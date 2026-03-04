// Service Packages — Beauty Spa, Gym / Fitness, Event Planning
// Tracks session bundles sold to clients (e.g. "10-class pack", "5-massage bundle")
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById, deleteDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface ServicePackage {
  id?:             string
  businessId:      string
  clientName:      string
  clientEmail?:    string
  packageName:     string
  serviceName:     string
  totalSessions:   number
  usedSessions:    number
  priceTotal:      number
  purchaseDate:    string
  expiryDate?:     string
  notes?:          string
  createdAt?:      unknown
}

export function usePackages() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.PACKAGES)

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages', businessId],
    queryFn:  () => fetchCollection<ServicePackage>(path, [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  const activePackages   = packages.filter(p => p.usedSessions < p.totalSessions)
  const expiredPackages  = packages.filter(p => p.usedSessions >= p.totalSessions)

  const createMutation = useMutation({
    mutationFn: (data: Omit<ServicePackage, 'id'>) =>
      createDoc(path, { ...data, businessId, usedSessions: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages', businessId] }),
  })

  // Record one session use — increments usedSessions
  const useSessionMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: number }) =>
      updateDocById(path, id, { usedSessions: current + 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['packages', businessId] }),
  })

  return {
    packages, activePackages, expiredPackages, isLoading,
    createPackage: createMutation.mutateAsync,
    useSession:    useSessionMutation.mutateAsync,
    deletePackage: deleteMutation.mutateAsync,
    isCreating:    createMutation.isPending,
  }
}
