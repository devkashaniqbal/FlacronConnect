// Patient Records + Intake Forms — Medical Clinic / Dental Office
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ClipboardList, Search, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Avatar, Spinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { usePatientRecords } from '@/hooks/usePatientRecords'
import { cn } from '@/utils/cn'

const patientSchema = z.object({
  patientName:     z.string().min(2, 'Name required'),
  dateOfBirth:     z.string().optional(),
  email:           z.string().email().optional().or(z.literal('')),
  phone:           z.string().optional(),
  bloodType:       z.string().optional(),
  allergies:       z.string().optional(),
  medications:     z.string().optional(),
  medicalHistory:  z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone:  z.string().optional(),
})
type PatientForm = z.infer<typeof patientSchema>

const intakeSchema = z.object({
  patientId:    z.string().min(1, 'Select patient'),
  symptoms:     z.string().optional(),
  currentMedications: z.string().optional(),
  allergies:    z.string().optional(),
  consentSigned: z.literal(true, { errorMap: () => ({ message: 'Consent required' }) }),
})
type IntakeForm = z.infer<typeof intakeSchema>

export function PatientRecordsPage() {
  const { patients, intakeForms, isLoading, createPatient, deletePatient, submitIntake, isCreating } = usePatientRecords()
  const [search, setSearch]       = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [showIntake, setShowIntake] = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)

  const { register: rPat, handleSubmit: hsPat, reset: resetPat, formState: { errors: ePat } } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) })
  const { register: rInt, handleSubmit: hsInt, reset: resetInt, formState: { errors: eInt, isSubmitting: submittingInt } } = useForm<IntakeForm>({ resolver: zodResolver(intakeSchema) })

  const filtered = patients.filter(p =>
    p.patientName.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  async function onCreatePatient(data: PatientForm) {
    await toast.promise(
      createPatient({ ...data, businessId: '' }),
      { loading: 'Creating record…', success: 'Patient record created!', error: 'Failed' }
    )
    resetPat(); setShowNew(false)
  }

  async function onSubmitIntake(data: IntakeForm) {
    const patient = patients.find(p => p.id === data.patientId)
    await toast.promise(
      submitIntake({ ...data, businessId: '', patientName: patient?.patientName ?? '', submittedAt: new Date().toISOString() }),
      { loading: 'Submitting intake…', success: 'Intake form saved!', error: 'Failed' }
    )
    resetInt(); setShowIntake(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete record for "${name}"?`)) return
    await toast.promise(deletePatient(id), { loading: '…', success: 'Record deleted', error: 'Failed' })
  }

  return (
    <DashboardShell title="Patient Records">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Patient Records</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{patients.length} patients · {intakeForms.length} intake forms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<ClipboardList size={14} />} onClick={() => setShowIntake(true)}>New Intake Form</Button>
          <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Add Patient</Button>
        </div>
      </div>

      <div className="mb-4">
        <Input placeholder="Search patients…" icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Heart size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No patient records yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient, i) => {
            const isExpanded = expanded === patient.id
            const patientIntakes = intakeForms.filter(f => f.patientId === patient.id)
            return (
              <motion.div key={patient.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : patient.id!)}>
                  <div className="flex items-center gap-3">
                    <Avatar name={patient.patientName} size="md" />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{patient.patientName}</p>
                      <div className="flex gap-3 text-xs text-ink-400">
                        {patient.dateOfBirth && <span>DOB: {formatDate(patient.dateOfBirth, 'MMM d, yyyy')}</span>}
                        {patient.phone && <span>{patient.phone}</span>}
                        {patientIntakes.length > 0 && <Badge variant="info" size="sm">{patientIntakes.length} intake{patientIntakes.length > 1 ? 's' : ''}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(patient.id!, patient.patientName) }}
                      className="p-1.5 text-ink-300 hover:text-red-500 transition-colors">×</button>
                    {isExpanded ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-ink-100 dark:border-ink-800 p-4 grid grid-cols-2 gap-4 text-sm bg-ink-50/50 dark:bg-ink-800/20">
                    {patient.bloodType && (
                      <div><p className="text-xs text-ink-400">Blood Type</p><p className="font-medium">{patient.bloodType}</p></div>
                    )}
                    {patient.allergies && (
                      <div><p className="text-xs text-ink-400">Allergies</p><p className="font-medium text-red-600">{patient.allergies}</p></div>
                    )}
                    {patient.medications && (
                      <div className="col-span-2"><p className="text-xs text-ink-400">Current Medications</p><p className="font-medium">{patient.medications}</p></div>
                    )}
                    {patient.medicalHistory && (
                      <div className="col-span-2"><p className="text-xs text-ink-400">Medical History</p><p className="font-medium">{patient.medicalHistory}</p></div>
                    )}
                    {patient.insuranceProvider && (
                      <div><p className="text-xs text-ink-400">Insurance</p><p className="font-medium">{patient.insuranceProvider} #{patient.insuranceNumber}</p></div>
                    )}
                    {patient.emergencyContact && (
                      <div><p className="text-xs text-ink-400">Emergency Contact</p><p className="font-medium">{patient.emergencyContact} · {patient.emergencyPhone}</p></div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* New patient modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Patient Record" size="lg">
        <form onSubmit={hsPat(onCreatePatient)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full name" placeholder="Jane Smith" {...rPat('patientName')} error={ePat.patientName?.message} />
            <Input label="Date of birth" type="date" {...rPat('dateOfBirth')} />
            <Input label="Email" type="email" placeholder="jane@example.com" {...rPat('email')} />
            <Input label="Phone" placeholder="555-0100" {...rPat('phone')} />
            <Input label="Blood type" placeholder="O+" {...rPat('bloodType')} />
            <Input label="Allergies" placeholder="Penicillin, Peanuts" {...rPat('allergies')} />
            <div className="col-span-2">
              <Input label="Current medications" placeholder="Medication names and dosages" {...rPat('medications')} />
            </div>
            <div className="col-span-2">
              <Input label="Medical history" placeholder="Past conditions, surgeries…" {...rPat('medicalHistory')} />
            </div>
            <Input label="Insurance provider" placeholder="BlueCross" {...rPat('insuranceProvider')} />
            <Input label="Insurance number" placeholder="INS-123456" {...rPat('insuranceNumber')} />
            <Input label="Emergency contact" placeholder="John Smith" {...rPat('emergencyContact')} />
            <Input label="Emergency phone" placeholder="555-0200" {...rPat('emergencyPhone')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Save Record</Button>
          </div>
        </form>
      </Modal>

      {/* Intake form modal */}
      <Modal isOpen={showIntake} onClose={() => setShowIntake(false)} title="Patient Intake Form" size="md">
        <form onSubmit={hsInt(onSubmitIntake)} className="space-y-4">
          <div>
            <label className="label">Patient</label>
            <select {...rInt('patientId')} className="input-base w-full">
              <option value="">Select patient…</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.patientName}</option>)}
            </select>
            {eInt.patientId && <p className="text-xs text-red-500 mt-1">{eInt.patientId.message}</p>}
          </div>
          <Input label="Symptoms / Reason for visit" placeholder="Chief complaint" {...rInt('symptoms')} />
          <Input label="Current medications (update)" placeholder="Any changes since last visit" {...rInt('currentMedications')} />
          <Input label="Allergies (update)" placeholder="Any new allergies" {...rInt('allergies')} />
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" {...rInt('consentSigned')} className="mt-0.5 accent-brand-600 w-4 h-4" />
            <span className="text-sm text-ink-600 dark:text-ink-400">
              Patient consents to treatment and data storage per HIPAA guidelines
            </span>
          </label>
          {eInt.consentSigned && <p className="text-xs text-red-500">{eInt.consentSigned.message}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowIntake(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={submittingInt}>Submit Intake</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
