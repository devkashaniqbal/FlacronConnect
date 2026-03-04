import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface TimeEntry {
  id?:          string
  businessId:   string
  employeeId?:  string
  employeeName: string
  projectId?:   string
  projectName?: string
  clientName?:  string
  date:         string    // YYYY-MM-DD
  hours:        number
  billable:     boolean
  hourlyRate?:  number
  description:  string
  invoiced?:    boolean
  createdAt?:   unknown
}

export function useTimeTracking() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.TIME_ENTRIES)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time_entries', businessId],
    queryFn:  () => fetchCollection<TimeEntry>(path, [orderBy('date', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<TimeEntry, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['time_entries', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time_entries', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['time_entries', businessId] }),
  })

  const totalBillable = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0)
  const totalHours    = entries.reduce((s, e) => s + e.hours, 0)

  return {
    entries, isLoading, totalHours, totalBillable,
    logTime:     createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    isCreating:  createMutation.isPending,
  }
}
