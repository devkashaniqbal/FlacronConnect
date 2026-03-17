import { useAuthStore } from '@/store/authStore'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { useInvoices } from '@/hooks/useInvoices'
import { useAttendance } from '@/hooks/useAttendance'
import { useBusinessSetup } from '@/hooks/useBusinessSetup'
import { formatDate } from '@/utils/formatters'
import type { Timestamp } from 'firebase/firestore'

function toDateStr(d: unknown): string {
  if (typeof d === 'string') return d
  if (typeof (d as { toDate?: () => Date }).toDate === 'function')
    return (d as { toDate: () => Date }).toDate().toISOString().split('T')[0]
  return String(d)
}

function tsToStr(ts: unknown): string {
  if (!ts) return 'null'
  if (typeof (ts as Timestamp).toDate === 'function')
    return (ts as Timestamp).toDate().toISOString()
  return String(ts)
}

export function useBusinessContext() {
  const user = useAuthStore(s => s.user)
  const { bookings }   = useBookings()
  const { employees }  = useEmployees()
  const { invoices }   = useInvoices()
  const { records: attendanceRecords } = useAttendance()
  const { business, services, hours }  = useBusinessSetup()

  function buildContext(): string {
    const today = new Date().toISOString().split('T')[0]

    // ── Revenue ──────────────────────────────────────────────────────────────
    const paidBookings    = bookings.filter(b => b.paymentStatus === 'paid')
    const monthRevenue    = paidBookings.reduce((s, b) => s + (b.amount ?? 0), 0)
    const todayBookings   = bookings.filter(b => toDateStr(b.date) === today)
    const pendingBookings = bookings.filter(b => b.status === 'pending')
    const activeEmployees = employees.filter(e => e.activeStatus)

    // ── Bookings ─────────────────────────────────────────────────────────────
    const bookingLines = bookings.slice(0, 40).map(b =>
      `  ID:${b.id} | ${b.customerName}${b.customerPhone ? ` (${b.customerPhone})` : ''} | ${b.serviceName} | ${toDateStr(b.date)} ${b.startTime} | status:${b.status} | payment:${b.paymentStatus} | $${b.amount ?? 0}`
    ).join('\n')

    // ── Employees ────────────────────────────────────────────────────────────
    const employeeLines = employees.map(e =>
      `  ID:${e.id} | ${e.name} | role:${e.role} | ${e.activeStatus ? 'active' : 'inactive'} | $${e.hourlyRate}/hr${e.email ? ` | ${e.email}` : ''}${e.phone ? ` | ${e.phone}` : ''}`
    ).join('\n')

    // ── Invoices ─────────────────────────────────────────────────────────────
    const invoiceLines = invoices.slice(0, 20).map(inv =>
      `  ID:${inv.id} | ${inv.customerName} | $${inv.total?.toFixed(2) ?? '0.00'} | status:${inv.status} | due:${toDateStr(inv.dueDate)}`
    ).join('\n')

    // ── Attendance (today + open shifts) ─────────────────────────────────────
    const openShifts    = attendanceRecords.filter(r => !r.clockOut)
    const todayAttend   = attendanceRecords.filter(r => r.date === today)
    const attendLines   = todayAttend.map(r =>
      `  RecordID:${r.id} | ${r.employeeName} (${r.employeeId}) | clockIn:${tsToStr(r.clockIn)} | clockOut:${r.clockOut ? tsToStr(r.clockOut) : 'OPEN'} | hours:${r.hours ?? 'in progress'}`
    ).join('\n')
    const openLines = openShifts.map(r =>
      `  RecordID:${r.id} | ${r.employeeName} (${r.employeeId}) | clockIn:${tsToStr(r.clockIn)} — USE THIS ID TO CLOCK OUT`
    ).join('\n')

    // ── Services ─────────────────────────────────────────────────────────────
    const serviceLines = services.map(s =>
      `  ID:${s.id} | ${s.name} | $${s.price}${s.duration ? ` | ${s.duration}min` : ''}${s.description ? ` | ${s.description}` : ''}`
    ).join('\n')

    // ── Business Hours ────────────────────────────────────────────────────────
    const hoursLines = hours.map(h =>
      `  ID:${h.id} | ${h.day}: ${h.isClosed ? 'CLOSED' : `${h.openTime} - ${h.closeTime}`}`
    ).join('\n')

    // ── Business Info ─────────────────────────────────────────────────────────
    const bizLines = business
      ? [
          business.name    && `Name: ${business.name}`,
          business.phone   && `Phone: ${business.phone}`,
          business.email   && `Email: ${business.email}`,
          business.address && `Address: ${business.address}`,
          business.website && `Website: ${business.website}`,
        ].filter(Boolean).join('\n')
      : '  Not configured yet.'

    return `=== BUSINESS CONTEXT (Live Data — Today: ${today}) ===
Owner: ${user?.displayName || 'Business Owner'}
Plan: ${user?.plan || 'starter'}
Industry: ${user?.industryType || 'general'}

=== BUSINESS INFO ===
${bizLines}

=== REVENUE ===
This month — paid bookings: $${monthRevenue.toFixed(2)} (${paidBookings.length} paid)
Pending (unpaid): ${pendingBookings.length} bookings

=== TODAY'S BOOKINGS (${todayBookings.length} total) ===
${todayBookings.length === 0
  ? '  No bookings today.'
  : todayBookings.map(b => `  ${b.customerName} | ${b.serviceName} | ${b.startTime} | status:${b.status}`).join('\n')
}

=== ALL BOOKINGS — most recent 40 (use IDs for status updates / deletions) ===
${bookingLines || '  No bookings on record.'}

=== EMPLOYEES (${employees.length} total, ${activeEmployees.length} active) ===
${employeeLines || '  No employees on record.'}

=== ATTENDANCE — TODAY (${today}) ===
${attendLines || '  No attendance records today.'}

=== OPEN SHIFTS (employees currently clocked in — use RecordID for clock-out) ===
${openLines || '  No open shifts.'}

=== INVOICES — most recent 20 ===
${invoiceLines || '  No invoices on record.'}

=== SERVICES ===
${serviceLines || '  No services configured.'}

=== BUSINESS HOURS ===
${hoursLines || '  Not configured.'}`.trim()
  }

  return { buildContext }
}
