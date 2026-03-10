import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()
const messaging = admin.messaging()

const BREVO_API_KEY = process.env.BREVO_API_KEY   || ''
const FROM_EMAIL    = process.env.BREVO_FROM_EMAIL || 'noreply@flacroncontrol.com'
const FROM_NAME     = process.env.BREVO_FROM_NAME  || 'FlacronControl'

async function sendStatusEmail(opts: {
  to: string; toName: string
  status: string; serviceName: string; date: string; startTime: string; businessName: string
}) {
  if (!BREVO_API_KEY || !opts.to) return

  const labels: Record<string, { subject: string; headline: string; color: string }> = {
    confirmed:  { subject: 'Booking Confirmed',   headline: 'Your booking is confirmed ✓',   color: '#16a34a' },
    completed:  { subject: 'Visit Complete',       headline: 'Thanks for your visit!',        color: '#2563eb' },
    cancelled:  { subject: 'Booking Cancelled',    headline: 'Your booking has been cancelled', color: '#dc2626' },
  }
  const meta = labels[opts.status] ?? { subject: `Booking ${opts.status}`, headline: `Your booking status: ${opts.status}`, color: '#ea580c' }

  const { default: fetch } = await import('node-fetch')
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { email: FROM_EMAIL, name: FROM_NAME },
      to:          [{ email: opts.to, name: opts.toName }],
      subject:     `${meta.subject} — ${opts.serviceName}`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:${meta.color};">${meta.headline}</h2>
          <p>Hi <strong>${opts.toName}</strong>,</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;">
            <tr><td style="padding:12px;color:#666;width:40%;">Service</td><td style="padding:12px;font-weight:600;">${opts.serviceName}</td></tr>
            <tr><td style="padding:12px;color:#666;">Date</td><td style="padding:12px;font-weight:600;">${opts.date}</td></tr>
            <tr><td style="padding:12px;color:#666;">Time</td><td style="padding:12px;font-weight:600;">${opts.startTime}</td></tr>
            <tr><td style="padding:12px;color:#666;">Business</td><td style="padding:12px;font-weight:600;">${opts.businessName}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#aaa;font-size:12px;">Powered by FlacronControl</p>
        </div>
      `,
    }),
  })
  functions.logger.info(`Status email (${opts.status}) sent to ${opts.to}`)
}

export const onBookingCreated = functions.firestore
  .document('businesses/{businessId}/bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data()
    const { businessId } = context.params

    // Get business owner's FCM token
    const bizSnap = await db.collection('businesses').doc(businessId).get()
    const ownerId = bizSnap.data()?.ownerId

    if (!ownerId) return

    const userSnap = await db.collection('users').doc(ownerId).get()
    const fcmToken = userSnap.data()?.fcmToken

    if (fcmToken) {
      await messaging.send({
        token: fcmToken,
        notification: {
          title: '📅 New Booking',
          body: `${booking.customerName} booked ${booking.serviceName} for ${booking.date} at ${booking.startTime}`,
        },
        data: {
          type:      'new_booking',
          bookingId: snap.id,
          businessId,
        },
      })
    }

    // Create notification record
    await db.collection(`businesses/${businessId}/notifications`).add({
      type:      'booking',
      title:     'New Booking Confirmed',
      message:   `${booking.customerName} booked ${booking.serviceName}`,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

export const onBookingStatusChange = functions.firestore
  .document('businesses/{businessId}/bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after  = change.after.data()

    if (before.status !== after.status) {
      const { businessId } = context.params
      functions.logger.info(`Booking ${context.params.bookingId} status: ${before.status} → ${after.status}`)

      // Only email on meaningful transitions
      const notifyStatuses = ['confirmed', 'completed', 'cancelled']
      if (!notifyStatuses.includes(after.status)) return

      // Get business name
      const bizSnap = await db.collection('businesses').doc(businessId).get()
      const businessName: string = bizSnap.data()?.name ?? 'Your Business'

      // customer email stored on booking or looked up from customers collection
      const customerEmail: string = after.customerEmail ?? ''
      const customerName:  string = after.customerName  ?? 'Customer'

      if (customerEmail) {
        await sendStatusEmail({
          to:           customerEmail,
          toName:       customerName,
          status:       after.status,
          serviceName:  after.serviceName  ?? '',
          date:         after.date         ?? '',
          startTime:    after.startTime    ?? '',
          businessName,
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
    }
  })
