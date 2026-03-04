import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface Retainer {
  id?:           string
  businessId:    string
  clientName:    string
  clientEmail?:  string
  amount:        number      // monthly retainer fee
  billingDay:    number      // day of month (1–28)
  active:        boolean
  startDate:     string      // YYYY-MM-DD
  description?:  string
  lastInvoiced?: string      // YYYY-MM-DD
  createdAt?:    unknown
  updatedAt?:    unknown
}

export function useRetainers() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.RETAINERS)

  const { data: retainers = [], isLoading } = useQuery({
    queryKey: ['retainers', businessId],
    queryFn:  () => fetchCollection<Retainer>(path, [orderBy('clientName')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Retainer, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['retainers', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Retainer> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['retainers', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['retainers', businessId] }),
  })

  const monthlyTotal = retainers.filter(r => r.active).reduce((s, r) => s + r.amount, 0)

  return {
    retainers, isLoading, monthlyTotal,
    createRetainer: createMutation.mutateAsync,
    updateRetainer: updateMutation.mutateAsync,
    deleteRetainer: deleteMutation.mutateAsync,
    isCreating:     createMutation.isPending,
  }
}
