import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp()

// Export all function groups
export * from './stripe/webhooks'
export * from './ai/chat'
export * from './invoices/generate'
export * from './notifications/triggers'

// Voice Agent System
// NOTE: realtimeBridge.ts is NOT exported here — deploy it to Cloud Run separately
export * from './voice/webhooks'
export * from './voice/outbound'
export * from './voice/provisioning'

// Email (Brevo)
export * from './email/brevo'

// Auto-Rebooking Scheduler (runs daily at 08:00 UTC)
export * from './autoRebook/scheduler'
