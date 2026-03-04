// ─────────────────────────────────────────────────────────────────────────────
// Industry Template Definitions  (12 verticals)
// ─────────────────────────────────────────────────────────────────────────────
import type { IndustryFeatureFlags, IndustryTemplate, IndustryType } from '@/types/industry.types'

// Helper: build a fully-defined IndustryFeatureFlags object from a partial
// override. Every omitted flag defaults to false — keeps the definitions DRY.
const flags = (overrides: Partial<IndustryFeatureFlags>): IndustryFeatureFlags => ({
  commissions:           false,
  tipsTracking:          false,
  loyaltySystem:         false,
  beforeAfterPhotos:     false,
  membershipPlans:       false,
  servicePackages:       false,
  addOnUpsells:          false,
  recurringAppointments: false,
  projectManagement:     false,
  crewAssignment:        false,
  jobsiteAttendance:     false,
  milestoneInvoicing:    false,
  equipmentTracking:     false,
  routePlanning:         false,
  autoRebooking:         false,
  clientNotes:           false,
  tableReservations:     false,
  waitlistManagement:    false,
  peakHourAnalytics:     false,
  mileageTracking:       false,
  vehicleManagement:     false,
  driverAssignment:      false,
  classBooking:          false,
  trainerAssignment:     false,
  packageTracking:       false,
  patientRecords:        false,
  intakeForms:           false,
  appointmentReminders:  false,
  leadTracking:          false,
  agentAssignment:       false,
  retainerBilling:       false,
  timeTracking:          false,
  projectTracking:       false,
  quoteToInvoice:        false,
  technicianAssignment:  false,
  depositManagement:     false,
  packageTiers:          false,
  timelineTracking:      false,
  eventBooking:          false,
  ...overrides,
})

// ─── 1. Hair Salon / Barbershop ───────────────────────────────────────────────
const hairSalon: IndustryTemplate = {
  key:              'hair_salon',
  label:            'Hair Salon / Barbershop',
  description:      'Appointment booking, stylists, commissions & tips.',
  emoji:            '✂️',
  gradientClass:    'from-pink-500 to-rose-500',
  businessCategory: 'Salon & Beauty',
  features: flags({
    commissions:           true,
    tipsTracking:          true,
    loyaltySystem:         true,
    beforeAfterPhotos:     true,
    recurringAppointments: true,
    appointmentReminders:  true,
  }),
  seedServices: [
    { name: "Women's Haircut",    duration: 60,  price: 65,  category: 'Hair',      description: 'Cut & style' },
    { name: "Men's Haircut",      duration: 30,  price: 35,  category: 'Hair',      description: 'Classic cut' },
    { name: 'Hair Coloring',      duration: 120, price: 120, category: 'Hair',      description: 'Full color treatment' },
    { name: 'Blowout & Style',    duration: 45,  price: 50,  category: 'Hair',      description: 'Wash, blowout and style' },
    { name: 'Beard Trim',         duration: 20,  price: 20,  category: 'Grooming',  description: 'Shape and trim' },
  ],
  navOrder: ['bookings', 'employees', 'payments', 'invoices', 'analytics'],
}

// ─── 2. Beauty Spa / Nail Salon ───────────────────────────────────────────────
const beautySpa: IndustryTemplate = {
  key:              'beauty_spa',
  label:            'Beauty Spa / Nail Salon',
  description:      'Memberships, packages, add-on upsells & recurring visits.',
  emoji:            '💅',
  gradientClass:    'from-purple-500 to-fuchsia-500',
  businessCategory: 'Spa & Wellness',
  features: flags({
    membershipPlans:       true,
    servicePackages:       true,
    addOnUpsells:          true,
    recurringAppointments: true,
    loyaltySystem:         true,
    appointmentReminders:  true,
    tipsTracking:          true,
  }),
  seedServices: [
    { name: 'Classic Manicure',   duration: 45,  price: 35,  category: 'Nails',    description: 'File, shape & polish' },
    { name: 'Gel Pedicure',       duration: 60,  price: 55,  category: 'Nails',    description: 'Gel polish pedicure' },
    { name: 'Full Body Massage',  duration: 60,  price: 90,  category: 'Massage',  description: 'Relaxing full body' },
    { name: 'Facial Treatment',   duration: 60,  price: 85,  category: 'Skincare', description: 'Deep cleanse & hydration' },
    { name: 'Eyebrow Threading',  duration: 15,  price: 18,  category: 'Spa',      description: 'Precision thread shaping' },
  ],
  navOrder: ['bookings', 'payments', 'employees', 'invoices', 'analytics'],
}

