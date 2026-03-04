import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type ClassRecurrence = 'once' | 'weekly' | 'biweekly'

export interface FitnessClass {
  id?:            string
  businessId:     string
  name:           string
  instructorId?:  string
  instructorName?: string
  capacity:       number
  enrolled:       number
  date:           string   // YYYY-MM-DD
  startTime:      string
  durationMins:   number
  recurrence:     ClassRecurrence
  price?:         number
  description?:   string
  createdAt?:     unknown
}

export interface ClassEnrollment {
  id?:          string
  classId:      string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  packageId?:   string   // linked session package
  enrolledAt?:  unknown
  attended?:    boolean
}

export function useClasses() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.CLASSES)

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes', businessId],
    queryFn:  () => fetchCollection<FitnessClass>(path, [orderBy('date', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<FitnessClass, 'id' | 'enrolled'>) =>
      createDoc(path, { ...data, businessId, enrolled: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FitnessClass> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['classes', businessId] }),
  })

  return {
    classes, isLoading,
    createClass: createMutation.mutateAsync,
    updateClass: updateMutation.mutateAsync,
    deleteClass: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
