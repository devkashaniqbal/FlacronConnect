import type { AuthUser } from '@/types/auth.types'

// Demo user injected when Firebase is not configured
export const DEMO_USER: AuthUser = {
  uid:              'demo-uid-001',
  email:            'demo@flacroncontrol.com',
  displayName:      'Alex Demo',
  photoURL:         null,
  emailVerified:    true,
  role:             'business_owner',
  businessId:       'demo-business-001',
  plan:             'pro',
  industryType:     'hair_salon',   // default demo industry
  stripeCustomerId: null,
  createdAt:        new Date(),
}

export function isDemoMode(): boolean {
  const key = import.meta.env.VITE_FIREBASE_API_KEY
  return !key || key === 'demo-key' || key.startsWith('demo')
}