// ─── 3. Construction Company ──────────────────────────────────────────────────
const construction: IndustryTemplate = {
  key:              'construction',
  label:            'Construction Company',
  description:      'Project bookings, crew management & milestone invoicing.',
  emoji:            '🏗️',
  gradientClass:    'from-orange-500 to-amber-500',
  businessCategory: 'Repair & Maintenance',
  features: flags({
    projectManagement:  true,
    crewAssignment:     true,
    jobsiteAttendance:  true,
    milestoneInvoicing: true,
    equipmentTracking:  true,
    quoteToInvoice:     true,
    clientNotes:        true,
  }),
  seedServices: [
    { name: 'Site Assessment',    duration: 120, price: 150,  category: 'Other', description: 'Initial site evaluation' },
    { name: 'Foundation Work',    duration: 480, price: 2500, category: 'Other', description: 'Concrete foundation' },
    { name: 'Framing',            duration: 480, price: 3500, category: 'Other', description: 'Structural framing' },
    { name: 'Roofing',            duration: 480, price: 4000, category: 'Other', description: 'Full roof installation' },
    { name: 'Interior Finishing', duration: 480, price: 2000, category: 'Other', description: 'Drywall, paint & trim' },
  ],
  navOrder: ['bookings', 'employees', 'attendance', 'invoices', 'payroll', 'analytics'],
}

// ─── 4. Cleaning Company ──────────────────────────────────────────────────────
const cleaning: IndustryTemplate = {
  key:              'cleaning',
  label:            'Cleaning Company',
  description:      'Recurring schedules, route planning & auto re-booking.',
  emoji:            '🧹',
  gradientClass:    'from-cyan-500 to-teal-500',
  businessCategory: 'Cleaning',
  features: flags({
    routePlanning:         true,
    autoRebooking:         true,
    recurringAppointments: true,
    clientNotes:           true,
    crewAssignment:        true,
    jobsiteAttendance:     true,
  }),
  seedServices: [
    { name: 'Standard Clean',     duration: 120, price: 120, category: 'Other', description: 'Regular home cleaning' },
    { name: 'Deep Clean',         duration: 240, price: 220, category: 'Other', description: 'Thorough deep clean' },
    { name: 'Move-In/Out Clean',  duration: 300, price: 280, category: 'Other', description: 'Full property turnover' },
    { name: 'Office Cleaning',    duration: 120, price: 150, category: 'Other', description: 'Commercial office clean' },
    { name: 'Window Cleaning',    duration: 90,  price: 100, category: 'Other', description: 'Interior & exterior windows' },
  ],
  navOrder: ['bookings', 'employees', 'attendance', 'payments', 'invoices'],
}

// ─── 5. Restaurant / Café ─────────────────────────────────────────────────────
const restaurant: IndustryTemplate = {
  key:              'restaurant',
  label:            'Restaurant / Café',
  description:      'Table reservations, waitlist & shift scheduling.',
  emoji:            '🍽️',
  gradientClass:    'from-red-500 to-orange-500',
  businessCategory: 'Restaurant',
  features: flags({
    tableReservations:  true,
    waitlistManagement: true,
    peakHourAnalytics:  true,
    clientNotes:        true,
  }),
  seedServices: [
    { name: 'Table Reservation (2)', duration: 90,  price: 0,  category: 'Other', description: 'Standard table for 2' },
    { name: 'Table Reservation (4)', duration: 90,  price: 0,  category: 'Other', description: 'Table for 4 guests' },
    { name: 'Private Dining Room',   duration: 120, price: 50, category: 'Other', description: 'Exclusive private room' },
    { name: 'Catering Package',      duration: 240, price: 500, category: 'Other', description: 'Off-site catering event' },
  ],
  navOrder: ['bookings', 'employees', 'attendance', 'payroll', 'analytics'],
}

