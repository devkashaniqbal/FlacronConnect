/**
 * Brevo Email Template Setup Script
 * Run once: node functions/setup-templates.mjs
 * Creates/updates all FlacronControl email templates in your Brevo account
 * and writes the resulting IDs to functions/src/notifications/templateIds.ts
 */

// Set these via environment or pass as args:
//   BREVO_API_KEY=your_key node functions/setup-templates.mjs
const API_KEY    = process.env.BREVO_API_KEY    || ''
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@example.com'
const FROM_NAME  = process.env.BREVO_FROM_NAME  || 'FlacronControl'

if (!API_KEY) { console.error('❌ BREVO_API_KEY env var is required'); process.exit(1) }

// ── Shared design helpers ──────────────────────────────────────────────────────
const font = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`

function baseLayout({ accentColor, headerText, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headerText}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:${accentColor};padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="${font};font-size:22px;font-weight:700;color:#ffffff;margin:0;">{{params.BUSINESS_NAME}}</p>
                <p style="${font};font-size:14px;color:rgba(255,255,255,0.8);margin:6px 0 0;">${headerText}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px;">
          ${bodyHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="${font};font-size:12px;color:#9ca3af;margin:0;text-align:center;">
            This email was sent by <strong>{{params.BUSINESS_NAME}}</strong> via
            <a href="https://flacroncontrol.com" style="color:#ea580c;text-decoration:none;">FlacronControl</a>.<br>
            If you have questions, contact us at {{params.BUSINESS_EMAIL}}.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function detailsTable(rows) {
  const trs = rows.map(([label, param]) => `
    <tr>
      <td style="${font};padding:12px 16px;color:#6b7280;font-size:14px;width:38%;border-bottom:1px solid #f3f4f6;">${label}</td>
      <td style="${font};padding:12px 16px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;">{{params.${param}}}</td>
    </tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:20px 0;">${trs}</table>`
}

