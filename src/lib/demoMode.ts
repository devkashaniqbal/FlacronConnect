import type { AuthUser } from '@/types/auth.types'
import type { IndustryType } from '@/types/industry.types'

// Demo user injected when Firebase is not configured
export const DEMO_USER: AuthUser = {
  uid:              'demo-uid-001',
  email:            'demo@flacroncontrol.com',
  displayName:      'Alex Demo',
  photoURL:         null,
  emailVerified:    true,
  role:             'business_owner',
  businessId:       'demo-business-001',
  plan:             'enterprise',
  industryType:     'hair_salon',   // default demo industry
  stripeCustomerId: null,
  createdAt:        new Date(),
}

// 12 pre-built demo accounts — one per industry, all on enterprise plan
export interface DemoAccount {
  email:        string
  password:     string
  displayName:  string
  industryType: IndustryType
  businessName: string
  emoji:        string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'salon@demo.test',        password: 'demo1234', displayName: 'Jordan Styles',   industryType: 'hair_salon',     businessName: 'Luxe Salon',         emoji: '✂️' },
  { email: 'spa@demo.test',          password: 'demo1234', displayName: 'Morgan Glow',     industryType: 'beauty_spa',     businessName: 'Aura Spa',           emoji: '💆' },
  { email: 'construction@demo.test', password: 'demo1234', displayName: 'Remy Builds',     industryType: 'construction',   businessName: 'Apex Construction',  emoji: '🏗️' },
  { email: 'cleaning@demo.test',     password: 'demo1234', displayName: 'Casey Clean',     industryType: 'cleaning',       businessName: 'SparkPro Cleaning',  emoji: '🧹' },
  { email: 'restaurant@demo.test',   password: 'demo1234', displayName: 'Alex Plate',      industryType: 'restaurant',     businessName: 'The Grove Kitchen',  emoji: '🍽️' },
  { email: 'transport@demo.test',    password: 'demo1234', displayName: 'Sam Routes',      industryType: 'transportation', businessName: 'SwiftRide Co.',      emoji: '🚐' },
  { email: 'gym@demo.test',          password: 'demo1234', displayName: 'Drew Gains',      industryType: 'gym_fitness',    businessName: 'IronCore Gym',       emoji: '🏋️' },
  { email: 'clinic@demo.test',       password: 'demo1234', displayName: 'Dr. Riley Care',  industryType: 'medical_clinic', businessName: 'ClearHealth Clinic', emoji: '🏥' },
  { email: 'realestate@demo.test',   password: 'demo1234', displayName: 'Taylor Keys',     industryType: 'real_estate',    businessName: 'Keystone Realty',    emoji: '🏠' },
  { email: 'consulting@demo.test',   password: 'demo1234', displayName: 'Quinn Advisors',  industryType: 'consulting',     businessName: 'Apex Consulting',    emoji: '💼' },
  { email: 'homeservices@demo.test', password: 'demo1234', displayName: 'Blake Fix-It',    industryType: 'home_services',  businessName: 'HomeFirst Services', emoji: '🔧' },
  { email: 'events@demo.test',       password: 'demo1234', displayName: 'Avery Events',    industryType: 'event_planning', businessName: 'Vivid Events Co.',   emoji: '🎉' },
]

export function getDemoAccountByEmail(email: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase())
}

export function isDemoMode(): boolean {
  const key = import.meta.env.VITE_FIREBASE_API_KEY
  return !key || key === 'demo-key' || key.startsWith('demo')
}
