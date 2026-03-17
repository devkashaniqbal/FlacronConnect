import { motion } from 'framer-motion'
import {
  DollarSign, Calendar, Users, MessageSquare,
  TrendingUp, TrendingDown, Clock, ArrowRight,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { useChatStore } from '@/store/chatStore'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'

function StatCard({ title, value, change, up, icon: Icon, color, loading }: {
  title: string; value: string; change: string; up: boolean
  icon: typeof DollarSign; color: string; loading?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-1">{title}</p>
          {loading
            ? <div className="h-8 w-20 bg-ink-100 dark:bg-ink-800 animate-pulse rounded" />
            : <p className="font-display font-bold text-2xl text-ink-900 dark:text-white">{value}</p>
          }
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {up
          ? <TrendingUp size={14} className="text-emerald-500" />
          : <TrendingDown size={14} className="text-amber-500" />
        }
        <span className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-amber-600'}`}>{change}</span>
      </div>
    </motion.div>
  )
}

const today = new Date().toISOString().split('T')[0]

export function DashboardPage() {
  const user      = useAuthStore(s => s.user)
  const { bookings, isLoading: bLoading } = useBookings()
  const { employees, isLoading: eLoading } = useEmployees()
  const chatCount = useChatStore(s => s.messages.filter(m => m.role === 'user').length)
  const hasPeakHour = useIndustryFeature('peakHourAnalytics')

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const toDateStr = (d: unknown): string => {
    if (typeof d === 'string') return d
    if (d && typeof (d as { toDate?: () => Date }).toDate === 'function')
      return (d as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    if (d instanceof Date) return d.toISOString().split('T')[0]
    return String(d ?? '')
  }
  const todayBookings    = bookings.filter(b => toDateStr(b.date) === today)
  const confirmedToday   = todayBookings.filter(b => b.status === 'confirmed')
  const pendingToday     = todayBookings.filter(b => b.status === 'pending')
  const currentMonth     = today.slice(0, 7)
  const monthRevenue     = bookings
    .filter(b => b.paymentStatus === 'paid' && toDateStr(b.date).startsWith(currentMonth))
    .reduce((s, b) => s + (b.amount ?? 0), 0)
  const activeEmployees  = employees.filter(e => e.activeStatus).length

  // Build simple 7-day revenue chart from booking data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const rev = bookings
      .filter(b => toDateStr(b.date) === key && b.paymentStatus === 'paid')
      .reduce((s, b) => s + (b.amount ?? 0), 0)
    return {
      month: d.toLocaleDateString('en', { weekday: 'short' }),
      revenue: rev,
    }
  })

  // Peak-hour density: count bookings by hour of day (for restaurant analytics)
  const peakHourData = Array.from({ length: 17 }, (_, i) => {
    const hour  = i + 7  // 7 AM – 11 PM
    const label = hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
    const count = bookings.filter(b => {
      const h = parseInt((b.startTime ?? '').split(':')[0] ?? '0', 10)
      return h === hour
    }).length
    return { label, count, hour }
  })
  const peakMax = Math.max(...peakHourData.map(d => d.count), 1)

  return (
    <DashboardShell title="Dashboard">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
          {greeting}, {user?.displayName?.split(' ')[0] || 'there'} 👋
        </h2>
        <p className="text-ink-500 dark:text-ink-400 mt-1">
          Here's what's happening with your business today, {formatDate(new Date())}.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Monthly Revenue" value={formatCurrency(monthRevenue)}
          change={`${confirmedToday.length} bookings today`} up={confirmedToday.length > 0}
          icon={DollarSign} color="from-emerald-500 to-emerald-600" loading={bLoading}
        />
        <StatCard
          title="Total Bookings" value={String(bookings.length)}
          change={`${pendingToday.length} pending`} up={todayBookings.length > 0}
          icon={Calendar} color="from-brand-500 to-brand-600" loading={bLoading}
        />
        <StatCard
          title="Active Employees" value={String(activeEmployees)}
          change={`${employees.length - activeEmployees} inactive`} up={activeEmployees > 0}
          icon={Users} color="from-amber-500 to-amber-600" loading={eLoading}
        />
        <StatCard
          title="AI Conversations" value={String(chatCount)}
          change="this session" up={chatCount > 0}
          icon={MessageSquare} color="from-accent-500 to-accent-600"
        />
      </div>

      {/* Charts + quick stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-white">Revenue — Last 7 Days</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Paid bookings only</p>
              </div>
              <Badge variant="success" dot>Live data</Badge>
            </div>
            {bLoading ? (
              <div className="h-[220px] flex items-center justify-center"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={last7}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Today at a glance</h3>
            <div className="space-y-4">
              {[
                { label: 'Appointments today',  value: String(todayBookings.length),    icon: Calendar,      color: 'text-brand-600' },
                { label: 'Confirmed today',      value: String(confirmedToday.length),   icon: Clock,         color: 'text-emerald-600' },
                { label: 'Pending approval',     value: String(pendingToday.length),     icon: MessageSquare, color: 'text-amber-600' },
                { label: 'Active staff',         value: String(activeEmployees),         icon: Users,         color: 'text-accent-600' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={item.color} />
                      <span className="text-sm text-ink-600 dark:text-ink-400">{item.label}</span>
                    </div>
                    <span className="font-semibold text-ink-900 dark:text-white text-sm">{item.value}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-ink-100 dark:border-ink-800">
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">AI Insight</p>
              <div className="p-3 bg-brand-50 dark:bg-brand-950/50 rounded-xl">
                <p className="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
                  💡 Use the AI Chat to get personalized business insights and recommendations.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent bookings */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-ink-900 dark:text-white">Recent Bookings</h3>
            <Link to={ROUTES.BOOKING}>
              <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />}>View all</Button>
            </Link>
          </div>
          {bLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-ink-400 py-8">No bookings yet. Create your first booking.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800">
                    {['Customer', 'Service', 'Date & Time', 'Status', 'Amount'].map(h => (
                      <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                  {bookings.slice(0, 5).map(b => (
                    <tr key={b.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={b.customerName} size="xs" />
                          <span className="text-sm font-medium text-ink-900 dark:text-white">{b.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-ink-600 dark:text-ink-400">{b.serviceName}</td>
                      <td className="py-3 pr-4 text-sm text-ink-600 dark:text-ink-400">
                        {formatDate(b.date as string, 'MMM d')} · {b.startTime}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'default'} dot>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3 font-medium text-ink-900 dark:text-white text-sm">
                        {formatCurrency(b.amount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
      {/* Peak-Hour Analytics (restaurant / café) */}
      {hasPeakHour && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-white">Peak Hour Analysis</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Booking density by hour of day</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={peakHourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, 'Bookings']}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {peakHourData.map(d => (
                    <Cell
                      key={d.hour}
                      fill={d.count === peakMax && peakMax > 0 ? '#ea580c' : '#fdba74'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-ink-400 mt-2 text-center">
              Busiest hour: {peakHourData.find(d => d.count === peakMax)?.label ?? '—'} · {peakMax} bookings
            </p>
          </Card>
        </motion.div>
      )}
    </DashboardShell>
  )
}
