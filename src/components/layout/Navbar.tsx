import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Search, LogOut, User, ChevronDown, PanelLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { ThemeToggleIcon } from '@/components/common/ThemeToggle'
import { Avatar, Badge, Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

interface NavbarProps {
  title?: string
}

export function Navbar({ title }: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const user = useAuthStore(s => s.user)
  const { toggleSidebar, collapseSidebar, sidebarCollapsed } = useUIStore()
  const { signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  async function handleSignOut() {
    setUserMenuOpen(false)
    await signOut()
    toast.success('Signed out successfully')
    navigate(ROUTES.LOGIN)
  }

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-4 lg:px-6 gap-3 bg-white/90 dark:bg-ink-950/90 backdrop-blur-xl border-b border-ink-100 dark:border-ink-800">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => collapseSidebar(!sidebarCollapsed)}
        className="hidden md:flex p-2 rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
      >
        <PanelLeft size={18} />
      </button>

      {title && (
        <h1 className="font-display font-semibold text-ink-900 dark:text-white hidden sm:block">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm ml-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder-ink-400 border-0 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggleIcon />

        {/* Notifications bell */}
        <button
          onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          className="relative p-2 rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-ink-950">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className={cn(
              'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all',
              userMenuOpen
                ? 'bg-ink-100 dark:bg-ink-800'
                : 'hover:bg-ink-100 dark:hover:bg-ink-800'
            )}
          >
            <Avatar name={user?.displayName || 'User'} src={user?.photoURL} size="xs" />
            <span className="text-sm font-medium text-ink-700 dark:text-ink-300 hidden sm:block max-w-[120px] truncate">
              {user?.displayName || 'User'}
            </span>
            <ChevronDown size={14} className={cn('text-ink-400 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 card p-1 shadow-lg z-50"
                >
                  <div className="px-3 py-2 mb-1 border-b border-ink-100 dark:border-ink-800">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{user?.displayName}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{user?.email}</p>
                    <Badge variant="brand" size="sm" className="mt-1">{user?.plan}</Badge>
                  </div>
                  <button
                    onClick={() => { navigate(ROUTES.SETTINGS); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                  >
                    <User size={16} /> Profile & Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
