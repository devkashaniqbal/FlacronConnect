export type EmployeeRole = 'manager' | 'employee' | 'part_time'

export interface Employee {
  id:              string
  businessId:      string
  userId:          string | null
  name:            string
  email:           string
  phone:           string
  role:            EmployeeRole
  hourlyRate:      number
  activeStatus:    boolean
  avatar:          string | null
  hireDate:        string
  // ── Industry extension fields ──────────────────────────────────────────
  commissionRate?: number   // % — Hair Salon, Real Estate
  specialization?: string   // Gym trainers, Medical staff
  vehicleId?:      string   // Transportation — assigned vehicle
  licenseNumber?:  string   // Transportation drivers
  createdAt?:      unknown
}

export interface AttendanceRecord {
  id:            string
  businessId:    string
  employeeId:    string
  employeeName:  string
  clockIn:       unknown   // Firestore Timestamp or Date
  clockOut:      unknown   // Firestore Timestamp or null
  hours:         number | null
  date:          string    // YYYY-MM-DD
  notes?:        string
  // ── Industry extension fields ──────────────────────────────────────────
  jobsiteId?:    string   // Construction / Home Services
  jobsiteName?:  string
  bookingId?:    string   // link to the job/booking
}

export interface PayrollSummary {
  id:           string
  employeeId:   string
  employeeName: string
  periodStart:  string
  periodEnd:    string
  hoursWorked:  number
  hourlyRate:   number
  grossPay:     number
  deductions:   number
  netPay:       number
  status:       'pending' | 'paid'
}
