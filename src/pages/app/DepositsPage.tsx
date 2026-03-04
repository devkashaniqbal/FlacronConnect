// Deposit Management — Event Planning / Photography
// Track deposit collection, paid/unpaid status, and outstanding balance per event booking
import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Search, CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Input, Avatar, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useBookings } from '@/hooks/useBookings'
import { cn } from '@/utils/cn'
import type { Booking } from '@/types/booking.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function depositStatus(booking: Booking): 'paid' | 'partial' | 'unpaid' | 'no_deposit' {
  if (!booking.depositAmount) return 'no_deposit'
  if (booking.depositPaid)    return 'paid'
  if (booking.paymentStatus === 'partial') return 'partial'
  return 'unpaid'
}

function balanceDue(booking: Booking): number {
  const total   = booking.amount ?? 0
  const deposit = booking.depositAmount ?? 0
  if (booking.depositPaid) return total - deposit
  return total
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DepositsPage() {
  const { bookings, isLoading, updateBooking } = useBookings()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<'all' | 'unpaid' | 'paid' | 'partial'>('all')

  // Only show bookings that have a deposit amount set
  const depositBookings = bookings.filter(b => b.depositAmount && b.depositAmount > 0)

  const filtered = depositBookings
    .filter(b => {
      const s = depositStatus(b)
      if (filter === 'paid')    return s === 'paid'
      if (filter === 'unpaid')  return s === 'unpaid'
      if (filter === 'partial') return s === 'partial'
      return true
    })
    .filter(b =>
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(search.toLowerCase())
    )

  async function markDepositPaid(booking: Booking) {
    await toast.promise(
      updateBooking({
        id: booking.id!,
        data: {
          depositPaid: true,
          paymentStatus: balanceDue(booking) <= 0 ? 'paid' : 'partial',
        },
      }),
      { loading: 'Marking deposit paid…', success: 'Deposit marked as paid!', error: 'Failed' }
    )
  }

  async function markDepositUnpaid(booking: Booking) {
    await toast.promise(
      updateBooking({
        id: booking.id!,
        data: { depositPaid: false, paymentStatus: 'unpaid' },
      }),
      { loading: '…', success: 'Deposit marked unpaid', error: 'Failed' }
    )
  }

  async function markFullyPaid(booking: Booking) {
    await toast.promise(
      updateBooking({
        id: booking.id!,
        data: { depositPaid: true, paymentStatus: 'paid', balanceDue: 0 },
      }),
      { loading: 'Marking fully paid…', success: 'Booking fully paid!', error: 'Failed' }
    )
  }

  // Aggregate stats
  const totalDepositsExpected  = depositBookings.reduce((s, b) => s + (b.depositAmount ?? 0), 0)
  const totalDepositsCollected = depositBookings.filter(b => b.depositPaid).reduce((s, b) => s + (b.depositAmount ?? 0), 0)
  const totalOutstanding       = depositBookings.reduce((s, b) => s + balanceDue(b), 0)
  const unpaidCount            = depositBookings.filter(b => !b.depositPaid).length

  const statusConfig = {
    paid:       { label: 'Deposit Paid',    variant: 'success' as const, icon: CheckCircle2, color: 'text-emerald-600' },
    partial:    { label: 'Partial',         variant: 'warning' as const, icon: Clock,        color: 'text-amber-600'  },
    unpaid:     { label: 'Deposit Unpaid',  variant: 'danger'  as const, icon: AlertCircle,  color: 'text-red-500'    },
    no_deposit: { label: 'No Deposit',      variant: 'default' as const, icon: DollarSign,   color: 'text-ink-400'    },
  }

  return (
    <DashboardShell title="Deposits">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Deposit Tracker</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {depositBookings.length} bookings with deposits · {unpaidCount} awaiting collection
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Deposits Expected',
            value: formatCurrency(totalDepositsExpected),
            icon: DollarSign,
            color: 'from-brand-500 to-brand-600',
          },
          {
            label: 'Collected',
            value: formatCurrency(totalDepositsCollected),
            icon: CheckCircle2,
            color: 'from-emerald-500 to-emerald-600',
          },
          {
            label: 'Outstanding Balance',
            value: formatCurrency(totalOutstanding),
            icon: AlertCircle,
            color: 'from-amber-500 to-amber-600',
          },
          {
            label: 'Collection Rate',
            value: totalDepositsExpected > 0
              ? `${Math.round((totalDepositsCollected / totalDepositsExpected) * 100)}%`
              : '—',
            icon: TrendingUp,
            color: 'from-accent-500 to-accent-600',
          },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-ink-500 dark:text-ink-400 font-medium uppercase tracking-wide">{stat.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon size={14} className="text-white" />
                </div>
              </div>
              <p className="font-bold text-xl text-ink-900 dark:text-white">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search by client or event…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit">
          {(['all', 'unpaid', 'partial', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                filter === f
                  ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <DollarSign size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">No deposit records found.</p>
          <p className="text-xs text-ink-400">
            Set a deposit amount when creating event bookings to track them here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => {
            const status    = depositStatus(booking)
            const balance   = balanceDue(booking)
            const config    = statusConfig[status]
            const StatusIcon = config.icon

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Client info */}
                  <div className="flex items-center gap-3">
                    <Avatar name={booking.customerName} size="md" />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{booking.customerName}</p>
                      <p className="text-sm text-ink-500">{booking.serviceName}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {formatDate(booking.date as string, 'MMM d, yyyy')} · {booking.startTime}
                      </p>
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                    <div className="text-right space-y-0.5">
                      <div className="flex items-center justify-end gap-4 text-sm">
                        <span className="text-ink-400">Total:</span>
                        <span className="font-semibold text-ink-900 dark:text-white w-20 text-right">
                          {formatCurrency(booking.amount ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-4 text-sm">
                        <span className="text-ink-400">Deposit:</span>
                        <span className={cn('font-semibold w-20 text-right', config.color)}>
                          {formatCurrency(booking.depositAmount ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-4 text-sm border-t border-ink-100 dark:border-ink-800 pt-1">
                        <span className="text-ink-400">Balance due:</span>
                        <span className={cn('font-bold w-20 text-right', balance > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={config.variant}>
                        <StatusIcon size={10} className="mr-1" />
                        {config.label}
                      </Badge>
                      <div className="flex gap-1.5">
                        {status === 'unpaid' && (
                          <Button size="sm" onClick={() => markDepositPaid(booking)}>
                            Mark Deposit Paid
                          </Button>
                        )}
                        {status === 'paid' && balance > 0 && (
                          <Button size="sm" variant="ghost" onClick={() => markFullyPaid(booking)}>
                            Mark Fully Paid
                          </Button>
                        )}
                        {status === 'paid' && (
                          <Button size="sm" variant="ghost" onClick={() => markDepositUnpaid(booking)}>
                            Revert
                          </Button>
                        )}
                        {status === 'partial' && (
                          <Button size="sm" onClick={() => markFullyPaid(booking)}>
                            Mark Fully Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <p className="mt-3 text-xs text-ink-400 border-t border-ink-100 dark:border-ink-800 pt-2">
                    {booking.notes}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
