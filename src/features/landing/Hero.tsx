import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Star, Users, Calendar, Brain } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

const stats = [
  { label: 'Businesses', value: '2,400+', icon: Users },
  { label: 'Bookings Made', value: '180K+', icon: Calendar },
  { label: 'AI Conversations', value: '950K+', icon: Brain },
]

const floatingCards = [
  { icon: '📅', title: 'Booking Confirmed', subtitle: 'Sarah — 2:30 PM today', color: 'from-brand-500 to-brand-700' },
  { icon: '🤖', title: 'AI Assistant',      subtitle: '3 conversations active', color: 'from-ink-800 to-ink-950' },
  { icon: '💰', title: 'Revenue',           subtitle: '+24% this month',        color: 'from-emerald-500 to-emerald-700' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-light dark:bg-mesh-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400/15 dark:bg-brand-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-400/15 dark:bg-accent-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-red-400/8 dark:bg-red-800/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left side */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            AI-Powered Business Automation
            <Star size={12} className="fill-brand-500 text-brand-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl lg:text-6xl font-bold text-ink-900 dark:text-white leading-[1.1] text-balance mb-6"
          >
            Run your business{' '}
            <span className="gradient-text">smarter</span>,{' '}
            not harder
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-ink-600 dark:text-ink-400 leading-relaxed mb-8 max-w-xl"
          >
            FlacronControl combines AI chat, booking management, employee payroll,
            and payment processing into one beautiful platform. Automate the repetitive,
            focus on what matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            <Link to={ROUTES.SIGNUP}>
              <Button size="lg" iconRight={<ArrowRight size={18} />}>
                Start free trial
              </Button>
            </Link>
            <Button size="lg" variant="secondary" icon={<Play size={16} className="fill-current" />}>
              Watch demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-8"
          >
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-ink-100 dark:bg-ink-800">
                  <s.icon size={16} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="font-bold text-ink-900 dark:text-white text-lg leading-none">{s.value}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right side — floating UI mockup */}
        <div className="relative lg:block hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            {/* Main dashboard card */}
            <div className="glass rounded-3xl p-6 shadow-glass-dark">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Today's Overview</p>
                  <p className="font-display font-bold text-2xl text-ink-900 dark:text-white mt-0.5">Dashboard</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                  <Brain size={18} className="text-white" />
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Revenue', value: '$4,280', trend: '+18%', color: 'text-emerald-600' },
                  { label: 'Bookings', value: '34', trend: '+7', color: 'text-brand-600' },
                  { label: 'Employees', value: '8', trend: 'Active', color: 'text-amber-600' },
                  { label: 'AI Chats', value: '127', trend: '+43', color: 'text-accent-600' },
                ].map(m => (
                  <div key={m.label} className="bg-ink-50 dark:bg-ink-800/50 rounded-xl p-3">
                    <p className="text-xs text-ink-500 dark:text-ink-400">{m.label}</p>
                    <p className="font-bold text-ink-900 dark:text-white text-lg">{m.value}</p>
                    <p className={`text-xs font-medium ${m.color}`}>{m.trend}</p>
                  </div>
                ))}
              </div>

              {/* Mini chart bar */}
              <div className="flex items-end gap-1 h-16">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex-1 bg-gradient-to-t from-brand-600 to-brand-400 rounded-sm opacity-90"
                  />
                ))}
              </div>
            </div>

            {/* Floating cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.7 + i * 0.15 }}
                className={`absolute glass rounded-2xl p-3 shadow-glass flex items-center gap-3 min-w-[180px] ${
                  i === 0 ? '-left-12 top-8' : i === 1 ? '-right-10 top-1/3' : '-left-8 bottom-8'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg flex-shrink-0`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-900 dark:text-white">{card.title}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{card.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-400 dark:text-ink-600"
      >
        <p className="text-xs">Scroll to explore</p>
        <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center pt-1.5">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 rounded-full bg-current"
          />
        </div>
      </motion.div>
    </section>
  )
}
