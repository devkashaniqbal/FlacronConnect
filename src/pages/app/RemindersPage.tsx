// Appointment Reminders — Medical Clinic · Hair Salon · Beauty Spa
// Configure reminder rules and manage the outgoing reminder queue
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Plus, Trash2, CheckCircle2, XCircle, Clock, MessageSquare, Mail, Send, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import {
  useReminderRules, useScheduledReminders, buildReminderMessage,
  type ReminderChannel, type ReminderStatus,
} from '@/hooks/useReminders'
import { useBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

// ── Form Schemas ───────────────────────────────────────────────────────────────

const ruleSchema = z.object({
  label:                  z.string().min(1, 'Label required'),
  hoursBeforeAppointment: z.coerce.number().min(1, 'Must be at least 1 hour').max(168, 'Max 7 days'),
  channel:                z.enum(['sms', 'email', 'both']),
  messageTemplate:        z.string().min(10, 'Message too short'),
  isActive:               z.boolean(),
})
type RuleForm = z.infer<typeof ruleSchema>

// ── Helpers ────────────────────────────────────────────────────────────────────

const channelIcon = { sms: MessageSquare, email: Mail, both: Send }
const channelLabel = { sms: 'SMS', email: 'Email', both: 'SMS + Email' }

const statusConfig: Record<ReminderStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: typeof CheckCircle2 }> = {
  pending:   { label: 'Pending',   variant: 'warning', icon: Clock },
  sent:      { label: 'Sent',      variant: 'success', icon: CheckCircle2 },
  failed:    { label: 'Failed',    variant: 'danger',  icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'default', icon: XCircle },
}

