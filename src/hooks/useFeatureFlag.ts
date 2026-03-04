import { useAuthStore } from '@/store/authStore'
import { PLAN_FEATURES, type PlanFeatures } from '@/constants/plans'

export function useFeatureFlag(feature: keyof PlanFeatures): boolean | number {
  const plan = useAuthStore(s => s.user?.plan) ?? 'starter'
  return PLAN_FEATURES[plan]?.[feature] ?? false
}

export function useHasFeature(feature: keyof PlanFeatures): boolean {
  const value = useFeatureFlag(feature)
  if (typeof value === 'number') return value !== 0
  return Boolean(value)
}

export function useEmployeeLimit(): number {
  const plan = useAuthStore(s => s.user?.plan) ?? 'starter'
  return PLAN_FEATURES[plan]?.employees ?? 3
}
