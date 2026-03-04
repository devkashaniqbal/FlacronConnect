import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Preloader } from '@/components/common/Preloader'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useAuthInit } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'

// Pages — public
import { LandingPage }          from '@/pages/LandingPage'
import { LoginPage }             from '@/pages/auth/LoginPage'
import { SignupPage }            from '@/pages/auth/SignupPage'
import { ForgotPasswordPage }    from '@/pages/auth/ForgotPasswordPage'
import { NotFoundPage }          from '@/pages/404Page'

// Pages — app (core)
import { DashboardPage }         from '@/pages/app/DashboardPage'
import { BusinessSetupPage }     from '@/pages/app/BusinessSetupPage'
import { BookingPage }           from '@/pages/app/BookingPage'
import { AIChatPage }            from '@/pages/app/AIChatPage'
import { EmployeesPage }         from '@/pages/app/EmployeesPage'
import { AttendancePage }        from '@/pages/app/AttendancePage'
import { PayrollPage }           from '@/pages/app/PayrollPage'
import { PaymentsPage }          from '@/pages/app/PaymentsPage'
import { InvoicesPage }          from '@/pages/app/InvoicesPage'
import { VoiceAgentPage }        from '@/pages/app/VoiceAgentPage'
import { NotificationsPage }     from '@/pages/app/NotificationsPage'
import { SettingsPage }          from '@/pages/app/SettingsPage'

// Pages — industry-specific
import { CommissionsPage }       from '@/pages/app/CommissionsPage'
import { LoyaltyPage }           from '@/pages/app/LoyaltyPage'
import { ProjectsPage }          from '@/pages/app/ProjectsPage'
import { EquipmentPage }         from '@/pages/app/EquipmentPage'
import { TablesPage }            from '@/pages/app/TablesPage'
import { ClassesPage }           from '@/pages/app/ClassesPage'
import { MileagePage }           from '@/pages/app/MileagePage'
import { VehiclesPage }          from '@/pages/app/VehiclesPage'
import { LeadsPage }             from '@/pages/app/LeadsPage'
import { TimeTrackingPage }      from '@/pages/app/TimeTrackingPage'
import { RetainersPage }         from '@/pages/app/RetainersPage'
import { PatientRecordsPage }    from '@/pages/app/PatientRecordsPage'
import { MembershipsPage }       from '@/pages/app/MembershipsPage'
import { PackagesPage }          from '@/pages/app/PackagesPage'
import { PackageTiersPage }      from '@/pages/app/PackageTiersPage'
import { ClientPhotosPage }      from '@/pages/app/ClientPhotosPage'
import { EventTimelinePage }     from '@/pages/app/EventTimelinePage'
import { IntakeFormsPage }       from '@/pages/app/IntakeFormsPage'
import { DepositsPage }          from '@/pages/app/DepositsPage'
import { EventBookingsPage }     from '@/pages/app/EventBookingsPage'
import { RemindersPage }         from '@/pages/app/RemindersPage'
import { RoutePlanningPage }     from '@/pages/app/RoutePlanningPage'
import { AutoRebookingPage }     from '@/pages/app/AutoRebookingPage'

// Pages — admin
import { SuperAdminPage }        from '@/pages/admin/SuperAdminPage'

import { ROUTES } from '@/constants/routes'

