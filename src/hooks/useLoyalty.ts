import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface LoyaltyAccount {
  id?:           string
  businessId:    string
  customerName:  string
  customerEmail?: string
  customerPhone?: string
  points:        number
  lifetimePoints: number
  tier:          'bronze' | 'silver' | 'gold'
  lastActivity?: string   // ISO date
  createdAt?:    unknown
  updatedAt?:    unknown
}

/** Points thresholds for tier upgrades */
export const LOYALTY_TIERS = {
  bronze: 0,
  silver: 500,
  gold:   2000,
} as const

/** Calculate tier from lifetime points */
export function getTier(lifetime: number): LoyaltyAccount['tier'] {
  if (lifetime >= LOYALTY_TIERS.gold)   return 'gold'
  if (lifetime >= LOYALTY_TIERS.silver) return 'silver'
  return 'bronze'
}

/** Default earn rate: 1 point per $1 spent */
export const POINTS_PER_DOLLAR = 1

export function useLoyalty() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.LOYALTY)

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['loyalty', businessId],
    queryFn:  () => fetchCollection<LoyaltyAccount>(path, [orderBy('points', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<LoyaltyAccount, 'id' | 'tier'>) =>
      createDoc(path, { ...data, businessId, tier: getTier(data.lifetimePoints) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty', businessId] }),
  })

  const awardMutation = useMutation({
    mutationFn: ({ id, pointsToAdd, currentPoints, lifetime }: {
      id: string; pointsToAdd: number; currentPoints: number; lifetime: number
    }) => {
      const newLifetime = lifetime + pointsToAdd
      return updateDocById(path, id, {
        points:        currentPoints + pointsToAdd,
        lifetimePoints: newLifetime,
        tier:          getTier(newLifetime),
        lastActivity:  new Date().toISOString().split('T')[0],
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty', businessId] }),
  })

  const redeemMutation = useMutation({
    mutationFn: ({ id, pointsToRedeem, currentPoints }: {
      id: string; pointsToRedeem: number; currentPoints: number
    }) => updateDocById(path, id, {
      points:       Math.max(0, currentPoints - pointsToRedeem),
      lastActivity: new Date().toISOString().split('T')[0],
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty', businessId] }),
  })

  return {
    accounts, isLoading,
    createAccount:  createMutation.mutateAsync,
    awardPoints:    awardMutation.mutateAsync,
    redeemPoints:   redeemMutation.mutateAsync,
    isCreating:     createMutation.isPending,
  }
}
