import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300',
  success:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning:  'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger:   'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  info:     'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  brand:    'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  outline:  'border border-current text-ink-600 dark:text-ink-400',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-ink-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-sky-500',
  brand:   'bg-brand-500',
  outline: 'bg-ink-400',
}

export function Badge({ variant = 'default', size = 'md', className, children, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}

export function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    pending:   'warning',
    confirmed: 'brand',
    completed: 'success',
    cancelled: 'danger',
    no_show:   'default',
  }
  return <Badge variant={map[status] ?? 'default'} dot>{status.replace('_', ' ')}</Badge>
}

export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, BadgeVariant> = {
    starter:    'default',
    growth:     'info',
    pro:        'brand',
    enterprise: 'success',
  }
  return <Badge variant={map[plan] ?? 'default'}>{plan}</Badge>
}
