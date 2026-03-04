import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, LayoutDashboard, Calendar, MessageSquare, Users,
  Clock, DollarSign, CreditCard, FileText, Bell, Settings,
  Building2, ChevronLeft, Shield, BarChart3, PhoneCall,
  Percent, Star, FolderKanban, Package2, UtensilsCrossed,
  Dumbbell, Navigation, Car, Target, Timer, RefreshCw, ClipboardList,
  BadgeCheck, ShoppingBag, Layers, ImagePlus, CalendarClock, Wallet, CalendarDays,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useIndustryTemplate } from '@/hooks/useIndustryTemplate'
import type { IndustryFeatureFlags } from '@/types/industry.types'
import { cn } from '@/utils/cn'
import { Tooltip } from '@/components/ui'
import { Avatar } from '@/components/ui'

// ── Nav item definition ────────────────────────────────────────────────────
interface NavItem {
  key:          string
  icon:         React.ElementType
  label:        string
  href:         string
  /** Show only when at least one of these industry feature flags is enabled */
  featureFlags?: readonly (keyof IndustryFeatureFlags)[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  // ── Core (always visible) ────────────────────────────────────────────────
  { key: 'dashboard',      icon: LayoutDashboard, label: 'Dashboard',     href: ROUTES.DASHBOARD },
  { key: 'business',       icon: Building2,       label: 'Business',      href: ROUTES.BUSINESS_SETUP },
  { key: 'bookings',       icon: Calendar,        label: 'Bookings',      href: ROUTES.BOOKING },
  { key: 'ai_chat',        icon: MessageSquare,   label: 'AI Chat',       href: ROUTES.AI_CHAT },
  { key: 'voice_agent',    icon: PhoneCall,       label: 'Voice Agent',   href: ROUTES.VOICE_AGENT },
  { key: 'employees',      icon: Users,           label: 'Employees',     href: ROUTES.EMPLOYEES },
  { key: 'attendance',     icon: Clock,           label: 'Attendance',    href: ROUTES.ATTENDANCE },
  { key: 'payroll',        icon: DollarSign,      label: 'Payroll',       href: ROUTES.PAYROLL },
  { key: 'payments',       icon: CreditCard,      label: 'Payments',      href: ROUTES.PAYMENTS },
  { key: 'invoices',       icon: FileText,        label: 'Invoices',      href: ROUTES.INVOICES },
  { key: 'analytics',      icon: BarChart3,       label: 'Analytics',     href: '#analytics' },
  { key: 'notifications',  icon: Bell,            label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  { key: 'settings',       icon: Settings,        label: 'Settings',      href: ROUTES.SETTINGS },

  // ── Industry-specific (gated by feature flags) ───────────────────────────
  { key: 'commissions',    icon: Percent,         label: 'Commissions',   href: ROUTES.COMMISSIONS,     featureFlags: ['commissions'] },
  { key: 'loyalty',        icon: Star,            label: 'Loyalty',       href: ROUTES.LOYALTY,         featureFlags: ['loyaltySystem'] },
  { key: 'projects',       icon: FolderKanban,    label: 'Projects',      href: ROUTES.PROJECTS,        featureFlags: ['projectManagement', 'projectTracking'] },
  { key: 'equipment',      icon: Package2,        label: 'Equipment',     href: ROUTES.EQUIPMENT,       featureFlags: ['equipmentTracking'] },
  { key: 'tables',         icon: UtensilsCrossed, label: 'Tables',        href: ROUTES.TABLES,          featureFlags: ['tableReservations'] },
  { key: 'classes',        icon: Dumbbell,        label: 'Classes',       href: ROUTES.CLASSES,         featureFlags: ['classBooking'] },
  { key: 'mileage',        icon: Navigation,      label: 'Mileage',       href: ROUTES.MILEAGE,         featureFlags: ['mileageTracking'] },
  { key: 'vehicles',       icon: Car,             label: 'Vehicles',      href: ROUTES.VEHICLES,        featureFlags: ['vehicleManagement'] },
  { key: 'leads',          icon: Target,          label: 'Leads',         href: ROUTES.LEADS,           featureFlags: ['leadTracking'] },
  { key: 'time_tracking',  icon: Timer,           label: 'Time Tracking', href: ROUTES.TIME_TRACKING,   featureFlags: ['timeTracking'] },
  { key: 'retainers',      icon: RefreshCw,       label: 'Retainers',     href: ROUTES.RETAINERS,       featureFlags: ['retainerBilling'] },
  { key: 'patient_records',icon: ClipboardList,   label: 'Patients',      href: ROUTES.PATIENT_RECORDS, featureFlags: ['patientRecords', 'intakeForms'] },
  { key: 'intake_forms',   icon: FileText,        label: 'Intake Forms',  href: ROUTES.INTAKE_FORMS,    featureFlags: ['intakeForms'] },
  { key: 'memberships',    icon: BadgeCheck,      label: 'Memberships',   href: ROUTES.MEMBERSHIPS,     featureFlags: ['membershipPlans'] },
  { key: 'packages',       icon: ShoppingBag,     label: 'Packages',      href: ROUTES.PACKAGES,        featureFlags: ['servicePackages', 'packageTracking'] },
  { key: 'package_tiers',  icon: Layers,          label: 'Pkg Tiers',     href: ROUTES.PACKAGE_TIERS,   featureFlags: ['packageTiers'] },
  { key: 'client_photos',  icon: ImagePlus,       label: 'Client Photos', href: ROUTES.CLIENT_PHOTOS,   featureFlags: ['beforeAfterPhotos'] },
  { key: 'event_timelines',icon: CalendarClock,   label: 'Timelines',     href: ROUTES.EVENT_TIMELINES, featureFlags: ['timelineTracking'] },
  { key: 'deposits',       icon: Wallet,          label: 'Deposits',      href: ROUTES.DEPOSITS,        featureFlags: ['depositManagement'] },
  { key: 'event_bookings', icon: CalendarDays,    label: 'Event Blocks',  href: ROUTES.EVENT_BOOKINGS,  featureFlags: ['eventBooking'] },
  { key: 'reminders',      icon: Bell,            label: 'Reminders',     href: ROUTES.REMINDERS,       featureFlags: ['appointmentReminders'] },
  { key: 'route_planning', icon: Navigation,      label: 'Route Plan',    href: ROUTES.ROUTE_PLANNING,  featureFlags: ['routePlanning'] },
  { key: 'auto_rebooking', icon: RefreshCw,       label: 'Auto-Rebook',   href: ROUTES.AUTO_REBOOKING,  featureFlags: ['autoRebooking'] },
]

// Keys that are always anchored regardless of industry order
const ANCHORED_FIRST = new Set(['dashboard'])
const ANCHORED_LAST  = new Set(['settings'])

/** Reorders nav items: dashboard → industry-priority items → rest → settings */
function buildOrderedNav(navOrder: string[], items: NavItem[]): NavItem[] {
  if (!navOrder.length) return items

  const prioritySet = new Set(navOrder)
  const first    = items.filter(i => ANCHORED_FIRST.has(i.key))
  const priority = items.filter(
    i => prioritySet.has(i.key) && !ANCHORED_FIRST.has(i.key) && !ANCHORED_LAST.has(i.key),
  )
  // Preserve template order inside the priority group
  priority.sort((a, b) => navOrder.indexOf(a.key) - navOrder.indexOf(b.key))
  const rest = items.filter(
    i => !prioritySet.has(i.key) && !ANCHORED_FIRST.has(i.key) && !ANCHORED_LAST.has(i.key),
  )
  const last  = items.filter(i => ANCHORED_LAST.has(i.key))

  return [...first, ...priority, ...rest, ...last]
}

// ── Component ──────────────────────────────────────────────────────────────
export function Sidebar() {
  const location                        = useLocation()
  const { sidebarCollapsed, collapseSidebar } = useUIStore()
  const user                            = useAuthStore(s => s.user)
  const isSuperAdmin                    = user?.role === 'super_admin'
  const template                        = useIndustryTemplate()
  const navOrder                        = template?.navOrder ?? []
  const features                        = template?.features

  const navItems = useMemo(() => {
    // Filter out industry-gated items whose flags are all disabled
    const eligible = ALL_NAV_ITEMS.filter(item => {
      if (!item.featureFlags || item.featureFlags.length === 0) return true
      return item.featureFlags.some(flag => features?.[flag] === true)
    })
    return buildOrderedNav(navOrder, eligible)
  }, [navOrder, features])

  function renderLink(item: NavItem) {
    const isActive = location.pathname === item.href
    const Icon     = item.icon
    const linkEl   = (
      <Link
        to={item.href}
        className={cn(
          'sidebar-item',
          isActive && 'sidebar-item-active',
          sidebarCollapsed && 'justify-center px-2',
        )}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )
    return sidebarCollapsed
      ? <Tooltip key={item.href} content={item.label} side="right">{linkEl}</Tooltip>
      : <div key={item.href}>{linkEl}</div>
  }

  return (
    <motion.aside
      layout
      className={cn(
        'hidden md:flex flex-col bg-white dark:bg-ink-950 border-r border-ink-100 dark:border-ink-800/60 h-screen sticky top-0 transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-ink-100 dark:border-ink-800">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              key="logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-white" fill="white" />
              </div>
              <span className="font-display font-bold text-ink-900 dark:text-white whitespace-nowrap text-sm">
                FlacronControl
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center mx-auto">
            <Zap size={14} className="text-white" fill="white" />
          </div>
        )}
        <button
          onClick={() => collapseSidebar(!sidebarCollapsed)}
          className={cn(
            'p-1 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-all',
            sidebarCollapsed && 'hidden',
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => renderLink(item))}

        {isSuperAdmin && (
          <>
            <div className={cn('px-3 pt-4 pb-1', sidebarCollapsed && 'hidden')}>
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Admin</span>
            </div>
            {renderLink({ key: 'super_admin', icon: Shield, label: 'Super Admin', href: ROUTES.ADMIN_BUSINESSES })}
          </>
        )}
      </nav>

      {/* User */}
      <div className={cn(
        'p-3 border-t border-ink-100 dark:border-ink-800',
        sidebarCollapsed && 'flex justify-center',
      )}>
        {sidebarCollapsed ? (
          <Tooltip content={user?.displayName || 'User'} side="right">
            <Avatar name={user?.displayName || 'U'} src={user?.photoURL} size="sm" />
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            <Avatar name={user?.displayName || 'U'} src={user?.photoURL} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900 dark:text-white truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400 capitalize truncate">{user?.plan}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
