import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { ThemeToggleIcon } from '@/components/common/ThemeToggle'
import { ROUTES } from '@/constants/routes'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-brand relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-mesh-dark opacity-30" />
        <div className="relative z-10">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-xl text-white">FlacronControl</span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
              The smarter way<br />to run your business
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Join 2,400+ businesses automating their operations with AI-powered tools.
            </p>

            {/* Feature list */}
            {[
              '🤖 AI Chat handles 80% of customer queries',
              '📅 Smart booking with automated reminders',
              '💰 Stripe payments with instant invoicing',
              '👥 Full employee management & payroll',
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 mb-3 text-white/90 text-sm"
              >
                {item}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          © {new Date().getFullYear()} FlacronControl
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-ink-900 dark:text-white">FlacronControl</span>
          </Link>
          <ThemeToggleIcon />
        </div>

        <div className="absolute top-6 right-6 hidden lg:block">
          <ThemeToggleIcon />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white mb-2">{title}</h1>
              <p className="text-ink-500 dark:text-ink-400">{subtitle}</p>
            </div>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
