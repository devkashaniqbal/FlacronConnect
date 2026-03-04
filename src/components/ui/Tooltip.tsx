import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const positions = {
    top:    '-top-9 left-1/2 -translate-x-1/2',
    bottom: '-bottom-9 left-1/2 -translate-x-1/2',
    left:   'top-1/2 -translate-y-1/2 -left-2 -translate-x-full',
    right:  'top-1/2 -translate-y-1/2 -right-2 translate-x-full',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-ink-900 dark:bg-ink-700 rounded-lg whitespace-nowrap pointer-events-none',
              positions[side],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
