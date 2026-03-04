import type { Plan } from './auth.types'

export type InvoiceStatus     = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'quote'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing'

export interface Invoice {
  id?:           string
  businessId:    string
  bookingId?:    string | null
  customerName:  string
  customerEmail?: string
  subtotal:      number
  tax:           number
  total:         number
  status:        InvoiceStatus
  pdfUrl?:       string | null
  dueDate:       string
  createdAt?:    unknown
  items:         InvoiceItem[]
  notes?:        string
}

export interface InvoiceItem {
  description: string
  quantity:    number
  unitPrice:   number
}

export interface Subscription {
  id:                   string
  businessId:           string
  stripeSubscriptionId: string
  plan:                 Plan
  status:               SubscriptionStatus
  currentPeriodEnd:     Date
  cancelAtPeriodEnd:    boolean
}

export interface PlanDetails {
  id:                    Plan
  name:                  string
  price:                 number
  priceAnnual:           number
  description:           string
  features:              string[]
  highlighted:           boolean
  stripePriceId:         string
  stripePriceIdAnnual:   string
}
