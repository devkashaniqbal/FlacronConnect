// Equipment Tracking — Construction Company · Home Services
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Wrench, Search, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { useEquipment, type EquipmentStatus } from '@/hooks/useEquipment'
import { useEmployees } from '@/hooks/useEmployees'
import { cn } from '@/utils/cn'

const statusColors: Record<EquipmentStatus, 'success' | 'brand' | 'warning' | 'default'> = {
  available:   'success',
  in_use:      'brand',
  maintenance: 'warning',
  retired:     'default',
}

const schema = z.object({
  name:         z.string().min(2, 'Name required'),
  type:         z.string().min(1, 'Type required'),
  serialNumber: z.string().optional(),
  status:       z.enum(['available', 'in_use', 'maintenance', 'retired']),
  assignedToId: z.string().optional(),
  purchaseDate: z.string().optional(),
  notes:        z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function EquipmentPage() {
  const { equipment, isLoading, createEquipment, updateEquipment, deleteEquipment, isCreating } = useEquipment()
  const { employees } = useEmployees()
  const [search, setSearch]   = useState('')
  const [showNew, setShowNew] = useState(false)
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'available' },
  })

  const filtered = equipment
    .filter(e => filterStatus === 'all' || e.status === filterStatus)
    .filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase())
    )

  async function onSubmit(data: FormData) {
    const emp = employees.find(e => e.id === data.assignedToId)
    await toast.promise(
      createEquipment({ ...data, businessId: '', assignedTo: emp?.name }),
      { loading: 'Adding equipment…', success: 'Equipment added!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleStatusChange(id: string, status: EquipmentStatus) {
    await toast.promise(
      updateEquipment({ id, data: { status } }),
      { loading: '…', success: `Status updated`, error: 'Failed' }
    )
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"?`)) return
    await toast.promise(deleteEquipment(id), { loading: '…', success: 'Removed', error: 'Failed' })
  }

  return (
    <DashboardShell title="Equipment">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Equipment</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {equipment.filter(e => e.status === 'available').length} available · {equipment.length} total
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Add Equipment</Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'available', 'in_use', 'maintenance', 'retired'] as const).map(s => (
          <button key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
              filterStatus === s
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-500 hover:bg-ink-200'
            )}
          >{s.replace('_', ' ')}</button>
        ))}
      </div>

      <div className="mb-4">
        <Input placeholder="Search equipment…" icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Wrench size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No equipment tracked yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((eq, i) => (
            <motion.div key={eq.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white">{eq.name}</p>
                  <p className="text-sm text-ink-500">{eq.type}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusColors[eq.status]}>{eq.status.replace('_', ' ')}</Badge>
                  <button onClick={() => handleDelete(eq.id!, eq.name)} className="p-1 text-ink-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {eq.serialNumber && (
                <p className="text-xs text-ink-400 font-mono mb-1">S/N: {eq.serialNumber}</p>
              )}
              {eq.assignedTo && (
                <p className="text-xs text-ink-500 mb-3">Assigned to: <strong>{eq.assignedTo}</strong></p>
              )}

              <div className="flex gap-1.5 pt-2 border-t border-ink-100 dark:border-ink-800 flex-wrap">
                {eq.status !== 'available' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eq.id!, 'available')}>
                    Mark Available
                  </Button>
                )}
                {eq.status === 'available' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eq.id!, 'in_use')}>
                    Check Out
                  </Button>
                )}
                {eq.status !== 'maintenance' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eq.id!, 'maintenance')}>
                    Maintenance
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Equipment" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" placeholder="Circular Saw" {...register('name')} error={errors.name?.message} />
            <Input label="Type / Category" placeholder="Power Tool" {...register('type')} error={errors.type?.message} />
            <Input label="Serial number" placeholder="SN-123456" {...register('serialNumber')} />
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input-base w-full">
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="label">Assign to (optional)</label>
              <select {...register('assignedToId')} className="input-base w-full">
                <option value="">Unassigned</option>
                {employees.filter(e => e.activeStatus).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <Input label="Purchase date" type="date" {...register('purchaseDate')} />
            <div className="col-span-2">
              <Input label="Notes" placeholder="Maintenance history, location…" {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Add Equipment</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
