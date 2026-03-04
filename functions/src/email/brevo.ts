/**
 * Brevo (formerly Sendinblue) email integration
 * Handles: appointment reminders, invoice emails, booking confirmations
 */
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { BrevoClient, BrevoEnvironment } from '@getbrevo/brevo'

const db = admin.firestore()

const BREVO_API_KEY = process.env.BREVO_API_KEY   || ''
const FROM_EMAIL    = process.env.BREVO_FROM_EMAIL || 'noreply@flacroncontrol.com'
const FROM_NAME     = process.env.BREVO_FROM_NAME  || 'FlacronControl'

function getBrevo() {
  return new BrevoClient({
    apiKey:      BREVO_API_KEY,
    environment: BrevoEnvironment.Default,
  })
}

// ── Core send helper ──────────────────────────────────────────────────────────

async function sendEmail(opts: {
  to:       string
  toName?:  string
  subject:  string
  html:     string
  text?:    string
}) {
  if (!BREVO_API_KEY) {
    functions.logger.warn('Brevo API key not set — skipping email to ' + opts.to)
    return
  }

  const brevo = getBrevo()
  await brevo.transactionalEmails.sendTransacEmail({
    sender:      { email: FROM_EMAIL, name: FROM_NAME },
    to:          [{ email: opts.to, name: opts.toName ?? opts.to }],
    subject:     opts.subject,
    htmlContent: opts.html,
    textContent: opts.text,
  })

  functions.logger.info(`Email sent to ${opts.to}: ${opts.subject}`)
}

// ── Booking confirmation ──────────────────────────────────────────────────────

export const sendBookingConfirmationEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const { customerEmail, customerName, serviceName, date, startTime, businessName, amount } = data as {
    customerEmail: string; customerName: string; serviceName: string
    date: string; startTime: string; businessName: string; amount?: number
  }

  await sendEmail({
    to:      customerEmail,
    toName:  customerName,
    subject: `Booking Confirmed — ${serviceName} on ${date}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#ea580c;">Booking Confirmed ✓</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Your appointment has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;">
          <tr><td style="padding:12px;color:#666;width:40%;">Service</td><td style="padding:12px;font-weight:600;">${serviceName}</td></tr>
          <tr><td style="padding:12px;color:#666;">Date</td><td style="padding:12px;font-weight:600;">${date}</td></tr>
          <tr><td style="padding:12px;color:#666;">Time</td><td style="padding:12px;font-weight:600;">${startTime}</td></tr>
          <tr><td style="padding:12px;color:#666;">Business</td><td style="padding:12px;font-weight:600;">${businessName}</td></tr>
          ${amount ? `<tr><td style="padding:12px;color:#666;">Amount</td><td style="padding:12px;font-weight:600;color:#ea580c;">$${amount}</td></tr>` : ''}
        </table>
        <p style="color:#666;font-size:14px;">Need to reschedule? Contact us directly.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">Powered by FlacronControl</p>
      </div>
    `,
    text: `Booking Confirmed\nService: ${serviceName}\nDate: ${date}\nTime: ${startTime}\nBusiness: ${businessName}`,
  })

  return { sent: true }
})

// ── Invoice email ─────────────────────────────────────────────────────────────

export const sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')

  const { customerEmail, customerName, invoiceNumber, amount, dueDate, businessName, pdfUrl } = data as {
    customerEmail: string; customerName: string; invoiceNumber: string
    amount: number; dueDate: string; businessName: string; pdfUrl?: string
  }

  await sendEmail({
    to:      customerEmail,
    toName:  customerName,
    subject: `Invoice #${invoiceNumber} from ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#ea580c;">Invoice #${invoiceNumber}</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Please find your invoice from <strong>${businessName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;">
          <tr><td style="padding:12px;color:#666;width:40%;">Invoice #</td><td style="padding:12px;font-weight:600;">${invoiceNumber}</td></tr>
          <tr><td style="padding:12px;color:#666;">Amount Due</td><td style="padding:12px;font-weight:700;font-size:20px;color:#ea580c;">$${amount}</td></tr>
          <tr><td style="padding:12px;color:#666;">Due Date</td><td style="padding:12px;font-weight:600;">${dueDate}</td></tr>
        </table>
        ${pdfUrl ? `
        <p>
          <a href="${pdfUrl}"
             style="background:#ea580c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
            Download Invoice PDF
          </a>
        </p>` : ''}
        <p style="color:#666;font-size:14px;">Thank you for your business!</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">Powered by FlacronControl</p>
      </div>
    `,
  })

  return { sent: true }
})

// ── Scheduled reminder sender (runs every 15 min via Cloud Scheduler) ─────────

export const sendScheduledReminders = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const cutoff = new Date().toISOString()

    // collectionGroup query across ALL businesses' scheduledReminders
    const snap = await db.collectionGroup('scheduledReminders')
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', cutoff)
      .limit(100)
      .get()

    functions.logger.info(`Processing ${snap.size} scheduled reminders`)

    await Promise.allSettled(snap.docs.map(async docSnap => {
      const r = docSnap.data()
      try {
        const channel: string = r.channel ?? 'sms'

        if ((channel === 'email' || channel === 'both') && r.customerEmail) {
          await sendEmail({
            to:      r.customerEmail,
            toName:  r.customerName ?? '',
            subject: `Reminder: ${r.serviceName ?? 'Your upcoming appointment'}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                <h2 style="color:#ea580c;">Appointment Reminder</h2>
                <p>${r.message}</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
                <p style="color:#aaa;font-size:12px;">
                  Reply STOP to opt out of reminders.<br/>
                  Powered by FlacronControl
                </p>
              </div>
            `,
            text: r.message,
          })
        }

        await docSnap.ref.update({
          status: 'sent',
          sentAt: new Date().toISOString(),
        })
      } catch (err) {
        functions.logger.error(`Reminder ${docSnap.id} failed:`, err)
        await docSnap.ref.update({ status: 'failed' })
      }
    }))
  })
