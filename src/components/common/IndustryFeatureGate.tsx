// ─────────────────────────────────────────────────────────────────────────────
// IndustryFeatureGate
// Conditionally renders children based on whether the current business's
// industry template has a specific feature flag enabled.
//
// Usage:
//   <IndustryFeatureGate flag="commissions">
//     <CommissionSection />
//   </IndustryFeatureGate>
//
//   // With fallback:
//   <IndustryFeatureGate flag="classBooking" fallback={<GenericBooking />}>
//     <ClassBookingForm />
//   </IndustryFeatureGate>
// ─────────────────────────────────────────────────────────────────────────────
import type { ReactNode } from 'react'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'
import type { IndustryFeatureFlags } from '@/types/industry.types'

interface Props {
  flag:      keyof IndustryFeatureFlags
  children:  ReactNode
  fallback?: ReactNode
}

export function IndustryFeatureGate({ flag, children, fallback = null }: Props) {
  const enabled = useIndustryFeature(flag)
  return enabled ? <>{children}</> : <>{fallback}</>
}
