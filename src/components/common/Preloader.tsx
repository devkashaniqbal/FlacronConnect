import { motion } from 'framer-motion'

export function Preloader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-ink-950"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="relative"
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-[22px] bg-gradient-brand flex items-center justify-center shadow-brand-lg">
          <span className="text-white font-display font-bold text-4xl">F</span>
        </div>

        {/* Spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-2 rounded-[26px] border-2 border-transparent border-t-brand-500 border-r-accent-500"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <p className="font-display font-bold text-xl text-ink-900 dark:text-ink-100">
          FlacronControl
        </p>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
          AI-powered business automation
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '160px' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className="mt-6 h-0.5 bg-gradient-brand rounded-full"
      />
    </motion.div>
  )
}
