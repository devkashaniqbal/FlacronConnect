import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, MessageSquare, Users,
  Clock, DollarSign, CreditCard, FileText, Bell, Settings,
  Building2, X, Zap,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: ROUTES.DASHBOARD },
  { icon: Building2,       label: 'Business',     href: ROUTES.BUSINESS_SETUP },
  { icon: Calendar,        label: 'Bookings',     href: ROUTES.BOOKING },
  { icon: MessageSquare,   label: 'AI Chat',      href: ROUTES.AI_CHAT },
  { icon: Users,           label: 'Employees',    href: ROUTES.EMPLOYEES },
  { icon: Clock,           label: 'Attendance',   href: ROUTES.ATTENDANCE },
  { icon: DollarSign,      label: 'Payroll',      href: ROUTES.PAYROLL },
  { icon: CreditCard,      label: 'Payments',     href: ROUTES.PAYMENTS },
  { icon: FileText,        label: 'Invoices',     href: ROUTES.INVOICES },
  { icon: Bell,            label: 'Notifications',href: ROUTES.NOTIFICATIONS },
  { icon: Settings,        label: 'Settings',     href: ROUTES.SETTINGS },
]

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const location = useLocation()

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-72 bg-white dark:bg-ink-900 h-full flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <Zap size={16} className="text-white" fill="white" />
                </div>
                <span className="font-display font-bold text-ink-900 dark:text-white">FlacronControl</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(item => {
                const isActive = location.pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn('sidebar-item', isActive && 'sidebar-item-active')}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