const DEFAULT_TEMPLATES: { label: string; hours: number; template: string; channel: ReminderChannel }[] = [
  {
    label:    '24-hour SMS',
    hours:    24,
    channel:  'sms',
    template: 'Hi {name}! Reminder: your {service} appointment is tomorrow at {time}. Reply STOP to opt out.',
  },
  {
    label:    '2-hour SMS',
    hours:    2,
    channel:  'sms',
    template: 'Hi {name}, your {service} appointment is in 2 hours at {time}. See you soon! – {business}',
  },
  {
    label:    '48-hour Email',
    hours:    48,
    channel:  'email',
    template: 'Hi {name},\n\nJust a friendly reminder that your {service} appointment is on {date} at {time}.\n\nSee you then!\n{business}',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function RemindersPage() {
  const businessName = useAuthStore(s => s.user?.displayName) ?? 'Our Business'
  const { rules, isLoading: rLoading, createRule, updateRule, deleteRule, isCreating } = useReminderRules()
  const { reminders, pendingReminders, sentReminders, failedReminders, isLoading: qLoading, scheduleReminder, updateReminder, cancelReminder } = useScheduledReminders()
  const { bookings } = useBookings()

  const [tab, setTab]           = useState<'rules' | 'queue'>('rules')
  const [showNew, setShowNew]   = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [previewMsg, setPreviewMsg] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      channel:         'sms',
      isActive:        true,
      messageTemplate: DEFAULT_TEMPLATES[0].template,
      hoursBeforeAppointment: 24,
    },
  })

  const watchedTemplate = watch('messageTemplate')
  const watchedChannel  = watch('channel')

  function applyTemplate(t: typeof DEFAULT_TEMPLATES[0]) {
    setValue('label',                  t.label)
    setValue('hoursBeforeAppointment', t.hours)
    setValue('channel',                t.channel)
    setValue('messageTemplate',        t.template)
  }

  async function onCreateRule(data: RuleForm) {
    await toast.promise(
      createRule({ ...data, businessId: '' }),
      { loading: 'Creating rule…', success: 'Reminder rule created!', error: 'Failed' }
    )
    reset()
    setShowNew(false)
  }

  async function toggleRule(id: string, current: boolean) {
    await toast.promise(
      updateRule({ id, data: { isActive: !current } }),
      { loading: '…', success: current ? 'Rule paused' : 'Rule activated', error: 'Failed' }
    )
  }

  async function handleDeleteRule(id: string, label: string) {
    if (!confirm(`Delete rule "${label}"?`)) return
    await toast.promise(deleteRule(id), { loading: '…', success: 'Rule deleted', error: 'Failed' })
  }

  /** Schedule reminders for an upcoming booking based on all active rules */
  async function scheduleForBooking(bookingId: string) {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    const activeRules = rules.filter(r => r.isActive)
    if (activeRules.length === 0) { toast.error('No active reminder rules'); return }

    const creates = activeRules.map(rule => {
      const appointmentDate = typeof booking.date === 'string' ? booking.date : new Date().toISOString().split('T')[0]
      const appointmentDt   = new Date(`${appointmentDate}T${booking.startTime ?? '09:00'}`)
      const sendAt          = new Date(appointmentDt.getTime() - rule.hoursBeforeAppointment * 60 * 60 * 1000)

      const message = buildReminderMessage(rule.messageTemplate, {
        name:     booking.customerName,
        service:  booking.serviceName,
        date:     formatDate(appointmentDate, 'MMM d'),
        time:     booking.startTime ?? '',
        business: businessName,
      })

      return scheduleReminder({
        businessId:      '',
        ruleId:          rule.id!,
        ruleLabel:       rule.label,
        bookingId:       booking.id!,
        customerName:    booking.customerName,
        customerPhone:   booking.customerPhone,
        customerEmail:   booking.customerEmail,
        serviceName:     booking.serviceName,
        appointmentDate,
        appointmentTime: booking.startTime ?? '',
        scheduledFor:    sendAt.toISOString(),
        channel:         rule.channel,
        status:          'pending',
        message,
      })
    })

    await toast.promise(
      Promise.all(creates),
      { loading: 'Scheduling reminders…', success: `${activeRules.length} reminder${activeRules.length > 1 ? 's' : ''} scheduled!`, error: 'Failed' }
    )
    setShowQueue(false)
  }

  async function markSent(id: string) {
    await toast.promise(
      updateReminder({ id, data: { status: 'sent', sentAt: new Date().toISOString() } }),
      { loading: '…', success: 'Marked as sent', error: 'Failed' }
    )
  }

  async function handleCancel(id: string) {
    await toast.promise(cancelReminder(id), { loading: '…', success: 'Reminder cancelled', error: 'Failed' })
  }

  // Upcoming bookings (next 7 days) with no pending reminders
  const today   = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const upcomingBookings = bookings.filter(b => {
    const d = typeof b.date === 'string' ? b.date : ''
    return d >= today && d <= in7days && b.status !== 'cancelled'
  })

  return (
    <DashboardShell title="Reminders">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Appointment Reminders</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {rules.filter(r => r.isActive).length} active rules · {pendingReminders.length} pending · {sentReminders.length} sent
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Send size={14} />} onClick={() => setShowQueue(true)}>
            Schedule for Booking
          </Button>
          <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Rule</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Rules',  value: rules.filter(r => r.isActive).length,  color: 'text-brand-600',   bg: 'bg-brand-50 dark:bg-brand-950/30' },
          { label: 'Pending Send',  value: pendingReminders.length,               color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Sent',          value: sentReminders.length,                  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Failed',        value: failedReminders.length,                color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-950/30' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-2xl p-4 border border-transparent', s.bg)}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-ink-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit mb-5">
        {(['rules', 'queue'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
              tab === t
                ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm'
                : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
            )}>
            {t === 'rules' ? 'Reminder Rules' : `Queue (${reminders.length})`}
          </button>
        ))}
      </div>

      {/* RULES TAB */}
      {tab === 'rules' && (
        rLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : rules.length === 0 ? (
          <Card className="py-16 text-center">
            <Bell size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500 mb-2">No reminder rules yet.</p>
            <p className="text-xs text-ink-400 mb-4">Create rules like "Send SMS 24 hours before appointment"</p>
            <Button size="sm" onClick={() => setShowNew(true)}>Create First Rule</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, i) => {
              const ChanIcon = channelIcon[rule.channel]
              return (
                <motion.div key={rule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        rule.isActive ? 'bg-brand-50 dark:bg-brand-950/40' : 'bg-ink-100 dark:bg-ink-800'
                      )}>
                        <ChanIcon size={18} className={rule.isActive ? 'text-brand-600' : 'text-ink-400'} />
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900 dark:text-white">{rule.label}</p>
                        <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5 flex-wrap">
                          <span>{rule.hoursBeforeAppointment}h before appointment</span>
                          <span>via {channelLabel[rule.channel]}</span>
                        </div>
                        <p className="text-xs text-ink-500 mt-1.5 line-clamp-2 max-w-md">{rule.messageTemplate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={rule.isActive ? 'success' : 'default'} dot>
                        {rule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => toggleRule(rule.id!, rule.isActive)}>
                        {rule.isActive ? 'Pause' : 'Activate'}
                      </Button>
                      <button onClick={() => handleDeleteRule(rule.id!, rule.label)} className="p-1.5 text-ink-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      )}

      {/* QUEUE TAB */}
      {tab === 'queue' && (
        qLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : reminders.length === 0 ? (
          <Card className="py-16 text-center">
            <Clock size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500 mb-2">No scheduled reminders yet.</p>
            <p className="text-xs text-ink-400">Use "Schedule for Booking" to queue reminders for upcoming appointments.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reminders.map((r, i) => {
              const config    = statusConfig[r.status]
              const StatusIcon = config.icon
              const ChanIcon  = channelIcon[r.channel]
              const isExpanded = expanded === r.id

              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : r.id!)}>
                    <div className="flex items-center gap-3">
                      <ChanIcon size={16} className="text-ink-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-ink-900 dark:text-white text-sm">{r.customerName}</p>
                        <p className="text-xs text-ink-400">{r.ruleLabel} · {r.serviceName}</p>
                        <p className="text-xs text-ink-400">{formatDate(r.scheduledFor, 'MMM d · h:mm a')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} size="sm">
                        <StatusIcon size={9} className="mr-1" />{config.label}
                      </Badge>
                      {r.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); markSent(r.id!) }}>Mark Sent</Button>
                          <button onClick={e => { e.stopPropagation(); handleCancel(r.id!) }} className="p-1.5 text-ink-300 hover:text-red-500 transition-colors">
                            <XCircle size={13} />
                          </button>
                        </>
                      )}
                      {isExpanded ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-ink-100 dark:border-ink-800 p-4 bg-ink-50/30 dark:bg-ink-800/10">
                      <p className="text-xs font-semibold text-ink-400 uppercase mb-2">Message</p>
                      <p className="text-sm text-ink-700 dark:text-ink-300 whitespace-pre-line">{r.message}</p>
                      {r.sentAt && <p className="text-xs text-ink-400 mt-2">Sent at: {formatDate(r.sentAt, 'MMM d, yyyy · h:mm a')}</p>}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )
      )}

      {/* New Rule Modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); reset() }} title="New Reminder Rule" size="md">
        <form onSubmit={handleSubmit(onCreateRule)} className="space-y-4">
          {/* Quick templates */}
          <div>
            <label className="label">Quick templates</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-brand-50 dark:bg-brand-950/30 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Rule name" placeholder="24-hour SMS reminder" {...register('label')} error={errors.label?.message} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hours before appointment</label>
              <input
                type="number"
                min={1}
                max={168}
                {...register('hoursBeforeAppointment')}
                className="input-base w-full"
              />
              {errors.hoursBeforeAppointment && <p className="text-xs text-red-500 mt-1">{errors.hoursBeforeAppointment.message}</p>}
            </div>
            <div>
              <label className="label">Channel</label>
              <select {...register('channel')} className="input-base w-full">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">Both (SMS + Email)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Message template</label>
            <p className="text-xs text-ink-400 mb-1">Available tokens: <code>{'{name}'}</code> <code>{'{service}'}</code> <code>{'{date}'}</code> <code>{'{time}'}</code> <code>{'{business}'}</code></p>
            <textarea
              {...register('messageTemplate')}
              rows={4}
              className="input-base w-full resize-none"
              onChange={e => setPreviewMsg(buildReminderMessage(e.target.value, {
                name: 'Jane Smith', service: 'Hair Cut', date: 'Jun 15', time: '2:30 PM', business: businessName
              }))}
            />
            {errors.messageTemplate && <p className="text-xs text-red-500 mt-1">{errors.messageTemplate.message}</p>}
          </div>

          {/* Live preview */}
          {(previewMsg || watchedTemplate) && (
            <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200 dark:border-ink-700">
              <p className="text-xs font-semibold text-ink-400 uppercase mb-1">Preview</p>
              <p className="text-sm text-ink-700 dark:text-ink-300 whitespace-pre-line">
                {previewMsg || buildReminderMessage(watchedTemplate, {
                  name: 'Jane Smith', service: 'Hair Cut', date: 'Jun 15', time: '2:30 PM', business: businessName
                })}
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-brand-600 w-4 h-4" />
            <span className="text-sm text-ink-700 dark:text-ink-300">Activate rule immediately</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => { setShowNew(false); reset() }}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating} icon={<Bell size={14} />}>Create Rule</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule for Booking Modal */}
      <Modal isOpen={showQueue} onClose={() => setShowQueue(false)} title="Schedule Reminders for Booking" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Select an upcoming booking (next 7 days) to schedule reminders based on your {rules.filter(r => r.isActive).length} active rule{rules.filter(r => r.isActive).length !== 1 ? 's' : ''}.
          </p>
          {upcomingBookings.length === 0 ? (
            <p className="text-center text-sm text-ink-400 py-4">No upcoming bookings in the next 7 days.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {upcomingBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 border border-ink-200 dark:border-ink-700 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-white">{b.customerName}</p>
                    <p className="text-xs text-ink-400">{b.serviceName} · {formatDate(b.date as string, 'MMM d')} {b.startTime}</p>
                  </div>
                  <Button size="sm" onClick={() => scheduleForBooking(b.id!)}>
                    Schedule
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setShowQueue(false)}>Close</Button>
        </div>
      </Modal>
    </DashboardShell>
  )
}
