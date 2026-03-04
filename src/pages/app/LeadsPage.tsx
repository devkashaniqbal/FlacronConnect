// Lead Tracking / CRM — Real Estate Agency
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Target, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import { useLeads, type LeadStage, type LeadSource } from '@/hooks/useLeads'
import { useEmployees } from '@/hooks/useEmployees'
import { cn } from '@/utils/cn'

const STAGES: LeadStage[] = ['new', 'contacted', 'viewing', 'offer', 'closed_won', 'closed_lost']

const stageColors: Record<LeadStage, 'default' | 'info' | 'brand' | 'warning' | 'success' | 'danger'> = {
  new:         'default',
  contacted:   'info',
  viewing:     'brand',
  offer:       'warning',
  closed_won:  'success',
  closed_lost: 'danger',
}

const schema = z.object({
  name:            z.string().min(2, 'Name required'),
  email:           z.string().email().optional().or(z.literal('')),
  phone:           z.string().optional(),
  stage:           z.enum(['new', 'contacted', 'viewing', 'offer', 'closed_won', 'closed_lost']),
  source:          z.enum(['referral', 'website', 'social', 'walk_in', 'advertising', 'other']),
  propertyAddress: z.string().optional(),
  estimatedValue:  z.coerce.number().min(0).optional(),
  assignedAgentId: z.string().optional(),
  notes:           z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function LeadsPage() {
  const { leads, isLoading, createLead, updateLead, deleteLead, isCreating } = useLeads()
  const { employees } = useEmployees()
  const [showNew, setShowNew]     = useState(false)
  const [activeStage, setActiveStage] = useState<LeadStage | 'all'>('all')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stage: 'new', source: 'other' },
  })

  const agents = employees.filter(e => e.activeStatus)

  const filtered = activeStage === 'all' ? leads : leads.filter(l => l.stage === activeStage)

  async function onSubmit(data: FormData) {
    const agent = agents.find(a => a.id === data.assignedAgentId)
    await toast.promise(
      createLead({ ...data, businessId: '', assignedAgent: agent?.name }),
      { loading: 'Creating lead…', success: 'Lead created!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function moveStage(id: string, current: LeadStage) {
    const idx = STAGES.indexOf(current)
    if (idx >= STAGES.length - 1) return
    const next = STAGES[idx + 1]
    await toast.promise(
      updateLead({ id, data: { stage: next } }),
      { loading: '…', success: `Moved to ${next.replace('_', ' ')}`, error: 'Failed' }
    )
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete lead for "${name}"?`)) return
    await toast.promise(deleteLead(id), { loading: '…', success: 'Lead deleted', error: 'Failed' })
  }

  const pipeline = {
    total:  leads.length,
    value:  leads.filter(l => l.stage !== 'closed_lost').reduce((s, l) => s + (l.estimatedValue ?? 0), 0),
    won:    leads.filter(l => l.stage === 'closed_won').length,
  }

  return (
    <DashboardShell title="Leads">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Lead Pipeline</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {pipeline.total} leads · {formatCurrency(pipeline.value)} pipeline value · {pipeline.won} won
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Lead</Button>
      </div>

      {/* Stage filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveStage('all')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            activeStage === 'all' ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500 hover:bg-ink-200')}>
          All ({leads.length})
        </button>
        {STAGES.map(s => {
          const count = leads.filter(l => l.stage === s).length
          return (
            <button key={s} onClick={() => setActiveStage(s)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                activeStage === s ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500 hover:bg-ink-200')}>
              {s.replace('_', ' ')} ({count})
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Target size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No leads found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead, i) => (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-ink-900 dark:text-white">{lead.name}</p>
                    <Badge variant={stageColors[lead.stage]}>{lead.stage.replace('_', ' ')}</Badge>
                  </div>
                  {lead.propertyAddress && (
                    <p className="text-sm text-ink-500 truncate mb-0.5">{lead.propertyAddress}</p>
                  )}
                  <div className="flex gap-3 text-xs text-ink-400">
                    {lead.email && <span>{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.assignedAgent && <span>Agent: {lead.assignedAgent}</span>}
                    <span className="capitalize">via {lead.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lead.estimatedValue && lead.estimatedValue > 0 && (
                    <p className="font-semibold text-ink-900 dark:text-white">{formatCurrency(lead.estimatedValue)}</p>
                  )}
                  {!['closed_won', 'closed_lost'].includes(lead.stage) && (
                    <Button size="sm" variant="ghost" icon={<ChevronRight size={13} />}
                      onClick={() => moveStage(lead.id!, lead.stage)}>
                      Advance
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(lead.id!, lead.name)}>
                    Remove
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Lead" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full name" placeholder="John Smith" {...register('name')} error={errors.name?.message} />
            <Input label="Phone" placeholder="555-0100" {...register('phone')} />
            <Input label="Email" type="email" placeholder="john@example.com" {...register('email')} />
            <Input label="Est. property value ($)" type="number" step="1000" placeholder="350000" {...register('estimatedValue')} />
            <div className="col-span-2">
              <Input label="Property address" placeholder="123 Main St, City" {...register('propertyAddress')} />
            </div>
            <div>
              <label className="label">Stage</label>
              <select {...register('stage')} className="input-base w-full">
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select {...register('source')} className="input-base w-full">
                {(['referral', 'website', 'social', 'walk_in', 'advertising', 'other'] as LeadSource[]).map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assign agent</label>
              <select {...register('assignedAgentId')} className="input-base w-full">
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Input label="Notes" placeholder="Any relevant context…" {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Create Lead</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
