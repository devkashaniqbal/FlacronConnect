export const ROUTES = {
  LANDING:          '/',
  LOGIN:            '/login',
  SIGNUP:           '/signup',
  FORGOT_PASSWORD:  '/forgot-password',
  VERIFY_EMAIL:     '/verify-email',

  // ── Core ─────────────────────────────────────────────────────────────
  DASHBOARD:        '/app/dashboard',
  BUSINESS_SETUP:   '/app/business/setup',
  BOOKING:          '/app/booking',
  AI_CHAT:          '/app/ai-chat',
  EMPLOYEES:        '/app/employees',
  ATTENDANCE:       '/app/attendance',
  PAYROLL:          '/app/payroll',
  PAYMENTS:         '/app/payments',
  INVOICES:         '/app/invoices',
  VOICE_AGENT:      '/app/voice-agent',
  NOTIFICATIONS:    '/app/notifications',
  SETTINGS:         '/app/settings',

  // ── Industry-specific ─────────────────────────────────────────────────
  COMMISSIONS:      '/app/commissions',      // Hair Salon, Real Estate
  LOYALTY:          '/app/loyalty',           // Hair Salon, Beauty Spa, Gym
  PROJECTS:         '/app/projects',          // Construction, Consulting
  EQUIPMENT:        '/app/equipment',         // Construction, Home Services
  TABLES:           '/app/tables',            // Restaurant
  CLASSES:          '/app/classes',           // Gym
  MEMBERSHIPS:      '/app/memberships',       // Gym, Beauty Spa
  PACKAGES:         '/app/packages',          // Gym, Beauty Spa, Event Planning
  PACKAGE_TIERS:    '/app/package-tiers',     // Consulting, Event Planning
  CLIENT_PHOTOS:    '/app/client-photos',     // Hair Salon, Beauty Spa
  EVENT_TIMELINES:  '/app/event-timelines',   // Event Planning
  DEPOSITS:         '/app/deposits',           // Event Planning — deposit tracking
  EVENT_BOOKINGS:   '/app/event-bookings',     // Event Planning — multi-session event blocks
  REMINDERS:        '/app/reminders',          // Hair Salon, Beauty Spa, Medical — reminder rules + queue
  ROUTE_PLANNING:   '/app/route-planning',     // Cleaning, Home Services — daily stop sequencing
  AUTO_REBOOKING:   '/app/auto-rebooking',     // Cleaning, Home Services — recurring job scheduler
  MILEAGE:          '/app/mileage',           // Transportation
  VEHICLES:         '/app/vehicles',          // Transportation
  LEADS:            '/app/leads',             // Real Estate
  TIME_TRACKING:    '/app/time-tracking',     // Consulting
  RETAINERS:        '/app/retainers',         // Consulting
  PATIENT_RECORDS:  '/app/patient-records',   // Medical
  INTAKE_FORMS:     '/app/intake-forms',      // Medical

  ADMIN_BUSINESSES: '/admin/businesses',
  ADMIN_USERS:      '/admin/users',
  ADMIN_PLANS:      '/admin/plans',
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]