// ── Template definitions ───────────────────────────────────────────────────────
const templates = [

  // 1. Booking Confirmed (to customer)
  {
    name:    'booking-confirmed',
    subject: 'Booking Confirmed ✓ — {{params.SERVICE_NAME}}',
    html: baseLayout({
      accentColor: '#16a34a',
      headerText:  'Booking Confirmed',
      bodyHtml: `
        <p style="${font};font-size:16px;color:#111827;margin:0 0 8px;">Hi <strong>{{params.CUSTOMER_NAME}}</strong>,</p>
        <p style="${font};font-size:14px;color:#6b7280;margin:0 0 24px;">
          Great news! Your booking has been confirmed. We look forward to seeing you.
        </p>
        ${detailsTable([
          ['Service',  'SERVICE_NAME'],
          ['Date',     'DATE'],
          ['Time',     'START_TIME'],
          ['Business', 'BUSINESS_NAME'],
        ])}
        <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:14px 16px;border-radius:4px;margin-top:8px;">
          <p style="${font};font-size:13px;color:#166534;margin:0;">
            Need to reschedule? Contact us as soon as possible at {{params.BUSINESS_EMAIL}}.
          </p>
        </div>`,
    }),
  },

  // 2. Booking Cancelled (to customer)
  {
    name:    'booking-cancelled',
    subject: 'Booking Cancelled — {{params.SERVICE_NAME}}',
    html: baseLayout({
      accentColor: '#dc2626',
      headerText:  'Booking Cancelled',
      bodyHtml: `
        <p style="${font};font-size:16px;color:#111827;margin:0 0 8px;">Hi <strong>{{params.CUSTOMER_NAME}}</strong>,</p>
        <p style="${font};font-size:14px;color:#6b7280;margin:0 0 24px;">
          We're sorry to inform you that your booking has been cancelled. Details below.
        </p>
        ${detailsTable([
          ['Service',  'SERVICE_NAME'],
          ['Date',     'DATE'],
          ['Time',     'START_TIME'],
          ['Business', 'BUSINESS_NAME'],
        ])}
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;border-radius:4px;margin-top:8px;">
          <p style="${font};font-size:13px;color:#991b1b;margin:0;">
            To rebook or if you have questions, reach us at {{params.BUSINESS_EMAIL}}.
          </p>
        </div>`,
    }),
  },

  // 3. Visit Complete / Thank You (to customer)
  {
    name:    'booking-completed',
    subject: 'Thanks for your visit! — {{params.SERVICE_NAME}}',
    html: baseLayout({
      accentColor: '#2563eb',
      headerText:  'Thanks for your visit!',
      bodyHtml: `
        <p style="${font};font-size:16px;color:#111827;margin:0 0 8px;">Hi <strong>{{params.CUSTOMER_NAME}}</strong>,</p>
        <p style="${font};font-size:14px;color:#6b7280;margin:0 0 24px;">
          Thank you for choosing <strong>{{params.BUSINESS_NAME}}</strong>! We hope your experience was great.
          We'd love to see you again soon.
        </p>
        ${detailsTable([
          ['Service',  'SERVICE_NAME'],
          ['Date',     'DATE'],
          ['Time',     'START_TIME'],
          ['Business', 'BUSINESS_NAME'],
        ])}
        <div style="text-align:center;margin-top:24px;">
          <p style="${font};font-size:13px;color:#6b7280;margin:0 0 12px;">
            Happy with your experience? Leave us a review — it means a lot!
          </p>
        </div>`,
    }),
  },

  // 4. Invoice Sent (to customer)
  {
    name:    'invoice-sent',
    subject: 'Invoice #{{params.INVOICE_ID}} from {{params.BUSINESS_NAME}}',
    html: baseLayout({
      accentColor: '#ea580c',
      headerText:  'Invoice Ready',
      bodyHtml: `
        <p style="${font};font-size:16px;color:#111827;margin:0 0 8px;">Hi <strong>{{params.CUSTOMER_NAME}}</strong>,</p>
        <p style="${font};font-size:14px;color:#6b7280;margin:0 0 24px;">
          Please find your invoice from <strong>{{params.BUSINESS_NAME}}</strong> below.
        </p>
        ${detailsTable([
          ['Invoice #',    'INVOICE_ID'],
          ['Service',      'SERVICE_NAME'],
          ['Date Issued',  'ISSUE_DATE'],
          ['Due Date',     'DUE_DATE'],
        ])}
        <!-- Amount box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;text-align:center;">
              <p style="${font};font-size:13px;color:#9a3412;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Amount Due</p>
              <p style="${font};font-size:32px;font-weight:700;color:#ea580c;margin:0;">{{params.AMOUNT_DUE}}</p>
              <p style="${font};font-size:12px;color:#9a3412;margin:6px 0 0;">Due by {{params.DUE_DATE}}</p>
            </td>
          </tr>
        </table>
        <div style="background:#f9fafb;border-left:4px solid #ea580c;padding:14px 16px;border-radius:4px;">
          <p style="${font};font-size:13px;color:#374151;margin:0;">
            To pay or ask questions about this invoice, contact us at <strong>{{params.BUSINESS_EMAIL}}</strong>.
          </p>
        </div>`,
    }),
  },

  // 5. Payment Receipt (to customer — auto-generated when booking marked paid)
  {
    name:    'payment-receipt',
    subject: 'Payment Received ✓ — {{params.SERVICE_NAME}}',
    html: baseLayout({
      accentColor: '#16a34a',
      headerText:  'Payment Receipt',
      bodyHtml: `
        <p style="${font};font-size:16px;color:#111827;margin:0 0 8px;">Hi <strong>{{params.CUSTOMER_NAME}}</strong>,</p>
        <p style="${font};font-size:14px;color:#6b7280;margin:0 0 24px;">
          We've received your payment. Thank you! Here's your receipt.
        </p>
        ${detailsTable([
          ['Service',    'SERVICE_NAME'],
          ['Date',       'DATE'],
          ['Time',       'START_TIME'],
          ['Subtotal',   'SUBTOTAL'],
          ['Tax (10%)',  'TAX'],
          ['Total Paid', 'TOTAL'],
        ])}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
          <p style="${font};font-size:13px;color:#166534;margin:0;">
            ✓ &nbsp;Payment confirmed for <strong>{{params.BUSINESS_NAME}}</strong>
          </p>
        </div>
        <p style="${font};font-size:13px;color:#6b7280;margin:0;">
          Keep this email as your receipt. For any queries contact {{params.BUSINESS_EMAIL}}.
        </p>`,
    }),
  },

  // 6. New Booking Alert (to business owner)
  {
    name:    'new-booking-owner',
    subject: '📅 New Booking: {{params.CUSTOMER_NAME}} — {{params.SERVICE_NAME}}',
    html: baseLayout({
      accentColor: '#7c3aed',
      headerText:  'New Booking Received',
      bodyHtml: `
        <p style="${font};font-size:15px;color:#111827;margin:0 0 20px;">
          You have a new booking! Here are the details:
        </p>
        ${detailsTable([
          ['Customer',  'CUSTOMER_NAME'],
          ['Email',     'CUSTOMER_EMAIL'],
          ['Phone',     'CUSTOMER_PHONE'],
          ['Service',   'SERVICE_NAME'],
          ['Date',      'DATE'],
          ['Time',      'START_TIME'],
          ['Amount',    'AMOUNT'],
          ['Notes',     'NOTES'],
        ])}
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:14px 16px;border-radius:4px;margin-top:8px;">
          <p style="${font};font-size:13px;color:#4c1d95;margin:0;">
            Log in to <a href="https://flacroncontrol.com" style="color:#7c3aed;">FlacronControl</a>
            to confirm or manage this booking.
          </p>
        </div>`,
    }),
  },

]

