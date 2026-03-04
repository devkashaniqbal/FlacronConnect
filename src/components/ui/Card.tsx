import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
  hoverable?: boolean
  glass?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export function Card({ className, children, hoverable, glass, onClick, padding = 'md' }: CardProps) {
  const Comp = hoverable ? motion.div : 'div'
  const motionProps = hoverable
    ? { whileHover: { y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }, transition: { duration: 0.2 } }
    : {}

  return (
    <Comp
      onClick={onClick}
      className={cn(
        glass ? 'glass' : 'card',
        paddings[padding],
        hoverable && 'cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      {...motionProps}
    >
      {children}
    </Comp>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('text-lg font-semibold text-ink-900 dark:text-ink-100', className)}>{children}</h3>
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-sm text-ink-500 dark:text-ink-400 mt-1', className)}>{children}</p>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mt-4 pt-4 border-t border-ink-100 dark:border-ink-800', className)}>{children}</div>
}
