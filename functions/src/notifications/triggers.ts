import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { BREVO_TEMPLATE_IDS } from './templateIds'

const db        = admin.firestore()
const messaging = admin.messaging()

const BREVO_API_KEY = process.env.BREVO_API_KEY   || ''
const FROM_EMAIL    = process.env.BREVO_FROM_EMAIL || 'marketing@flacronenterprises.com'
const FROM_NAME     = process.env.BREVO_FROM_NAME  || 'Flacron CV - Flacron Enterprises'

// ── Brevo transactional email via template ─────────────────────────────────────
async function sendTemplateEmail(opts: {
  templateId: number
  to: string
  toName: string
  params: Record<string, string>
}) {
  if (!BREVO_API_KEY || !opts.to) return

  const { default: fetch } = await import('node-fetch')
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      templateId: opts.templateId,
      sender:     { email: FROM_EMAIL, name: FROM_NAME },
      to:         [{ email: opts.to, name: opts.toName }],
      params:     opts.params,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brevo error ${res.status}: ${body}`)
  }

  functions.logger.info(`Template ${opts.templateId} sent to ${opts.to}`)
}

// ── Booking Created → push + email to owner ────────────────────────────────────
export const onBookingCreated = functions.firestore
  .document('businesses/{businessId}/bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data()
    const { businessId } = context.params

    const bizSnap  = await db.collection('businesses').doc(businessId).get()
    const bizData  = bizSnap.data() ?? {}
    const ownerId  = bizData.ownerId as string | undefined
    const bizName  = (bizData.name  as string) || 'Your Business'
    const bizEmail = (bizData.email as string) || FROM_EMAIL

    // FCM push to owner
    if (ownerId) {
      const userSnap = await db.collection('users').doc(ownerId).get()
      const fcmToken = userSnap.data()?.fcmToken as string | undefined

      if (fcmToken) {
        await messaging.send({
          token: fcmToken,
          notification: {
            title: '📅 New Booking',
            body:  `${booking.customerName} booked ${booking.serviceName} for ${booking.date} at ${booking.startTime}`,
          },
          data: { type: 'new_booking', bookingId: snap.id, businessId },
        })
      }

      // Email to owner
      const ownerEmail = userSnap.data()?.email as string | undefined
      if (ownerEmail) {
        await sendTemplateEmail({
          templateId: BREVO_TEMPLATE_IDS.newBookingOwner,
          to:         ownerEmail,
          toName:     bizName,
          params: {
            BUSINESS_NAME:   bizName,
            BUSINESS_EMAIL:  bizEmail,
            CUSTOMER_NAME:   booking.customerName  || '',
            CUSTOMER_EMAIL:  booking.customerEmail || '',
            CUSTOMER_PHONE:  booking.customerPhone || '',
            SERVICE_NAME:    booking.serviceName   || '',
            DATE:            booking.date          || '',
            START_TIME:      booking.startTime     || '',
            AMOUNT:          booking.amount != null ? `$${Number(booking.amount).toFixed(2)}` : '',
            NOTES:           booking.notes         || '',
          },
        }).catch(err => functions.logger.error('Owner email failed:', err))
      }
    }

    // In-app notification
    await db.collection(`businesses/${businessId}/notifications`).add({
      type:      'booking',
      title:     'New Booking',
      message:   `${booking.customerName} booked ${booking.serviceName}`,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

// ── Booking Status Changed → email customer ────────────────────────────────────
export const onBookingStatusChange = functions.firestore
  .document('businesses/{businessId}/bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after  = change.after.data()

    if (before.status === after.status) return

    const { businessId } = context.params
    functions.logger.info(`Booking ${context.params.bookingId}: ${before.status} → ${after.status}`)

    const notifyStatuses: Record<string, number> = {
      confirmed: BREVO_TEMPLATE_IDS.bookingConfirmed,
      completed: BREVO_TEMPLATE_IDS.bookingCompleted,
      cancelled: BREVO_TEMPLATE_IDS.bookingCancelled,
    }
    const templateId = notifyStatuses[after.status]
    if (!templateId) return

    const bizSnap  = await db.collection('businesses').doc(businessId).get()
    const bizData  = bizSnap.data() ?? {}
    const bizName  = (bizData.name  as string) || 'Your Business'
    const bizEmail = (bizData.email as string) || FROM_EMAIL

    const customerEmail = (after.customerEmail as string) || ''
    const customerName  = (after.customerName  as string) || 'Customer'

    if (customerEmail) {
      await sendTemplateEmail({
        templateId,
        to:     customerEmail,
        toName: customerName,
        params: {
          BUSINESS_NAME:  bizName,
          BUSINESS_EMAIL: bizEmail,
          CUSTOMER_NAME:  customerName,
          SERVICE_NAME:   (after.serviceName as string) || '',
          DATE:           (after.date        as string) || '',
          START_TIME:     (after.startTime   as string) || '',
        },
      }).catch(err => functions.logger.error('Status email failed:', err))
    }

    // In-app notification
    await db.collection(`businesses/${businessId}/notifications`).add({
      type:      'booking_status',
      title:     `Booking ${after.status}`,
      message:   `${customerName}'s ${after.serviceName} booking changed to ${after.status}`,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

// ── Invoice Created → email customer ──────────────────────────────────────────
export const onInvoiceCreated = functions.firestore
  .document('businesses/{businessId}/invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const invoice = snap.data()
    const { businessId } = context.params

    if (invoice.status !== 'sent') return   // only email when explicitly sent

    const bizSnap  = await db.collection('businesses').doc(businessId).get()
    const bizData  = bizSnap.data() ?? {}
    const bizName  = (bizData.name  as string) || 'Your Business'
    const bizEmail = (bizData.email as string) || FROM_EMAIL

    const customerEmail = (invoice.customerEmail as string) || ''
    if (!customerEmail) return

    await sendTemplateEmail({
      templateId: BREVO_TEMPLATE_IDS.invoiceSent,
      to:         customerEmail,
      toName:     (invoice.customerName as string) || 'Customer',
      params: {
        BUSINESS_NAME:  bizName,
        BUSINESS_EMAIL: bizEmail,
        CUSTOMER_NAME:  (invoice.customerName as string) || 'Customer',
        INVOICE_ID:     snap.id.slice(-8).toUpperCase(),
        SERVICE_NAME:   (invoice.items?.[0]?.description as string) || 'Services',
        ISSUE_DATE:     new Date().toLocaleDateString(),
        DUE_DATE:       (invoice.dueDate as string) || '',
        AMOUNT_DUE:     `$${Number(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      },
    }).catch(err => functions.logger.error('Invoice email failed:', err))
  })

// ── Payment Marked Paid → send receipt ────────────────────────────────────────
export const onBookingPaymentPaid = functions.firestore
  .document('businesses/{businessId}/bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after  = change.after.data()

    if (before.paymentStatus === 'paid' || after.paymentStatus !== 'paid') return

    const { businessId } = context.params

    const bizSnap  = await db.collection('businesses').doc(businessId).get()
    const bizData  = bizSnap.data() ?? {}
    const bizName  = (bizData.name  as string) || 'Your Business'
    const bizEmail = (bizData.email as string) || FROM_EMAIL

    const customerEmail = (after.customerEmail as string) || ''
    if (!customerEmail) return

    const subtotal = Number(after.amount || 0)
    const tax      = Math.round(subtotal * 0.1 * 100) / 100
    const total    = subtotal + tax

    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    await sendTemplateEmail({
      templateId: BREVO_TEMPLATE_IDS.paymentReceipt,
      to:         customerEmail,
      toName:     (after.customerName as string) || 'Customer',
      params: {
        BUSINESS_NAME:  bizName,
        BUSINESS_EMAIL: bizEmail,
        CUSTOMER_NAME:  (after.customerName  as string) || 'Customer',
        SERVICE_NAME:   (after.serviceName   as string) || '',
        DATE:           (after.date          as string) || '',
        START_TIME:     (after.startTime     as string) || '',
        SUBTOTAL:       fmt(subtotal),
        TAX:            fmt(tax),
        TOTAL:          fmt(total),
      },
    }).catch(err => functions.logger.error('Payment receipt email failed:', err))
  })
