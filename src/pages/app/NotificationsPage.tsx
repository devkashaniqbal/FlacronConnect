import { motion } from 'framer-motion'
import { Bell, Calendar, DollarSign, Users, MessageSquare, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Button, Badge, Spinner } from '@/components/ui'
import { formatRelative } from '@/utils/formatters'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'

const typeIcons: Record<string, typeof Bell> = {
  booking:  Calendar,
  payment:  DollarSign,
  employee: Users,
  chat:     MessageSquare,
  system:   Bell,
}

const typeColors: Record<string, string> = {
  booking:  'bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400',
  payment:  'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
  employee: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  chat:     'bg-accent-100 dark:bg-accent-950 text-accent-600 dark:text-accent-400',
  system:   'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400',
}

export function NotificationsPage() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead } = useNotifications()

  async function handleMarkAllRead() {
    await toast.promise(markAllRead(), { loading: '…', success: 'All marked as read', error: 'Failed' })
  }

  return (
    <DashboardShell title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && <Badge variant="brand">{unreadCount} new</Badge>}
          </h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No notifications yet.</p>
          <p className="text-sm text-ink-400 mt-1">Activity from bookings, payments, and employees will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = typeIcons[n.type] ?? Bell
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'card p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-all',
                  !n.read && 'ring-1 ring-brand-200 dark:ring-brand-800'
                )}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', typeColors[n.type] ?? typeColors.system)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm',
                      n.read ? 'font-medium text-ink-700 dark:text-ink-300' : 'font-semibold text-ink-900 dark:text-white'
                    )}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-ink-400">{formatRelative(n.createdAt)}</span>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                    </div>
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{n.message}</p>
                </div>
                {!n.read && (
                  <button
                    className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors flex-shrink-0"
                    onClick={e => { e.stopPropagation(); markRead(n.id) }}
                  >
                    <Check size={14} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
