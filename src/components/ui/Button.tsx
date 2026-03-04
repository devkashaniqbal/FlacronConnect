import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variants = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white shadow-brand hover:shadow-brand-lg',
  secondary: 'bg-ink-100 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-200',
  ghost:     'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  outline:   'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 dark:text-brand-400',
}

const sizes = {
  sm:   'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md:   'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg:   'px-7 py-3.5 text-base rounded-xl gap-2',
  icon: 'p-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, iconRight, children, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 12 : 16} /> : icon}
      {children}
      {!loading && iconRight}
    </motion.button>
  )
)
Button.displayName = 'Button'
