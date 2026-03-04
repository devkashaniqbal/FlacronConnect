// Loyalty System — Hair Salon / Beauty Spa / Gym
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Star, Gift, Search, Award } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Modal, Input, Spinner } from '@/components/ui'
import { useLoyalty, LOYALTY_TIERS, POINTS_PER_DOLLAR } from '@/hooks/useLoyalty'
import { cn } from '@/utils/cn'

const tierColors = { bronze: 'default', silver: 'info', gold: 'warning' } as const
const tierEmoji  = { bronze: '🥉', silver: '🥈', gold: '🥇' } as const

const newAccountSchema = z.object({
  customerName:  z.string().min(2),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
})
type NewAccountForm = z.infer<typeof newAccountSchema>

export function LoyaltyPage() {
  const { accounts, isLoading, createAccount, awardPoints, redeemPoints } = useLoyalty()
  const [search, setSearch]       = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [awardModal, setAwardModal] = useState<string | null>(null)
  const [redeemModal, setRedeemModal] = useState<string | null>(null)
  const [pointInput, setPointInput] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewAccountForm>({
    resolver: zodResolver(newAccountSchema),
  })

  const filtered = accounts.filter(a =>
    a.customerName.toLowerCase().includes(search.toLowerCase()) ||
    a.customerEmail?.toLowerCase().includes(search.toLowerCase())
  )

  async function onCreate(data: NewAccountForm) {
    await toast.promise(
      createAccount({ ...data, points: 0, lifetimePoints: 0, businessId: '', lastActivity: new Date().toISOString().split('T')[0] }),
      { loading: 'Creating account…', success: 'Loyalty account created!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleAward(id: string, current: number, lifetime: number) {
    const pts = parseInt(pointInput)
    if (isNaN(pts) || pts <= 0) { toast.error('Enter a valid number of points'); return }
    await toast.promise(
      awardPoints({ id, pointsToAdd: pts, currentPoints: current, lifetime }),
      { loading: '…', success: `+${pts} points awarded!`, error: 'Failed' }
    )
    setPointInput(''); setAwardModal(null)
  }

  async function handleRedeem(id: string, current: number) {
    const pts = parseInt(pointInput)
    if (isNaN(pts) || pts <= 0 || pts > current) { toast.error('Invalid redemption amount'); return }
    await toast.promise(
      redeemPoints({ id, pointsToRedeem: pts, currentPoints: current }),
      { loading: '…', success: `${pts} points redeemed!`, error: 'Failed' }
    )
    setPointInput(''); setRedeemModal(null)
  }

  const awardAccount  = accounts.find(a => a.id === awardModal)
  const redeemAccount = accounts.find(a => a.id === redeemModal)

  return (
    <DashboardShell title="Loyalty">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Loyalty Program</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {accounts.length} members · {POINTS_PER_DOLLAR} pt per $1 spent
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Add Member</Button>
      </div>

      {/* Tier legend */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(LOYALTY_TIERS) as [string, number][]).map(([tier, pts]) => (
          <Card key={tier} className="text-center py-3">
            <p className="text-2xl mb-1">{tierEmoji[tier as keyof typeof tierEmoji]}</p>
            <p className="text-xs font-semibold capitalize text-ink-700 dark:text-ink-300">{tier}</p>
            <p className="text-xs text-ink-400">{pts}+ pts lifetime</p>
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <Input placeholder="Search members…" icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Star size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No loyalty members yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((acc, i) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={acc.customerName} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 dark:text-white truncate">{acc.customerName}</p>
                  <Badge variant={tierColors[acc.tier]}>{tierEmoji[acc.tier]} {acc.tier}</Badge>
                </div>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p className="text-xs text-ink-400">Current Points</p>
                  <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{acc.points.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400">Lifetime</p>
                  <p className="font-semibold text-ink-700 dark:text-ink-300">{acc.lifetimePoints.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" icon={<Award size={13} />}
                  onClick={() => { setAwardModal(acc.id!); setPointInput('') }}>
                  Award
                </Button>
                <Button size="sm" variant="ghost" className="flex-1" icon={<Gift size={13} />}
                  onClick={() => { setRedeemModal(acc.id!); setPointInput('') }}
                  disabled={acc.points === 0}>
                  Redeem
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New member modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Loyalty Member" size="sm">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input label="Customer name" placeholder="Sarah Johnson" {...register('customerName')} error={errors.customerName?.message} />
          <Input label="Email (optional)" type="email" placeholder="sarah@example.com" {...register('customerEmail')} />
          <Input label="Phone (optional)" placeholder="555-0100" {...register('customerPhone')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isSubmitting}>Add Member</Button>
          </div>
        </form>
      </Modal>

      {/* Award points modal */}
      <Modal isOpen={!!awardModal} onClose={() => setAwardModal(null)} title={`Award Points — ${awardAccount?.customerName}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-500">Current balance: <strong>{awardAccount?.points ?? 0} pts</strong></p>
          <Input label="Points to award" type="number" min="1" placeholder="100" value={pointInput} onChange={e => setPointInput(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAwardModal(null)}>Cancel</Button>
            <Button className="flex-1" onClick={() => awardAccount && handleAward(awardAccount.id!, awardAccount.points, awardAccount.lifetimePoints)}>
              Award Points
            </Button>
          </div>
        </div>
      </Modal>

      {/* Redeem points modal */}
      <Modal isOpen={!!redeemModal} onClose={() => setRedeemModal(null)} title={`Redeem Points — ${redeemAccount?.customerName}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-500">Available: <strong>{redeemAccount?.points ?? 0} pts</strong></p>
          <Input label="Points to redeem" type="number" min="1" max={redeemAccount?.points} placeholder="50" value={pointInput} onChange={e => setPointInput(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRedeemModal(null)}>Cancel</Button>
            <Button className="flex-1" variant="danger" onClick={() => redeemAccount && handleRedeem(redeemAccount.id!, redeemAccount.points)}>
              Redeem
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  )
}
