import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Calendar, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Modal, Spinner } from '@/components/ui'
import { Input } from '@/components/ui'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { useBusiness } from '@/hooks/useBusiness'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'
import { RecurrencePicker } from '@/components/common/RecurrencePicker'
import type { Booking, BookingRecurrence } from '@/types/booking.types'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

const schema = z.object({
  customerName:       z.string().min(2),
  customerPhone:      z.string().optional(),
  serviceName:        z.string().min(1),
  date:               z.string().min(1),
  startTime:          z.string().min(1),
  amount:             z.coerce.number().min(0),
  notes:              z.string().optional(),
  clientNotes:        z.string().optional(),
  tipAmount:          z.coerce.number().min(0).optional(),
  assignedEmployeeId: z.string().optional(),
  depositAmount:      z.coerce.number().min(0).optional(),
})
type FormData = z.infer<typeof schema>

// ── Calendar helpers ──────────────────────────────────────────────────────────

interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Booking
}

function toCalEvents(bookings: Booking[]): CalEvent[] {
  return bookings.flatMap(b => {
    const dateStr = typeof b.date === 'string' ? b.date : ''
    if (!dateStr) return []
    const start = new Date(`${dateStr}T${b.startTime ?? '09:00'}`)
    const end   = b.endTime
      ? new Date(`${dateStr}T${b.endTime}`)
      : new Date(start.getTime() + 30 * 60 * 1000)
    return [{ id: b.id ?? dateStr, title: `${b.customerName} · ${b.serviceName}`, start, end, resource: b }]
  })
}

const calEventStyle = (event: CalEvent) => {
  const colors: Record<string, string> = {
    confirmed: '#16a34a',
    pending:   '#d97706',
    cancelled: '#dc2626',
    completed: '#6b7280',
    no_show:   '#dc2626',
  }
  const bg = colors[event.resource.status] ?? '#7c3aed'
  return { style: { backgroundColor: bg, borderColor: bg } }
}

