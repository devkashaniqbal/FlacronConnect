import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui'
import { PLANS } from '@/constants/plans'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

export function Pricing() {
  const [annual, setAnnual] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="pricing" className="py-24 px-6 bg-ink-50/50 dark:bg-ink-900/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold uppercase tracking-wider">
            Simple pricing
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white mt-3 mb-4">
            Grow at your own{' '}
            <span className="gradient-text">pace</span>
          </h2>
          <p className="text-lg text-ink-600 dark:text-ink-400 mb-8">
            14-day free trial on all plans. No credit card required.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-ink-100 dark:bg-ink-800 rounded-full">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                !annual
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm'
                  : 'text-ink-500 dark:text-ink-400'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                annual
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm'
                  : 'text-ink-500 dark:text-ink-400'
              )}
            >
              Annual
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'relative rounded-3xl p-6 flex flex-col',
                plan.highlighted
                  ? 'bg-gradient-brand text-white shadow-brand-lg ring-4 ring-brand-400/30 scale-105'
                  : 'card'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white text-brand-700 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  <Zap size={10} fill="currentColor" /> Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={cn(
                  'font-display font-bold text-xl mb-1',
                  plan.highlighted ? 'text-white' : 'text-ink-900 dark:text-white'
                )}>
                  {plan.name}
                </h3>
                <p className={cn(
                  'text-sm mb-4 leading-relaxed',
                  plan.highlighted ? 'text-white/80' : 'text-ink-500 dark:text-ink-400'
                )}>
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    'text-4xl font-bold font-display',
                    plan.highlighted ? 'text-white' : 'text-ink-900 dark:text-white'
                  )}>
                    ${annual ? plan.priceAnnual : plan.price}
                  </span>
                  <span className={plan.highlighted ? 'text-white/70' : 'text-ink-500 dark:text-ink-400'}>
                    /mo
                  </span>
                </div>
                {annual && (
                  <p className={cn('text-xs mt-1', plan.highlighted ? 'text-white/60' : 'text-ink-400')}>
                    Billed annually (${(annual ? plan.priceAnnual : plan.price) * 12}/yr)
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={16}
                      className={cn('flex-shrink-0 mt-0.5', plan.highlighted ? 'text-white' : 'text-brand-500')}
                    />
                    <span className={plan.highlighted ? 'text-white/90' : 'text-ink-600 dark:text-ink-400'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={ROUTES.SIGNUP}>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'secondary' : 'primary'}
                >
                  {plan.highlighted ? (
                    <span className="text-ink-900">Get started</span>
                  ) : (
                    'Get started'
                  )}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-10">
          All plans include 14-day free trial · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  )
}
