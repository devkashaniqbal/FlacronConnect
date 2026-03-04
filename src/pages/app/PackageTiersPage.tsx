// Package Tiers — Consulting / Agency & Event Planning / Photography
// Bronze / Silver / Gold (or custom) service tier configuration
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Layers, Check, Trash2, Edit2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PackageTier {
  id?:           string
  businessId:    string
  name:          string            // e.g. "Bronze", "Silver", "Gold"
  tagline?:      string
  price:         number
  billingNote?:  string            // e.g. "per project", "/mo"
  features:      string            // newline-separated list
  highlighted:   boolean           // show as "most popular"
  color:         string            // brand accent: 'amber' | 'slate' | 'yellow' | etc.
  sortOrder:     number
  createdAt?:    unknown
}

function useTiers() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.PACKAGES + '_tiers')

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['packageTiers', businessId],
    queryFn:  () => fetchCollection<PackageTier>(path, [orderBy('sortOrder', 'asc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<PackageTier, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['packageTiers', businessId] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PackageTier> }) => updateDocById(path, id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['packageTiers', businessId] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['packageTiers', businessId] }),
  })

  return {
    tiers, isLoading,
    createTier: createMutation.mutateAsync,
    updateTier: updateMutation.mutateAsync,
    deleteTier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

// ── Form schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  name:        z.string().min(1, 'Name required'),
  tagline:     z.string().optional(),
  price:       z.coerce.number().min(0, 'Price required'),
  billingNote: z.string().optional(),
  features:    z.string().min(1, 'Add at least one feature'),
  highlighted: z.boolean(),
  color:       z.enum(['amber', 'slate', 'violet', 'emerald', 'sky', 'rose']),
  sortOrder:   z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

const COLORS: { value: FormData['color']; label: string; dot: string }[] = [
  { value: 'slate',   label: 'Bronze',  dot: 'bg-amber-700' },
  { value: 'amber',   label: 'Silver',  dot: 'bg-slate-400' },
  { value: 'violet',  label: 'Gold',    dot: 'bg-yellow-500' },
  { value: 'emerald', label: 'Emerald', dot: 'bg-emerald-500' },
  { value: 'sky',     label: 'Sky',     dot: 'bg-sky-500' },
  { value: 'rose',    label: 'Rose',    dot: 'bg-rose-500' },
]

const colorClasses: Record<string, string> = {
  amber:   'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
  slate:   'border-slate-400 bg-slate-50 dark:bg-slate-800/20',
  violet:  'border-violet-400 bg-violet-50 dark:bg-violet-950/20',
  emerald: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
  sky:     'border-sky-400 bg-sky-50 dark:bg-sky-950/20',
  rose:    'border-rose-400 bg-rose-50 dark:bg-rose-950/20',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PackageTiersPage() {
  const { tiers, isLoading, createTier, updateTier, deleteTier, isCreating } = useTiers()
  const [showNew, setShowNew]   = useState(false)
  const [editTier, setEditTier] = useState<PackageTier | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { highlighted: false, color: 'violet', sortOrder: tiers.length },
  })

  function openEdit(tier: PackageTier) {
    setEditTier(tier)
    setValue('name',        tier.name)
    setValue('tagline',     tier.tagline ?? '')
    setValue('price',       tier.price)
    setValue('billingNote', tier.billingNote ?? '')
    setValue('features',    tier.features)
    setValue('highlighted', tier.highlighted)
    setValue('color',       tier.color as FormData['color'])
    setValue('sortOrder',   tier.sortOrder)
    setShowNew(true)
  }

  async function onSubmit(data: FormData) {
    if (editTier) {
      await toast.promise(
        updateTier({ id: editTier.id!, data }),
        { loading: 'Saving…', success: 'Tier updated!', error: 'Failed' }
      )
    } else {
      await toast.promise(
        createTier({ ...data, businessId: '' }),
        { loading: 'Creating tier…', success: 'Tier created!', error: 'Failed' }
      )
    }
    reset(); setEditTier(null); setShowNew(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" tier?`)) return
    await toast.promise(deleteTier(id), { loading: '…', success: 'Tier deleted', error: 'Failed' })
  }

  const highlighted = watch('highlighted')

  return (
    <DashboardShell title="Package Tiers">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Package Tiers</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            Define your service tiers to display on proposals and client-facing materials
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => { reset({ color: 'violet', highlighted: false, sortOrder: tiers.length }); setEditTier(null); setShowNew(true) }}>
          Add Tier
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tiers.length === 0 ? (
        <Card className="py-16 text-center">
          <Layers size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-4">No tiers configured yet.</p>
          <p className="text-xs text-ink-400">Create Bronze, Silver, and Gold tiers to present structured offers to clients.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative rounded-2xl border-2 p-6 ${colorClasses[tier.color] ?? 'border-ink-200 bg-white dark:bg-ink-900'}`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand" size="sm">Most Popular</Badge>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-xl text-ink-900 dark:text-white">{tier.name}</p>
                  {tier.tagline && <p className="text-xs text-ink-500 mt-0.5">{tier.tagline}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(tier)} className="p-1.5 text-ink-400 hover:text-brand-600 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(tier.id!, tier.name)} className="p-1.5 text-ink-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-ink-900 dark:text-white">{formatCurrency(tier.price)}</span>
                {tier.billingNote && <span className="text-sm text-ink-500 ml-1">{tier.billingNote}</span>}
              </div>

              <ul className="space-y-2">
                {tier.features.split('\n').filter(Boolean).map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-300">
                    <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f.trim()}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNew}
        onClose={() => { setShowNew(false); setEditTier(null); reset() }}
        title={editTier ? 'Edit Tier' : 'Add Package Tier'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tier name" placeholder="Gold" {...register('name')} error={errors.name?.message} />
            <Input label="Tagline (optional)" placeholder="Best value" {...register('tagline')} />
            <Input label="Price ($)" type="number" step="0.01" placeholder="2500" {...register('price')} error={errors.price?.message} />
            <Input label="Billing note" placeholder="per project / /mo" {...register('billingNote')} />
            <div>
              <label className="label">Accent colour</label>
              <select {...register('color')} className="input-base w-full">
                {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <Input label="Sort order" type="number" min="0" {...register('sortOrder')} />
          </div>
          <div>
            <label className="label">Features (one per line)</label>
            <textarea
              {...register('features')}
              rows={5}
              placeholder={"Up to 3 revision rounds\nDedicated Slack channel\n48h response time"}
              className="input-base w-full resize-none"
            />
            {errors.features && <p className="text-xs text-red-500 mt-1">{errors.features.message}</p>}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('highlighted')} className="w-4 h-4 accent-brand-600" />
            <span className="text-sm text-ink-700 dark:text-ink-300">Mark as "Most Popular"</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => { setShowNew(false); setEditTier(null); reset() }}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>{editTier ? 'Save Changes' : 'Create Tier'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
