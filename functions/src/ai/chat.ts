import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import OpenAI from 'openai'

const db = admin.firestore()

const COMPLEXITY_KEYWORDS = [
  'explain', 'analyze', 'compare', 'recommend', 'why', 'strategy',
  'optimize', 'suggest', 'advise', 'evaluate', 'assess',
]

function routeAI(query: string): 'watsonx' | 'openai' {
  const lower = query.toLowerCase()
  const isComplex = COMPLEXITY_KEYWORDS.some(k => lower.includes(k)) || query.length > 200
  return isComplex ? 'watsonx' : 'openai'
}

export const aiChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated')
  }

  const { messages, businessId, conversationId } = data as {
    messages: Array<{ role: string; content: string }>
    businessId: string
    conversationId?: string
  }

  const lastMessage = messages[messages.length - 1]?.content || ''
  const provider = routeAI(lastMessage)

  let response = ''

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      max_tokens: 500,
    })
    response = completion.choices[0].message.content || ''
  } else {
    // WatsonX — implement via IBM Cloud API
    // For now, use OpenAI as fallback
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      max_tokens: 1000,
    })
    response = completion.choices[0].message.content || ''
  }

  // Save conversation to Firestore
  const convRef = conversationId
    ? db.collection(`businesses/${businessId}/conversations`).doc(conversationId)
    : db.collection(`businesses/${businessId}/conversations`).doc()

  await convRef.set({
    messages: admin.firestore.FieldValue.arrayUnion({ role: 'assistant', content: response }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  return { message: response, provider, conversationId: convRef.id }
})