// ── Brevo API helpers ──────────────────────────────────────────────────────────
async function listTemplates() {
  const res = await fetch('https://api.brevo.com/v3/smtp/templates?limit=50&offset=0', {
    headers: { 'api-key': API_KEY, 'accept': 'application/json' },
  })
  const data = await res.json()
  return data.templates || []
}

async function createTemplate(name, subject, htmlContent) {
  const res = await fetch('https://api.brevo.com/v3/smtp/templates', {
    method: 'POST',
    headers: { 'api-key': API_KEY, 'content-type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      templateName: name,
      subject,
      htmlContent,
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      isActive: true,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Create failed for "${name}": ${JSON.stringify(data)}`)
  return data.id
}

async function updateTemplate(id, name, subject, htmlContent) {
  const res = await fetch(`https://api.brevo.com/v3/smtp/templates/${id}`, {
    method: 'PUT',
    headers: { 'api-key': API_KEY, 'content-type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      templateName: name,
      subject,
      htmlContent,
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      isActive: true,
    }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`Update failed for "${name}" (id ${id}): ${JSON.stringify(data)}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Fetching existing Brevo templates…')
  const existing = await listTemplates()
  const existingMap = {}
  for (const t of existing) existingMap[t.name] = t.id

  const ids = {}

  for (const tpl of templates) {
    if (existingMap[tpl.name]) {
      const id = existingMap[tpl.name]
      await updateTemplate(id, tpl.name, tpl.subject, tpl.html)
      ids[tpl.name] = id
      console.log(`  ✏️  Updated  "${tpl.name}" → id ${id}`)
    } else {
      const id = await createTemplate(tpl.name, tpl.subject, tpl.html)
      ids[tpl.name] = id
      console.log(`  ✅ Created  "${tpl.name}" → id ${id}`)
    }
  }

  // Write templateIds.ts
  const tsContent = `// Auto-generated by setup-templates.mjs — do not edit manually
// Re-run \`node functions/setup-templates.mjs\` to refresh

export const BREVO_TEMPLATE_IDS = {
  bookingConfirmed:  ${ids['booking-confirmed']},
  bookingCancelled:  ${ids['booking-cancelled']},
  bookingCompleted:  ${ids['booking-completed']},
  invoiceSent:       ${ids['invoice-sent']},
  paymentReceipt:    ${ids['payment-receipt']},
  newBookingOwner:   ${ids['new-booking-owner']},
} as const

export type BrevoTemplateKey = keyof typeof BREVO_TEMPLATE_IDS
`

  import('fs').then(fs => {
    fs.writeFileSync('functions/src/notifications/templateIds.ts', tsContent)
    console.log('\n📄 Written: functions/src/notifications/templateIds.ts')
    console.log('\n🎉 All done! Template IDs:')
    console.table(ids)
  })
}

main().catch(err => { console.error('❌', err); process.exit(1) })
