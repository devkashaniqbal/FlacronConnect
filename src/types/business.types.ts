import type { Plan } from './auth.types'
import type { IndustryType, IndustryFeatureFlags } from './industry.types'

export interface Business {
  id?:               string
  name:              string
  category:          string
  industryType?:     IndustryType
  industryFeatures?: IndustryFeatureFlags
  address?:     string
  city?:        string
  state?:       string
  country?:     string
  phone?:       string
  email?:       string
  logo?:        string | null
  website?:     string | null
  description?: string
  plan?:        Plan
  ownerId?:     string
  createdAt?:   unknown
  updatedAt?:   unknown
}

export interface Service {
  id?:          string
  businessId?:  string
  name:         string
  duration:     number
  price:        number
  category:     string
  description?: string
  active:       boolean
  createdAt?:   unknown
}

export interface BusinessHours {
  id?:       string
  day:       string   // Monday–Sunday
  openTime:  string   // HH:mm
  closeTime: string   // HH:mm
  isClosed:  boolean
}

export const BUSINESS_CATEGORIES = [
  'Salon & Beauty', 'Barbershop', 'Spa & Wellness', 'Fitness & Gym',
  'Medical & Dental', 'Veterinary', 'Legal', 'Consulting', 'Cleaning',
  'Repair & Maintenance', 'Photography', 'Tutoring & Education', 'Restaurant',
  'Retail', 'Other',
]