// ─── 6. Transportation / Chauffeur ────────────────────────────────────────────
const transportation: IndustryTemplate = {
  key:              'transportation',
  label:            'Transportation / Chauffeur',
  description:      'Trip scheduling, driver dispatch & mileage tracking.',
  emoji:            '🚗',
  gradientClass:    'from-blue-500 to-indigo-500',
  businessCategory: 'Other',
  features: flags({
    mileageTracking:   true,
    vehicleManagement: true,
    driverAssignment:  true,
    clientNotes:       true,
    quoteToInvoice:    true,
  }),
  seedServices: [
    { name: 'Airport Transfer',    duration: 60,  price: 85,  category: 'Other', description: 'One-way airport pickup/drop' },
    { name: 'City Tour',           duration: 180, price: 200, category: 'Other', description: '3-hour city exploration' },
    { name: 'Corporate Shuttle',   duration: 120, price: 150, category: 'Other', description: 'Business transport' },
    { name: 'Wedding Chauffeur',   duration: 480, price: 600, category: 'Other', description: 'Full-day wedding service' },
  ],
  navOrder: ['bookings', 'employees', 'payments', 'invoices', 'analytics'],
}

// ─── 7. Gym / Fitness Studio ──────────────────────────────────────────────────
const gymFitness: IndustryTemplate = {
  key:              'gym_fitness',
  label:            'Gym / Fitness Studio',
  description:      'Memberships, class booking & trainer assignment.',
  emoji:            '💪',
  gradientClass:    'from-green-500 to-emerald-500',
  businessCategory: 'Fitness & Gym',
  features: flags({
    membershipPlans:   true,
    classBooking:      true,
    trainerAssignment: true,
    packageTracking:   true,
    loyaltySystem:     true,
  }),
  seedServices: [
    { name: 'Personal Training (1hr)', duration: 60, price: 80,  category: 'Other', description: '1-on-1 training session' },
    { name: 'Group Yoga Class',        duration: 60, price: 20,  category: 'Other', description: 'All levels yoga' },
    { name: 'HIIT Class',              duration: 45, price: 18,  category: 'Other', description: 'High intensity interval training' },
    { name: 'Pilates Class',           duration: 50, price: 22,  category: 'Other', description: 'Mat pilates' },
    { name: 'Nutrition Consultation',  duration: 60, price: 90,  category: 'Other', description: 'Personalised diet plan' },
  ],
  navOrder: ['bookings', 'employees', 'payments', 'invoices', 'analytics'],
}

// ─── 8. Medical Clinic / Dental Office ───────────────────────────────────────
const medicalClinic: IndustryTemplate = {
  key:              'medical_clinic',
  label:            'Medical Clinic / Dental Office',
  description:      'Patient scheduling, intake forms & visit history.',
  emoji:            '🏥',
  gradientClass:    'from-sky-500 to-blue-500',
  businessCategory: 'Medical & Dental',
  features: flags({
    patientRecords:       true,
    intakeForms:          true,
    appointmentReminders: true,
    clientNotes:          true,
    recurringAppointments:true,
  }),
  seedServices: [
    { name: 'General Consultation', duration: 30,  price: 120, category: 'Other', description: 'Standard consult' },
    { name: 'Dental Cleaning',      duration: 60,  price: 150, category: 'Other', description: 'Scale & polish' },
    { name: 'X-Ray',                duration: 20,  price: 80,  category: 'Other', description: 'Diagnostic imaging' },
    { name: 'Follow-up Visit',      duration: 15,  price: 60,  category: 'Other', description: 'Post-treatment review' },
    { name: 'Emergency Appointment',duration: 30,  price: 200, category: 'Other', description: 'Urgent care slot' },
  ],
  navOrder: ['bookings', 'employees', 'invoices', 'payments', 'analytics'],
}

// ─── 9. Real Estate Agency ───────────────────────────────────────────────────
const realEstate: IndustryTemplate = {
  key:              'real_estate',
  label:            'Real Estate Agency',
  description:      'Property showings, lead tracking & commission management.',
  emoji:            '🏠',
  gradientClass:    'from-yellow-500 to-amber-500',
  businessCategory: 'Other',
  features: flags({
    leadTracking:       true,
    agentAssignment:    true,
    commissions:        true,
    clientNotes:        true,
    timeTracking:       true,
  }),
  seedServices: [
    { name: 'Property Showing',    duration: 60,  price: 0,    category: 'Other', description: 'Scheduled property tour' },
    { name: 'Open House',          duration: 120, price: 0,    category: 'Other', description: 'Public viewing session' },
    { name: 'Buyer Consultation',  duration: 60,  price: 0,    category: 'Other', description: 'Initial buyer meeting' },
    { name: 'Market Appraisal',    duration: 45,  price: 0,    category: 'Other', description: 'Property valuation' },
  ],
  navOrder: ['bookings', 'employees', 'invoices', 'payments', 'analytics'],
}

