// Class Scheduling + Session Packages — Gym / Fitness Studio
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Dumbbell, Users, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatDate } from '@/utils/formatters'
import { formatCurrency } from '@/utils/formatters'
import { useClasses } from '@/hooks/useClasses'
import { useEmployees } from '@/hooks/useEmployees'
import { cn } from '@/utils/cn'

const schema = z.object({
  name:          z.string().min(2, 'Class name required'),
  instructorId:  z.string().optional(),
  capacity:      z.coerce.number().min(1),
  date:          z.string().min(1, 'Date required'),
  startTime:     z.string().min(1, 'Time required'),
  durationMins:  z.coerce.number().min(15),
  recurrence:    z.enum(['once', 'weekly', 'biweekly']),
  price:         z.coerce.number().min(0).optional(),
  description:   z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ClassesPage() {
  const { classes, isLoading, createClass, updateClass, deleteClass, isCreating } = useClasses()
  const { employees } = useEmployees()
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 20, durationMins: 60, recurrence: 'weekly' },
  })

  const trainers = employees.filter(e => e.activeStatus)

  async function onSubmit(data: FormData) {
    const instructor = trainers.find(t => t.id === data.instructorId)
    await toast.promise(
      createClass({ ...data, businessId: '', instructorName: instructor?.name }),
      { loading: 'Creating class…', success: 'Class created!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await toast.promise(deleteClass(id), { loading: '…', success: 'Class deleted', error: 'Failed' })
  }

  const spotsCalc = (cls: { capacity: number; enrolled: number }) =>
    Math.max(0, cls.capacity - cls.enrolled)

  return (
    <DashboardShell title="Classes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Class Schedule</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{classes.length} classes scheduled</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Class</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : classes.length === 0 ? (
        <Card className="py-16 text-center">
          <Dumbbell size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No classes scheduled yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls, i) => {
            const spots = spotsCalc(cls)
            const full  = spots === 0
            return (
              <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{cls.name}</p>
                    {cls.instructorName && <p className="text-sm text-ink-500">with {cls.instructorName}</p>}
                  </div>
                  <Badge variant={full ? 'danger' : 'success'} dot>{full ? 'Full' : `${spots} spots`}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-ink-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />{cls.startTime} · {cls.durationMins}min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={11} />{cls.enrolled}/{cls.capacity} enrolled
                  </div>
                  <div className="col-span-2">{formatDate(cls.date, 'EEE, MMM d')} · {cls.recurrence}</div>
                </div>

                {cls.price && cls.price > 0 && (
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-3">
                    {formatCurrency(cls.price)} / session
                  </p>
                )}

                {/* Capacity bar */}
                <div className="mb-3">
                  <div className="h-1.5 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', full ? 'bg-red-500' : 'bg-brand-500')}
                      style={{ width: `${Math.min(100, (cls.enrolled / cls.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1"
                    onClick={() => !full && toast.promise(
                      updateClass({ id: cls.id!, data: { enrolled: cls.enrolled + 1 } }),
                      { loading: 'Enrolling…', success: 'Enrolled!', error: 'Failed to enroll' }
                    )}
                    disabled={full}>
                    + Enroll
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(cls.id!, cls.name)}>
                    Delete
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Class" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Class name" placeholder="Morning Yoga" {...register('name')} error={errors.name?.message} />
            </div>
            <div>
              <label className="label">Instructor (optional)</label>
              <select {...register('instructorId')} className="input-base w-full">
                <option value="">No instructor</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <Input label="Capacity" type="number" min="1" {...register('capacity')} error={errors.capacity?.message} />
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
            <Input label="Start time" type="time" {...register('startTime')} error={errors.startTime?.message} />
            <Input label="Duration (mins)" type="number" min="15" {...register('durationMins')} error={errors.durationMins?.message} />
            <Input label="Price ($)" type="number" step="0.01" placeholder="0 = free" {...register('price')} />
            <div className="col-span-2">
              <label className="label">Recurrence</label>
              <select {...register('recurrence')} className="input-base w-full">
                <option value="once">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Create Class</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
