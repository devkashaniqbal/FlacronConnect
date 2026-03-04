// Intake Forms — Medical Clinic / Dental Office
// Dedicated intake form management: submit, review, and track patient consent forms
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Plus, Search, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Avatar, Spinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { usePatientRecords } from '@/hooks/usePatientRecords'
import { cn } from '@/utils/cn'

// ── Form Schema ────────────────────────────────────────────────────────────────

const intakeSchema = z.object({
  patientId:          z.string().min(1, 'Select a patient'),
  bookingId:          z.string().optional(),
  symptoms:           z.string().min(1, 'Please describe the reason for visit'),
  currentMedications: z.string().optional(),
  allergies:          z.string().optional(),
  painLevel:          z.coerce.number().min(0).max(10).optional(),
  lastVisitDate:      z.string().optional(),
  newSymptoms:        z.string().optional(),
  consentSigned:      z.literal(true, { errorMap: () => ({ message: 'Patient consent is required before proceeding' }) }),
})
type IntakeFormData = z.infer<typeof intakeSchema>

// ── Component ──────────────────────────────────────────────────────────────────

export function IntakeFormsPage() {
  const { patients, intakeForms, isLoading, submitIntake } = usePatientRecords()
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'today' | 'week'>('all')
  const [showNew, setShowNew]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
  })

  const selectedPatientId = watch('patientId')
  const selectedPatient   = patients.find(p => p.id === selectedPatientId)

  // Filter + search
  const displayed = intakeForms
    .filter(f => {
      if (filter === 'today') return f.submittedAt?.startsWith(today)
      if (filter === 'week')  return f.submittedAt >= weekAgo
      return true
    })
    .filter(f =>
      f.patientName.toLowerCase().includes(search.toLowerCase()) ||
      f.symptoms?.toLowerCase().includes(search.toLowerCase())
    )

  async function onSubmit(data: IntakeFormData) {
    const patient = patients.find(p => p.id === data.patientId)
    await toast.promise(
      submitIntake({
        ...data,
        businessId:   '',
        patientName:  patient?.patientName ?? '',
        submittedAt:  new Date().toISOString(),
      }),
      { loading: 'Submitting intake form…', success: 'Intake form saved!', error: 'Failed to save' }
    )
    reset()
    setShowNew(false)
  }

  // Stats
  const todayCount = intakeForms.filter(f => f.submittedAt?.startsWith(today)).length
  const consentRate = intakeForms.length > 0
    ? Math.round((intakeForms.filter(f => f.consentSigned).length / intakeForms.length) * 100)
    : 100

  return (
    <DashboardShell title="Intake Forms">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Patient Intake Forms</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {intakeForms.length} total · {todayCount} today · {consentRate}% consent signed
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Intake Form</Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Forms',    value: intakeForms.length,  color: 'text-brand-600' },
          { label: 'Today',          value: todayCount,           color: 'text-emerald-600' },
          { label: 'Consent Rate',   value: `${consentRate}%`,   color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-ink-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search by patient or symptoms…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit">
          {(['all', 'today', 'week'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                filter === f
                  ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
              )}>
              {f === 'week' ? 'Last 7 days' : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <Card className="py-16 text-center">
          <ClipboardList size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">No intake forms found.</p>
          <p className="text-xs text-ink-400">Intake forms capture patient symptoms and consent before each appointment.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((form, i) => {
            const isExpanded = expanded === form.id
            return (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card overflow-hidden"
              >
                {/* Row header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : form.id!)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={form.patientName} size="md" />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{form.patientName}</p>
                      <div className="flex items-center gap-3 text-xs text-ink-400">
                        <span>{formatDate(form.submittedAt, 'MMM d, yyyy · h:mm a')}</span>
                        {form.symptoms && (
                          <span className="truncate max-w-[200px]">"{form.symptoms}"</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.consentSigned ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 size={10} className="mr-1" />Consent Signed
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <XCircle size={10} className="mr-1" />No Consent
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-ink-100 dark:border-ink-800"
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-ink-50/30 dark:bg-ink-800/10">
                        <div>
                          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <FileText size={10} /> Reason for Visit / Symptoms
                          </p>
                          <p className="text-ink-700 dark:text-ink-300">{form.symptoms || '—'}</p>
                        </div>
                        {form.currentMedications && (
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Current Medications</p>
                            <p className="text-ink-700 dark:text-ink-300">{form.currentMedications}</p>
                          </div>
                        )}
                        {form.allergies && (
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Allergies</p>
                            <p className="text-red-600 dark:text-red-400 font-medium">{form.allergies}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">HIPAA Consent</p>
                          <p className={cn('font-medium', form.consentSigned ? 'text-emerald-600' : 'text-red-500')}>
                            {form.consentSigned ? 'Signed & on file' : 'Not obtained'}
                          </p>
                        </div>
                        {form.bookingId && (
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Linked Booking</p>
                            <p className="text-ink-600 dark:text-ink-400 font-mono text-xs">{form.bookingId}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* New Intake Form Modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); reset() }} title="New Patient Intake Form" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Patient selector */}
          <div>
            <label className="label">Patient <span className="text-red-500">*</span></label>
            <select {...register('patientId')} className="input-base w-full">
              <option value="">Select patient…</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.patientName}</option>
              ))}
            </select>
            {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId.message}</p>}
          </div>

          {/* Auto-fill hint from patient record */}
          {selectedPatient && (selectedPatient.allergies || selectedPatient.medications) && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-300">
              <p className="font-semibold mb-1">⚠ Patient Record Alert</p>
              {selectedPatient.allergies && <p>Known allergies: <strong>{selectedPatient.allergies}</strong></p>}
              {selectedPatient.medications && <p>On file meds: <strong>{selectedPatient.medications}</strong></p>}
            </div>
          )}

          <div>
            <label className="label">Reason for visit / Chief complaint <span className="text-red-500">*</span></label>
            <textarea
              {...register('symptoms')}
              rows={3}
              placeholder="Describe symptoms, pain location, duration…"
              className="input-base w-full resize-none"
            />
            {errors.symptoms && <p className="text-xs text-red-500 mt-1">{errors.symptoms.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Current medications (updates)"
                placeholder="Any changes since last visit"
                {...register('currentMedications')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Allergies (updates)"
                placeholder="New or confirmed allergies"
                {...register('allergies')}
              />
            </div>
            <div>
              <label className="label">Pain level (0–10)</label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                {...register('painLevel')}
                className="w-full accent-brand-600 mt-2"
              />
              <div className="flex justify-between text-xs text-ink-400 mt-1">
                <span>0 — No pain</span>
                <span>10 — Worst</span>
              </div>
            </div>
            <Input label="Last visit date" type="date" {...register('lastVisitDate')} />
          </div>

          <div>
            <label className="label">New symptoms since last visit</label>
            <textarea
              {...register('newSymptoms')}
              rows={2}
              placeholder="Any new symptoms or concerns…"
              className="input-base w-full resize-none"
            />
          </div>

          {/* HIPAA Consent */}
          <div className={cn(
            'p-4 rounded-xl border-2 transition-colors',
            errors.consentSigned
              ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
              : 'border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/30'
          )}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('consentSigned')}
                className="mt-0.5 accent-brand-600 w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
                <strong>Patient Consent (HIPAA):</strong> The patient consents to receive treatment and authorizes the collection, use, and storage of their health information in compliance with HIPAA guidelines. The patient confirms the information provided is accurate.
              </span>
            </label>
            {errors.consentSigned && (
              <p className="text-xs text-red-500 mt-2">{errors.consentSigned.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => { setShowNew(false); reset() }}>
              Cancel
            </Button>
            <Button className="flex-1" type="submit" loading={isSubmitting} icon={<ClipboardList size={14} />}>
              Submit Intake
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
