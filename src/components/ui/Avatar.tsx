import { cn } from '@/utils/cn'
import { formatInitials } from '@/utils/formatters'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const colors = [
  'from-brand-500 to-brand-700',
  'from-accent-500 to-accent-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-sky-500 to-sky-700',
  'from-rose-500 to-rose-700',
]

function getColor(name: string) {
  let sum = 0
  for (const c of name) sum += c.charCodeAt(0)
  return colors[sum % colors.length]
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white dark:ring-ink-800', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        `rounded-full bg-gradient-to-br ${getColor(name)} flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-ink-800`,
        sizes[size],
        className
      )}
    >
      {formatInitials(name)}
    </div>
  )
}
