// Event Bookings (Multi-Session Blocks) — Event Planning / Photography
// Groups multiple booking sessions under a single event with a contract total
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Plus, Trash2, ChevronDown, ChevronUp, Calendar, DollarSign } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Avatar, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useBookings } from '@/hooks/useBookings'
import { cn } from '@/utils/cn'
import type { Booking } from '@/types/booking.types'

// ── Form Schema ────────────────────────────────────────────────────────────────

const sessionSchema = z.object({
  date:      z.string().min(1, 'Date required'),
  startTime: z.string().min(1, 'Time required'),
  notes:     z.string().optional(),
})

const eventSchema = z.object({
  eventName:     z.string().min(2, 'Event name required'),
  customerName:  z.string().min(2, 'Client name required'),
  customerPhone: z.string().optional(),
  serviceName:   z.string().min(2, 'Service required'),
  contractTotal: z.coerce.number().min(0, 'Contract value required'),
  depositAmount: z.coerce.number().min(0).optional(),
  sessions:      z.array(sessionSchema).min(1, 'Add at least one session'),
})
type EventForm = z.infer<typeof eventSchema>

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupByEvent(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>()
  for (const b of bookings) {
    const key = b.eventId ?? b.id!
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(b)
  }
  return map
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventBookingsPage() {
  const { bookings, isLoading, createBooking, deleteBooking } = useBookings()
  const [showNew, setShowNew]     = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Only bookings that have an eventId or are standalone events
  const eventBookings = bookings.filter(b => b.eventId || b.eventName)

  // Group by eventId
  const grouped = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of eventBookings) {
      const key = b.eventId ?? b.id!
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b)
    }
    // Sort sessions within each event
    for (const [, sessions] of map) {
      sessions.sort((a, b) => (a.eventSessionNumber ?? 0) - (b.eventSessionNumber ?? 0))
    }
    return map
  }, [eventBookings])

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      sessions: [{ date: '', startTime: '', notes: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'sessions' })

  async function onSubmit(data: EventForm) {
    const eventId  = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const perSession = data.contractTotal / data.sessions.length

    const creates = data.sessions.map((session, idx) =>
      createBooking({
        eventId,
        eventName:           data.eventName,
        eventSessionNumber:  idx + 1,
        eventTotalSessions:  data.sessions.length,
        contractTotal:       data.contractTotal,
        customerName:        data.customerName,
        customerPhone:       data.customerPhone ?? '',
        serviceName:         data.serviceName,
        date:                session.date,
        startTime:           session.startTime,
        amount:              perSession,
        depositAmount:       idx === 0 ? (data.depositAmount ?? 0) : 0,
        notes:               session.notes ?? '',
      })
    )

    await toast.promise(
      Promise.all(creates),
      { loading: `Creating ${data.sessions.length} sessions…`, success: 'Event booked!', error: 'Failed' }
    )
    reset({ sessions: [{ date: '', startTime: '', notes: '' }] })
    setShowNew(false)
  }

  async function handleDeleteEvent(eventId: string, sessions: Booking[], eventName: string) {
    if (!confirm(`Delete all ${sessions.length} sessions for "${eventName}"?`)) return
    await toast.promise(
      Promise.all(sessions.map(s => deleteBooking(s.id!))),
      { loading: 'Deleting event…', success: 'Event deleted', error: 'Failed' }
    )
  }

  // Stats
  const totalEvents   = grouped.size
  const totalRevenue  = Array.from(grouped.values()).reduce((sum, sessions) => {
    const first = sessions[0]
    return sum + (first?.contractTotal ?? first?.amount ?? 0)
  }, 0)

  return (
    <DashboardShell title="Event Bookings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Event Bookings</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} · {formatCurrency(totalRevenue)} in contracts
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Book Event</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Events',         value: totalEvents,               icon: CalendarDays, color: 'from-brand-500 to-brand-600' },
          { label: 'Total Contract Value', value: formatCurrency(totalRevenue), icon: DollarSign,  color: 'from-emerald-500 to-emerald-600' },
          { label: 'Total Sessions',       value: eventBookings.length,      icon: Calendar,     color: 'from-amber-500 to-amber-600' },
        ].map(s => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-ink-500 dark:text-ink-400 font-medium uppercase tracking-wide">{s.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon size={14} className="text-white" />
                </div>
              </div>
              <p className="font-bold text-xl text-ink-900 dark:text-white">{s.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Event list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : grouped.size === 0 ? (
        <Card className="py-16 text-center">
          <CalendarDays size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">No event bookings yet.</p>
          <p className="text-xs text-ink-400">Create multi-session event blocks for weddings, corporate events, and multi-day shoots.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([eventId, sessions], i) => {
            const first       = sessions[0]
            const isExpanded  = expandedId === eventId
            const allDone     = sessions.every(s => s.status === 'completed')
            const anyPending  = sessions.some(s => s.status === 'pending')

            return (
              <motion.div
                key={eventId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card overflow-hidden"
              >
                {/* Event header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-ink-50/40 dark:hover:bg-ink-800/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : eventId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={first.customerName} size="md" />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">
                        {first.eventName ?? first.serviceName}
                      </p>
                      <p className="text-sm text-ink-500">{first.customerName}</p>
                      <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5">
                        <span>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                        {first.contractTotal && (
                          <span className="font-medium text-brand-600">{formatCurrency(first.contractTotal)} contract</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={allDone ? 'success' : anyPending ? 'warning' : 'brand'} dot>
                      {allDone ? 'Complete' : anyPending ? 'Pending' : 'Confirmed'}
                    </Badge>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteEvent(eventId, sessions, first.eventName ?? first.serviceName) }}
                      className="p-1.5 text-ink-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                  </div>
                </div>

                {/* Session list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key="sessions"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-ink-100 dark:border-ink-800"
                    >
                      <div className="p-4 space-y-2">
                        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Sessions</p>
                        {sessions.map(session => (
                          <div key={session.id} className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-sm',
                            session.status === 'completed'
                              ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10'
                              : 'border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900'
                          )}>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                                session.status === 'completed'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-brand-100 dark:bg-brand-900/40 text-brand-600'
                              )}>
                                {session.eventSessionNumber ?? '—'}
                              </div>
                              <div>
                                <p className="font-medium text-ink-900 dark:text-white">
                                  {formatDate(session.date as string, 'EEEE, MMM d, yyyy')}
                                </p>
                                <p className="text-xs text-ink-400">{session.startTime} · {session.serviceName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink-700 dark:text-ink-300">
                                {formatCurrency(session.amount ?? 0)}
                              </span>
                              <Badge
                                variant={session.status === 'completed' ? 'success' : session.status === 'pending' ? 'warning' : 'brand'}
                                size="sm"
                              >
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* New Event Modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); reset({ sessions: [{ date: '', startTime: '', notes: '' }] }) }} title="Book Multi-Session Event" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Event info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Event name" placeholder="Johnson Wedding · Corporate Retreat" {...register('eventName')} error={errors.eventName?.message} />
            </div>
            <Input label="Client name" placeholder="Sarah Johnson" {...register('customerName')} error={errors.customerName?.message} />
            <Input label="Client phone" placeholder="555-0100" {...register('customerPhone')} />
            <Input label="Service type" placeholder="Wedding Photography · Event Coverage" {...register('serviceName')} error={errors.serviceName?.message} />
            <Input label="Deposit ($)" type="number" step="0.01" placeholder="500" {...register('depositAmount')} />
            <div className="col-span-2">
              <Input label="Contract total ($)" type="number" step="0.01" placeholder="3500" {...register('contractTotal')} error={errors.contractTotal?.message} />
            </div>
          </div>

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Sessions ({fields.length})</label>
              <button
                type="button"
                onClick={() => append({ date: '', startTime: '', notes: '' })}
                className="text-xs text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add session
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2 p-3 border border-ink-200 dark:border-ink-700 rounded-xl bg-ink-50/50 dark:bg-ink-800/20">
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-1 font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <input
                        type="date"
                        {...register(`sessions.${idx}.date`)}
                        className="input-base w-full text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        {...register(`sessions.${idx}.startTime`)}
                        className="input-base w-full text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      {...register(`sessions.${idx}.notes`)}
                      className="input-base w-full text-sm"
                    />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="text-ink-300 hover:text-red-500 mt-1 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.sessions && (
              <p className="text-xs text-red-500 mt-1">{errors.sessions.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => { setShowNew(false); reset({ sessions: [{ date: '', startTime: '', notes: '' }] }) }}>
              Cancel
            </Button>
            <Button className="flex-1" type="submit" loading={isSubmitting} icon={<CalendarDays size={14} />}>
              Book {fields.length} Session{fields.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