function AppContent() {
  useAuthInit()
  const { theme } = useUIStore()

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.LANDING}         element={<LandingPage />} />
      <Route path={ROUTES.LOGIN}           element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP}          element={<SignupPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* Protected app routes */}
      <Route path="/app" element={<ProtectedRoute><Navigate to={ROUTES.DASHBOARD} replace /></ProtectedRoute>} />
      <Route path={ROUTES.DASHBOARD}       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path={ROUTES.BUSINESS_SETUP}  element={<ProtectedRoute><BusinessSetupPage /></ProtectedRoute>} />
      <Route path={ROUTES.BOOKING}         element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
      <Route path={ROUTES.AI_CHAT}         element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
      <Route path={ROUTES.EMPLOYEES}       element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path={ROUTES.ATTENDANCE}      element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path={ROUTES.PAYROLL}         element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
      <Route path={ROUTES.PAYMENTS}        element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path={ROUTES.INVOICES}        element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path={ROUTES.VOICE_AGENT}      element={<ProtectedRoute><VoiceAgentPage /></ProtectedRoute>} />
      <Route path={ROUTES.NOTIFICATIONS}   element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path={ROUTES.SETTINGS}        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Industry-specific routes */}
      <Route path={ROUTES.COMMISSIONS}     element={<ProtectedRoute><CommissionsPage /></ProtectedRoute>} />
      <Route path={ROUTES.LOYALTY}         element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
      <Route path={ROUTES.PROJECTS}        element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path={ROUTES.EQUIPMENT}       element={<ProtectedRoute><EquipmentPage /></ProtectedRoute>} />
      <Route path={ROUTES.TABLES}          element={<ProtectedRoute><TablesPage /></ProtectedRoute>} />
      <Route path={ROUTES.CLASSES}         element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
      <Route path={ROUTES.MILEAGE}         element={<ProtectedRoute><MileagePage /></ProtectedRoute>} />
      <Route path={ROUTES.VEHICLES}        element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
      <Route path={ROUTES.LEADS}           element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
      <Route path={ROUTES.TIME_TRACKING}   element={<ProtectedRoute><TimeTrackingPage /></ProtectedRoute>} />
      <Route path={ROUTES.RETAINERS}       element={<ProtectedRoute><RetainersPage /></ProtectedRoute>} />
      <Route path={ROUTES.PATIENT_RECORDS} element={<ProtectedRoute><PatientRecordsPage /></ProtectedRoute>} />
      <Route path={ROUTES.MEMBERSHIPS}     element={<ProtectedRoute><MembershipsPage /></ProtectedRoute>} />
      <Route path={ROUTES.PACKAGES}        element={<ProtectedRoute><PackagesPage /></ProtectedRoute>} />
      <Route path={ROUTES.PACKAGE_TIERS}   element={<ProtectedRoute><PackageTiersPage /></ProtectedRoute>} />
      <Route path={ROUTES.CLIENT_PHOTOS}   element={<ProtectedRoute><ClientPhotosPage /></ProtectedRoute>} />
      <Route path={ROUTES.EVENT_TIMELINES} element={<ProtectedRoute><EventTimelinePage /></ProtectedRoute>} />
      <Route path={ROUTES.INTAKE_FORMS}    element={<ProtectedRoute><IntakeFormsPage /></ProtectedRoute>} />
      <Route path={ROUTES.DEPOSITS}        element={<ProtectedRoute><DepositsPage /></ProtectedRoute>} />
      <Route path={ROUTES.EVENT_BOOKINGS}  element={<ProtectedRoute><EventBookingsPage /></ProtectedRoute>} />
      <Route path={ROUTES.REMINDERS}       element={<ProtectedRoute><RemindersPage /></ProtectedRoute>} />
      <Route path={ROUTES.ROUTE_PLANNING}  element={<ProtectedRoute><RoutePlanningPage /></ProtectedRoute>} />
      <Route path={ROUTES.AUTO_REBOOKING}  element={<ProtectedRoute><AutoRebookingPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin"                 element={<ProtectedRoute requiredRole="super_admin"><Navigate to={ROUTES.ADMIN_BUSINESSES} replace /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN_BUSINESSES} element={<ProtectedRoute><SuperAdminPage /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN_USERS}     element={<ProtectedRoute><SuperAdminPage /></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN_PLANS}     element={<ProtectedRoute><SuperAdminPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" />}
      </AnimatePresence>
      {!loading && <AppContent />}
    </BrowserRouter>
  )
}
