import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, TrendingUp, ArrowUpRight, ExternalLink, Check, AlertCircle, Clock, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { PLANS } from '@/constants/plans'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { useInvoices } from '@/hooks/useInvoices'
import { useBookings } from '@/hooks/useBookings'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe'
import { cn } from '@/utils/cn'

export function PaymentsPage() {
  const user                     = useAuthStore(s => s.user)
  const currentPlan              = PLANS.find(p => p.id === (user?.plan ?? 'starter'))
  const [annual, setAnnual]      = useState(false)
  const [loading, setLoading]    = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const { invoices, isLoading: invLoading } = useInvoices()
  const { bookings, isLoading: bLoading }   = useBookings()

  const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const toDateStr = (d: unknown): string => {
    if (typeof d === 'string') return d
    if (d && typeof (d as { toDate?: () => Date }).toDate === 'function')
      return (d as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    if (d instanceof Date) return d.toISOString().split('T')[0]
    return ''
  }

  // Revenue from paid bookings THIS month
  const monthRevenue = bookings
    .filter(b => b.paymentStatus === 'paid' && toDateStr(b.date).startsWith(currentMonth))
    .reduce((s, b) => s + (b.amount ?? 0), 0)

  // All-time paid revenue
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((s, b) => s + (b.amount ?? 0), 0)

  // Invoice stats
  const paidInvoices     = invoices.filter(i => i.status === 'paid')
  const outstandingInvs  = invoices.filter(i => i.status === 'sent' || i.status === 'draft')
  const overdueInvs      = invoices.filter(i => i.status === 'overdue')
  const outstandingTotal = outstandingInvs.reduce((s, i) => s + (i.total ?? 0), 0)
  const overdueTotal     = overdueInvs.reduce((s, i) => s + (i.total ?? 0), 0)
  const paidTotal        = paidInvoices.reduce((s, i) => s + (i.total ?? 0), 0)

  // Real recent transactions from invoices (latest 5)
  const recentTransactions = [...invoices]
    .sort((a, b) => {
      const ts = (v: unknown) => {
        if (v && typeof (v as { toDate?: () => Date }).toDate === 'function') {
          return (v as { toDate: () => Date }).toDate().getTime()
        }
        return 0
      }
      return ts(b.createdAt) - ts(a.createdAt)
    })
    .slice(0, 5)

  // Handle Stripe redirect back
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const plan = searchParams.get('plan')
      toast.success(`🎉 You're now on the ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''} plan!`)
      setSearchParams({})
    } else if (searchParams.get('cancelled') === 'true') {
      toast('Checkout cancelled.', { icon: '↩️' })
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  async function handleUpgrade(planId: string) {
    if (!user?.businessId) { toast.error('No business found'); return }
    const plan    = PLANS.find(p => p.id === planId)
    if (!plan)    return
    const priceId = annual ? plan.stripePriceIdAnnual : plan.stripePriceId

    setLoading(planId)
    try {
      const result = await createCheckoutSession(priceId, user.businessId, planId)
      if (result?.url) {
        window.location.href = result.url
      } else {
        toast.error('Could not start checkout. Please try again.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  async function handleManageBilling() {
    if (!user?.businessId) { toast.error('No business found'); return }
    setLoading('portal')
    try {
      const result = await createPortalSession(user.businessId)
      if (result?.url) {
        window.location.href = result.url
      } else {
        toast.error('No billing account found. Subscribe to a plan first.')
      }
    } catch {
      toast.error('Could not open billing portal.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <DashboardShell title="Payments">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Payments & Billing</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm">Manage your subscription and view transactions</p>
      </div>

      {/* Current plan card */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-brand border-0 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1">Current Plan</p>
                <h3 className="font-display text-3xl font-bold capitalize">{currentPlan?.name}</h3>
                <p className="text-white/70 text-sm mt-1">{currentPlan?.description}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard size={22} className="text-white" />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm opacity-70">Billing</p>
                <p className="font-semibold">
                  {formatCurrency(annual ? (currentPlan?.priceAnnual ?? 0) : (currentPlan?.price ?? 0))}/{annual ? 'mo (annual)' : 'mo'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-ink-900"
                  loading={loading === 'portal'}
                  onClick={handleManageBilling}
                >
                  Manage Billing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white/30 hover:bg-white/10"
                  onClick={() => document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue summary */}
        <Card>
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mb-1">This Month Revenue</p>
          {bLoading
            ? <div className="h-9 w-28 bg-ink-100 dark:bg-ink-800 animate-pulse rounded mb-2" />
            : <p className="font-display font-bold text-3xl text-ink-900 dark:text-white mb-2">{formatCurrency(monthRevenue)}</p>
          }
          <div className="flex items-center gap-1.5 text-emerald-600 mb-4">
            <TrendingUp size={14} />
            <span className="text-sm font-medium">Paid bookings this month</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            icon={<ExternalLink size={13} />}
            iconRight={<ArrowUpRight size={13} />}
            onClick={handleManageBilling}
            loading={loading === 'portal'}
          >
            View Stripe Dashboard
          </Button>
        </Card>
      </div>

      {/* Financial overview */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            sub: 'All-time paid bookings',
            icon: DollarSign,
            color: 'from-emerald-500 to-emerald-600',
            loading: bLoading,
          },
          {
            label: 'Paid Invoices',
            value: formatCurrency(paidTotal),
            sub: `${paidInvoices.length} invoice${paidInvoices.length !== 1 ? 's' : ''}`,
            icon: Check,
            color: 'from-brand-500 to-brand-600',
            loading: invLoading,
          },
          {
            label: 'Outstanding',
            value: formatCurrency(outstandingTotal),
            sub: `${outstandingInvs.length} awaiting payment`,
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            loading: invLoading,
          },
          {
            label: 'Overdue',
            value: formatCurrency(overdueTotal),
            sub: `${overdueInvs.length} overdue invoice${overdueInvs.length !== 1 ? 's' : ''}`,
            icon: AlertCircle,
            color: 'from-red-500 to-red-600',
            loading: invLoading,
          },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">{card.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
              {card.loading
                ? <div className="h-7 w-24 bg-ink-100 dark:bg-ink-800 animate-pulse rounded" />
                : <p className="font-display font-bold text-2xl text-ink-900 dark:text-white">{card.value}</p>
              }
              <p className="text-xs text-ink-400 mt-1">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Plan selector */}
      <div className="mb-6" id="plans-grid">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="font-semibold text-ink-900 dark:text-white">Choose a Plan</h3>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center gap-2 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                !annual ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm' : 'text-ink-500'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                annual ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm' : 'text-ink-500'
              )}
            >
              Annual
              <span className="text-emerald-600 font-semibold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isCurrent  = plan.id === user?.plan
            const isLoading  = loading === plan.id
            const price      = annual ? plan.priceAnnual : plan.price

            return (
              <motion.div
                key={plan.id}
                whileHover={!isCurrent ? { y: -2 } : undefined}
                className={cn(
                  'rounded-2xl p-4 border-2 transition-all flex flex-col',
                  isCurrent
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700',
                  plan.highlighted && !isCurrent && 'border-brand-200 dark:border-brand-800'
                )}
              >
                {plan.highlighted && (
                  <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2 uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-ink-900 dark:text-white">{plan.name}</span>
                  {isCurrent && <Badge variant="brand" size="sm">Current</Badge>}
                </div>
                <p className="text-2xl font-bold text-ink-900 dark:text-white mb-1">
                  ${price}<span className="text-sm font-normal text-ink-500">/mo</span>
                </p>
                {annual && (
                  <p className="text-xs text-emerald-600 mb-3">${price * 12}/year · save ${(plan.price - price) * 12}/yr</p>
                )}
                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.slice(0, 4).map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-ink-600 dark:text-ink-400">
                      <Check size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                  disabled={isCurrent}
                  loading={isLoading}
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                >
                  {isCurrent ? 'Current plan' : `Upgrade to ${plan.name}`}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Recent transactions — from real invoices */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink-900 dark:text-white">Recent Transactions</h3>
          <Button variant="ghost" size="sm" onClick={handleManageBilling} loading={loading === 'portal'}>
            View all in Stripe →
          </Button>
        </div>
        {invLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentTransactions.length === 0 ? (
          <p className="text-center text-ink-400 py-8 text-sm">No transactions yet. Paid invoices will appear here.</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950">
                    <CreditCard size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-white">
                      Invoice — {inv.customerName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {inv.createdAt && typeof (inv.createdAt as { toDate?: () => Date }).toDate === 'function'
                        ? formatDate((inv.createdAt as { toDate: () => Date }).toDate())
                        : inv.dueDate ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-emerald-600">
                    +{formatCurrency(inv.total ?? 0)}
                  </p>
                  <Badge size="sm" variant={inv.status === 'paid' ? 'success' : 'warning'}>
                    {inv.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  )
}
