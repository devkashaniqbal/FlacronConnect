// Event Timeline — Event Planning / Photography
// Manages day-of-event schedules with tasks, vendors, and time blocks
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CalendarClock, CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy, where } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/formatters'

// ── Types ──────────────────────────────────────────────────────────────────────

type EventCategory = 'ceremony' | 'reception' | 'vendor' | 'setup' | 'photo' | 'other'

interface EventTimeline {
  id?:          string
  businessId:   string
  eventName:    string
  eventDate:    string
  clientName:   string
  createdAt?:   unknown
}

interface TimelineItem {
  id?:          string
  timelineId:   string
  title:        string
  time:         string          // HH:mm
  duration?:    number          // minutes
  category:     EventCategory
  notes?:       string
  completed:    boolean
  assignedTo?:  string
  createdAt?:   unknown
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  ceremony:  'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  reception: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  vendor:    'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  setup:     'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  photo:     'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  other:     'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400',
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useTimelines() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.EVENT_TIMELINES)

  const { data: timelines = [], isLoading } = useQuery({
    queryKey: ['eventTimelines', businessId],
    queryFn:  () => fetchCollection<EventTimeline>(path, [orderBy('eventDate', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<EventTimeline, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['eventTimelines', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['eventTimelines', businessId] }),
  })

  return { timelines, isLoading, createTimeline: createMutation.mutateAsync, deleteTimeline: deleteMutation.mutateAsync, isCreating: createMutation.isPending }
}

function useTimelineItems(timelineId: string) {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, 'timelineItems')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['timelineItems', businessId, timelineId],
    queryFn:  () => fetchCollection<TimelineItem>(path, [
      where('timelineId', '==', timelineId),
      orderBy('time', 'asc'),
    ]),
    enabled:  !!businessId && !!timelineId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<TimelineItem, 'id'>) => createDoc(path, { ...data, timelineId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timelineItems', businessId, timelineId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimelineItem> }) => updateDocById(path, id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timelineItems', businessId, timelineId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timelineItems', businessId, timelineId] }),
  })

  return {
    items, isLoading,
    addItem:    createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isAdding:   createMutation.isPending,
  }
}

// ── Timeline Items Panel ───────────────────────────────────────────────────────

const itemSchema = z.object({
  title:      z.string().min(1, 'Title required'),
  time:       z.string().min(1, 'Time required'),
  duration:   z.coerce.number().min(1).optional(),
  category:   z.enum(['ceremony', 'reception', 'vendor', 'setup', 'photo', 'other']),
  notes:      z.string().optional(),
  assignedTo: z.string().optional(),
})
type ItemForm = z.infer<typeof itemSchema>

