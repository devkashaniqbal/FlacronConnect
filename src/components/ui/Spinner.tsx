import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-brand-500/30 border-t-brand-500 animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg h-4', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-3">
      <SkeletonLine className="w-1/3 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-3/4" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonLine className="w-24 h-3" />
          <SkeletonLine className="w-16 h-7" />
        </div>
        <div className="skeleton w-10 h-10 rounded-xl" />
      </div>
      <SkeletonLine className="w-32 h-3" />
    </div>
  )
}
