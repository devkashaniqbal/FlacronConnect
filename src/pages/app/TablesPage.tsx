// Table Reservations + Waitlist — Restaurant / Café
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, UtensilsCrossed, Users, ClipboardList } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Input, Spinner } from '@/components/ui'
import { useTables, type TableStatus, type WaitlistEntry } from '@/hooks/useTables'
import { createDoc, subColPath } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCollection, orderBy, updateDocById } from '@/lib/firestore'
import { cn } from '@/utils/cn'

const statusColors: Record<TableStatus, 'success' | 'danger' | 'warning' | 'default'> = {
  available: 'success',
  occupied:  'danger',
  reserved:  'warning',
  cleaning:  'default',
}

const tableSchema = z.object({
  number:   z.coerce.number().min(1),
  capacity: z.coerce.number().min(1),
  zone:     z.string().optional(),
})

const waitlistSchema = z.object({
  name:      z.string().min(2),
  phone:     z.string().optional(),
  partySize: z.coerce.number().min(1),
})

type TableForm     = z.infer<typeof tableSchema>
type WaitlistForm  = z.infer<typeof waitlistSchema>

export function TablesPage() {
  const { tables, isLoading, createTable, updateTable, deleteTable, isCreating } = useTables()
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const waitlistPath = subColPath(businessId, SUB_COLLECTIONS.WAITLIST)

  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist', businessId],
    queryFn:  () => fetchCollection<WaitlistEntry>(waitlistPath, [orderBy('addedAt')]),
    enabled:  !!businessId,
  })

  const [activeTab, setActiveTab] = useState<'tables' | 'waitlist'>('tables')
  const [showNewTable, setShowNewTable] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)

  const { register: rTable, handleSubmit: hsTable, reset: resetTable, formState: { errors: eTable } } = useForm<TableForm>({ resolver: zodResolver(tableSchema) })
  const { register: rWait, handleSubmit: hsWait, reset: resetWait, formState: { errors: eWait } } = useForm<WaitlistForm>({ resolver: zodResolver(waitlistSchema), defaultValues: { partySize: 2 } })

  async function onCreateTable(data: TableForm) {
    await toast.promise(
      createTable({ ...data, status: 'available', businessId: '' }),
      { loading: 'Adding table…', success: 'Table added!', error: 'Failed' }
    )
    resetTable(); setShowNewTable(false)
  }

  async function onAddWaitlist(data: WaitlistForm) {
    await toast.promise(
      createDoc(waitlistPath, { ...data, businessId, addedAt: new Date().toISOString(), notified: false, seated: false }),
      { loading: 'Adding to waitlist…', success: 'Added to waitlist!', error: 'Failed' }
    )
    resetWait(); setShowWaitlist(false)
    qc.invalidateQueries({ queryKey: ['waitlist', businessId] })
  }

  async function handleTableStatus(id: string, status: TableStatus) {
    await toast.promise(
      updateTable({ id, data: { status } }),
      { loading: '…', success: `Table ${status}`, error: 'Failed' }
    )
  }

  async function seatFromWaitlist(entry: WaitlistEntry) {
    await updateDocById(waitlistPath, entry.id!, { seated: true, notified: true })
    qc.invalidateQueries({ queryKey: ['waitlist', businessId] })
    toast.success(`${entry.name} seated!`)
  }

  const available = tables.filter(t => t.status === 'available').length
  const pending   = waitlist.filter(w => !w.seated).length

  return (
    <DashboardShell title="Tables">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Floor & Waitlist</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {available} available · {pending} waiting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<ClipboardList size={14} />} onClick={() => setShowWaitlist(true)}>
            Add to Waitlist
          </Button>
          <Button icon={<Plus size={14} />} onClick={() => setShowNewTable(true)}>Add Table</Button>
        </div>
      </div>

      {/* Tab */}
      <div className="flex p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit mb-6 gap-1">
        {(['tables', 'waitlist'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === t ? 'bg-white dark:bg-ink-700 text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
            )}>
            {t}{t === 'waitlist' && pending > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-brand-500 text-white text-xs rounded-full">{pending}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'tables' ? (
        isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> :
        tables.length === 0 ? (
          <Card className="py-16 text-center">
            <UtensilsCrossed size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No tables set up yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table, i) => (
              <motion.div key={table.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className="card p-4 text-center">
                <p className="text-3xl font-bold text-ink-900 dark:text-white mb-1">#{table.number}</p>
                <p className="text-xs text-ink-400 flex items-center justify-center gap-1 mb-2">
                  <Users size={11} /> {table.capacity} seats
                  {table.zone && ` · ${table.zone}`}
                </p>
                <Badge variant={statusColors[table.status]} dot className="mb-3">{table.status}</Badge>
                <div className="flex flex-col gap-1.5">
                  {table.status === 'available' && (
                    <Button size="sm" variant="ghost" onClick={() => handleTableStatus(table.id!, 'occupied')}>Seat</Button>
                  )}
                  {table.status === 'occupied' && (
                    <Button size="sm" variant="ghost" onClick={() => handleTableStatus(table.id!, 'cleaning')}>Clear</Button>
                  )}
                  {table.status === 'cleaning' && (
                    <Button size="sm" variant="ghost" onClick={() => handleTableStatus(table.id!, 'available')}>Ready</Button>
                  )}
                  {table.status !== 'reserved' && (
                    <Button size="sm" variant="ghost" onClick={() => handleTableStatus(table.id!, 'reserved')}>Reserve</Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <Card>
          {waitlist.filter(w => !w.seated).length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList size={36} className="text-ink-300 mx-auto mb-3" />
              <p className="text-ink-500">Waitlist is empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitlist.filter(w => !w.seated).map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-800/50">
                  <div>
                    <p className="font-medium text-ink-900 dark:text-white">{entry.name}</p>
                    <p className="text-xs text-ink-500 flex items-center gap-1">
                      <Users size={11} /> Party of {entry.partySize}
                      {entry.phone && ` · ${entry.phone}`}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => seatFromWaitlist(entry)}>Seat Now</Button>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={showNewTable} onClose={() => setShowNewTable(false)} title="Add Table" size="sm">
        <form onSubmit={hsTable(onCreateTable)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Table #" type="number" min="1" placeholder="1" {...rTable('number')} error={eTable.number?.message} />
            <Input label="Capacity (seats)" type="number" min="1" placeholder="4" {...rTable('capacity')} error={eTable.capacity?.message} />
            <div className="col-span-2">
              <Input label="Zone (optional)" placeholder="Indoor / Patio / Bar" {...rTable('zone')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNewTable(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isCreating}>Add Table</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} title="Add to Waitlist" size="sm">
        <form onSubmit={hsWait(onAddWaitlist)} className="space-y-4">
          <Input label="Guest name" placeholder="Johnson" {...rWait('name')} error={eWait.name?.message} />
          <Input label="Party size" type="number" min="1" {...rWait('partySize')} error={eWait.partySize?.message} />
          <Input label="Phone (optional)" placeholder="555-0100" {...rWait('phone')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowWaitlist(false)}>Cancel</Button>
            <Button className="flex-1" type="submit">Add to Waitlist</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
