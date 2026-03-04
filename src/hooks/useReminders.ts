// Appointment Reminders — Medical Clinic, Hair Salon, Beauty Spa
// Manages reminder rules (when to send) and a queue of upcoming reminders derived from bookings
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'

export type ReminderChannel  = 'sms' | 'email' | 'both'
export type ReminderStatus   = 'pending' | 'sent' | 'failed' | 'cancelled'

/** Configurable rule: "send a reminder X hours before each appointment via Y channel" */
export interface ReminderRule {
  id?:         string
  businessId:  string
  label:       string          // e.g. "24-hour SMS reminder"
  hoursBeforeAppointment: number  // e.g. 24, 48, 1
  channel:     ReminderChannel
  messageTemplate: string     // e.g. "Hi {name}, your {service} appointment is tomorrow at {time}."
  isActive:    boolean
  createdAt?:  unknown
}

/** A concrete reminder scheduled for a specific booking */
export interface ScheduledReminder {
  id?:          string
  businessId:   string
  ruleId:       string
  ruleLabel:    string
  bookingId:    string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  serviceName:  string
  appointmentDate: string    // YYYY-MM-DD
  appointmentTime: string    // HH:mm
  scheduledFor: string       // ISO datetime — when to send
  channel:      ReminderChannel
  status:       ReminderStatus
  sentAt?:      string
  message:      string
  createdAt?:   unknown
}

const RULES_PATH        = 'reminderRules'
const REMINDERS_PATH    = 'scheduledReminders'

export function useReminderRules() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, RULES_PATH)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['reminderRules', businessId],
    queryFn:  () => fetchCollection<ReminderRule>(path, [orderBy('hoursBeforeAppointment', 'asc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<ReminderRule, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['reminderRules', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReminderRule> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminderRules', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['reminderRules', businessId] }),
  })

  return {
    rules, isLoading,
    createRule: createMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

export function useScheduledReminders() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, REMINDERS_PATH)

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['scheduledReminders', businessId],
    queryFn:  () => fetchCollection<ScheduledReminder>(path, [orderBy('scheduledFor', 'asc')]),
    enabled:  !!businessId,
  })

  const scheduleMutation = useMutation({
    mutationFn: (data: Omit<ScheduledReminder, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['scheduledReminders', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduledReminder> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduledReminders', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['scheduledReminders', businessId] }),
  })

  const pendingReminders  = reminders.filter(r => r.status === 'pending')
  const sentReminders     = reminders.filter(r => r.status === 'sent')
  const failedReminders   = reminders.filter(r => r.status === 'failed')

  return {
    reminders, pendingReminders, sentReminders, failedReminders, isLoading,
    scheduleReminder: scheduleMutation.mutateAsync,
    updateReminder:   updateMutation.mutateAsync,
    cancelReminder:   deleteMutation.mutateAsync,
    isScheduling:     scheduleMutation.isPending,
  }
}

/** Build the reminder message from a template by substituting tokens */
export function buildReminderMessage(template: string, vars: {
  name: string; service: string; date: string; time: string; business: string
}): string {
  return template
    .replace(/\{name\}/g,     vars.name)
    .replace(/\{service\}/g,  vars.service)
    .replace(/\{date\}/g,     vars.date)
    .replace(/\{time\}/g,     vars.time)
    .replace(/\{business\}/g, vars.business)
}
