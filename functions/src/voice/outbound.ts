/**
 * Outbound call initiation — Cloud Function callable from client.
 * Creates a Twilio call, creates the Firestore call record, and returns
 * the callSid + callId so the client can track the session.
 */
import * as functions from 'firebase-functions'
import * as admin      from 'firebase-admin'
import twilio          from 'twilio'

const db = admin.firestore()

export const initiateOutboundCall = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const { agentId, to, from: fromNumber } = data as {
    agentId: string
    to:      string
    from:    string
  }

  // Get the business's Twilio sub-account credentials
  const uid        = context.auth.uid
  const userDoc    = await db.collection('users').doc(uid).get()
  const businessId = userDoc.data()?.businessId as string | undefined

  if (!businessId) {
    throw new functions.https.HttpsError('not-found', 'Business not found')
  }

  // Load agent
  const agentDoc = await db.doc(`businesses/${businessId}/voiceAgents/${agentId}`).get()
  if (!agentDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Agent not found')
  }

  // Load Twilio sub-account for this business
  const twilioAccountDoc = await db.doc(`businesses/${businessId}/twilioAccount/config`).get()

  const masterAccountSid  = process.env.TWILIO_ACCOUNT_SID || ''
  const masterAuthToken   = process.env.TWILIO_AUTH_TOKEN  || ''
  const webhookBaseUrl    = process.env.APP_URL            || ''

  let accountSid  = masterAccountSid
  let authToken   = masterAuthToken
  let outboundNum = fromNumber

  if (twilioAccountDoc.exists) {
    const ta = twilioAccountDoc.data()!
    accountSid  = ta.subAccountSid    || masterAccountSid
    authToken   = ta.subAccountAuthToken || masterAuthToken
  }

  const client = twilio(accountSid, authToken)

  // Create the call record first (get the doc ID)
  const callRef = db.collection(`businesses/${businessId}/voiceCalls`).doc()

  const gatherUrl = `${webhookBaseUrl}/twilioGather?businessId=${businessId}&agentId=${agentId}&callDocId=${callRef.id}`
  const statusUrl = `${webhookBaseUrl}/twilioCallStatus`

  // Initiate the Twilio call
  const call = await client.calls.create({
    to,
    from:       outboundNum,
    twiml:      `<?xml version="1.0" encoding="UTF-8"?><Response>
      <Say voice="Polly.Joanna">This call may be recorded for quality purposes.</Say>
      <Gather input="speech" action="${gatherUrl}" speechTimeout="auto" language="en-US">
        <Say voice="Polly.Joanna">How can I help you today?</Say>
      </Gather>
    </Response>`,
    statusCallback:       statusUrl,
    statusCallbackMethod: 'POST',
    statusCallbackEvent:  ['initiated', 'ringing', 'answered', 'completed'],
  })

  // Save call record
  await callRef.set({
    businessId,
    agentId,
    agentName:  agentDoc.data()?.name ?? '',
    direction:  'outbound',
    status:     'initiated',
    from:       outboundNum,
    to,
    duration:   0,
    transcript: [],
    workflowActions: [],
    twilioCallSid: call.sid,
    startedAt:  admin.firestore.FieldValue.serverTimestamp(),
    createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
  })

  return { callSid: call.sid, callId: callRef.id }
})
