/**
 * Twilio Voice Webhooks — TwiML handlers for inbound and outbound calls.
 *
 * Conversation flow (stateless, works in Cloud Functions):
 *   1. Twilio calls /twilioVoiceInbound with call metadata
 *   2. We return TwiML: announce consent, then <Gather input="speech">
 *   3. Twilio transcribes speech → calls /twilioGather with SpeechResult
 *   4. We send to GPT-4o → get response text
 *   5. Return TwiML: <Say> the response + <Gather> again (loop)
 *   6. On completion, save transcript + trigger workflows
 *
 * NOTE: For true OpenAI Realtime API streaming (<300ms latency), deploy
 * realtimeBridge.ts to Cloud Run instead of Cloud Functions.
 */
import * as functions from 'firebase-functions'
import * as admin      from 'firebase-admin'
import twilio          from 'twilio'
import OpenAI          from 'openai'
import type { VoiceAgent, VoiceCall, TranscriptEntry, WorkflowAction } from './types'

const db = admin.firestore()

// ── Helpers ────────────────────────────────────────────────────────────────────

function twiml(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`
}

function sayAndGather(text: string, gatherUrl: string, voice: string): string {
  return twiml(`
    <Say voice="${voice}">${escapeXml(text)}</Say>
    <Gather input="speech" action="${gatherUrl}" speechTimeout="auto" language="en-US">
      <Say voice="${voice}">I'm listening.</Say>
    </Gather>
    <Say voice="${voice}">I didn't catch that. Goodbye.</Say>
  `)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function twilioVoice(gender: string): string {
  if (gender === 'male')    return 'Polly.Matthew'
  if (gender === 'female')  return 'Polly.Joanna'
  return 'Polly.Salli'
}

async function getAgentByNumber(phoneNumber: string): Promise<{ agent: VoiceAgent; businessId: string } | null> {
  // Query all businesses for a voiceAgent matching this phone number
  const snap = await db.collectionGroup('voiceAgents')
    .where('phoneNumber', '==', phoneNumber)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (snap.empty) return null

  const doc = snap.docs[0]
  const agent = { id: doc.id, ...doc.data() } as VoiceAgent
  // Extract businessId from path: businesses/{businessId}/voiceAgents/{agentId}
  const businessId = doc.ref.parent.parent?.id ?? ''
  return { agent, businessId }
}

async function buildBusinessContext(businessId: string): Promise<string> {
  const [services, hours] = await Promise.all([
    db.collection(`businesses/${businessId}/services`).get(),
    db.collection(`businesses/${businessId}/businessHours`).get(),
  ])

  const serviceList = services.docs
    .map(d => { const s = d.data(); return `- ${s.name}: $${s.price ?? 'N/A'} (${s.duration ?? '?'} min)` })
    .join('\n')

  const hoursList = hours.docs
    .map(d => { const h = d.data(); return `- ${h.day}: ${h.open ? `${h.openTime}–${h.closeTime}` : 'Closed'}` })
    .join('\n')

  return `
BUSINESS SERVICES:
${serviceList || 'No services listed.'}

BUSINESS HOURS:
${hoursList || 'No hours listed.'}
`.trim()
}

async function generateAIResponse(
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ],
    max_tokens: 200,
    temperature: 0.7,
  })

  return response.choices[0].message.content ?? "I'm sorry, I had trouble processing that. Could you repeat?"
}

// ── Inbound call handler ───────────────────────────────────────────────────────

export const twilioVoiceInbound = functions.https.onRequest(async (req, res) => {
  const toNumber   = req.body.To   as string
  const fromNumber = req.body.From as string
  const callSid    = req.body.CallSid as string

  const result = await getAgentByNumber(toNumber)

  if (!result) {
    res.type('text/xml').send(twiml('<Say>Sorry, this number is not configured. Goodbye.</Say><Hangup/>'))
    return
  }

  const { agent, businessId } = result

  // Create call record in Firestore
  const callRef = db.collection(`businesses/${businessId}/voiceCalls`).doc()
  await callRef.set({
    businessId,
    agentId:    agent.id,
    agentName:  agent.name,
    direction:  'inbound',
    status:     'in-progress',
    from:       fromNumber,
    to:         toNumber,
    duration:   0,
    transcript: [],
    workflowActions: [],
    twilioCallSid: callSid,
    startedAt:  admin.firestore.FieldValue.serverTimestamp(),
    createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
  })

  const voice   = twilioVoice(agent.voiceGender)
  const baseUrl = `https://${req.hostname}/twilioGather`
  const gatherUrl = `${baseUrl}?businessId=${businessId}&agentId=${agent.id}&callDocId=${callRef.id}`

  // Consent announcement
  const consentMsg = 'Thank you for calling. This call may be recorded for quality purposes. How can I help you today?'

  res.type('text/xml').send(sayAndGather(consentMsg, gatherUrl, voice))
})

