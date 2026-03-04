import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star } from 'lucide-react'
import { Avatar } from '@/components/ui'

const testimonials = [
  {
    name: 'Sarah Johnson', role: 'Owner, Bloom Salon', avatar: null,
    rating: 5,
    text: 'FlacronControl transformed how we run our salon. Bookings are up 40% and we spend 3 fewer hours per day on admin. The AI assistant handles most customer questions automatically.',
  },
  {
    name: 'Marcus Rivera', role: 'Director, FitZone Gym', avatar: null,
    rating: 5,
    text: 'The payroll automation alone saves us 8 hours every month. Our employees love the GPS clock-in feature, and the analytics help us make better scheduling decisions.',
  },
  {
    name: 'Emily Chen', role: 'Owner, Bright Smiles Dental', avatar: null,
    rating: 5,
    text: 'Switching from 4 separate tools to FlacronControl was the best decision we made. The integrated payment + booking + notifications system is seamless.',
  },
  {
    name: 'David Okafor', role: 'Founder, CleanPro Services', avatar: null,
    rating: 5,
    text: 'The WatsonX integration for complex customer queries is impressive. It understands context much better than simple chatbots we tried before.',
  },
  {
    name: 'Lena Müller', role: 'Manager, Serenity Spa', avatar: null,
    rating: 5,
    text: 'Beautiful interface that our staff actually enjoys using. Dark mode, smooth animations, and it works great on mobile. Customer reviews have improved since we started.',
  },
  {
    name: 'James Park', role: 'CEO, QuickFix Repairs', avatar: null,
    rating: 5,
    text: 'The multi-tenant setup is perfect for our franchise model. Each location is isolated with its own data, but I can see everything from the admin panel.',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-wider">
            Loved by businesses
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white mt-3 mb-4">
            Don't just take our{' '}
            <span className="gradient-text">word for it</span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-ink-600 dark:text-ink-400">
            <Stars count={5} />
            <span className="text-sm">4.9/5 from 800+ reviews</span>
          </div>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 }}
              className="card p-6 break-inside-avoid"
            >
              <Stars count={t.rating} />
              <p className="text-ink-700 dark:text-ink-300 text-sm leading-relaxed mt-3 mb-4">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <Avatar name={t.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
