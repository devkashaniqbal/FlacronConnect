// ─────────────────────────────────────────────────────────────────────────────
// Industry Template System – Type Definitions
// All 12 supported industry verticals and their associated metadata
// ─────────────────────────────────────────────────────────────────────────────

export const INDUSTRY_KEYS = [
  'hair_salon',
  'beauty_spa',
  'construction',
  'cleaning',
  'restaurant',
  'transportation',
  'gym_fitness',
  'medical_clinic',
  'real_estate',
  'consulting',
  'home_services',
  'event_planning',
] as const

export type IndustryType = (typeof INDUSTRY_KEYS)[number]

// ─── Feature Flags ────────────────────────────────────────────────────────────
// Each flag maps to a UI module or workflow that can be toggled per industry.
// Plan-level flags (aiChat, payroll, etc.) live in PlanFeatures (plans.ts).
// These are industry-specific *on top of* plan access.
export interface IndustryFeatureFlags {
  // Salon / Barbershop
  commissions:        boolean   // Stylist commission tracking
  tipsTracking:       boolean   // Tips per appointment
  loyaltySystem:      boolean   // Points / loyalty rewards
  beforeAfterPhotos:  boolean   // Before & after gallery per client

  // Spa / Nail Salon
  membershipPlans:    boolean   // Recurring membership billing
  servicePackages:    boolean   // Bundled service packages
  addOnUpsells:       boolean   // Upsell extras during checkout
  recurringAppointments: boolean

  // Construction
  projectManagement:  boolean   // Project-based bookings
  crewAssignment:     boolean   // Assign crew to job sites
  jobsiteAttendance:  boolean   // On-site clock-in/out
  milestoneInvoicing: boolean   // Invoice per project milestone
  equipmentTracking:  boolean   // Equipment / asset registry

  // Cleaning
  routePlanning:      boolean   // Optimised stop routing
  autoRebooking:      boolean   // Auto recurring re-book
  clientNotes:        boolean   // Per-client notes field

  // Restaurant / Café
  tableReservations:  boolean   // Table management
  waitlistManagement: boolean   // Digital waitlist
  peakHourAnalytics:  boolean   // Busy-period reporting

  // Transportation
  mileageTracking:    boolean   // Trip mileage log
  vehicleManagement:  boolean   // Vehicle / fleet registry
  driverAssignment:   boolean   // Assign driver to trip

  // Gym / Fitness
  classBooking:       boolean   // Group class scheduling
  trainerAssignment:  boolean   // Assign trainer to client
  packageTracking:    boolean   // Session bundle tracking

  // Medical / Dental
  patientRecords:     boolean   // Visit history per patient
  intakeForms:        boolean   // Digital intake / consent forms
  appointmentReminders: boolean // Automated reminder messages

  // Real Estate
  leadTracking:       boolean   // CRM-style lead pipeline
  agentAssignment:    boolean   // Assign agent to showing

  // Consulting / Agency
  retainerBilling:    boolean   // Recurring retainer invoices
  timeTracking:       boolean   // Billable hours logging
  projectTracking:    boolean   // Project milestones / tasks

  // Home Services
  quoteToInvoice:     boolean   // Convert on-site quote to invoice
  technicianAssignment: boolean // Assign tech to job request

  // Event Planning / Photography
  depositManagement:  boolean   // Collect / track deposits
  packageTiers:       boolean   // Bronze / Silver / Gold packages
  timelineTracking:   boolean   // Event timeline management
  eventBooking:       boolean   // Multi-session event blocks
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
export interface SeedService {
  name:        string
  duration:    number   // minutes
  price:       number
  category:    string
  description: string
}

// ─── Template ─────────────────────────────────────────────────────────────────
export interface IndustryTemplate {
  key:              IndustryType
  label:            string
  description:      string
  emoji:            string
  /** Tailwind gradient CSS string applied to the card accent */
  gradientClass:    string
  /** Maps to the existing BUSINESS_CATEGORIES constant */
  businessCategory: string
  features:         IndustryFeatureFlags
  seedServices:     SeedService[]
  /** Navigation item keys ordered by relevance for this industry.
   *  Keys map to NavItem.key in Sidebar.tsx. */
  navOrder:         string[]
}
