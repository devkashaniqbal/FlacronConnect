import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Calendar, TrendingUp, TrendingDown,
  Users, FileText, CheckCircle, XCircle, Clock,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { useInvoices } from '@/hooks/useInvoices'
import { useAuthStore } from '@/store/authStore'
import type { Timestamp } from 'firebase/firestore'

// ── helpers ────────────────────────────────────────────────────────────────────
function toDateStr(d: unknown): string {
  if (typeof d === 'string') return d
  if (d && typeof (d as Timestamp).toDate === 'function')
    return (d as Timestamp).toDate().toISOString().split('T')[0]
  if (d instanceof Date) return d.toISOString().split('T')[0]
  return String(d ?? '')
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function startOfMonth(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset, 1)
  return d.toISOString().split('T')[0]
}

function endOfMonth(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset + 1, 0)
  return d.toISOString().split('T')[0]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const STATUS_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  pending:   '#f59e0b',
  completed: '#3b82f6',
  cancelled: '#ef4444',
}

// ── stat card ─────────────────────────────────────────────────────────────────
function MetricCard({ title, value, sub, up, icon: Icon, color }: {
  title: string; value: string; sub: string; up?: boolean
  icon: typeof DollarSign; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="font-display font-bold text-2xl text-ink-900 dark:text-white mb-1">{value}</p>
      <div className="flex items-center gap-1.5">
        {up !== undefined && (
          up ? <TrendingUp size={12} className="text-emerald-500" />
             : <TrendingDown size={12} className="text-amber-500" />
        )}
        <span className={`text-xs ${up === true ? 'text-emerald-600' : up === false ? 'text-amber-600' : 'text-ink-500 dark:text-ink-400'}`}>
          {sub}
        </span>
      </div>
    </motion.div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const user                              = useAuthStore(s => s.user)
  const { bookings, isLoading: bLoading } = useBookings()
  const { employees }                     = useEmployees()
  const { invoices, isLoading: iLoading } = useInvoices()

  const industryLabel = user?.industryType?.replace(/_/g, ' ') ?? 'General'

  // ── Date boundaries ─────────────────────────────────────────────────────────
  const thisMonthStart = startOfMonth(0)
  const thisMonthEnd   = endOfMonth(0)
  const lastMonthStart = startOfMonth(-1)
  const lastMonthEnd   = endOfMonth(-1)

  // ── Core calculations ───────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const paid = (b: typeof bookings[number]) => b.paymentStatus === 'paid'
    const inRange = (date: unknown, start: string, end: string) => {
      const d = toDateStr(date)
      return d >= start && d <= end
    }

    // Revenue
    const thisMonthRev  = bookings.filter(b => paid(b) && inRange(b.date, thisMonthStart, thisMonthEnd)).reduce((s, b) => s + (b.amount ?? 0), 0)
    const lastMonthRev  = bookings.filter(b => paid(b) && inRange(b.date, lastMonthStart, lastMonthEnd)).reduce((s, b) => s + (b.amount ?? 0), 0)
    const revChange     = lastMonthRev === 0 ? 100 : ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
    const totalRevenue  = bookings.filter(paid).reduce((s, b) => s + (b.amount ?? 0), 0)
    const avgBooking    = bookings.length ? totalRevenue / bookings.filter(paid).length || 0 : 0

    // Booking status breakdown
    const statusCount = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

    const completionRate = bookings.length
      ? Math.round(((statusCount['completed'] ?? 0) / bookings.length) * 100)
      : 0

    // 30-day revenue chart
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const dateKey = daysAgo(29 - i)
      const rev = bookings
        .filter(b => paid(b) && toDateStr(b.date) === dateKey)
        .reduce((s, b) => s + (b.amount ?? 0), 0)
      const label = new Date(dateKey + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
      return { date: label, revenue: rev, bookings: bookings.filter(b => toDateStr(b.date) === dateKey).length }
    })

    // Show only every 5th label to avoid clutter
    const last30Labeled = last30.map((d, i) => ({ ...d, date: i % 5 === 0 ? d.date : '' }))

    // Top services
    const serviceMap = new Map<string, { count: number; revenue: number }>()
    bookings.forEach(b => {
      const key = b.serviceName || 'Unknown'
      const cur = serviceMap.get(key) ?? { count: 0, revenue: 0 }
      serviceMap.set(key, {
        count:   cur.count + 1,
        revenue: cur.revenue + (paid(b) ? (b.amount ?? 0) : 0),
      })
    })
    const topServices = [...serviceMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 6)
      .map(([name, d]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, ...d }))

    // Bookings by day of week
    const dayCount = Array(7).fill(0) as number[]
    bookings.forEach(b => {
      const d = new Date(toDateStr(b.date) + 'T00:00:00')
      if (!isNaN(d.getTime())) dayCount[d.getDay()]++
    })
    const byDow = DAYS.map((d, i) => ({ day: d, count: dayCount[i] }))

    // Invoice summary
    const invPaid      = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0)
    const invPending   = invoices.filter(i => i.status === 'draft').reduce((s, i) => s + (i.total ?? 0), 0)
    const invOverdue   = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total ?? 0), 0)
    const invTotal     = invoices.reduce((s, i) => s + (i.total ?? 0), 0)

    return {
      thisMonthRev, lastMonthRev, revChange, totalRevenue, avgBooking,
      statusCount, completionRate,
      last30: last30Labeled,
      topServices, byDow,
      invPaid, invPending, invOverdue, invTotal,
      activeEmployees: employees.filter(e => e.activeStatus).length,
    }
  }, [bookings, employees, invoices, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd])

  if (bLoading || iLoading) {
    return (
      <DashboardShell title="Analytics">
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      </DashboardShell>
    )
  }

  const statusPie = Object.entries(analytics.statusCount).map(([status, value]) => ({ status, value }))

  return (
    <DashboardShell title="Analytics">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Business Analytics</h2>
          <p className="text-ink-500 dark:text-ink-400 mt-0.5 text-sm capitalize">{industryLabel} · All-time data from your account</p>
        </div>
        <Badge variant="success" dot>Live data</Badge>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="This Month Revenue" value={formatCurrency(analytics.thisMonthRev)}
          sub={`${analytics.revChange >= 0 ? '+' : ''}${analytics.revChange.toFixed(1)}% vs last month`}
          up={analytics.revChange >= 0}
          icon={DollarSign} color="from-emerald-500 to-emerald-600"
        />
        <MetricCard
          title="Total Bookings" value={String(bookings.length)}
          sub={`${analytics.completionRate}% completion rate`}
          icon={Calendar} color="from-brand-500 to-brand-600"
        />
        <MetricCard
          title="Avg Booking Value" value={formatCurrency(analytics.avgBooking)}
          sub={`${bookings.filter(b => b.paymentStatus === 'paid').length} paid bookings`}
          icon={TrendingUp} color="from-accent-500 to-accent-600"
        />
        <MetricCard
          title="Active Employees" value={String(analytics.activeEmployees)}
          sub={`${employees.length} total staff`}
          icon={Users} color="from-amber-500 to-amber-600"
        />
      </div>

      {/* 30-day revenue chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink-900 dark:text-white">Revenue — Last 30 Days</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">Paid bookings only · {formatCurrency(analytics.thisMonthRev)} this month</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-ink-900 dark:text-white">{formatCurrency(analytics.totalRevenue)}</p>
              <p className="text-xs text-ink-400">All-time revenue</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics.last30} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  name === 'revenue' ? formatCurrency(v) : v,
                  name === 'revenue' ? 'Revenue' : 'Bookings',
                ]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2.5} fill="url(#revGrad30)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Middle row: Status breakdown + by day of week */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Booking status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Booking Status Breakdown</h3>
            {bookings.length === 0 ? (
              <p className="text-ink-400 text-sm text-center py-8">No bookings yet.</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      dataKey="value"
                      nameKey="status"
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                      paddingAngle={3}
                    >
                      {statusPie.map(entry => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {statusPie.map(entry => (
                    <div key={entry.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[entry.status] ?? '#94a3b8' }} />
                        <span className="text-sm capitalize text-ink-700 dark:text-ink-300">{entry.status}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-ink-900 dark:text-white">{entry.value}</span>
                        <span className="text-xs text-ink-400 ml-1">({Math.round((entry.value / bookings.length) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* By day of week */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <h3 className="font-semibold text-ink-900 dark:text-white mb-1">Bookings by Day of Week</h3>
            <p className="text-xs text-ink-400 mb-4">Across all time — spot your busiest days</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={analytics.byDow} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Bookings']} contentStyle={{ borderRadius: '10px', border: 'none' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.byDow.map((d, i) => {
                    const max = Math.max(...analytics.byDow.map(x => x.count), 1)
                    return <Cell key={i} fill={d.count === max && max > 0 ? '#ea580c' : '#fdba74'} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Top services */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
        <Card>
          <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Top Services by Revenue</h3>
          {analytics.topServices.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-6">No service data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.topServices} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  formatter={(v: number, name: string) => [name === 'revenue' ? formatCurrency(v) : v, name === 'revenue' ? 'Revenue' : 'Bookings']}
                  contentStyle={{ borderRadius: '10px', border: 'none' }}
                />
                <Bar dataKey="revenue" fill="#ea580c" radius={[0, 4, 4, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* Invoice summary + employee summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Invoice summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-brand-500" />
              <h3 className="font-semibold text-ink-900 dark:text-white">Invoice Summary</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total invoiced',   value: formatCurrency(analytics.invTotal),   icon: DollarSign,   color: 'text-ink-600 dark:text-ink-400' },
                { label: 'Paid',             value: formatCurrency(analytics.invPaid),    icon: CheckCircle,  color: 'text-emerald-600' },
                { label: 'Outstanding',      value: formatCurrency(analytics.invPending), icon: Clock,        color: 'text-amber-600' },
                { label: 'Overdue',          value: formatCurrency(analytics.invOverdue), icon: XCircle,      color: 'text-red-600' },
              ].map(row => {
                const Icon = row.icon
                return (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={row.color} />
                      <span className="text-sm text-ink-600 dark:text-ink-400">{row.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-ink-900 dark:text-white">{row.value}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800">
              <div className="flex justify-between text-xs text-ink-400">
                <span>{invoices.length} total invoices</span>
                <span>{invoices.filter(i => i.status === 'paid').length} paid</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Month comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-emerald-500" />
              <h3 className="font-semibold text-ink-900 dark:text-white">Month-over-Month</h3>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[
                  { month: 'Last Month', revenue: analytics.lastMonthRev },
                  { month: 'This Month', revenue: analytics.thisMonthRev },
                ]}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '10px', border: 'none' }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  <Cell fill="#94a3b8" />
                  <Cell fill="#ea580c" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-ink-400 mt-2">
              {analytics.revChange >= 0 ? '▲' : '▼'} {Math.abs(analytics.revChange).toFixed(1)}% {analytics.revChange >= 0 ? 'growth' : 'decline'} this month
            </p>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