// ─── 10. Consulting / Agency ──────────────────────────────────────────────────
const consulting: IndustryTemplate = {
  key:              'consulting',
  label:            'Consulting / Agency',
  description:      'Client onboarding, retainer billing & time tracking.',
  emoji:            '💼',
  gradientClass:    'from-violet-500 to-purple-500',
  businessCategory: 'Consulting',
  features: flags({
    retainerBilling:  true,
    timeTracking:     true,
    projectTracking:  true,
    clientNotes:      true,
    packageTiers:     true,
    milestoneInvoicing: true,
  }),
  seedServices: [
    { name: 'Strategy Session',     duration: 60,  price: 200, category: 'Other', description: 'Initial discovery & planning' },
    { name: 'Monthly Retainer',     duration: 0,   price: 1500, category: 'Other', description: 'Ongoing monthly advisory' },
    { name: 'Project Sprint',       duration: 0,   price: 3000, category: 'Other', description: '2-week focused engagement' },
    { name: 'Workshop / Training',  duration: 240, price: 800, category: 'Other', description: 'Team workshop facilitation' },
  ],
  navOrder: ['bookings', 'invoices', 'payments', 'employees', 'analytics'],
}

// ─── 11. Home Services (Plumbing, HVAC, Electrical) ──────────────────────────
const homeServices: IndustryTemplate = {
  key:              'home_services',
  label:            'Home Services',
  description:      'Job requests, technician dispatch & quote-to-invoice.',
  emoji:            '🔧',
  gradientClass:    'from-slate-500 to-gray-600',
  businessCategory: 'Repair & Maintenance',
  features: flags({
    quoteToInvoice:      true,
    technicianAssignment:true,
    jobsiteAttendance:   true,
    clientNotes:         true,
    equipmentTracking:   true,
    mileageTracking:     true,
  }),
  seedServices: [
    { name: 'Emergency Call-Out',  duration: 60,  price: 150, category: 'Other', description: 'Urgent on-site response' },
    { name: 'Routine Inspection',  duration: 90,  price: 120, category: 'Other', description: 'Standard safety check' },
    { name: 'Installation',        duration: 180, price: 300, category: 'Other', description: 'New unit installation' },
    { name: 'Repair Service',      duration: 120, price: 200, category: 'Other', description: 'Fault diagnosis & fix' },
    { name: 'Maintenance Plan',    duration: 60,  price: 80,  category: 'Other', description: 'Scheduled preventive visit' },
  ],
  navOrder: ['bookings', 'employees', 'attendance', 'invoices', 'payments', 'analytics'],
}

// ─── 12. Event Planning / Photography ────────────────────────────────────────
const eventPlanning: IndustryTemplate = {
  key:              'event_planning',
  label:            'Event Planning / Photography',
  description:      'Event bookings, deposit management & package tiers.',
  emoji:            '📸',
  gradientClass:    'from-rose-500 to-pink-500',
  businessCategory: 'Photography',
  features: flags({
    depositManagement: true,
    packageTiers:      true,
    timelineTracking:  true,
    eventBooking:      true,
    clientNotes:       true,
    beforeAfterPhotos: true,
    retainerBilling:   true,
  }),
  seedServices: [
    { name: 'Wedding Photography', duration: 480, price: 2500, category: 'Photography', description: 'Full-day coverage + album' },
    { name: 'Portrait Session',    duration: 120, price: 350,  category: 'Photography', description: '2-hour portrait shoot' },
    { name: 'Event Coverage',      duration: 240, price: 800,  category: 'Photography', description: '4-hour event photography' },
    { name: 'Event Planning Consult', duration: 60, price: 150, category: 'Other',     description: 'Initial planning session' },
    { name: 'Day-Of Coordination', duration: 480, price: 1200, category: 'Other',      description: 'Full day event coordination' },
  ],
  navOrder: ['bookings', 'invoices', 'payments', 'employees', 'analytics'],
}

// ─── Master Map ───────────────────────────────────────────────────────────────
export const INDUSTRY_TEMPLATES: Record<IndustryType, IndustryTemplate> = {
  hair_salon:     hairSalon,
  beauty_spa:     beautySpa,
  construction:   construction,
  cleaning:       cleaning,
  restaurant:     restaurant,
  transportation: transportation,
  gym_fitness:    gymFitness,
  medical_clinic: medicalClinic,
  real_estate:    realEstate,
  consulting:     consulting,
  home_services:  homeServices,
  event_planning: eventPlanning,
}

export const INDUSTRY_TEMPLATE_LIST: IndustryTemplate[] = Object.values(INDUSTRY_TEMPLATES)
