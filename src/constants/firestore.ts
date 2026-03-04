export const COLLECTIONS = {
  BUSINESSES:    'businesses',
  USERS:         'users',
  SUBSCRIPTIONS: 'subscriptions',
} as const

export const SUB_COLLECTIONS = {
  // Core
  SERVICES:         'services',
  BUSINESS_HOURS:   'businessHours',
  BOOKINGS:         'bookings',
  EMPLOYEES:        'employees',
  ATTENDANCE:       'attendance',
  PAYROLL:          'payroll',
  INVOICES:         'invoices',
  CONVERSATIONS:    'conversations',
  VOICE_AGENTS:     'voiceAgents',
  VOICE_CALLS:      'voiceCalls',
  CATEGORIES:       'categories',
  // Industry-specific
  JOB_ASSIGNMENTS:  'jobAssignments',   // booking ↔ employee junction
  PROJECTS:         'projects',          // Construction, Consulting
  EQUIPMENT:        'equipment',         // Construction, Home Services
  TABLES:           'tables',            // Restaurant
  WAITLIST:         'waitlist',          // Restaurant, Gym
  CLASSES:          'classes',           // Gym
  MEMBERSHIPS:      'memberships',       // Gym, Beauty Spa
  LOYALTY:          'loyaltyAccounts',   // Hair Salon, Beauty Spa, Gym
  MILEAGE_LOGS:     'mileageLogs',       // Transportation
  VEHICLES:         'vehicles',          // Transportation
  LEADS:            'leads',             // Real Estate
  TIME_ENTRIES:     'timeEntries',       // Consulting
  RETAINERS:        'retainers',         // Consulting
  INTAKE_FORMS:     'intakeForms',       // Medical
  CLIENT_PHOTOS:    'clientPhotos',      // Hair Salon, Event Planning
  EVENT_TIMELINES:  'eventTimelines',    // Event Planning
  PACKAGES:         'packages',          // Gym, Beauty Spa, Event Planning
  MILESTONES:       'milestones',        // Construction, Consulting — project milestones
} as const
