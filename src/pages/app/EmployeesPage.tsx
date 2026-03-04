import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Mail, Phone, MoreVertical, Trash2, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Modal, Spinner } from '@/components/ui'
import { Input } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import { useEmployees } from '@/hooks/useEmployees'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'

const schema = z.object({
  name:           z.string().min(2),
  email:          z.string().email(),
  phone:          z.string().min(6),
  role:           z.enum(['manager', 'employee', 'part_time']),
  hourlyRate:     z.coerce.number().min(1),
  hireDate:       z.string().min(1),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  specialization: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const roleColors: Record<string, 'brand' | 'info' | 'default'> = {
  manager:   'brand',
  employee:  'info',
  part_time: 'default',
}

export function EmployeesPage() {
  const { employees, isLoading, createEmployee, deleteEmployee, isCreating } = useEmployees()
  const hasCommissions   = useIndustryFeature('commissions')
  const hasSpecialization = useIndustryFeature('trainerAssignment') || useIndustryFeature('technicianAssignment')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee', hourlyRate: 18 },
  })

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  async function onSubmit(data: FormData) {
    await toast.promise(
      createEmployee({
        ...data,
        userId: null, avatar: null, activeStatus: true, businessId: '',
        commissionRate: data.commissionRate,
        specialization: data.specialization,
      }),
      { loading: 'Adding employee…', success: 'Employee added!', error: 'Failed to add employee' }
    )
    reset()
    setShowNew(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    await toast.promise(
      deleteEmployee(id),
      { loading: 'Removing…', success: 'Employee removed', error: 'Failed to remove' }
    )
    setMenuOpen(null)
  }

  return (
    <DashboardShell title="Employees">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Employees</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {employees.filter(e => e.activeStatus).length} active · {employees.length} total
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Add Employee</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search employees…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-ink-400">No employees yet. Add your first employee to get started.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-5 group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={emp.name} size="lg" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-ink-900 ${emp.activeStatus ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{emp.name}</p>
                    <Badge variant={roleColors[emp.role]} size="sm">{emp.role.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === emp.id && (
                    <div className="absolute right-0 top-8 z-10 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-xl shadow-lg overflow-hidden">
                      <button
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 w-full"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
                  <Mail size={13} className="text-ink-400" />{emp.email}
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
                    <Phone size={13} className="text-ink-400" />{emp.phone}
                  </div>
                )}
              </div>

              {hasSpecialization && emp.specialization && (
                <p className="text-xs text-ink-400 mb-3">Specialization: {emp.specialization}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800">
                <div>
                  <p className="text-xs text-ink-500">Hourly rate</p>
                  <p className="font-semibold text-ink-900 dark:text-white">{formatCurrency(emp.hourlyRate)}/hr</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasCommissions && emp.commissionRate != null && emp.commissionRate > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Percent size={11} />{emp.commissionRate}%
                    </span>
                  )}
                  <Badge variant={emp.activeStatus ? 'success' : 'default'} dot>
                    {emp.activeStatus ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Employee" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full name" placeholder="Jane Smith" {...register('name')} error={errors.name?.message} />
            <Input label="Email" type="email" placeholder="jane@biz.com" {...register('email')} error={errors.email?.message} />
            <Input label="Phone" placeholder="555-0100" {...register('phone')} error={errors.phone?.message} />
            <div>
              <label className="label">Role</label>
              <select {...register('role')} className="input-base w-full">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="part_time">Part-time</option>
              </select>
            </div>
            <Input label="Hourly rate ($)" type="number" step="0.50" placeholder="20" {...register('hourlyRate')} error={errors.hourlyRate?.message} />
            <Input label="Hire date" type="date" {...register('hireDate')} error={errors.hireDate?.message} />
            {hasCommissions && (
              <Input label="Commission rate (%)" type="number" step="0.5" min="0" max="100" placeholder="0" {...register('commissionRate')} />
            )}
            {hasSpecialization && (
              <Input label="Specialization" placeholder="e.g. Yoga, HVAC, Portraits" {...register('specialization')} />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Add Employee</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
