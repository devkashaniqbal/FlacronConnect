// Auto-Rebooking — Cleaning Company · Home Services
// Tracks bookings with auto-rebook enabled and queues next appointments automatically
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Plus, Calendar, CheckCircle2, Clock, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useBookings } from '@/hooks/useBookings'
import { cn } from '@/utils/cn'
import type { Booking } from '@/types/booking.types'

// ── Types ──────────────────────────────────────────────────────────────────────

type RebookInterval = 'weekly' | 'biweekly' | 'monthly' | '6weeks' | '8weeks'

const INTERVAL_LABELS: Record<RebookInterval, string> = {
  weekly:   'Every week',
  biweekly: 'Every 2 weeks',
  monthly:  'Every 4 weeks',
  '6weeks': 'Every 6 weeks',
  '8weeks': 'Every 8 weeks',
}

const INTERVAL_DAYS: Record<RebookInterval, number> = {
  weekly:   7,
  biweekly: 14,
  monthly:  28,
  '6weeks': 42,
  '8weeks': 56,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutoRebookingPage() {
  const { bookings, isLoading, createBooking, updateBooking } = useBookings()
  const [filter, setFilter] = useState<'enabled' | 'all'>('enabled')
  const [creating, setCreating] = useState<string | null>(null)

  // Bookings with auto-rebook flag on (stored as notes field pattern or a custom field)
  // We use `isRecurring` as the auto-rebook proxy since it already exists on Booking type
  const enabledBookings = bookings.filter(b => b.isRecurring && b.status !== 'cancelled')
  const allBookings     = bookings.filter(b => b.status !== 'cancelled')
  const displayed       = filter === 'enabled' ? enabledBookings : allBookings

  // Compute next booking date based on recurrence rule
  function getNextDate(booking: Booking): string | null {
    const dateStr = typeof booking.date === 'string' ? booking.date : null
    if (!dateStr) return null
    const rule = booking.recurrence?.rule
    if (!rule) return addDays(dateStr, 14)  // default biweekly
    const days = rule === 'weekly' ? 7 : rule === 'biweekly' ? 14 : 28
    return addDays(dateStr, days)
  }

  async function toggleAutoRebook(booking: Booking) {
    const newValue = !booking.isRecurring
    await toast.promise(
      updateBooking({ id: booking.id!, data: { isRecurring: newValue } }),
      {
        loading: '…',
        success: newValue ? 'Auto-rebook enabled' : 'Auto-rebook disabled',
        error:   'Failed',
      }
    )
  }

  async function createNextBooking(booking: Booking) {
    const nextDate = getNextDate(booking)
    if (!nextDate) { toast.error('Cannot determine next date'); return }

    setCreating(booking.id!)
    try {
      await toast.promise(
        createBooking({
          customerName:        booking.customerName,
          customerPhone:       booking.customerPhone ?? '',
          serviceName:         booking.serviceName,
          date:                nextDate,
          startTime:           booking.startTime,
          amount:              booking.amount ?? 0,
          notes:               booking.notes ?? '',
          assignedEmployeeId:  booking.assignedEmployeeId,
          assignedEmployeeName: booking.assignedEmployeeName,
          isRecurring:         true,
          recurrence:          booking.recurrence,
        }),
        {
          loading: `Booking ${formatDate(nextDate, 'MMM d')}…`,
          success: `New booking created for ${formatDate(nextDate, 'MMM d')}!`,
          error:   'Failed to create booking',
        }
      )
    } finally {
      setCreating(null)
    }
  }

  // Stats
  const autoCount    = enabledBookings.length
  const pendingRebook = enabledBookings.filter(b => {
    const d = typeof b.date === 'string' ? b.date : ''
    return d < new Date().toISOString().split('T')[0] && b.status === 'completed'
  }).length

  return (
    <DashboardShell title="Auto-Rebooking">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Auto-Rebooking</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {autoCount} recurring client{autoCount !== 1 ? 's' : ''} · {pendingRebook} need rebooking
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Auto-Rebook On',   value: autoCount,     color: 'text-brand-600',   bg: 'bg-brand-50 dark:bg-brand-950/30',    icon: RefreshCw },
          { label: 'Pending Rebook',   value: pendingRebook, color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30',    icon: AlertCircle },
          { label: 'Total Recurring',  value: bookings.filter(b => b.isRecurring).length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: Calendar },
        ].map(s => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-2xl p-4', s.bg)}>
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs text-ink-500 font-medium uppercase tracking-wide">{s.label}</p>
                <Icon size={14} className={s.color} />
              </div>
              <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Info banner */}
      <div className="mb-5 p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40">
        <div className="flex items-start gap-3">
          <RefreshCw size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-brand-700 dark:text-brand-300">
            <p className="font-semibold mb-0.5">How Auto-Rebooking works</p>
            <p className="text-xs leading-relaxed">
              Enable auto-rebook on any booking to track it here. When a job is complete, use the "Rebook" button to instantly create the next appointment using the same details and interval. The recurrence rule (weekly/biweekly/monthly) from the original booking sets the date gap.
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit mb-5">
        {([
          { key: 'enabled', label: `Auto-rebook on (${autoCount})` },
          { key: 'all',     label: `All active (${allBookings.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === t.key
                ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm'
                : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <Card className="py-16 text-center">
          <RefreshCw size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">
            {filter === 'enabled' ? 'No bookings with auto-rebook enabled.' : 'No active bookings.'}
          </p>
          <p className="text-xs text-ink-400">
            Toggle the auto-rebook switch on any booking to track it here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((booking, i) => {
            const nextDate     = getNextDate(booking)
            const isAutoOn     = !!booking.isRecurring
            const isCompleted  = booking.status === 'completed'
            const needsRebook  = isCompleted && isAutoOn
            const isCreatingThis = creating === booking.id

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'card p-4 transition-all',
                  needsRebook && 'border-amber-200 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10'
                )}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Client info */}
                  <div className="flex items-center gap-3">
                    <Avatar name={booking.customerName} size="md" />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{booking.customerName}</p>
                      <p className="text-sm text-ink-500">{booking.serviceName}</p>
                      <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(booking.date as string, 'MMM d, yyyy')} · {booking.startTime}
                        </span>
                        {booking.recurrence?.rule && (
                          <span className="capitalize">{booking.recurrence.rule}</span>
                        )}
                        {nextDate && (
                          <span className="text-brand-500">
                            Next: {formatDate(nextDate, 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-ink-900 dark:text-white">{formatCurrency(booking.amount ?? 0)}</p>
                      <Badge
                        variant={
                          booking.status === 'completed' ? 'success'
                          : booking.status === 'confirmed' ? 'brand'
                          : booking.status === 'pending' ? 'warning'
                          : 'default'
                        }
                        size="sm"
                        dot
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    {/* Auto-rebook toggle */}
                    <button
                      onClick={() => toggleAutoRebook(booking)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                        isAutoOn
                          ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/60'
                          : 'bg-ink-100 dark:bg-ink-800 text-ink-500 hover:bg-ink-200 dark:hover:bg-ink-700'
                      )}
                    >
                      {isAutoOn ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      Auto-rebook {isAutoOn ? 'on' : 'off'}
                    </button>

                    {/* Create next booking */}
                    {isAutoOn && nextDate && (
                      <Button
                        size="sm"
                        variant={needsRebook ? 'primary' : 'ghost'}
                        loading={isCreatingThis}
                        icon={<Plus size={12} />}
                        onClick={() => createNextBooking(booking)}
                      >
                        Rebook {formatDate(nextDate, 'MMM d')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Needs rebook alert */}
                {needsRebook && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle size={12} />
                    <span>Job complete — ready for next booking on {formatDate(nextDate!, 'MMM d')}</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