function BookingCalendar({ bookings, onSelectSlot }: { bookings: Booking[]; onSelectSlot: () => void }) {
  const [calView, setCalView] = useState<(typeof Views)[keyof typeof Views]>(Views.MONTH)
  const [calDate, setCalDate] = useState(new Date())
  const [selected, setSelected] = useState<Booking | null>(null)

  const events = useMemo(() => toCalEvents(bookings), [bookings])

  const handleSelectEvent = useCallback((e: CalEvent) => setSelected(e.resource), [])

  return (
    <div className="space-y-4">
      <div className="cal-wrap bg-white dark:bg-ink-950 rounded-2xl p-4 shadow-sm border border-ink-100 dark:border-ink-800">
      <BigCalendar
        localizer={localizer}
        events={events}
        view={calView}
        date={calDate}
        onView={v => setCalView(v)}
        onNavigate={d => setCalDate(d)}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={calEventStyle}
        style={{ height: 600 }}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        popup
      />
      </div>

      {/* Booking detail popover */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Appointment Details" size="sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={selected.customerName} size="md" />
              <div>
                <p className="font-semibold text-ink-900 dark:text-white">{selected.customerName}</p>
                {selected.customerPhone && <p className="text-sm text-ink-500">{selected.customerPhone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-3">
                <p className="text-ink-400 text-xs mb-0.5">Service</p>
                <p className="font-medium text-ink-900 dark:text-white">{selected.serviceName}</p>
              </div>
              <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-3">
                <p className="text-ink-400 text-xs mb-0.5">Amount</p>
                <p className="font-medium text-ink-900 dark:text-white">{formatCurrency(selected.amount ?? 0)}</p>
              </div>
              <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-3">
                <p className="text-ink-400 text-xs mb-0.5">Date & Time</p>
                <p className="font-medium text-ink-900 dark:text-white">
                  {formatDate(selected.date as string, 'MMM d')} · {selected.startTime}
                </p>
              </div>
              <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-3">
                <p className="text-ink-400 text-xs mb-0.5">Status</p>
                <Badge variant={statusColors[selected.status] ?? 'default'} dot>{selected.status}</Badge>
              </div>
            </div>
            {selected.notes && (
              <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-3 text-sm">
                <p className="text-ink-400 text-xs mb-0.5">Notes</p>
                <p className="text-ink-700 dark:text-ink-300">{selected.notes}</p>
              </div>
            )}
            <Button variant="secondary" className="w-full" onClick={() => setSelected(null)}>Close</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  confirmed: 'success',
  pending:   'warning',
  cancelled: 'danger',
  completed: 'default',
  no_show:   'danger',
}

export function BookingPage() {
  const { bookings, isLoading, createBooking, updateBooking, isCreating } = useBookings()
  const { employees } = useEmployees()
  const { services }  = useBusiness()
  const hasTips        = useIndustryFeature('tipsTracking')
  const hasAssignment  = useIndustryFeature('crewAssignment') || useIndustryFeature('driverAssignment') || useIndustryFeature('trainerAssignment') || useIndustryFeature('technicianAssignment')
  const hasDeposit     = useIndustryFeature('depositManagement')
  const hasRecurring   = useIndustryFeature('recurringAppointments')
  const hasClientNotes = useIndustryFeature('clientNotes')
  const hasAddOns      = useIndustryFeature('addOnUpsells')
  const [view, setView]       = useState<'list' | 'calendar'>('list')
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter]   = useState<string>('all')
  const [recurrence, setRecurrence] = useState<BookingRecurrence | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const activeEmployees = employees.filter(e => e.activeStatus)

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  async function onSubmit(data: FormData) {
    const emp = activeEmployees.find(e => e.id === data.assignedEmployeeId)
    const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0)
    await toast.promise(
      createBooking({
        customerName:         data.customerName,
        customerPhone:        data.customerPhone ?? '',
        serviceName:          data.serviceName,
        date:                 data.date,
        startTime:            data.startTime,
        endTime:              data.startTime,
        amount:               data.amount + addOnTotal,
        notes:                data.notes ?? '',
        clientNotes:          data.clientNotes,
        customerId:           '',
        serviceId:            '',
        tipAmount:            data.tipAmount,
        assignedEmployeeId:   data.assignedEmployeeId,
        assignedEmployeeName: emp?.name,
        depositAmount:        data.depositAmount,
        recurrence:           recurrence ?? undefined,
        isRecurring:          !!recurrence,
        addOns:               selectedAddOns.length > 0 ? selectedAddOns : undefined,
      }),
      { loading: 'Creating booking…', success: 'Booking created!', error: 'Failed' }
    )
    reset()
    setRecurrence(null)
    setSelectedAddOns([])
    setShowNew(false)
  }

  async function handleStatusChange(id: string, status: Booking['status']) {
    const extra = status === 'completed' ? { paymentStatus: 'paid' as const } : {}
    await toast.promise(
      updateBooking({ id, data: { status, ...extra } }),
      { loading: '…', success: `Booking ${status}`, error: 'Failed' }
    )
  }

  return (
    <DashboardShell title="Bookings">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Bookings</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{bookings.length} total appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-ink-100 dark:bg-ink-800 rounded-xl">
            {[{ v: 'list', Icon: List }, { v: 'calendar', Icon: Calendar }].map(({ v, Icon }) => (
              <button
                key={v}
                onClick={() => setView(v as typeof view)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  view === v
                    ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm'
                    : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Booking</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'confirmed', 'pending', 'cancelled', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize',
              filter === f
                ? 'bg-brand-600 text-white shadow-brand'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
            )}
          >
            {f}
            {f === 'all' && ` (${bookings.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : view === 'list' ? (
        filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <Calendar size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-400">No bookings found.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={booking.customerName} size="md" />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{booking.customerName}</p>
                      <p className="text-sm text-ink-500 dark:text-ink-400">{booking.serviceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-ink-900 dark:text-white">
                        {formatDate(booking.date as string, 'MMM d')} · {booking.startTime}
                      </p>
                      {booking.customerPhone && (
                        <p className="text-xs text-ink-400">{booking.customerPhone}</p>
                      )}
                    </div>
                    <Badge variant={statusColors[booking.status] ?? 'default'} dot>{booking.status}</Badge>
                    <span className="font-semibold text-ink-900 dark:text-white hidden md:block">
                      {formatCurrency(booking.amount ?? 0)}
                    </span>
                    {booking.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleStatusChange(booking.id!, 'confirmed')}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleStatusChange(booking.id!, 'cancelled')}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(booking.id!, 'completed')}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <BookingCalendar bookings={bookings} onSelectSlot={() => setShowNew(true)} />
      )}

      {/* New Booking Modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Booking" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer name" placeholder="Sarah Johnson" {...register('customerName')} error={errors.customerName?.message} />
            <Input label="Phone (optional)" placeholder="555-0100" {...register('customerPhone')} />
            <Input label="Service" placeholder="Hair Cut & Style" {...register('serviceName')} error={errors.serviceName?.message} />
            <Input label="Amount ($)" type="number" step="0.01" placeholder="85" {...register('amount')} error={errors.amount?.message} />
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
            <Input label="Time" type="time" {...register('startTime')} error={errors.startTime?.message} />

            {hasTips && (
              <Input label="Tip ($)" type="number" step="0.01" placeholder="0" {...register('tipAmount')} />
            )}
            {hasDeposit && (
              <Input label="Deposit ($)" type="number" step="0.01" placeholder="0" {...register('depositAmount')} />
            )}
            {hasAssignment && activeEmployees.length > 0 && (
              <div className="col-span-2">
                <label className="label">Assign staff (optional)</label>
                <select {...register('assignedEmployeeId')} className="input-base w-full">
                  <option value="">Unassigned</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <Input label="Notes (optional)" placeholder="Any special requests…" {...register('notes')} />
          {hasClientNotes && (
            <div>
              <label className="label">Client notes (private)</label>
              <textarea
                {...register('clientNotes')}
                rows={2}
                placeholder="Internal notes about this client…"
                className="input-base w-full resize-none"
              />
            </div>
          )}
          {hasAddOns && services.filter(s => s.active).length > 0 && (
            <div>
              <label className="label">Add-on services (upsell)</label>
              <div className="grid grid-cols-2 gap-2 p-3 border border-ink-200 dark:border-ink-700 rounded-xl">
                {services.filter(s => s.active).map(s => {
                  const selected = selectedAddOns.some(a => a.name === s.name)
                  return (
                    <label key={s.id} className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors',
                      selected ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300' : 'hover:bg-ink-50 dark:hover:bg-ink-800'
                    )}>
                      <input
                        type="checkbox"
                        className="accent-brand-600 w-3.5 h-3.5"
                        checked={selected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAddOns(prev => [...prev, { name: s.name, price: s.price }])
                          } else {
                            setSelectedAddOns(prev => prev.filter(a => a.name !== s.name))
                          }
                        }}
                      />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="font-medium text-ink-600 dark:text-ink-400">+{formatCurrency(s.price)}</span>
                    </label>
                  )
                })}
              </div>
              {selectedAddOns.length > 0 && (
                <p className="text-xs text-brand-600 dark:text-brand-400 mt-1.5 text-right font-medium">
                  Add-ons total: +{formatCurrency(selectedAddOns.reduce((s, a) => s + a.price, 0))}
                </p>
              )}
            </div>
          )}
          {hasRecurring && (
            <RecurrencePicker value={recurrence} onChange={setRecurrence} />
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Create Booking</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
