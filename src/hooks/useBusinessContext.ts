import { useAuthStore } from '@/store/authStore'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { formatDate } from '@/utils/formatters'

export function useBusinessContext() {
  const user = useAuthStore(s => s.user)
  const { bookings } = useBookings()
  const { employees } = useEmployees()

  function buildContext(): string {
    const today = new Date().toISOString().split('T')[0]

    const paidBookings     = bookings.filter(b => b.paymentStatus === 'paid')
    const monthRevenue     = paidBookings.reduce((s, b) => s + (b.amount ?? 0), 0)
    const todayBookings    = bookings.filter(b => {
      const d = typeof b.date === 'string' ? b.date
        : typeof (b.date as { toDate?: () => Date }).toDate === 'function'
          ? (b.date as { toDate: () => Date }).toDate().toISOString().split('T')[0]
          : String(b.date)
      return d === today
    })
    const pendingBookings  = bookings.filter(b => b.status === 'pending')
    const activeEmployees  = employees.filter(e => e.activeStatus)

    const bookingLines = bookings.slice(0, 40).map(b => {
      const dateStr = typeof b.date === 'string' ? b.date
        : typeof (b.date as { toDate?: () => Date }).toDate === 'function'
          ? formatDate((b.date as { toDate: () => Date }).toDate(), 'yyyy-MM-dd')
          : String(b.date)
      return `  ID:${b.id} | ${b.customerName}${b.customerPhone ? ` (${b.customerPhone})` : ''} | ${b.serviceName} | ${dateStr} ${b.startTime} | status:${b.status} | payment:${b.paymentStatus} | $${b.amount ?? 0}`
    }).join('\n')

    const employeeLines = employees.map(e =>
      `  ${e.name} | role:${e.role} | ${e.activeStatus ? 'active' : 'inactive'} | $${e.hourlyRate}/hr`
    ).join('\n')

    return `=== BUSINESS CONTEXT (Live Data — Today: ${today}) ===
Owner: ${user?.displayName || 'Business Owner'}
Plan: ${user?.plan || 'starter'}

=== REVENUE ===
This month — paid bookings: $${monthRevenue.toFixed(2)} (${paidBookings.length} bookings paid)
Pending (unpaid): ${pendingBookings.length} bookings

=== TODAY'S BOOKINGS (${todayBookings.length} total) ===
${todayBookings.length === 0
  ? '  No bookings today.'
  : todayBookings.map(b =>
      `  ${b.customerName} | ${b.serviceName} | ${b.startTime} | status:${b.status}`
    ).join('\n')
}

=== ALL BOOKINGS — most recent 40 (use IDs for status updates) ===
${bookingLines || '  No bookings on record.'}

=== EMPLOYEES (${employees.length} total, ${activeEmployees.length} active) ===
${employeeLines || '  No employees on record.'}`.trim()
  }

  return { buildContext }
}
