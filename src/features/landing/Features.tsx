import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain, Calendar, Users, CreditCard, Bell, BarChart3,
  Clock, FileText, Smartphone, Shield, Zap, Globe,
} from 'lucide-react'

const features = [
  {
    icon: Brain, color: 'from-brand-500 to-brand-600',
    title: 'AI Chat Assistant',
    description: 'Powered by OpenAI & WatsonX. Intelligently routes complex queries to the right model, handling customer conversations 24/7.',
  },
  {
    icon: Calendar, color: 'from-accent-500 to-accent-600',
    title: 'Smart Booking Calendar',
    description: 'Beautiful drag-and-drop calendar with automated reminders, online payments, and real-time availability.',
  },
  {
    icon: Users, color: 'from-emerald-500 to-emerald-600',
    title: 'Employee Management',
    description: 'Full HR suite with onboarding, attendance tracking, GPS clock-in/out, and performance insights.',
  },
  {
    icon: Clock, color: 'from-amber-500 to-amber-600',
    title: 'Attendance & Payroll',
    description: 'Automated time tracking with geo-fencing, payroll calculation, and one-click PDF export.',
  },
  {
    icon: CreditCard, color: 'from-blue-500 to-blue-600',
    title: 'Stripe Payments',
    description: 'Accept payments globally with multiple currencies. Subscription billing, invoicing, and refunds.',
  },
  {
    icon: BarChart3, color: 'from-rose-500 to-rose-600',
    title: 'Business Analytics',
    description: 'Real-time revenue dashboards, customer insights, and AI-generated business recommendations.',
  },
  {
    icon: Bell, color: 'from-violet-500 to-violet-600',
    title: 'Smart Notifications',
    description: 'Push, email, and SMS notifications. Automated booking confirmations, reminders, and alerts.',
  },
  {
    icon: FileText, color: 'from-teal-500 to-teal-600',
    title: 'Auto Invoicing',
    description: 'Beautiful PDF invoices generated automatically on every booking with custom branding.',
  },
  {
    icon: Smartphone, color: 'from-orange-500 to-orange-600',
    title: 'Mobile First',
    description: 'PWA-ready responsive design that works perfectly on any device, anywhere.',
  },
  {
    icon: Shield, color: 'from-ink-500 to-ink-700',
    title: 'Enterprise Security',
    description: 'Multi-tenant isolation, role-based access, encrypted data, and full audit logs.',
  },
  {
    icon: Globe, color: 'from-cyan-500 to-cyan-600',
    title: 'Multi-language',
    description: 'Serve customers in their language with AI-powered translation and localization.',
  },
  {
    icon: Zap, color: 'from-yellow-500 to-yellow-600',
    title: 'Automation Rules',
    description: 'Set up triggers and workflows. Automate follow-ups, upsells, and customer journeys.',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card p-6 group cursor-default"
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="font-semibold text-ink-900 dark:text-ink-100 mb-2">{feature.title}</h3>
      <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true })

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-wider">
            Everything you need
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white mt-3 mb-4">
            One platform, infinite{' '}
            <span className="gradient-text">possibilities</span>
          </h2>
          <p className="text-lg text-ink-600 dark:text-ink-400 max-w-2xl mx-auto">
            Replace 6+ tools with one integrated platform. Save time, reduce costs,
            and grow faster with AI-powered automation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
