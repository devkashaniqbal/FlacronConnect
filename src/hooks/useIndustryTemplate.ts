// ─────────────────────────────────────────────────────────────────────────────
// useIndustryTemplate – hooks for reading industry-specific config
// ─────────────────────────────────────────────────────────────────────────────
import { useAuthStore } from '@/store/authStore'
import { INDUSTRY_TEMPLATES } from '@/constants/industryTemplates'
import type { IndustryFeatureFlags, IndustryTemplate } from '@/types/industry.types'

/** Returns the full IndustryTemplate for the current user, or null if not set. */
export function useIndustryTemplate(): IndustryTemplate | null {
  const industryType = useAuthStore(s => s.user?.industryType)
  if (!industryType) return null
  return INDUSTRY_TEMPLATES[industryType] ?? null
}

/**
 * Returns true/false for a single industry feature flag.
 * Falls back to false when no industry is configured (safe default).
 */
export function useIndustryFeature(flag: keyof IndustryFeatureFlags): boolean {
  const template = useIndustryTemplate()
  return template?.features[flag] ?? false
}

/**
 * Returns the ordered list of sidebar nav keys for the current industry.
 * Used by Sidebar.tsx to surface the most relevant modules first.
 * An empty array means "use default order".
 */
export function useNavOrder(): string[] {
  const template = useIndustryTemplate()
  return template?.navOrder ?? []
}
