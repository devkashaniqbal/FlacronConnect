// Mileage Tracking — Transportation / Chauffeur · Home Services
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Navigation, Trash2, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Modal, Input, Spinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { useMileage } from '@/hooks/useMileage'
import { useEmployees } from '@/hooks/useEmployees'
import { useVehicles } from '@/hooks/useVehicles'

const schema = z.object({
  date:          z.string().min(1, 'Date required'),
  driverId:      z.string().optional(),
  vehicleId:     z.string().optional(),
  tripPurpose:   z.string().min(2, 'Purpose required'),
  startOdometer: z.coerce.number().min(0),
  endOdometer:   z.coerce.number().min(0),
  notes:         z.string().optional(),
}).refine(d => d.endOdometer >= d.startOdometer, {
  message: 'End odometer must be ≥ start',
  path: ['endOdometer'],
})
type FormData = z.infer<typeof schema>

export function MileagePage() {
  const { logs, isLoading, logTrip, deleteMileage, totalMiles, isCreating } = useMileage()
  const { employees } = useEmployees()
  const { vehicles }  = useVehicles()
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })

  const startOdo = watch('startOdometer') ?? 0
  const endOdo   = watch('endOdometer')   ?? 0
  const preview  = Math.max(0, endOdo - startOdo)

  async function onSubmit(data: FormData) {
    const driver  = employees.find(e => e.id === data.driverId)
    const vehicle = vehicles.find(v => v.id === data.vehicleId)
    await toast.promise(
      logTrip({ ...data, businessId: '', driverName: driver?.name ?? 'Unknown', vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : undefined, distanceMiles: Math.max(0, data.endOdometer - data.startOdometer) }),
      { loading: 'Logging trip…', success: 'Mileage logged!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this mileage record?')) return
    await toast.promise(deleteMileage(id), { loading: '…', success: 'Deleted', error: 'Failed' })
  }

  function exportCSV() {
    const IRS_RATE = 0.67 // 2024 IRS standard mileage rate ($/mile)
    const rows = [
      ['Date', 'Driver', 'Vehicle', 'Purpose', 'Miles', 'Reimbursement ($)', 'Notes'],
      ...logs.map(l => [
        l.date,
        l.driverName,
        l.vehicleName ?? '',
        l.tripPurpose,
        l.distanceMiles.toFixed(1),
        (l.distanceMiles * IRS_RATE).toFixed(2),
        l.notes ?? '',
      ]),
      [],
      ['TOTAL', '', '', '', totalMiles.toFixed(1), (totalMiles * IRS_RATE).toFixed(2), ''],
    ]
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `mileage-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Mileage log exported!')
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthMiles = logs
    .filter(l => l.date.startsWith(thisMonth))
    .reduce((s, l) => s + (l.distanceMiles ?? 0), 0)

  return (
    <DashboardShell title="Mileage">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Mileage Log</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{logs.length} trips recorded</p>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <Button variant="secondary" icon={<Download size={14} />} onClick={exportCSV}>
              Export CSV
            </Button>
          )}
          <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Log Trip</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Miles',     value: totalMiles.toFixed(1) },
          { label: 'This Month',      value: monthMiles.toFixed(1) },
          { label: 'Total Trips',     value: logs.length.toString() },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <p className="text-2xl font-bold text-ink-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <Card className="py-16 text-center">
          <Navigation size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No trips logged yet.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Date', 'Driver', 'Vehicle', 'Purpose', 'Miles', ''].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                {logs.map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{formatDate(log.date, 'MMM d, yyyy')}</td>
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{log.driverName}</td>
                    <td className="py-3 pr-4 text-sm text-ink-500">{log.vehicleName ?? '—'}</td>
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{log.tripPurpose}</td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-ink-900 dark:text-white">{log.distanceMiles.toFixed(1)} mi</span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(log.id!)} className="p-1.5 text-ink-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Log a Trip" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
            <div>
              <label className="label">Driver (optional)</label>
              <select {...register('driverId')} className="input-base w-full">
                <option value="">No driver</option>
                {employees.filter(e => e.activeStatus).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Vehicle (optional)</label>
              <select {...register('vehicleId')} className="input-base w-full">
                <option value="">No vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}
              </select>
            </div>
            <Input label="Trip purpose" placeholder="Airport pickup" {...register('tripPurpose')} error={errors.tripPurpose?.message} />
            <Input label="Start odometer (mi)" type="number" step="0.1" {...register('startOdometer')} error={errors.startOdometer?.message} />
            <div>
              <Input label="End odometer (mi)" type="number" step="0.1" {...register('endOdometer')} error={errors.endOdometer?.message} />
              {preview > 0 && <p className="text-xs text-brand-600 mt-1">{preview.toFixed(1)} miles</p>}
            </div>
            <div className="col-span-2">
              <Input label="Notes (optional)" placeholder="Any observations…" {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Log Trip</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
