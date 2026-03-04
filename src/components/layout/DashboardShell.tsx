import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileSidebar } from './MobileSidebar'
import { ChatWidget } from '@/features/ai-chat/ChatWidget'
import { ActiveCallHUD } from '@/components/voice/ActiveCallHUD'

interface DashboardShellProps {
  children: React.ReactNode
  title?: string
}

export function DashboardShell({ children, title }: DashboardShellProps) {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-ink-50 dark:bg-ink-950 overflow-hidden">
      <Sidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-6 min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating AI Chat widget */}
      <ChatWidget />
      {/* Floating Active Call HUD */}
      <ActiveCallHUD />
    </div>
  )
}
