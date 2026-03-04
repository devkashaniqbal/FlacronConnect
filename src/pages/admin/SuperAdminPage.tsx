import { motion } from 'framer-motion'
import { Building2, Users, CreditCard, Activity, TrendingUp, Globe, RefreshCw } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAdminStats } from '@/hooks/useAdminStats'

export function SuperAdminPage() {
  const { stats, isLoading } = useAdminStats()

  if (isLoading) {
    return (
      <DashboardShell title="Super Admin">
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" />
        </div>
      </DashboardShell>
    )
  }

  const adminStats = [
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses?.toLocaleString() ?? '0',
      change: 'all time',
      icon: Building2,
      color: 'from-brand-500 to-brand-600',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() ?? '0',
      change: 'all time',
      icon: Users,
      color: 'from-accent-500 to-accent-600',
    },
    {
      label: 'MRR',
      value: formatCurrency(stats?.mrr ?? 0),
      change: 'active subscriptions',
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Plans Active',
      value: String(stats?.planDistribution?.reduce((s, p) => s + p.count, 0) ?? 0),
      change: 'paid seats',
      icon: Activity,
      color: 'from-amber-500 to-amber-600',
    },
  ]

  return (
    <DashboardShell title="Super Admin">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Super Admin Panel</h2>
          <Badge variant="danger">Admin Only</Badge>
        </div>
        <p className="text-ink-500 dark:text-ink-400 text-sm">Platform-wide overview and management — live data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {adminStats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400 uppercase tracking-wider">{s.label}</p>
                  <p className="font-display font-bold text-2xl text-ink-900 dark:text-white mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-ink-400 flex items-center gap-1">
                <TrendingUp size={11} /> {s.change}
              </p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Plan distribution chart */}
        <Card>
          <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Plan Distribution</h3>
          {stats?.planDistribution && stats.planDistribution.some(p => p.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.planDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="plan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#ea580c" radius={[6, 6, 0, 0]} name="Businesses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-ink-400 text-sm">
              No businesses yet
            </div>
          )}
        </Card>

        {/* Revenue by plan */}
        <Card>
          <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Revenue by Plan</h3>
          <div className="space-y-3">
            {(stats?.planDistribution ?? []).map(p => {
              const total = stats?.mrr || 1
              const pct = Math.round((p.revenue / total) * 100)
              return (
                <div key={p.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-600 dark:text-ink-400">{p.plan}</span>
                    <span className="font-medium text-ink-900 dark:text-white">
                      {formatCurrency(p.revenue)}/mo
                    </span>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">{p.count} businesses</p>
                </div>
              )
            })}
            {(!stats?.mrr || stats.mrr === 0) && (
              <p className="text-sm text-ink-400 text-center py-4">No active subscriptions yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent businesses */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink-900 dark:text-white">Recently Joined Businesses</h3>
          <Badge variant="default">{stats?.recentBusinesses?.length ?? 0} shown</Badge>
        </div>

        {!stats?.recentBusinesses?.length ? (
          <p className="text-sm text-ink-400 py-8 text-center">No businesses registered yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Business', 'Plan', 'Status', 'Industry', 'Joined', 'MRR'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                {stats.recentBusinesses.map(b => (
                  <tr key={b.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
                          <Globe size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-ink-900 dark:text-white">{b.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={
                        b.plan === 'enterprise' ? 'success'
                        : b.plan === 'pro' ? 'brand'
                        : b.plan === 'growth' ? 'info'
                        : 'default'
                      }>
                        {b.plan}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={b.planStatus === 'active' ? 'success' : 'warning'} dot>
                        {b.planStatus || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-ink-500 capitalize">
                      {b.industry?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-ink-500">
                      {formatDate(b.createdAt.toISOString(), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 text-sm font-medium text-ink-900 dark:text-white">
                      {b.mrr === 0 ? <span className="text-ink-400">—</span> : formatCurrency(b.mrr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  )
}
