/**
 * Auto-Rebooking Scheduler
 *
 * Runs every day at 08:00 UTC. For each business, finds all bookings that are:
 *   - isRecurring: true
 *   - status: 'completed'
 *   - nextRebookCreated: falsy (haven't spawned a successor yet)
 *
 * For each qualifying booking it computes the next date based on the recurrence
 * rule and creates a new booking, then stamps the original with
 * `nextRebookCreated: true` to prevent duplicate runs.
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const db = admin.firestore()

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function nextDateFromRule(dateStr: string, rule?: string): string {
  const days =
    rule === 'weekly'   ? 7  :
    rule === 'biweekly' ? 14 :
    rule === 'monthly'  ? 28 :
    14 // default biweekly
  return addDays(dateStr, days)
}

export const autoRebookScheduler = functions.pubsub
  .schedule('0 8 * * *')          // every day at 08:00 UTC
  .timeZone('UTC')
  .onRun(async () => {
    functions.logger.info('autoRebookScheduler: starting run')

    // Fetch all businesses
    const bizSnap = await db.collection('businesses').get()

    let created = 0
    const batch = db.batch()

    for (const bizDoc of bizSnap.docs) {
      const businessId = bizDoc.id

      // Find completed recurring bookings not yet re-booked.
      // We query without the nextRebookCreated filter because existing docs
      // may not have the field; we filter in memory below.
      const rebookSnap = await db
        .collection(`businesses/${businessId}/bookings`)
        .where('isRecurring', '==', true)
        .where('status',      '==', 'completed')
        .get()

      for (const doc of rebookSnap.docs) {
        const b = doc.data()
        // Skip if already processed
        if (b.nextRebookCreated === true) continue
        const dateStr = typeof b.date === 'string' ? b.date : null
        if (!dateStr) continue

        const nextDate = nextDateFromRule(dateStr, b.recurrence?.rule)

        // Check a booking for this customer on the next date doesn't already exist
        const existsSnap = await db
          .collection(`businesses/${businessId}/bookings`)
          .where('customerName', '==', b.customerName)
          .where('date',         '==', nextDate)
          .where('serviceName',  '==', b.serviceName)
          .limit(1)
          .get()

        if (!existsSnap.empty) {
          // Already booked — just mark original so we don't check again
          batch.update(doc.ref, { nextRebookCreated: true })
          continue
        }

        // Create next booking
        const newRef = db
          .collection(`businesses/${businessId}/bookings`)
          .doc()

        batch.set(newRef, {
          businessId,
          customerName:        b.customerName,
          customerPhone:       b.customerPhone ?? '',
          serviceName:         b.serviceName,
          date:                nextDate,
          startTime:           b.startTime,
          endTime:             b.endTime ?? '',
          amount:              b.amount ?? 0,
          notes:               b.notes ?? '',
          status:              'pending',
          paymentStatus:       'unpaid',
          isRecurring:         true,
          recurrence:          b.recurrence ?? null,
          nextRebookCreated:   false,
          assignedEmployeeId:  b.assignedEmployeeId ?? null,
          assignedEmployeeName: b.assignedEmployeeName ?? null,
          createdAt:           admin.firestore.FieldValue.serverTimestamp(),
          autoCreated:         true,
        })

        // Mark original so it won't be processed again
        batch.update(doc.ref, { nextRebookCreated: true })

        // Push notification to business
        const notifRef = db
          .collection(`businesses/${businessId}/notifications`)
          .doc()
        batch.set(notifRef, {
          type:      'auto_rebook',
          title:     'Auto-Rebook Created',
          message:   `${b.customerName}'s next ${b.serviceName} auto-booked for ${nextDate}`,
          read:      false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        created++
        functions.logger.info(`autoRebook: created booking for ${b.customerName} on ${nextDate} (biz: ${businessId})`)
      }
    }

    await batch.commit()
    functions.logger.info(`autoRebookScheduler: done — ${created} bookings created`)
  })
