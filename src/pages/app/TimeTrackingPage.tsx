// Time Tracking — Consulting / Agency
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, DollarSign, Trash2, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { useTimeTracking } from '@/hooks/useTimeTracking'
import { useEmployees } from '@/hooks/useEmployees'
import { useProjects } from '@/hooks/useProjects'
import { useInvoices } from '@/hooks/useInvoices'
import { cn } from '@/utils/cn'

const schema = z.object({
  date:         z.string().min(1, 'Date required'),
  employeeId:   z.string().optional(),
  projectId:    z.string().optional(),
  clientName:   z.string().optional(),
  hours:        z.coerce.number().min(0.25, 'Minimum 0.25 hours').max(24),
  billable:     z.boolean(),
  hourlyRate:   z.coerce.number().min(0).optional(),
  description:  z.string().min(2, 'Description required'),
})
type FormData = z.infer<typeof schema>

export function TimeTrackingPage() {
  const { entries, isLoading, logTime, deleteEntry, updateEntry, totalHours, totalBillable, isCreating } = useTimeTracking()
  const { employees }    = useEmployees()
  const { projects }     = useProjects()
  const { createInvoice } = useInvoices()
  const [showNew, setShowNew]             = useState(false)
  const [invoicing, setInvoicing]         = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0], billable: true, hours: 1 },
  })

  const billable  = watch('billable')
  const hours     = watch('hours') ?? 0
  const rate      = watch('hourlyRate') ?? 0
  const previewAmt = billable ? (hours * rate) : 0

  async function onSubmit(data: FormData) {
    const emp  = employees.find(e => e.id === data.employeeId)
    const proj = projects.find(p => p.id === data.projectId)
    await toast.promise(
      logTime({ ...data, businessId: '', employeeName: emp?.name ?? 'Me', projectName: proj?.name }),
      { loading: 'Logging time…', success: 'Time logged!', error: 'Failed' }
    )
    reset({ date: new Date().toISOString().split('T')[0], billable: true, hours: 1 })
    setShowNew(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this time entry?')) return
    await toast.promise(deleteEntry(id), { loading: '…', success: 'Deleted', error: 'Failed' })
  }

  async function handleGenerateBillableInvoice() {
    const uninvoiced = entries.filter(e => e.billable && !e.invoiced && (e.hourlyRate ?? 0) > 0)
    if (uninvoiced.length === 0) { toast.error('No uninvoiced billable entries with a rate set'); return }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Group by clientName — use first client found as invoice customer
    const clientName = uninvoiced[0].clientName || uninvoiced[0].employeeName || 'Client'

    setInvoicing(true)
    try {
      await toast.promise(
        createInvoice({
          customerName: clientName,
          items: uninvoiced.map(e => ({
            description: `${e.description} (${e.date} · ${e.hours}h @ ${formatCurrency(e.hourlyRate ?? 0)}/h)`,
            quantity:    e.hours,
            unitPrice:   e.hourlyRate ?? 0,
          })),
          dueDate: dueDate.toISOString().split('T')[0],
          status:  'sent',
        }),
        { loading: 'Creating invoice…', success: 'Invoice created — check Invoices page!', error: 'Failed' }
      )
      // Mark all included entries as invoiced
      await Promise.all(uninvoiced.map(e => updateEntry({ id: e.id!, data: { invoiced: true } })))
    } finally {
      setInvoicing(false)
    }
  }

  const billableRevenue = entries.filter(e => e.billable && !e.invoiced)
    .reduce((s, e) => s + (e.hours * (e.hourlyRate ?? 0)), 0)

  return (
    <DashboardShell title="Time Tracking">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Time Tracking</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{entries.length} entries · {totalBillable.toFixed(1)}h billable</p>
        </div>
        <div className="flex items-center gap-2">
          {billableRevenue > 0 && (
            <Button
              variant="secondary"
              icon={<FileText size={14} />}
              onClick={handleGenerateBillableInvoice}
              loading={invoicing}
            >
              Invoice {formatCurrency(billableRevenue)}
            </Button>
          )}
          <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Log Time</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Hours',     value: totalHours.toFixed(1) + 'h',   icon: Clock,     color: 'text-brand-600' },
          { label: 'Billable Hours',  value: totalBillable.toFixed(1) + 'h', icon: Clock,     color: 'text-emerald-600' },
          { label: 'Uninvoiced Revenue', value: formatCurrency(billableRevenue), icon: DollarSign, color: 'text-amber-600' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="flex items-center gap-3">
              <Icon size={22} className={s.color} />
              <div>
                <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
                <p className="font-bold text-ink-900 dark:text-white text-lg">{s.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : entries.length === 0 ? (
        <Card className="py-16 text-center">
          <Clock size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No time entries yet.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Date', 'Employee', 'Project / Client', 'Description', 'Hours', 'Billable', ''].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                {entries.map((entry, i) => (
                  <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20">
                    <td className="py-3 pr-4 text-sm text-ink-500">{formatDate(entry.date, 'MMM d')}</td>
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{entry.employeeName}</td>
                    <td className="py-3 pr-4 text-sm text-ink-500">{entry.projectName ?? entry.clientName ?? '—'}</td>
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300 max-w-xs truncate">{entry.description}</td>
                    <td className="py-3 pr-4 font-semibold text-ink-900 dark:text-white text-sm">{entry.hours}h</td>
                    <td className="py-3 pr-4">
                      {entry.billable
                        ? <Badge variant="success">Billable{entry.hourlyRate ? ` · ${formatCurrency(entry.hours * entry.hourlyRate)}` : ''}</Badge>
                        : <Badge variant="default">Non-billable</Badge>}
                    </td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(entry.id!)} className="p-1.5 text-ink-300 hover:text-red-500 transition-colors">
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

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Log Time" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
            <div>
              <label className="label">Employee</label>
              <select {...register('employeeId')} className="input-base w-full">
                <option value="">Me (owner)</option>
                {employees.filter(e => e.activeStatus).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Project (optional)</label>
              <select {...register('projectId')} className="input-base w-full">
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Input label="Client name (optional)" placeholder="Acme Corp" {...register('clientName')} />
            <Input label="Hours" type="number" step="0.25" min="0.25" {...register('hours')} error={errors.hours?.message} />
            <Input label="Hourly rate ($)" type="number" step="0.01" placeholder="0" {...register('hourlyRate')} />
            <div className="col-span-2">
              <Input label="Description" placeholder="What did you work on?" {...register('description')} error={errors.description?.message} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="billable" {...register('billable')} className="w-4 h-4 accent-brand-600" />
              <label htmlFor="billable" className="text-sm text-ink-700 dark:text-ink-300 cursor-pointer">
                Billable to client
                {previewAmt > 0 && <span className="ml-2 text-emerald-600 font-medium">({formatCurrency(previewAmt)})</span>}
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Log Time</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
