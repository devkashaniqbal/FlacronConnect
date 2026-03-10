// Retainer Billing — Consulting / Agency
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useRetainers } from '@/hooks/useRetainers'
import { useInvoices } from '@/hooks/useInvoices'

const schema = z.object({
  clientName:   z.string().min(2, 'Client name required'),
  clientEmail:  z.string().email().optional().or(z.literal('')),
  amount:       z.coerce.number().min(1, 'Amount required'),
  billingDay:   z.coerce.number().min(1).max(28),
  startDate:    z.string().min(1, 'Start date required'),
  description:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function RetainersPage() {
  const { retainers, isLoading, createRetainer, updateRetainer, deleteRetainer, monthlyTotal, isCreating } = useRetainers()
  const { createInvoice } = useInvoices()
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { billingDay: 1, startDate: new Date().toISOString().split('T')[0] },
  })

  async function onSubmit(data: FormData) {
    await toast.promise(
      createRetainer({ ...data, active: true, businessId: '' }),
      { loading: 'Creating retainer…', success: 'Retainer created!', error: 'Failed' }
    )
    reset(); setShowNew(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await toast.promise(
      updateRetainer({ id, data: { active: !current } }),
      { loading: '…', success: current ? 'Retainer paused' : 'Retainer activated', error: 'Failed' }
    )
  }

  async function handleGenerateInvoice(ret: { id: string; clientName: string; clientEmail?: string; amount: number; description?: string }) {
    const today   = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + 30)

    await toast.promise(
      Promise.all([
        createInvoice({
          customerName:  ret.clientName,
          customerEmail: ret.clientEmail ?? '',
          items: [{
            description: ret.description || `Monthly retainer — ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            quantity:    1,
            unitPrice:   ret.amount,
          }],
          dueDate: dueDate.toISOString().split('T')[0],
          status:  'sent',
        }),
        updateRetainer({ id: ret.id, data: { lastInvoiced: today.toISOString().split('T')[0] } }),
      ]),
      { loading: 'Generating invoice…', success: `Invoice created for ${ret.clientName}!`, error: 'Failed to create invoice' }
    )
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete retainer for "${name}"?`)) return
    await toast.promise(deleteRetainer(id), { loading: '…', success: 'Retainer deleted', error: 'Failed' })
  }

  const activeRetainers = retainers.filter(r => r.active)

  return (
    <DashboardShell title="Retainers">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Retainer Billing</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {activeRetainers.length} active · {formatCurrency(monthlyTotal)}/mo recurring
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>New Retainer</Button>
      </div>

      {/* MRR card */}
      <Card className="mb-6 flex items-center gap-4 bg-gradient-to-r from-brand-600 to-accent-600 border-0">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <RefreshCw size={24} className="text-white" />
        </div>
        <div className="text-white">
          <p className="text-sm opacity-80">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(monthlyTotal)}</p>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : retainers.length === 0 ? (
        <Card className="py-16 text-center">
          <RefreshCw size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No retainers set up yet.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {retainers.map((ret, i) => (
            <motion.div key={ret.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white">{ret.clientName}</p>
                  {ret.clientEmail && <p className="text-xs text-ink-400">{ret.clientEmail}</p>}
                </div>
                <Badge variant={ret.active ? 'success' : 'default'} dot>{ret.active ? 'Active' : 'Paused'}</Badge>
              </div>

              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-1">{formatCurrency(ret.amount)}<span className="text-sm text-ink-400 font-normal">/mo</span></p>
              <p className="text-xs text-ink-500 mb-1">Bills on day {ret.billingDay} of each month</p>
              {ret.lastInvoiced && (
                <p className="text-xs text-ink-400 mb-3">Last invoiced: {formatDate(ret.lastInvoiced, 'MMM d, yyyy')}</p>
              )}
              {ret.description && <p className="text-xs text-ink-500 mb-3 line-clamp-2">{ret.description}</p>}

              <div className="flex gap-2 pt-2 border-t border-ink-100 dark:border-ink-800 flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => handleGenerateInvoice({ id: ret.id!, clientName: ret.clientName, clientEmail: ret.clientEmail, amount: ret.amount, description: ret.description })}>
                  Generate Invoice
                </Button>
                <button onClick={() => toggleActive(ret.id!, ret.active)} className="p-1.5 text-ink-400 hover:text-brand-600 transition-colors">
                  {ret.active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => handleDelete(ret.id!, ret.clientName)} className="p-1.5 text-ink-300 hover:text-red-500 transition-colors ml-auto">
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Retainer" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Client name" placeholder="Acme Corp" {...register('clientName')} error={errors.clientName?.message} />
          <Input label="Client email (optional)" type="email" placeholder="billing@acme.com" {...register('clientEmail')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly amount ($)" type="number" step="0.01" placeholder="2000" {...register('amount')} error={errors.amount?.message} />
            <Input label="Billing day (1–28)" type="number" min="1" max="28" {...register('billingDay')} error={errors.billingDay?.message} />
          </div>
          <Input label="Start date" type="date" {...register('startDate')} error={errors.startDate?.message} />
          <Input label="Description (optional)" placeholder="Monthly marketing retainer" {...register('description')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Create Retainer</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
