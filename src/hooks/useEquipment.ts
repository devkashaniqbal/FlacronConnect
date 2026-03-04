import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'retired'

export interface Equipment {
  id?:           string
  businessId:    string
  name:          string
  type:          string
  serialNumber?: string
  status:        EquipmentStatus
  assignedTo?:   string   // employee name
  assignedToId?: string   // employee id
  purchaseDate?: string
  notes?:        string
  createdAt?:    unknown
  updatedAt?:    unknown
}

export function useEquipment() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.EQUIPMENT)

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', businessId],
    queryFn:  () => fetchCollection<Equipment>(path, [orderBy('name')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Equipment, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['equipment', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['equipment', businessId] }),
  })

  return {
    equipment, isLoading,
    createEquipment: createMutation.mutateAsync,
    updateEquipment: updateMutation.mutateAsync,
    deleteEquipment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
