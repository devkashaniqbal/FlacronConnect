// Vehicle Management — Transportation / Chauffeur
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Car, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { useVehicles, type VehicleStatus } from '@/hooks/useVehicles'
import { useEmployees } from '@/hooks/useEmployees'
import { cn } from '@/utils/cn'

const statusColors: Record<VehicleStatus, 'success' | 'warning' | 'default'> = {
  active:      'success',
  maintenance: 'warning',
  retired:     'default',
}

const schema = z.object({
  make:            z.string().min(1, 'Make required'),
  model:           z.string().min(1, 'Model required'),
  year:            z.coerce.number().min(1900).max(2030),
  licensePlate:    z.string().min(1, 'Plate required'),
  vin:             z.string().optional(),
  color:           z.string().optional(),
  status:          z.enum(['active', 'maintenance', 'retired']),
  assignedDriverId: z.string().optional(),
  lastServiceDate: z.string().optional(),
  notes:           z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function VehiclesPage() {
  const { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, isCreating } = useVehicles()
  const { employees } = useEmployees()
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', year: new Date().getFullYear() },
  })

  const drivers = employees.filter(e => e.activeStatus)

  async function onSubmit(data: FormData) {
    const driver = drivers.find(d => d.id === data.assignedDriverId)
    await toast.promise(
      createVehicle({ ...data, businessId: '', assignedDriver: driver?.name }),
      { loading: 'Adding vehicle…', success: 'Vehicle added!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Remove "${label}"?`)) return
    await toast.promise(deleteVehicle(id), { loading: '…', success: 'Vehicle removed', error: 'Failed' })
  }

  async function handleStatus(id: string, status: VehicleStatus) {
    await toast.promise(
      updateVehicle({ id, data: { status } }),
      { loading: '…', success: 'Status updated', error: 'Failed' }
    )
  }

  return (
    <DashboardShell title="Vehicles">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Fleet Management</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {vehicles.filter(v => v.status === 'active').length} active · {vehicles.length} total
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Add Vehicle</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : vehicles.length === 0 ? (
        <Card className="py-16 text-center">
          <Car size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No vehicles in fleet yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white">{v.year} {v.make} {v.model}</p>
                  <p className="text-sm text-ink-500 font-mono">{v.licensePlate}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusColors[v.status]}>{v.status}</Badge>
                  <button onClick={() => handleDelete(v.id!, `${v.make} ${v.model}`)} className="p-1 text-ink-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {v.color && <p className="text-xs text-ink-400 mb-1">Color: {v.color}</p>}
              {v.vin   && <p className="text-xs text-ink-400 font-mono mb-1">VIN: {v.vin}</p>}
              {v.assignedDriver && (
                <p className="text-xs text-ink-500 mb-3">Driver: <strong>{v.assignedDriver}</strong></p>
              )}

              <div className="flex gap-1.5 pt-2 border-t border-ink-100 dark:border-ink-800">
                {v.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatus(v.id!, 'maintenance')}>
                    Send for Service
                  </Button>
                )}
                {v.status === 'maintenance' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatus(v.id!, 'active')}>
                    Back to Active
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Vehicle" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Make" placeholder="Toyota" {...register('make')} error={errors.make?.message} />
            <Input label="Model" placeholder="Camry" {...register('model')} error={errors.model?.message} />
            <Input label="Year" type="number" min="1900" {...register('year')} error={errors.year?.message} />
            <Input label="License plate" placeholder="ABC-1234" {...register('licensePlate')} error={errors.licensePlate?.message} />
            <Input label="Color" placeholder="Black" {...register('color')} />
            <Input label="VIN (optional)" placeholder="1HGBH41JXMN..." {...register('vin')} />
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input-base w-full">
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="label">Assign driver (optional)</label>
              <select {...register('assignedDriverId')} className="input-base w-full">
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Input label="Last service date" type="date" {...register('lastServiceDate')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Add Vehicle</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
