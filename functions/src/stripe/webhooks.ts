import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const db = admin.firestore()

const APP_URL         = process.env.APP_URL            || 'https://flacroncontrol.web.app'
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY  || ''
const WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET || ''

function getStripe() {
  return new Stripe(STRIPE_SECRET, { apiVersion: '2024-12-18.acacia' as any })
}

// ── Webhook handler ───────────────────────────────────────────────────────────

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = WEBHOOK_SECRET

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err) {
    functions.logger.error('Webhook signature verification failed:', err)
    res.status(400).send(`Webhook Error: ${err}`)
    return
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const businessId = sub.metadata?.businessId
        const plan       = sub.metadata?.plan || 'starter'

        if (businessId) {
          // Save to top-level subscriptions collection
          await db.collection('subscriptions').doc(sub.id).set({
            businessId,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            plan,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true })

          // Update the business document plan so features unlock immediately
          await db.collection('businesses').doc(businessId).update({
            plan,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            planStatus: sub.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })

          // Update the user document plan
          const bizDoc = await db.collection('businesses').doc(businessId).get()
          const ownerId = bizDoc.data()?.ownerId
          if (ownerId) {
            await db.collection('users').doc(ownerId).update({
              plan,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }

          functions.logger.info(`Plan updated: business=${businessId} plan=${plan} status=${sub.status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const businessId = sub.metadata?.businessId

        await db.collection('subscriptions').doc(sub.id).update({
          status: 'cancelled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        if (businessId) {
          await db.collection('businesses').doc(businessId).update({
            plan: 'starter',
            planStatus: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })

          const bizDoc = await db.collection('businesses').doc(businessId).get()
          const ownerId = bizDoc.data()?.ownerId
          if (ownerId) {
            await db.collection('users').doc(ownerId).update({
              plan: 'starter',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        functions.logger.info('Payment succeeded:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        functions.logger.warn('Payment failed:', invoice.id)
        // Could send a notification here
        break
      }
    }
  } catch (err) {
    functions.logger.error('Error processing webhook event:', err)
  }

  res.json({ received: true })
})

// ── Create checkout session ───────────────────────────────────────────────────

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const stripe = getStripe()
  const { priceId, businessId, plan } = data as { priceId: string; businessId: string; plan: string }

  if (!priceId || !businessId || !plan) {
    throw new functions.https.HttpsError('invalid-argument', 'priceId, businessId, and plan are required')
  }

  // Get or create Stripe customer
  const bizDoc = await db.collection('businesses').doc(businessId).get()
  const bizData = bizDoc.data() || {}
  let customerId: string = bizData.stripeCustomerId || ''

  if (!customerId) {
    const userDoc = await db.collection('users').doc(context.auth.uid).get()
    const userData = userDoc.data() || {}
    const customer = await stripe.customers.create({
      email: userData.email || context.auth.token.email || '',
      name: bizData.name || userData.displayName || '',
      metadata: { businessId, userId: context.auth.uid },
    })
    customerId = customer.id
    await db.collection('businesses').doc(businessId).update({ stripeCustomerId: customerId })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { businessId, plan },
    },
    metadata: { businessId, plan },
    allow_promotion_codes: true,
    success_url: `${APP_URL}/app/payments?success=true&plan=${plan}`,
    cancel_url:  `${APP_URL}/app/payments?cancelled=true`,
  })

  return { url: session.url }
})

// ── Create billing portal session ─────────────────────────────────────────────

export const createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const stripe = getStripe()
  const { businessId } = data as { businessId: string }

  const bizDoc = await db.collection('businesses').doc(businessId).get()
  const customerId = bizDoc.data()?.stripeCustomerId

  if (!customerId) {
    throw new functions.https.HttpsError('not-found', 'No Stripe customer found. Please subscribe first.')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/app/payments`,
  })

  return { url: session.url }
})
