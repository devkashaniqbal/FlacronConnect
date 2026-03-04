import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface MileageLog {
  id?:          string
  businessId:   string
  date:         string
  driverId?:    string
  driverName:   string
  vehicleId?:   string
  vehicleName?: string
  tripPurpose:  string
  startOdometer: number
  endOdometer:  number
  distanceMiles: number
  bookingId?:   string
  notes?:       string
  createdAt?:   unknown
}

export function useMileage() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.MILEAGE_LOGS)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['mileage', businessId],
    queryFn:  () => fetchCollection<MileageLog>(path, [orderBy('date', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<MileageLog, 'id'>) => {
      const distance = parseFloat((data.endOdometer - data.startOdometer).toFixed(1))
      return createDoc(path, { ...data, businessId, distanceMiles: distance })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mileage', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mileage', businessId] }),
  })

  const totalMiles = logs.reduce((s, l) => s + (l.distanceMiles ?? 0), 0)

  return {
    logs, isLoading, totalMiles,
    logTrip:     createMutation.mutateAsync,
    deleteMileage: deleteMutation.mutateAsync,
    isCreating:  createMutation.isPending,
  }
}
