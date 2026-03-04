import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
        isDark ? 'bg-brand-600' : 'bg-ink-200',
        className
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center',
          isDark ? 'left-7' : 'left-0.5'
        )}
      >
        {isDark
          ? <Moon size={12} className="text-brand-600" />
          : <Sun size={12} className="text-amber-500" />
        }
      </motion.div>
    </motion.button>
  )
}

export function ThemeToggleIcon({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'p-2 rounded-xl text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 transition-all',
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </motion.button>
  )
}