function TimelineItemsPanel({ timelineId }: { timelineId: string }) {
  const { items, isLoading, addItem, updateItem, deleteItem, isAdding } = useTimelineItems(timelineId)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { category: 'other' },
  })

  async function onAdd(data: ItemForm) {
    await toast.promise(
      addItem({ ...data, timelineId, completed: false }),
      { loading: 'Adding…', success: 'Item added!', error: 'Failed' }
    )
    reset(); setShowForm(false)
  }

  if (isLoading) return <div className="py-4 flex justify-center"><Spinner size="sm" /></div>

  const completed = items.filter(i => i.completed).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-ink-400 font-medium">{completed}/{items.length} completed</p>
        <button onClick={() => setShowForm(v => !v)} className="text-xs text-brand-600 hover:underline">
          + Add item
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 mb-3">
          {items.map(item => (
            <div key={item.id} className={cn(
              'flex items-start gap-2 p-2.5 rounded-xl border',
              item.completed
                ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900'
            )}>
              <button
                onClick={() => updateItem({ id: item.id!, data: { completed: !item.completed } })}
                className="mt-0.5 flex-shrink-0 text-ink-300 hover:text-emerald-500 transition-colors"
              >
                {item.completed
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-ink-900 dark:text-white">{item.time}</span>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[item.category])}>
                    {item.category}
                  </span>
                  <span className={cn('text-sm font-medium', item.completed && 'line-through text-ink-400')}>
                    {item.title}
                  </span>
                  {item.duration && <span className="text-xs text-ink-400">{item.duration}min</span>}
                </div>
                {item.notes && <p className="text-xs text-ink-400 mt-0.5">{item.notes}</p>}
                {item.assignedTo && <p className="text-xs text-brand-500 mt-0.5">→ {item.assignedTo}</p>}
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Remove this item?')) return
                  await deleteItem(item.id!)
                }}
                className="text-ink-300 hover:text-red-500 transition-colors p-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            key="item-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit(onAdd)}
            className="space-y-2 overflow-hidden border border-brand-100 dark:border-brand-900/40 rounded-xl p-3 bg-brand-50/30 dark:bg-brand-950/10"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Input placeholder="Item title (e.g. Bride entrance)" {...register('title')} error={errors.title?.message} />
              </div>
              <Input type="time" {...register('time')} error={errors.time?.message} />
              <Input type="number" placeholder="Duration (min)" {...register('duration')} />
              <div>
                <select {...register('category')} className="input-base w-full text-sm">
                  {['ceremony', 'reception', 'vendor', 'setup', 'photo', 'other'].map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <Input placeholder="Assigned to (optional)" {...register('assignedTo')} />
              <div className="col-span-2">
                <Input placeholder="Notes (optional)" {...register('notes')} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" type="button" className="flex-1" onClick={() => { setShowForm(false); reset() }}>Cancel</Button>
              <Button size="sm" type="submit" className="flex-1" loading={isAdding}>Add</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const timelineSchema = z.object({
  eventName:  z.string().min(2, 'Event name required'),
  clientName: z.string().min(2, 'Client name required'),
  eventDate:  z.string().min(1, 'Event date required'),
})
type TimelineForm = z.infer<typeof timelineSchema>

export function EventTimelinePage() {
  const { timelines, isLoading, createTimeline, deleteTimeline, isCreating } = useTimelines()
  const [showNew, setShowNew] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TimelineForm>({
    resolver: zodResolver(timelineSchema),
  })

  async function onSubmit(data: TimelineForm) {
    await toast.promise(
      createTimeline({ ...data, businessId: '' }),
      { loading: 'Creating timeline…', success: 'Timeline created!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete timeline for "${name}"?`)) return
    await toast.promise(deleteTimeline(id), { loading: '…', success: 'Deleted', error: 'Failed' })
  }

  return (
    <DashboardShell title="Event Timelines">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Event Timelines</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {timelines.length} event{timelines.length !== 1 ? 's' : ''} planned
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Timeline</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : timelines.length === 0 ? (
        <Card className="py-16 text-center">
          <CalendarClock size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">No event timelines yet.</p>
          <p className="text-xs text-ink-400">Create a day-of timeline for your events to keep everything on schedule.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {timelines.map((timeline, i) => (
            <motion.div
              key={timeline.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
            >
              {/* Header */}
              <div
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === timeline.id ? null : timeline.id!)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
                    <CalendarClock size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{timeline.eventName}</p>
                    <p className="text-sm text-ink-500">{timeline.clientName} · {formatDate(timeline.eventDate, 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(timeline.id!, timeline.eventName) }}
                    className="p-1.5 text-ink-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expandedId === timeline.id
                    ? <ChevronUp size={16} className="text-ink-400" />
                    : <ChevronDown size={16} className="text-ink-400" />
                  }
                </div>
              </div>

              {/* Expanded items panel */}
              <AnimatePresence>
                {expandedId === timeline.id && (
                  <motion.div
                    key="items"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-ink-100 dark:border-ink-800"
                  >
                    <div className="p-5">
                      <TimelineItemsPanel timelineId={timeline.id!} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Timeline Modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); reset() }} title="New Event Timeline" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Event name" placeholder="Sarah & James Wedding" {...register('eventName')} error={errors.eventName?.message} />
          <Input label="Client name" placeholder="Sarah Johnson" {...register('clientName')} error={errors.clientName?.message} />
          <Input label="Event date" type="date" {...register('eventDate')} error={errors.eventDate?.message} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => { setShowNew(false); reset() }}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Create Timeline</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
