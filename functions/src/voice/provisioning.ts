/**
 * Twilio Sub-Account & Phone Number Provisioning
 *
 * - provisionTwilioAccount   Create a sub-account for a new voice-plan tenant
 * - purchasePhoneNumber      Buy a number and assign it to a voice agent
 * - releasePhoneNumber       Release a number back to Twilio
 * - listAvailableNumbers     Search available numbers by country/area code
 */
import * as functions from 'firebase-functions'
import * as admin      from 'firebase-admin'
import twilio          from 'twilio'

const db = admin.firestore()

function getMasterClient() {
  return twilio(
    functions.config().twilio?.account_sid || '',
    functions.config().twilio?.auth_token  || '',
  )
}

// ── Provision a Twilio sub-account for a business ─────────────────────────────

export const provisionTwilioAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const userDoc    = await db.collection('users').doc(context.auth.uid).get()
  const businessId = userDoc.data()?.businessId as string
  if (!businessId) throw new functions.https.HttpsError('not-found', 'Business not found')

  // Check if already provisioned
  const existing = await db.doc(`businesses/${businessId}/twilioAccount/config`).get()
  if (existing.exists) return { alreadyProvisioned: true, ...existing.data() }

  const master     = getMasterClient()
  const subAccount = await master.api.accounts.create({
    friendlyName: `FlacronControl — ${businessId}`,
  })

  await db.doc(`businesses/${businessId}/twilioAccount/config`).set({
    subAccountSid:       subAccount.sid,
    subAccountAuthToken: subAccount.authToken,
    phoneNumbers:        [],
    monthlyMinutesUsed:  0,
    billingPeriodStart:  new Date().toISOString(),
    createdAt:           admin.firestore.FieldValue.serverTimestamp(),
    updatedAt:           admin.firestore.FieldValue.serverTimestamp(),
  })

  return { subAccountSid: subAccount.sid }
})

// ── List available phone numbers ───────────────────────────────────────────────

export const listAvailableNumbers = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const { countryCode = 'US', areaCode } = data as { countryCode?: string; areaCode?: string }
  const master = getMasterClient()

  const params: Record<string, unknown> = { voiceEnabled: true, limit: 20 }
  if (areaCode) params.areaCode = areaCode

  const numbers = await master.availablePhoneNumbers(countryCode).local.list(params)

  return numbers.map(n => ({
    phoneNumber:  n.phoneNumber,
    friendlyName: n.friendlyName,
    locality:     n.locality,
    region:       n.region,
    country:      countryCode,
  }))
})

// ── Purchase a phone number and assign to an agent ────────────────────────────

export const purchasePhoneNumber = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const { phoneNumber, agentId } = data as { phoneNumber: string; agentId: string }

  const userDoc    = await db.collection('users').doc(context.auth.uid).get()
  const businessId = userDoc.data()?.businessId as string
  if (!businessId) throw new functions.https.HttpsError('not-found', 'Business not found')

  const webhookBase  = functions.config().app?.url || ''
  const inboundUrl   = `${webhookBase}/twilioVoiceInbound`
  const statusUrl    = `${webhookBase}/twilioCallStatus`

  // Use business sub-account if provisioned
  const twilioDoc = await db.doc(`businesses/${businessId}/twilioAccount/config`).get()
  const client = twilioDoc.exists
    ? twilio(twilioDoc.data()!.subAccountSid, twilioDoc.data()!.subAccountAuthToken)
    : getMasterClient()

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl:            inboundUrl,
    voiceMethod:         'POST',
    statusCallback:      statusUrl,
    statusCallbackMethod:'POST',
  })

  // Persist number in Firestore and assign to agent
  await Promise.all([
    db.doc(`businesses/${businessId}/twilioAccount/config`).update({
      phoneNumbers: admin.firestore.FieldValue.arrayUnion({
        sid:          purchased.sid,
        number:       purchased.phoneNumber,
        friendlyName: purchased.friendlyName,
        country:      'US',
        capabilities: { voice: true, sms: true },
        assignedAt:   new Date().toISOString(),
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }),
    agentId && db.doc(`businesses/${businessId}/voiceAgents/${agentId}`).update({
      phoneNumber:    purchased.phoneNumber,
      phoneNumberSid: purchased.sid,
      updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
    }),
  ])

  return { phoneNumber: purchased.phoneNumber, sid: purchased.sid }
})

// ── Release a phone number ─────────────────────────────────────────────────────

export const releasePhoneNumber = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const { numberSid } = data as { numberSid: string }

  const userDoc    = await db.collection('users').doc(context.auth.uid).get()
  const businessId = userDoc.data()?.businessId as string

  const twilioDoc = await db.doc(`businesses/${businessId}/twilioAccount/config`).get()
  const client = twilioDoc.exists
    ? twilio(twilioDoc.data()!.subAccountSid, twilioDoc.data()!.subAccountAuthToken)
    : getMasterClient()

  await client.incomingPhoneNumbers(numberSid).remove()

  // Remove from Firestore
  const phoneNumbers: { sid: string }[] = twilioDoc.data()?.phoneNumbers ?? []
  await db.doc(`businesses/${businessId}/twilioAccount/config`).update({
    phoneNumbers: phoneNumbers.filter(n => n.sid !== numberSid),
    updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
  })

  return { released: true }
})
