import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Download, Plus, Search, Trash2, FileEdit } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Spinner } from '@/components/ui'
import { Input } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useInvoices } from '@/hooks/useInvoices'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'
import type { Invoice } from '@/types/payment.types'

const statusColors: Record<string, 'success' | 'info' | 'danger' | 'default' | 'warning'> = {
  paid:    'success',
  sent:    'info',
  overdue: 'danger',
  draft:   'default',
  quote:   'warning',
}

const lineItem = z.object({
  description: z.string().min(1),
  quantity:    z.coerce.number().min(1),
  unitPrice:   z.coerce.number().min(0.01),
})
const schema = z.object({
  customerName:  z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  dueDate:       z.string().min(1),
  notes:         z.string().optional(),
  items:         z.array(lineItem).min(1),
})
type FormData = z.infer<typeof schema>

export function InvoicesPage() {
  const { invoices, isLoading, createInvoice, updateStatus, downloadPDF, isCreating } = useInvoices()
  const hasQuoteToInvoice = useIndustryFeature('quoteToInvoice')
  const [search, setSearch]     = useState('')
  const [showNew, setShowNew]   = useState(false)
  const [saveAsQuote, setSaveAsQuote] = useState(false)
  const [preview, setPreview]   = useState<Invoice | null>(null)

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ description: '', quantity: 1, unitPrice: 0 }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const subtotal = watchedItems?.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0) ?? 0
  const tax      = subtotal * 0.1
  const total    = subtotal + tax

  const filtered = invoices.filter(inv =>
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.id?.toLowerCase().includes(search.toLowerCase())
  )

  async function onSubmit(data: FormData) {
    const label = saveAsQuote ? 'Quote saved!' : 'Invoice created!'
    await toast.promise(
      createInvoice({ ...(data as Parameters<typeof createInvoice>[0]), status: saveAsQuote ? 'quote' : 'draft' }),
      { loading: saveAsQuote ? 'Saving quote…' : 'Creating invoice…', success: label, error: 'Failed' }
    )
    reset()
    setSaveAsQuote(false)
    setShowNew(false)
  }

  async function convertQuoteToInvoice(id: string) {
    await toast.promise(
      updateStatus({ id, status: 'draft' }),
      { loading: 'Converting…', success: 'Quote converted to invoice!', error: 'Failed' }
    )
  }

  return (
    <DashboardShell title="Invoices">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Invoices</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {invoices.filter(i => i.status === 'paid').length} paid · {invoices.length} total
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Create Invoice</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search invoices…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No invoices yet. Create your first invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Invoice', 'Customer', 'Date', 'Due', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                {filtered.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-brand-500" />
                        <span className="font-mono text-sm font-medium text-ink-900 dark:text-white">
                          #{inv.id?.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300">{inv.customerName}</td>
                    <td className="py-3 pr-4 text-sm text-ink-500">{formatDate(inv.createdAt as string, 'MMM d')}</td>
                    <td className="py-3 pr-4 text-sm text-ink-500">{formatDate(inv.dueDate, 'MMM d')}</td>
                    <td className="py-3 pr-4">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{formatCurrency(inv.total)}</p>
                      <p className="text-xs text-ink-400">tax {formatCurrency(inv.tax)}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusColors[inv.status] ?? 'default'}>{inv.status}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1 flex-wrap">
                        {inv.status === 'quote' && hasQuoteToInvoice && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<FileEdit size={13} />}
                            onClick={() => convertQuoteToInvoice(inv.id!)}
                          >
                            Convert
                          </Button>
                        )}
                        {inv.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toast.promise(
                              updateStatus({ id: inv.id!, status: 'sent' }),
                              { loading: '…', success: 'Marked as sent', error: 'Failed' }
                            )}
                          >
                            Send
                          </Button>
                        )}
                        {inv.status === 'sent' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toast.promise(
                              updateStatus({ id: inv.id!, status: 'paid' }),
                              { loading: '…', success: 'Marked as paid!', error: 'Failed' }
                            )}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Download size={13} />}
                          onClick={() => downloadPDF(inv)}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer name" placeholder="Sarah Johnson" {...register('customerName')} error={errors.customerName?.message} />
            <Input label="Customer email (optional)" type="email" placeholder="sarah@example.com" {...register('customerEmail')} />
            <Input label="Due date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label">Line Items</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Plus size={13} />}
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-6">
                    <Input placeholder="Description" {...register(`items.${i}.description`)} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Qty" type="number" min="1" {...register(`items.${i}.quantity`)} />
                  </div>
                  <div className="col-span-3">
                    <Input placeholder="Price ($)" type="number" step="0.01" {...register(`items.${i}.unitPrice`)} />
                  </div>
                  <div className="col-span-1 pt-2">
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="p-1.5 text-ink-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-ink-50 dark:bg-ink-800/50 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between text-ink-600 dark:text-ink-400">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-600 dark:text-ink-400">
              <span>Tax (10%)</span><span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink-900 dark:text-white pt-1 border-t border-ink-200 dark:border-ink-700">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          {hasQuoteToInvoice && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-dashed border-ink-200 dark:border-ink-700 hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={saveAsQuote}
                onChange={e => setSaveAsQuote(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-white">Save as Quote</p>
                <p className="text-xs text-ink-500">Send a quote first — convert to invoice when approved</p>
              </div>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>
              {saveAsQuote ? 'Save Quote' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
