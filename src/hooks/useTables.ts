import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export interface RestaurantTable {
  id?:       string
  businessId: string
  number:    number
  capacity:  number
  zone?:     string    // e.g. 'Indoor', 'Patio', 'Bar'
  status:    TableStatus
  notes?:    string
  createdAt?: unknown
}

export interface WaitlistEntry {
  id?:          string
  businessId:   string
  name:         string
  phone?:       string
  partySize:    number
  addedAt:      string   // ISO timestamp
  notified:     boolean
  seated:       boolean
}

export function useTables() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.TABLES)

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', businessId],
    queryFn:  () => fetchCollection<RestaurantTable>(path, [orderBy('number')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<RestaurantTable, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tables', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RestaurantTable> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tables', businessId] }),
  })

  return {
    tables, isLoading,
    createTable: createMutation.mutateAsync,
    updateTable: updateMutation.mutateAsync,
    deleteTable: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
