// Service Packages / Session Bundles — Beauty Spa, Gym / Fitness, Event Planning
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Package2, Search, Minus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { usePackages } from '@/hooks/usePackages'
import { cn } from '@/utils/cn'

const schema = z.object({
  clientName:    z.string().min(2, 'Client name required'),
  clientEmail:   z.string().email().optional().or(z.literal('')),
  packageName:   z.string().min(2, 'Package name required'),
  serviceName:   z.string().min(2, 'Service name required'),
  totalSessions: z.coerce.number().min(1, 'At least 1 session'),
  priceTotal:    z.coerce.number().min(0, 'Price required'),
  purchaseDate:  z.string().min(1, 'Purchase date required'),
  expiryDate:    z.string().optional(),
  notes:         z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function PackagesPage() {
  const { packages, activePackages, expiredPackages, isLoading, createPackage, useSession, deletePackage, isCreating } = usePackages()
  const [search, setSearch]   = useState('')
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter]   = useState<'active' | 'expired' | 'all'>('active')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { purchaseDate: new Date().toISOString().split('T')[0], totalSessions: 5 },
  })

  const displayed = (filter === 'active' ? activePackages : filter === 'expired' ? expiredPackages : packages)
    .filter(p =>
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.packageName.toLowerCase().includes(search.toLowerCase())
    )

  async function onSubmit(data: FormData) {
    await toast.promise(
      createPackage({ ...data, businessId: '', usedSessions: 0 }),
      { loading: 'Creating package…', success: 'Package sold!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleUseSession(id: string, current: number, client: string) {
    await toast.promise(
      useSession({ id, current }),
      { loading: '…', success: `Session recorded for ${client}`, error: 'Failed' }
    )
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete package for "${name}"?`)) return
    await toast.promise(deletePackage(id), { loading: '…', success: 'Package deleted', error: 'Failed' })
  }

  return (
    <DashboardShell title="Packages">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Session Packages</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {activePackages.length} active · {packages.length} total sold
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Sell Package</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search clients or packages…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit">
          {(['active', 'expired', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                filter === f ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
              )}>
              {f} ({f === 'active' ? activePackages.length : f === 'expired' ? expiredPackages.length : packages.length})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : displayed.length === 0 ? (
        <Card className="py-16 text-center">
          <Package2 size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No packages found.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((pkg, i) => {
            const remaining = pkg.totalSessions - pkg.usedSessions
            const pct       = Math.round((pkg.usedSessions / pkg.totalSessions) * 100)
            const exhausted = remaining <= 0

            return (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{pkg.clientName}</p>
                    <p className="text-xs text-ink-400">{pkg.clientEmail}</p>
                  </div>
                  <button onClick={() => handleDelete(pkg.id!, pkg.clientName)} className="p-1 text-ink-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </div>

                <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-1">{pkg.packageName}</p>
                <p className="text-xs text-ink-500 mb-3">{pkg.serviceName}</p>

                {/* Session progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-ink-500 mb-1">
                    <span>{pkg.usedSessions} of {pkg.totalSessions} sessions used</span>
                    <span className={exhausted ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                      {remaining} left
                    </span>
                  </div>
                  <div className="w-full bg-ink-100 dark:bg-ink-800 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all', exhausted ? 'bg-red-500' : 'bg-emerald-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 text-xs text-ink-400 mb-3">
                  <span>Purchased: {formatDate(pkg.purchaseDate, 'MMM d, yyyy')}</span>
                  {pkg.expiryDate && <span>Expires: {formatDate(pkg.expiryDate, 'MMM d, yyyy')}</span>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-ink-800">
                  <p className="font-semibold text-ink-900 dark:text-white">{formatCurrency(pkg.priceTotal)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={exhausted ? 'danger' : 'success'}>
                      {exhausted ? 'Exhausted' : 'Active'}
                    </Badge>
                    {!exhausted && (
                      <Button size="sm" variant="ghost" icon={<Minus size={12} />}
                        onClick={() => handleUseSession(pkg.id!, pkg.usedSessions, pkg.clientName)}>
                        Use
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Sell Session Package" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Client name" placeholder="Jane Smith" {...register('clientName')} error={errors.clientName?.message} />
            <Input label="Client email (optional)" type="email" placeholder="jane@example.com" {...register('clientEmail')} />
            <Input label="Package name" placeholder="10-Class Bundle" {...register('packageName')} error={errors.packageName?.message} />
            <Input label="Service" placeholder="Yoga / Massage / Nails" {...register('serviceName')} error={errors.serviceName?.message} />
            <Input label="Total sessions" type="number" min="1" {...register('totalSessions')} error={errors.totalSessions?.message} />
            <Input label="Total price ($)" type="number" step="0.01" placeholder="200" {...register('priceTotal')} error={errors.priceTotal?.message} />
            <Input label="Purchase date" type="date" {...register('purchaseDate')} error={errors.purchaseDate?.message} />
            <Input label="Expiry date (optional)" type="date" {...register('expiryDate')} />
          </div>
          <Input label="Notes (optional)" placeholder="Any special terms…" {...register('notes')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Sell Package</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
