export type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'employee' | 'customer'
export type Plan = 'starter' | 'growth' | 'pro' | 'enterprise'

import type { IndustryType } from './industry.types'
export type { IndustryType }   // re-export for consumers of auth.types

export interface AuthUser {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  role: UserRole
  businessId: string | null
  plan: Plan
  industryType: IndustryType | null
  stripeCustomerId: string | null
  createdAt: Date
  localization?: {
    language:   string
    currency:   string
    dateFormat: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupStep1 {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface SignupStep2 {
  businessName: string
  phone: string
}

export interface SignupStepIndustry {
  industryType: IndustryType
}

export interface SignupStep3 {
  address: string
  city: string
  state: string
  country: string
}

export interface SignupStep4 {
  plan: Plan
}

export interface SignupStep5 {
  acceptTerms: boolean
  acceptMarketing: boolean
}

export type SignupData = SignupStep1 & SignupStep2 & SignupStepIndustry & SignupStep3 & SignupStep4 & SignupStep5
