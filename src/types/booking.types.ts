export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partial'
export type RecurrenceRule = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface BookingRecurrence {
  rule:             RecurrenceRule
  endDate?:         string   // YYYY-MM-DD — when to stop generating
  parentBookingId?: string   // set on all child bookings
}

export interface Booking {
  id?:              string
  businessId:       string
  serviceId?:       string
  serviceName:      string
  customerId?:      string
  customerName:     string
  customerEmail?:   string
  customerPhone?:   string
  date:             unknown   // string YYYY-MM-DD or Firestore Timestamp
  startTime:        string
  endTime?:         string
  status:           BookingStatus
  paymentStatus:    PaymentStatus
  amount?:          number
  notes?:           string
  // ── Industry extension fields ──────────────────────────────────────────
  tipAmount?:       number          // Hair Salon / Beauty Spa
  commissionRate?:  number          // % — Hair Salon / Real Estate
  commissionAmount?: number         // computed: amount * commissionRate / 100
  assignedEmployeeId?: string       // Construction / Cleaning / Home Services
  assignedEmployeeName?: string
  projectId?:       string          // Construction / Consulting
  tableId?:         string          // Restaurant
  tableNumber?:     number
  recurrence?:      BookingRecurrence
  isRecurring?:     boolean
  depositAmount?:   number          // Event Planning
  depositPaid?:     boolean
  balanceDue?:      number
  vehicleId?:       string          // Transportation
  startOdometer?:   number          // Transportation / mileage
  endOdometer?:     number
  distanceMiles?:   number
  classId?:         string          // Gym — class booking
  sessionPackageId?: string         // Gym — package tracking
  patientId?:       string          // Medical
  intakeFormId?:    string          // Medical
  leadId?:          string          // Real Estate
  quoteStatus?:     'quote' | 'invoice'  // Home Services — quote-to-invoice
  // ── Event block (multi-session) ───────────────────────────────────────
  eventId?:         string          // Groups multiple sessions under one event
  eventName?:       string          // e.g. "Johnson Wedding"
  eventSessionNumber?: number       // 1-of-N within the event
  eventTotalSessions?: number       // total sessions in this event block
  contractTotal?:   number          // full event contract value
  // ── Upsell / notes extensions ─────────────────────────────────────────
  clientNotes?:     string          // Private internal notes about the client
  addOns?:          { name: string; price: number }[]  // Beauty Spa upsells
  createdAt?:       unknown
  updatedAt?:       unknown
}

export interface CreateBookingData {
  serviceId?:           string
  serviceName:          string
  isRecurring?:         boolean
  customerId?:          string
  customerName:         string
  customerEmail?:       string
  customerPhone?:       string
  date:                 string
  startTime:            string
  endTime?:             string
  amount?:              number
  notes?:               string
  tipAmount?:           number
  commissionRate?:      number
  assignedEmployeeId?:  string
  assignedEmployeeName?: string
  projectId?:           string
  tableId?:             string
  tableNumber?:         number
  recurrence?:          BookingRecurrence
  depositAmount?:       number
  vehicleId?:           string
  classId?:             string
  sessionPackageId?:    string
  quoteStatus?:         'quote' | 'invoice'
  clientNotes?:         string
  addOns?:              { name: string; price: number }[]
  eventId?:             string
  eventName?:           string
  eventSessionNumber?:  number
  eventTotalSessions?:  number
  contractTotal?:       number
}

// ── Job Assignment junction ────────────────────────────────────────────────
export interface JobAssignment {
  id?:           string
  bookingId:     string
  employeeId:    string
  employeeName:  string
  role?:         string
  assignedAt?:   unknown
}
