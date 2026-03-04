import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()
const messaging = admin.messaging()

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
      functions.logger.info(`Booking ${context.params.bookingId} status: ${before.status} → ${after.status}`)
      // Send customer email notification via SendGrid
      // Implementation via sendgrid API would go here
    }
  })
