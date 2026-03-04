import { motion } from 'framer-motion'
import { PhoneCall, Zap, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

export function VoiceUpgradePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mb-6 shadow-brand">
        <PhoneCall size={36} className="text-white" />
      </div>

      <h2 className="font-display font-bold text-2xl text-ink-900 dark:text-white mb-3">
        AI Voice Calling — Pro Feature
      </h2>
      <p className="text-ink-500 dark:text-ink-400 max-w-md leading-relaxed mb-6">
        Automate customer calls with intelligent voice agents powered by GPT-4o.
        Handle bookings, answer FAQs, and run outbound campaigns — all hands-free.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-8 w-full max-w-lg">
        {[
          'Inbound & Outbound AI Calls',
          'Real-time Transcription',
          'Auto-book Appointments',
          'Call Recording & Playback',
          'Sentiment Analysis',
          'SMS Follow-ups',
        ].map(feature => (
          <div key={feature} className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
            <Check size={14} className="text-emerald-500 flex-shrink-0" />
            {feature}
          </div>
        ))}
      </div>

      <Link to={ROUTES.PAYMENTS}>
        <Button size="lg" icon={<Zap size={18} fill="white" />}>
          Upgrade to Pro
        </Button>
      </Link>

      <p className="text-xs text-ink-400 mt-4">Pro: 500 min/mo · Enterprise: Unlimited</p>
    </motion.div>
  )
}
