// Commission Report — Hair Salon / Barbershop · Real Estate Agency
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Download } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Spinner } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { calcCommission, totalCommissionForEmployee } from '@/utils/commission'
import { cn } from '@/utils/cn'

const PERIODS = ['This Week', 'This Month', 'Last Month', 'All Time'] as const
type Period = (typeof PERIODS)[number]

function filterByPeriod(bookings: { date: unknown; status: string }[], period: Period) {
  const now = new Date()
  const start = new Date()
  if (period === 'This Week') start.setDate(now.getDate() - now.getDay())
  else if (period === 'This Month') start.setDate(1)
  else if (period === 'Last Month') { start.setMonth(now.getMonth() - 1); start.setDate(1) }
  else return bookings.filter(b => b.status === 'completed')

  const end = period === 'Last Month'
    ? new Date(now.getFullYear(), now.getMonth(), 0)
    : now

  return bookings.filter(b => {
    if (b.status !== 'completed') return false
    const d = new Date(b.date as string)
    return d >= start && d <= end
  })
}

export function CommissionsPage() {
  const { bookings, isLoading: loadingB } = useBookings()
  const { employees, isLoading: loadingE } = useEmployees()
  const [period, setPeriod] = useState<Period>('This Month')

  const filtered = useMemo(() => filterByPeriod(bookings, period), [bookings, period])

  const commissionableEmployees = employees.filter(e => (e.commissionRate ?? 0) > 0)

  const rows = useMemo(() => commissionableEmployees.map(emp => {
    const empBookings = filtered.filter(b =>
      (b as { assignedEmployeeId?: string }).assignedEmployeeId === emp.id
    )
    const revenue    = empBookings.reduce((s, b) => s + ((b as { amount?: number }).amount ?? 0), 0)
    const commission = totalCommissionForEmployee(
      empBookings.map(b => ({
        amount: (b as { amount?: number }).amount,
        commissionRate: emp.commissionRate,
      }))
    )
    return { emp, bookings: empBookings.length, revenue, commission }
  }), [commissionableEmployees, filtered])

  const totals = rows.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, commission: acc.commission + r.commission }),
    { revenue: 0, commission: 0 }
  )

  const isLoading = loadingB || loadingE

  return (
    <DashboardShell title="Commissions">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Commission Report</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">Earnings by staff member</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-ink-100 dark:bg-ink-800 rounded-xl gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  period === p
                    ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm'
                    : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Revenue',     value: formatCurrency(totals.revenue),    icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Total Commissions', value: formatCurrency(totals.commission),  icon: DollarSign, color: 'text-brand-600' },
          { label: 'Staff w/ Commission', value: `${commissionableEmployees.length}`, icon: DollarSign, color: 'text-amber-600' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="flex items-center gap-3">
              <Icon size={22} className={s.color} />
              <div>
                <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
                <p className="font-bold text-ink-900 dark:text-white text-lg">{s.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : commissionableEmployees.length === 0 ? (
        <Card className="py-16 text-center">
          <DollarSign size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No commission rates set</p>
          <p className="text-ink-400 text-sm mt-1">
            Go to Employees and set a commission % for each stylist/agent.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Employee', 'Rate', 'Jobs', 'Revenue', 'Commission', ''].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                {rows.map((row, i) => (
                  <motion.tr
                    key={row.emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.emp.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-ink-900 dark:text-white">{row.emp.name}</p>
                          <p className="text-xs text-ink-400 capitalize">{row.emp.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="brand">{row.emp.commissionRate}%</Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{row.bookings}</td>
                    <td className="py-3 pr-4 text-sm font-medium text-ink-900 dark:text-white">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.commission)}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Download size={13} />}
                        onClick={() => {
                          const csv = [
                            'Employee,Role,Commission Rate,Bookings,Revenue,Commission',
                            `${row.emp.name},${row.emp.role},${row.emp.commissionRate}%,${row.bookings},${row.revenue.toFixed(2)},${row.commission.toFixed(2)}`,
                          ].join('\n')
                          const blob = new Blob([csv], { type: 'text/csv' })
                          const url  = URL.createObjectURL(blob)
                          const a    = document.createElement('a')
                          a.href     = url
                          a.download = `commission-${row.emp.name.replace(/\s+/g, '-').toLowerCase()}-${period.replace(/\s+/g, '-').toLowerCase()}.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                      >
                        Export
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardShell>
  )
}
