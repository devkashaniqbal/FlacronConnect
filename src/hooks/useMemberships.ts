// Memberships — Gym / Fitness Studio & Beauty Spa
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById, deleteDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired'
export type BillingCycle = 'monthly' | 'quarterly' | 'annual'

export interface MembershipPlan {
  id?:           string
  businessId:    string
  name:          string
  description?:  string
  price:         number
  billingCycle:  BillingCycle
  features?:     string      // comma-separated list of features
  color?:        string      // accent colour for card
  isActive:      boolean
  createdAt?:    unknown
}

export interface MembershipEnrollment {
  id?:            string
  businessId:     string
  planId:         string
  planName:       string
  memberName:     string
  memberEmail?:   string
  memberPhone?:   string
  status:         MembershipStatus
  startDate:      string
  nextBillingDate?: string
  endDate?:       string
  price:          number
  billingCycle:   BillingCycle
  createdAt?:     unknown
}

export function useMembershipPlans() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.MEMBERSHIPS)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['membershipPlans', businessId],
    queryFn:  () => fetchCollection<MembershipPlan>(path + '/plans', [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<MembershipPlan, 'id'>) =>
      createDoc(path + '/plans', { ...data, businessId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membershipPlans', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MembershipPlan> }) =>
      updateDocById(path + '/plans', id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membershipPlans', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path + '/plans', id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['membershipPlans', businessId] }),
  })

  return {
    plans, isLoading,
    createPlan: createMutation.mutateAsync,
    updatePlan: updateMutation.mutateAsync,
    deletePlan: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

export function useMembershipEnrollments() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.MEMBERSHIPS)

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['membershipEnrollments', businessId],
    queryFn:  () => fetchCollection<MembershipEnrollment>(path + '/enrollments', [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  const activeMemberCount = enrollments.filter(e => e.status === 'active').length
  const monthlyRevenue    = enrollments
    .filter(e => e.status === 'active')
    .reduce((sum, e) => {
      if (e.billingCycle === 'monthly')   return sum + e.price
      if (e.billingCycle === 'quarterly') return sum + e.price / 3
      if (e.billingCycle === 'annual')    return sum + e.price / 12
      return sum
    }, 0)

  const enrollMutation = useMutation({
    mutationFn: (data: Omit<MembershipEnrollment, 'id'>) =>
      createDoc(path + '/enrollments', { ...data, businessId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membershipEnrollments', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MembershipEnrollment> }) =>
      updateDocById(path + '/enrollments', id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membershipEnrollments', businessId] }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateDocById(path + '/enrollments', id, { status: 'cancelled' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['membershipEnrollments', businessId] }),
  })

  return {
    enrollments, isLoading,
    activeMemberCount,
    monthlyRevenue,
    enroll:        enrollMutation.mutateAsync,
    updateEnrollment: updateMutation.mutateAsync,
    cancelEnrollment: cancelMutation.mutateAsync,
    isEnrolling:   enrollMutation.isPending,
  }
}
