import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, deleteDocById, subColPath, where } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { JobAssignment } from '@/types/booking.types'

export function useJobAssignments(bookingId?: string) {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.JOB_ASSIGNMENTS)

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['job_assignments', businessId, bookingId],
    queryFn:  () => bookingId
      ? fetchCollection<JobAssignment>(path, [where('bookingId', '==', bookingId)])
      : fetchCollection<JobAssignment>(path),
    enabled: !!businessId,
  })

  const assignMutation = useMutation({
    mutationFn: (data: Omit<JobAssignment, 'id' | 'assignedAt'>) =>
      createDoc(path, { ...data, assignedAt: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job_assignments', businessId] }),
  })

  const unassignMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['job_assignments', businessId] }),
  })

  return {
    assignments,
    isLoading,
    assignEmployee:   assignMutation.mutateAsync,
    unassignEmployee: unassignMutation.mutateAsync,
    isAssigning:      assignMutation.isPending,
  }
}
