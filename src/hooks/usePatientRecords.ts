import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface PatientRecord {
  id?:            string
  businessId:     string
  patientName:    string
  dateOfBirth?:   string
  email?:         string
  phone?:         string
  address?:       string
  bloodType?:     string
  allergies?:     string
  medications?:   string
  medicalHistory?: string
  insuranceProvider?: string
  insuranceNumber?:   string
  emergencyContact?:  string
  emergencyPhone?:    string
  notes?:         string
  lastVisit?:     string
  createdAt?:     unknown
  updatedAt?:     unknown
}

export interface IntakeForm {
  id?:             string
  businessId:      string
  patientId:       string
  patientName:     string
  bookingId?:      string
  symptoms?:       string
  currentMedications?: string
  allergies?:      string
  consentSigned:   boolean
  submittedAt:     string
  createdAt?:      unknown
}

export function usePatientRecords() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.INTAKE_FORMS)
  const patientPath = subColPath(businessId, 'patientRecords')

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', businessId],
    queryFn:  () => fetchCollection<PatientRecord>(patientPath, [orderBy('patientName')]),
    enabled:  !!businessId,
  })

  const { data: intakeForms = [] } = useQuery({
    queryKey: ['intake_forms', businessId],
    queryFn:  () => fetchCollection<IntakeForm>(path, [orderBy('submittedAt', 'desc')]),
    enabled:  !!businessId,
  })

  const createPatientMutation = useMutation({
    mutationFn: (data: Omit<PatientRecord, 'id'>) => createDoc(patientPath, { ...data, businessId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients', businessId] }),
  })

  const updatePatientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientRecord> }) =>
      updateDocById(patientPath, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients', businessId] }),
  })

  const deletePatientMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(patientPath, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['patients', businessId] }),
  })

  const submitIntakeMutation = useMutation({
    mutationFn: (data: Omit<IntakeForm, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['intake_forms', businessId] }),
  })

  return {
    patients, intakeForms, isLoading,
    createPatient:  createPatientMutation.mutateAsync,
    updatePatient:  updatePatientMutation.mutateAsync,
    deletePatient:  deletePatientMutation.mutateAsync,
    submitIntake:   submitIntakeMutation.mutateAsync,
    isCreating:     createPatientMutation.isPending,
  }
}
