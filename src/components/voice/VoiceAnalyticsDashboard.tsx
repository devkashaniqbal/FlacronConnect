import { motion } from 'framer-motion'
import {
  PhoneCall, Clock, TrendingUp, CheckCircle2, Calendar, ThumbsUp,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { Card } from '@/components/ui'
import type { VoiceAnalytics } from '@/types/voice.types'

interface StatCardProps {
  title: string; value: string; sub: string; icon: typeof PhoneCall; color: string
}

function StatCard({ title, value, sub, icon: Icon, color }: StatCardProps) {
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
          <p className="font-display font-bold text-2xl text-ink-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400">{sub}</p>
    </motion.div>
  )
}

interface VoiceAnalyticsDashboardProps {
  analytics: VoiceAnalytics
}

export function VoiceAnalyticsDashboard({ analytics }: VoiceAnalyticsDashboardProps) {
  const sentimentData = [
    { name: 'Positive', value: analytics.sentimentBreakdown.positive, color: '#10b981' },
    { name: 'Neutral',  value: analytics.sentimentBreakdown.neutral,  color: '#6b7280' },
    { name: 'Negative', value: analytics.sentimentBreakdown.negative, color: '#ef4444' },
  ]

  const avgDurationMin = Math.floor(analytics.avgDuration / 60)
  const avgDurationSec = analytics.avgDuration % 60

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"     value={String(analytics.totalCalls)}
          sub={`${analytics.completedCalls} completed`}
          icon={PhoneCall} color="from-brand-500 to-brand-600"
        />
        <StatCard
          title="Total Minutes"   value={String(analytics.totalMinutes)}
          sub={`Avg ${avgDurationMin}:${avgDurationSec.toString().padStart(2,'0')} / call`}
          icon={Clock} color="from-sky-500 to-sky-600"
        />
        <StatCard
          title="Success Rate"    value={`${analytics.successRate}%`}
          sub={`${analytics.totalCalls - analytics.completedCalls} missed`}
          icon={CheckCircle2} color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Bookings Created" value={String(analytics.bookingsCreated)}
          sub={`${analytics.smsSent} SMS sent`}
          icon={Calendar} color="from-accent-500 to-accent-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calls + Minutes 7-day chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-white">Call Volume — Last 7 Days</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Calls and minutes per day</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.callsByDay}>
                <defs>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" className="dark:stroke-ink-800" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                  formatter={(v: number, name: string) => [v, name === 'calls' ? 'Calls' : 'Minutes']}
                />
                <Area type="monotone" dataKey="calls"   stroke="#ea580c" strokeWidth={2.5} fill="url(#callGrad)" />
                <Area type="monotone" dataKey="minutes" stroke="#0ea5e9" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Sentiment breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <Card>
            <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Sentiment</h3>
            <div className="space-y-3 mb-4">
              {sentimentData.map(s => {
                const total = analytics.totalCalls || 1
                const pct   = Math.round((s.value / total) * 100)
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-ink-600 dark:text-ink-400">{s.name}</span>
                      <span className="text-sm font-semibold text-ink-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 border-t border-ink-100 dark:border-ink-800">
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Top Outcomes</p>
              <div className="space-y-1.5">
                {analytics.topOutcomes.slice(0, 4).map(o => (
                  <div key={o.outcome} className="flex items-center justify-between text-xs">
                    <span className="text-ink-600 dark:text-ink-400 capitalize">
                      {o.outcome?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-ink-900 dark:text-white">{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Hourly heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <Card>
          <h3 className="font-semibold text-ink-900 dark:text-white mb-1">Peak Call Hours</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">Calls by hour of day</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={analytics.callsByHour} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={h => h % 6 === 0 ? `${h}h` : ''}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                formatter={(v: number) => [v, 'Calls']}
                labelFormatter={h => `${h}:00`}
              />
              <Bar dataKey="calls" radius={[3, 3, 0, 0]}>
                {analytics.callsByHour.map((entry, i) => (
                  <Cell key={i} fill={entry.calls > 0 ? '#ea580c' : '#e5e7eb'} className="dark:fill-ink-700" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </div>
  )
}