// ── Gather (speech turn) handler ───────────────────────────────────────────────

export const twilioGather = functions.https.onRequest(async (req, res) => {
  const { businessId, agentId, callDocId, history: historyParam } = req.query as Record<string, string>
  const speechResult = req.body.SpeechResult as string | undefined

  if (!speechResult) {
    res.type('text/xml').send(twiml('<Say>I didn\'t catch that. Please call back.</Say><Hangup/>'))
    return
  }

  // Load agent
  const agentDoc = await db.doc(`businesses/${businessId}/voiceAgents/${agentId}`).get()
  if (!agentDoc.exists) {
    res.type('text/xml').send(twiml('<Say>Configuration error. Goodbye.</Say><Hangup/>'))
    return
  }

  const agent = { id: agentDoc.id, ...agentDoc.data() } as VoiceAgent

  // Parse conversation history from query param
  let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  try {
    if (historyParam) conversationHistory = JSON.parse(decodeURIComponent(historyParam))
  } catch { /* ignore parse errors */ }

  // Build system prompt
  let systemPrompt = agent.systemPrompt
  if (agent.injectBusinessContext) {
    const context = await buildBusinessContext(businessId)
    systemPrompt  = `${systemPrompt}\n\n${context}`
  }

  // Generate AI response
  const aiResponse = await generateAIResponse(systemPrompt, conversationHistory, speechResult)

  // Update conversation history
  const updatedHistory = [
    ...conversationHistory,
    { role: 'user'      as const, content: speechResult },
    { role: 'assistant' as const, content: aiResponse   },
  ]

  // Save transcript turn to Firestore
  const newEntries: TranscriptEntry[] = [
    { speaker: 'caller', text: speechResult, timestamp: Date.now() },
    { speaker: 'agent',  text: aiResponse,   timestamp: Date.now() + 1000 },
  ]
  await db.doc(`businesses/${businessId}/voiceCalls/${callDocId}`).update({
    transcript: admin.firestore.FieldValue.arrayUnion(...newEntries),
    updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
  })

  // Check for hangup intent
  const hangupPhrases = ['goodbye', 'bye', 'hang up', 'that\'s all', 'nothing else', 'no thanks']
  const shouldHangup  = hangupPhrases.some(p => speechResult.toLowerCase().includes(p))

  if (shouldHangup) {
    // Mark call completed
    await db.doc(`businesses/${businessId}/voiceCalls/${callDocId}`).update({
      status:    'completed',
      endedAt:   admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const voice = twilioVoice(agent.voiceGender)
    res.type('text/xml').send(twiml(`<Say voice="${voice}">${escapeXml(aiResponse)}</Say><Hangup/>`))
    return
  }

  // Continue the loop
  const voice   = twilioVoice(agent.voiceGender)
  const baseUrl = `https://${req.hostname}/twilioGather`
  const gatherUrl = `${baseUrl}?businessId=${businessId}&agentId=${agentId}&callDocId=${callDocId}&history=${encodeURIComponent(JSON.stringify(updatedHistory.slice(-10)))}`

  res.type('text/xml').send(sayAndGather(aiResponse, gatherUrl, voice))
})

// ── Call status callback ────────────────────────────────────────────────────────

export const twilioCallStatus = functions.https.onRequest(async (req, res) => {
  const callSid    = req.body.CallSid    as string
  const callStatus = req.body.CallStatus as string
  const duration   = parseInt(req.body.CallDuration ?? '0', 10)

  // Find the call document by twilioCallSid
  const snap = await db.collectionGroup('voiceCalls')
    .where('twilioCallSid', '==', callSid)
    .limit(1)
    .get()

  if (!snap.empty) {
    const callRef = snap.docs[0].ref
    const update: Record<string, unknown> = {
      status:    callStatus,
      duration,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    if (['completed', 'failed', 'no-answer', 'busy'].includes(callStatus)) {
      update.endedAt = admin.firestore.FieldValue.serverTimestamp()
    }
    await callRef.update(update)
  }

  res.json({ received: true })
})
