import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type VehicleStatus = 'active' | 'maintenance' | 'retired'

export interface Vehicle {
  id?:             string
  businessId:      string
  make:            string
  model:           string
  year:            number
  licensePlate:    string
  vin?:            string
  status:          VehicleStatus
  color?:          string
  assignedDriverId?: string
  assignedDriver?:   string
  lastServiceDate?:  string
  notes?:          string
  createdAt?:      unknown
}

export function useVehicles() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.VEHICLES)

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', businessId],
    queryFn:  () => fetchCollection<Vehicle>(path, [orderBy('make')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Vehicle, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['vehicles', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['vehicles', businessId] }),
  })

  return {
    vehicles, isLoading,
    createVehicle: createMutation.mutateAsync,
    updateVehicle: updateMutation.mutateAsync,
    deleteVehicle: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
