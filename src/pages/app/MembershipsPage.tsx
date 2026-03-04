// Memberships — Gym / Fitness Studio & Beauty Spa / Nail Salon
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, BadgeCheck, Users, DollarSign, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  useMembershipPlans, useMembershipEnrollments,
  type BillingCycle, type MembershipStatus,
} from '@/hooks/useMemberships'

const planSchema = z.object({
  name:         z.string().min(2, 'Name required'),
  description:  z.string().optional(),
  price:        z.coerce.number().min(1, 'Price required'),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual']),
  features:     z.string().optional(),
  color:        z.string().optional(),
})
type PlanForm = z.infer<typeof planSchema>

const enrollSchema = z.object({
  planId:      z.string().min(1, 'Select a plan'),
  memberName:  z.string().min(2, 'Name required'),
  memberEmail: z.string().email().optional().or(z.literal('')),
  memberPhone: z.string().optional(),
  startDate:   z.string().min(1, 'Start date required'),
})
type EnrollForm = z.infer<typeof enrollSchema>

const cycleLabel: Record<BillingCycle, string> = {
  monthly:   '/mo',
  quarterly: '/qtr',
  annual:    '/yr',
}

const statusColors: Record<MembershipStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  active:    'success',
  paused:    'warning',
  cancelled: 'danger',
  expired:   'default',
}

