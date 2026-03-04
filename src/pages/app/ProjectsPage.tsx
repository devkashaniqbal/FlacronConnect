// Projects — Construction Company · Consulting / Agency
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderKanban, Search, Trash2, Calendar, ChevronDown, ChevronUp, Flag, CheckCircle2, Circle, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useProjects, useMilestones, type ProjectStatus, type Milestone } from '@/hooks/useProjects'
import { useInvoices } from '@/hooks/useInvoices'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'
import { cn } from '@/utils/cn'

// ── Milestone panel ────────────────────────────────────────────────────────

const milestoneSchema = z.object({
  title:       z.string().min(1, 'Title required'),
  description: z.string().optional(),
  dueDate:     z.string().optional(),
  amount:      z.coerce.number().min(0).optional(),
})
type MilestoneForm = z.infer<typeof milestoneSchema>

function MilestonePanel({ projectId, projectClientName }: { projectId: string; projectClientName: string }) {
  const { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone, isCreating } = useMilestones(projectId)
  const { createInvoice } = useInvoices()
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MilestoneForm>({
    resolver: zodResolver(milestoneSchema),
  })

  async function onAdd(data: MilestoneForm) {
    await toast.promise(
      createMilestone({ ...data, projectId, completed: false }),
      { loading: 'Adding milestone…', success: 'Milestone added!', error: 'Failed' }
    )
    reset(); setShowForm(false)
  }

  async function toggleComplete(m: Milestone) {
    await updateMilestone({ id: m.id!, data: { completed: !m.completed } })
  }

  async function handleCreateInvoice(m: Milestone) {
    if (!m.amount) { toast.error('Set an amount on this milestone first'); return }
    const invoiceId = await toast.promise(
      createInvoice({
        customerName: projectClientName,
        items: [{ description: m.title, quantity: 1, unitPrice: m.amount }],
        dueDate: m.dueDate ?? new Date().toISOString().split('T')[0],
        notes: `Project milestone: ${m.title}`,
      }),
      { loading: 'Creating invoice…', success: 'Invoice created!', error: 'Failed' }
    )
    await updateMilestone({ id: m.id!, data: { completed: true, invoiceId: invoiceId as string } })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this milestone?')) return
    await toast.promise(deleteMilestone(id), { loading: '…', success: 'Deleted', error: 'Failed' })
  }

  if (isLoading) return <div className="py-2 flex justify-center"><Spinner size="sm" /></div>

  return (
    <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-1">
          <Flag size={10} /> Milestones ({milestones.length})
        </span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs text-brand-600 hover:underline"
        >
          + Add
        </button>
      </div>

      {milestones.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {milestones.map(m => (
            <li key={m.id} className={cn(
              'flex items-start gap-2 p-2 rounded-lg text-xs',
              m.completed ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-ink-50 dark:bg-ink-800/40'
            )}>
              <button onClick={() => toggleComplete(m)} className="mt-0.5 flex-shrink-0 text-ink-400 hover:text-emerald-500">
                {m.completed
                  ? <CheckCircle2 size={13} className="text-emerald-500" />
                  : <Circle size={13} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium truncate', m.completed && 'line-through text-ink-400')}>{m.title}</p>
                {m.amount && (
                  <p className="text-ink-500">{formatCurrency(m.amount)}{m.dueDate && ` · due ${formatDate(m.dueDate, 'MMM d')}`}</p>
                )}
                {m.invoiceId && (
                  <p className="text-emerald-600 text-xs flex items-center gap-0.5 mt-0.5">
                    <FileText size={9} /> Invoice created
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!m.completed && !m.invoiceId && m.amount && (
                  <button
                    onClick={() => handleCreateInvoice(m)}
                    className="px-1.5 py-0.5 rounded text-brand-600 bg-brand-50 dark:bg-brand-950/30 hover:bg-brand-100 text-xs font-medium"
                  >
                    Invoice
                  </button>
                )}
                <button onClick={() => handleDelete(m.id!)} className="text-ink-300 hover:text-red-500 px-1">×</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            key="milestone-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit(onAdd)}
            className="space-y-2 overflow-hidden"
          >
            <Input placeholder="Milestone title" {...register('title')} error={errors.title?.message} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Amount ($)" type="number" step="0.01" {...register('amount')} />
              <Input type="date" {...register('dueDate')} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" type="button" className="flex-1" onClick={() => { setShowForm(false); reset() }}>Cancel</Button>
              <Button size="sm" type="submit" className="flex-1" loading={isCreating}>Add</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Status colors ──────────────────────────────────────────────────────────

const statusColors: Record<ProjectStatus, 'success' | 'brand' | 'warning' | 'default' | 'danger'> = {
  planning:  'default',
  active:    'brand',
  on_hold:   'warning',
  completed: 'success',
  cancelled: 'danger',
}

const schema = z.object({
  name:        z.string().min(2, 'Project name required'),
  clientName:  z.string().min(2, 'Client name required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  budget:      z.coerce.number().min(0).optional(),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
  description: z.string().optional(),
  address:     z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ProjectsPage() {
  const { projects, isLoading, createProject, updateProject, deleteProject, isCreating } = useProjects()
  const hasMilestones = useIndustryFeature('milestoneInvoicing')
  const [search, setSearch]       = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [filter, setFilter]       = useState<ProjectStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const filtered = projects
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
    )

  async function onSubmit(data: FormData) {
    await toast.promise(
      createProject({ ...data, status: 'planning', businessId: '' }),
      { loading: 'Creating project…', success: 'Project created!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleStatusChange(id: string, status: ProjectStatus) {
    await toast.promise(
      updateProject({ id, data: { status } }),
      { loading: '…', success: `Project ${status}`, error: 'Failed' }
    )
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await toast.promise(deleteProject(id), { loading: '…', success: 'Project deleted', error: 'Failed' })
  }

  const stats = {
    active:    projects.filter(p => p.status === 'active').length,
    total:     projects.length,
    budget:    projects.reduce((s, p) => s + (p.budget ?? 0), 0),
  }

  return (
    <DashboardShell title="Projects">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Projects</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {stats.active} active · {stats.total} total · {formatCurrency(stats.budget)} total budget
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Project</Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'planning', 'active', 'on_hold', 'completed', 'cancelled'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-500 hover:bg-ink-200 dark:hover:bg-ink-700'
            )}
          >{f.replace('_', ' ')}</button>
        ))}
      </div>

      <div className="mb-4">
        <Input placeholder="Search projects…" icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <FolderKanban size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No projects found.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((proj, i) => (
            <motion.div key={proj.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 dark:text-white truncate">{proj.name}</p>
                  <p className="text-sm text-ink-500">{proj.clientName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusColors[proj.status]}>{proj.status.replace('_', ' ')}</Badge>
                  <button onClick={() => handleDelete(proj.id!, proj.name)}
                    className="p-1 text-ink-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {proj.budget && (
                <p className="text-lg font-bold text-ink-900 dark:text-white mb-2">{formatCurrency(proj.budget)}</p>
              )}

              {(proj.startDate || proj.endDate) && (
                <div className="flex items-center gap-1.5 text-xs text-ink-500 mb-3">
                  <Calendar size={12} />
                  {proj.startDate && formatDate(proj.startDate, 'MMM d')}
                  {proj.startDate && proj.endDate && ' → '}
                  {proj.endDate && formatDate(proj.endDate, 'MMM d, yyyy')}
                </div>
              )}

              {proj.description && (
                <p className="text-xs text-ink-500 mb-3 line-clamp-2">{proj.description}</p>
              )}

              {/* Quick status change */}
              <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-ink-800">
                <div className="flex gap-1.5 flex-wrap">
                  {proj.status === 'planning' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(proj.id!, 'active')}>Start</Button>
                  )}
                  {proj.status === 'active' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(proj.id!, 'on_hold')}>Hold</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(proj.id!, 'completed')}>Complete</Button>
                    </>
                  )}
                  {proj.status === 'on_hold' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(proj.id!, 'active')}>Resume</Button>
                  )}
                </div>
                {hasMilestones && (
                  <button
                    onClick={() => setExpandedId(expandedId === proj.id ? null : proj.id!)}
                    className="text-xs text-ink-400 hover:text-brand-600 flex items-center gap-0.5 transition-colors"
                  >
                    Milestones
                    {expandedId === proj.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {hasMilestones && (
                <AnimatePresence>
                  {expandedId === proj.id && (
                    <motion.div
                      key="milestones"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <MilestonePanel projectId={proj.id!} projectClientName={proj.clientName} />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Project" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Project name" placeholder="Kitchen Renovation" {...register('name')} error={errors.name?.message} />
            </div>
            <Input label="Client name" placeholder="John Smith" {...register('clientName')} error={errors.clientName?.message} />
            <Input label="Client phone" placeholder="555-0100" {...register('clientPhone')} />
            <Input label="Client email" type="email" placeholder="john@example.com" {...register('clientEmail')} />
            <Input label="Budget ($)" type="number" step="100" placeholder="15000" {...register('budget')} />
            <Input label="Start date" type="date" {...register('startDate')} />
            <Input label="End date" type="date" {...register('endDate')} />
            <div className="col-span-2">
              <Input label="Job site address" placeholder="123 Main St" {...register('address')} />
            </div>
            <div className="col-span-2">
              <Input label="Description (optional)" placeholder="Scope of work…" {...register('description')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
