// ─────────────────────────────────────────────────────────────────────────────
// Template Engine
// Called once at the end of registration to configure a business workspace
// based on the chosen industry template.
//
// Responsibilities:
//   1. Write industryType + industryFeatures to the business document.
//   2. Seed default services into businesses/{businessId}/services.
//   3. Return the applied template so the caller can update local state.
// ─────────────────────────────────────────────────────────────────────────────
import {
  collection, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isDemoMode } from '@/lib/demoMode'
import { COLLECTIONS, SUB_COLLECTIONS } from '@/constants/firestore'
import { INDUSTRY_TEMPLATES } from '@/constants/industryTemplates'
import type { IndustryType } from '@/types/industry.types'
import type { IndustryTemplate } from '@/types/industry.types'

/**
 * Applies an industry template to a newly-created business.
 *
 * @param businessId  Firestore document ID for the business (biz_{uid})
 * @param industryType  The selected industry key
 * @returns The resolved IndustryTemplate that was applied
 */
export async function applyIndustryTemplate(
  businessId: string,
  industryType: IndustryType,
): Promise<IndustryTemplate> {
  const template = INDUSTRY_TEMPLATES[industryType]

  // Demo mode — skip Firestore writes, just return the template
  if (isDemoMode()) return template

  const batch = writeBatch(db)

  // ── 1. Stamp business doc with industry metadata ──────────────────────────
  const bizRef = doc(db, COLLECTIONS.BUSINESSES, businessId)
  batch.update(bizRef, {
    industryType,
    industryFeatures: template.features,
    // Override the generic category with the template's mapped value
    category:   template.businessCategory,
    updatedAt:  serverTimestamp(),
  })

  // ── 2. Seed default services ──────────────────────────────────────────────
  const servicesRef = collection(
    db, COLLECTIONS.BUSINESSES, businessId, SUB_COLLECTIONS.SERVICES,
  )
  for (const svc of template.seedServices) {
    const newSvcRef = doc(servicesRef)           // auto-ID
    batch.set(newSvcRef, {
      ...svc,
      businessId,
      active:    true,
      createdAt: serverTimestamp(),
    })
  }

  // ── 3. Commit everything in a single round-trip ───────────────────────────
  await batch.commit()

  return template
}