export function MembershipsPage() {
  const { plans, isLoading: plansLoading, createPlan, deletePlan, isCreating: creatingPlan } = useMembershipPlans()
  const {
    enrollments, isLoading: enrollLoading,
    activeMemberCount, monthlyRevenue,
    enroll, updateEnrollment, cancelEnrollment, isEnrolling,
  } = useMembershipEnrollments()

  const [tab, setTab]             = useState<'plans' | 'members'>('plans')
  const [showNewPlan, setShowNewPlan]       = useState(false)
  const [showEnroll,  setShowEnroll]        = useState(false)

  const {
    register: rPlan, handleSubmit: hsPlan, reset: resetPlan,
    formState: { errors: ePlan },
  } = useForm<PlanForm>({ resolver: zodResolver(planSchema), defaultValues: { billingCycle: 'monthly' } })

  const {
    register: rEnroll, handleSubmit: hsEnroll, reset: resetEnroll,
    formState: { errors: eEnroll },
  } = useForm<EnrollForm>({ resolver: zodResolver(enrollSchema), defaultValues: { startDate: new Date().toISOString().split('T')[0] } })

  async function onCreatePlan(data: PlanForm) {
    await toast.promise(
      createPlan({ ...data, isActive: true, businessId: '' }),
      { loading: 'Creating plan…', success: 'Plan created!', error: 'Failed' }
    )
    resetPlan(); setShowNewPlan(false)
  }

  async function onEnroll(data: EnrollForm) {
    const plan = plans.find(p => p.id === data.planId)
    if (!plan) return
    await toast.promise(
      enroll({
        ...data,
        planName:     plan.name,
        price:        plan.price,
        billingCycle: plan.billingCycle,
        status:       'active',
        businessId:   '',
      }),
      { loading: 'Enrolling member…', success: 'Member enrolled!', error: 'Failed' }
    )
    resetEnroll(); setShowEnroll(false)
  }

  async function handleDeletePlan(id: string, name: string) {
    if (!confirm(`Delete plan "${name}"?`)) return
    await toast.promise(deletePlan(id), { loading: '…', success: 'Plan deleted', error: 'Failed' })
  }

  async function handleCancelEnrollment(id: string, name: string) {
    if (!confirm(`Cancel membership for "${name}"?`)) return
    await toast.promise(cancelEnrollment(id), { loading: '…', success: 'Membership cancelled', error: 'Failed' })
  }

  const isLoading = plansLoading || enrollLoading

  return (
    <DashboardShell title="Memberships">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Memberships</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {activeMemberCount} active members · {formatCurrency(monthlyRevenue)}/mo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<BadgeCheck size={14} />} onClick={() => setShowEnroll(true)}>
            Enroll Member
          </Button>
          <Button icon={<Plus size={14} />} onClick={() => setShowNewPlan(true)}>New Plan</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Members', value: String(activeMemberCount), icon: Users,       color: 'text-brand-600' },
          { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), icon: DollarSign, color: 'text-emerald-600' },
          { label: 'Plans Available', value: String(plans.filter(p => p.isActive).length), icon: BadgeCheck, color: 'text-violet-600' },
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit mb-6">
        {(['plans', 'members'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
            }`}
          >
            {t === 'plans' ? `Plans (${plans.length})` : `Members (${enrollments.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'plans' ? (
        plans.length === 0 ? (
          <Card className="py-16 text-center">
            <BadgeCheck size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No membership plans yet.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{plan.name}</p>
                    {plan.description && <p className="text-xs text-ink-500 mt-0.5">{plan.description}</p>}
                  </div>
                  <button onClick={() => handleDeletePlan(plan.id!, plan.name)} className="p-1 text-ink-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-2">
                  {formatCurrency(plan.price)}<span className="text-sm text-ink-400 font-normal">{cycleLabel[plan.billingCycle]}</span>
                </p>

                {plan.features && (
                  <ul className="space-y-1 mb-3">
                    {plan.features.split(',').map(f => (
                      <li key={f} className="text-xs text-ink-600 dark:text-ink-400 flex items-center gap-1.5">
                        <BadgeCheck size={11} className="text-emerald-500 flex-shrink-0" />
                        {f.trim()}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
                  <Badge variant="info" size="sm" className="capitalize">{plan.billingCycle}</Badge>
                  <Badge variant={plan.isActive ? 'success' : 'default'} size="sm" dot>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="ml-auto text-xs text-ink-400">
                    {enrollments.filter(e => e.planId === plan.id && e.status === 'active').length} members
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        enrollments.length === 0 ? (
          <Card className="py-16 text-center">
            <Users size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No members enrolled yet.</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800">
                    {['Member', 'Plan', 'Start Date', 'Price', 'Status', ''].map(h => (
                      <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 uppercase tracking-wider pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                  {enrollments.map((e, i) => (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-ink-900 dark:text-white">{e.memberName}</p>
                        {e.memberEmail && <p className="text-xs text-ink-400">{e.memberEmail}</p>}
                      </td>
                      <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{e.planName}</td>
                      <td className="py-3 pr-4 text-sm text-ink-500">{formatDate(e.startDate, 'MMM d, yyyy')}</td>
                      <td className="py-3 pr-4 text-sm font-semibold text-ink-900 dark:text-white">
                        {formatCurrency(e.price)}<span className="text-xs text-ink-400 font-normal">{cycleLabel[e.billingCycle]}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusColors[e.status]}>{e.status}</Badge>
                      </td>
                      <td className="py-3">
                        {e.status === 'active' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost"
                              onClick={() => toast.promise(updateEnrollment({ id: e.id!, data: { status: 'paused' } }), { loading: '…', success: 'Paused', error: 'Failed' })}>
                              Pause
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleCancelEnrollment(e.id!, e.memberName)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                        {e.status === 'paused' && (
                          <Button size="sm" variant="ghost"
                            onClick={() => toast.promise(updateEnrollment({ id: e.id!, data: { status: 'active' } }), { loading: '…', success: 'Reactivated', error: 'Failed' })}>
                            Reactivate
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* New Plan Modal */}
      <Modal isOpen={showNewPlan} onClose={() => setShowNewPlan(false)} title="New Membership Plan" size="sm">
        <form onSubmit={hsPlan(onCreatePlan)} className="space-y-4">
          <Input label="Plan name" placeholder="Gold Membership" {...rPlan('name')} error={ePlan.name?.message} />
          <Input label="Description (optional)" placeholder="Our premium tier" {...rPlan('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price ($)" type="number" step="0.01" placeholder="49" {...rPlan('price')} error={ePlan.price?.message} />
            <div>
              <label className="label">Billing cycle</label>
              <select {...rPlan('billingCycle')} className="input-base w-full">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <Input label="Features (comma-separated)" placeholder="Unlimited classes, Guest passes, Towel service" {...rPlan('features')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNewPlan(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={creatingPlan}>Create Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Modal */}
      <Modal isOpen={showEnroll} onClose={() => setShowEnroll(false)} title="Enroll Member" size="sm">
        <form onSubmit={hsEnroll(onEnroll)} className="space-y-4">
          <div>
            <label className="label">Plan</label>
            <select {...rEnroll('planId')} className="input-base w-full">
              <option value="">Select plan…</option>
              {plans.filter(p => p.isActive).map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}{cycleLabel[p.billingCycle]}</option>
              ))}
            </select>
            {eEnroll.planId && <p className="text-xs text-red-500 mt-1">{eEnroll.planId.message}</p>}
          </div>
          <Input label="Member name" placeholder="Jane Smith" {...rEnroll('memberName')} error={eEnroll.memberName?.message} />
          <Input label="Email (optional)" type="email" placeholder="jane@example.com" {...rEnroll('memberEmail')} />
          <Input label="Phone (optional)" placeholder="555-0100" {...rEnroll('memberPhone')} />
          <Input label="Start date" type="date" {...rEnroll('startDate')} error={eEnroll.startDate?.message} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowEnroll(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isEnrolling}>Enroll</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
