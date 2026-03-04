import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, TrendingUp, ArrowUpRight, ExternalLink, CheckCircle2, XCircle, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge } from '@/components/ui'
import { PLANS } from '@/constants/plans'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe'
import { cn } from '@/utils/cn'

export function PaymentsPage() {
  const user                     = useAuthStore(s => s.user)
  const currentPlan              = PLANS.find(p => p.id === (user?.plan ?? 'starter'))
  const [annual, setAnnual]      = useState(false)
  const [loading, setLoading]    = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

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
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mb-1">Monthly Revenue</p>
          <p className="font-display font-bold text-3xl text-ink-900 dark:text-white mb-2">{formatCurrency(4280)}</p>
          <div className="flex items-center gap-1.5 text-emerald-600 mb-4">
            <TrendingUp size={14} />
            <span className="text-sm font-medium">+18.2% vs last month</span>
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

      {/* Recent transactions (live data placeholder) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink-900 dark:text-white">Recent Transactions</h3>
          <Button variant="ghost" size="sm" onClick={handleManageBilling} loading={loading === 'portal'}>
            View all in Stripe →
          </Button>
        </div>
        <div className="space-y-2">
          {[
            { id: 't1', desc: 'Booking Payment — Sarah Johnson', amount: 85,  date: '2026-02-17', status: 'completed' },
            { id: 't2', desc: 'Subscription — Growth Plan',     amount: 79,  date: '2026-02-15', status: 'completed' },
            { id: 't3', desc: 'Booking Payment — James Park',   amount: 120, date: '2026-02-14', status: 'completed' },
            { id: 't4', desc: 'Refund — Marcus Lee',            amount: -35, date: '2026-02-13', status: 'refunded' },
            { id: 't5', desc: 'Booking Payment — Emily Chen',   amount: 150, date: '2026-02-12', status: 'completed' },
          ].map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  t.amount < 0 ? 'bg-red-100 dark:bg-red-950' : 'bg-emerald-100 dark:bg-emerald-950'
                )}>
                  <CreditCard size={16} className={t.amount < 0 ? 'text-red-600' : 'text-emerald-600'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{t.desc}</p>
                  <p className="text-xs text-ink-500">{formatDate(t.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('font-semibold text-sm', t.amount < 0 ? 'text-red-500' : 'text-emerald-600')}>
                  {t.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                </p>
                <Badge size="sm" variant={t.status === 'completed' ? 'success' : 'danger'}>{t.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </DashboardShell>
  )
}
