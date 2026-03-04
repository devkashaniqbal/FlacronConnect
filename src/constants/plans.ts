import type { Plan } from '@/types/auth.types'
import type { PlanDetails } from '@/types/payment.types'

export interface PlanFeatures {
  aiChat: boolean
  booking: boolean
  employees: number    // -1 = unlimited
  payroll: boolean
  analytics: boolean
  customBranding: boolean
  apiAccess: boolean
  prioritySupport: boolean
  voiceCalling: boolean
  voiceMinutes: number // -1 = unlimited; 0 = no access
  voiceAgents: number  // -1 = unlimited; 0 = no access
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  starter: {
    aiChat: true, booking: true, employees: 3,
    payroll: false, analytics: false, customBranding: false,
    apiAccess: false, prioritySupport: false,
    voiceCalling: true, voiceMinutes: 30, voiceAgents: 1,
  },
  growth: {
    aiChat: true, booking: true, employees: 15,
    payroll: true, analytics: false, customBranding: false,
    apiAccess: false, prioritySupport: false,
    voiceCalling: true, voiceMinutes: 100, voiceAgents: 3,
  },
  pro: {
    aiChat: true, booking: true, employees: 50,
    payroll: true, analytics: true, customBranding: true,
    apiAccess: false, prioritySupport: true,
    voiceCalling: true, voiceMinutes: 500, voiceAgents: 5,
  },
  enterprise: {
    aiChat: true, booking: true, employees: -1,
    payroll: true, analytics: true, customBranding: true,
    apiAccess: true, prioritySupport: true,
    voiceCalling: true, voiceMinutes: -1, voiceAgents: -1,
  },
}

export const PLANS: PlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceAnnual: 23,
    description: 'Perfect for solo professionals and small teams just getting started.',
    features: [
      'AI Chat Assistant',
      'Booking Calendar',
      'Up to 3 Employees',
      'Basic Invoicing',
      'Email Support',
    ],
    highlighted: false,
    stripePriceId: 'price_1T6dxkPhkIqfqdBvtKp3Vv3M',
    stripePriceIdAnnual: 'price_1T6e2NPhkIqfqdBvGrZkOH17',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    priceAnnual: 63,
    description: 'For growing businesses that need more power and automation.',
    features: [
      'Everything in Starter',
      'Up to 15 Employees',
      'Payroll Management',
      'Attendance Tracking',
      'SMS Notifications',
      'Priority Email Support',
    ],
    highlighted: true,
    stripePriceId: 'price_1T6dzFPhkIqfqdBvASNgUl5f',
    stripePriceIdAnnual: 'price_1T6e3NPhkIqfqdBvGeGbBrhH',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    priceAnnual: 119,
    description: 'Advanced analytics and customization for established businesses.',
    features: [
      'Everything in Growth',
      'Up to 50 Employees',
      'Advanced Analytics',
      'Custom Branding',
      'AI Voice Calling (500 min/mo)',
      'Up to 5 Voice Agents',
      'WatsonX AI Integration',
      'Phone & Chat Support',
    ],
    highlighted: false,
    stripePriceId: 'price_1T6e0LPhkIqfqdBvQasmKs01',
    stripePriceIdAnnual: 'price_1T6e4DPhkIqfqdBvWEAA7Q2i',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    priceAnnual: 319,
    description: 'Unlimited scale with dedicated support and API access.',
    features: [
      'Everything in Pro',
      'Unlimited Employees',
      'API Access',
      'Custom Integrations',
      'Unlimited Voice Calling',
      'Unlimited Voice Agents',
      'Dedicated Account Manager',
      '24/7 Priority Support',
      'SLA Guarantee',
    ],
    highlighted: false,
    stripePriceId: 'price_1T6e1HPhkIqfqdBvplh5ia3n',
    stripePriceIdAnnual: 'price_1T6e5HPhkIqfqdBv0j8J34O2',
  },
]
