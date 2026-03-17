import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Plus, Trash2, Clock, Tag, Save } from 'lucide-react'
import { LocationPicker } from '@/components/common/LocationPicker'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Modal, Spinner } from '@/components/ui'
import { Input, Select, Textarea } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'
import { BUSINESS_CATEGORIES } from '@/types/business.types'
import { useBusinessSetup } from '@/hooks/useBusinessSetup'

const bizSchema = z.object({
  name:     z.string().min(2),
  category: z.string().min(1),
  phone:    z.string().optional(),
  email:    z.string().email().optional().or(z.literal('')),
  address:  z.string().optional(),
  website:  z.string().optional(),
  description: z.string().optional(),
})
const svcSchema = z.object({
  name:        z.string().min(1),
  category:    z.string().min(1),
  duration:    z.coerce.number().min(5),
  price:       z.coerce.number().min(0),
  description: z.string().optional(),
})
type BizForm = z.infer<typeof bizSchema>
type SvcForm = z.infer<typeof svcSchema>

const tabs = [
  ['info',     'Business Info'],
  ['services', 'Services'],
  ['hours',    'Business Hours'],
] as const

export function BusinessSetupPage() {
  const {
    business, saveBusiness,
    services, servicesLoading, createService, deleteService,
    hours, hoursLoading, updateHours,
    isLoading,
  } = useBusinessSetup()

  const [activeTab, setActiveTab]     = useState<'info' | 'services' | 'hours'>('info')
  const [showNewService, setShowNewService] = useState(false)
  const [savingBiz, setSavingBiz]     = useState(false)

  const bizForm = useForm<BizForm>({
    resolver: zodResolver(bizSchema),
    values: {
      name:        business?.name        ?? '',
      category:    business?.category    ?? '',
      phone:       business?.phone       ?? '',
      email:       business?.email       ?? '',
      address:     business?.address     ?? '',
      website:     business?.website     ?? '',
      description: business?.description ?? '',
    },
  })

  const svcForm = useForm<SvcForm>({ resolver: zodResolver(svcSchema) })

  async function onSaveBiz(data: BizForm) {
    setSavingBiz(true)
    await toast.promise(saveBusiness(data), {
      loading: 'Saving…', success: 'Business info saved!', error: 'Failed to save',
    })
    setSavingBiz(false)
  }

  async function onCreateService(data: SvcForm) {
    await toast.promise(
      createService({ ...data, active: true }),
      { loading: 'Adding service…', success: 'Service added!', error: 'Failed' }
    )
    svcForm.reset()
    setShowNewService(false)
  }

  async function handleDeleteService(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await toast.promise(deleteService(id), {
      loading: 'Deleting…', success: 'Service deleted', error: 'Failed',
    })
  }

  return (
    <DashboardShell title="Business Setup">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Business Setup</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm">Configure your profile, services, and hours</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl mb-6 w-fit">
        {tabs.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setActiveTab(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === v
                ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm'
                : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Business Info ─────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <h3 className="font-semibold text-ink-900 dark:text-white">Business Information</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <form onSubmit={bizForm.handleSubmit(onSaveBiz)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Business name *" placeholder="My Salon" {...bizForm.register('name')} error={bizForm.formState.errors.name?.message} />
                  <div>
                    <label className="label">Category *</label>
                    <select {...bizForm.register('category')} className="input-base w-full">
                      <option value="">Select category…</option>
                      {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <Input label="Phone" placeholder="+1 555-0100" {...bizForm.register('phone')} />
                  <Input label="Email" type="email" placeholder="hello@mybusiness.com" {...bizForm.register('email')} />
                  <div className="sm:col-span-2">
                    <LocationPicker
                      label="Address"
                      placeholder="Pick on map or type address…"
                      value={bizForm.watch('address') ?? ''}
                      onChange={v => bizForm.setValue('address', v)}
                      error={bizForm.formState.errors.address?.message}
                    />
                  </div>
                  <Input label="Website" placeholder="https://mybusiness.com" {...bizForm.register('website')} />
                </div>
                <Textarea label="Description" placeholder="Tell customers about your business…" rows={3} {...bizForm.register('description')} />
                <Button type="submit" icon={<Save size={14} />} loading={savingBiz}>Save Changes</Button>
              </form>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── Services ──────────────────────────────────────────────── */}
      {activeTab === 'services' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-900 dark:text-white">{services.length} Services</h3>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowNewService(true)}>Add Service</Button>
          </div>

          {servicesLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : services.length === 0 ? (
            <Card className="py-12 text-center">
              <Tag size={32} className="text-ink-300 mx-auto mb-3" />
              <p className="text-ink-500">No services yet. Add your first service.</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {services.map((svc, i) => (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card p-4 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{svc.name}</p>
                      <Badge variant="default" size="sm">{svc.category}</Badge>
                    </div>
                    <button
                      onClick={() => handleDeleteService(svc.id!, svc.name)}
                      className="p-1.5 text-ink-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100 dark:border-ink-800">
                    <div className="flex items-center gap-1 text-xs text-ink-500">
                      <Clock size={12} /> {svc.duration} min
                    </div>
                    <p className="font-bold text-ink-900 dark:text-white">{formatCurrency(svc.price)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Business Hours ────────────────────────────────────────── */}
      {activeTab === 'hours' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Operating Hours</h3>
            {hoursLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="space-y-3">
                {hours.map(h => (
                  <div key={h.id} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium text-ink-700 dark:text-ink-300 flex-shrink-0">{h.day}</div>
                    <label className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={!h.isClosed}
                        onChange={e => updateHours({ id: h.id!, data: { isClosed: !e.target.checked } })}
                        className="rounded"
                      />
                      <span className="text-xs text-ink-500">{h.isClosed ? 'Closed' : 'Open'}</span>
                    </label>
                    {!h.isClosed && (
                      <>
                        <input
                          type="time"
                          value={h.openTime}
                          onChange={e => updateHours({ id: h.id!, data: { openTime: e.target.value } })}
                          className="input-base py-1.5 text-sm w-28"
                        />
                        <span className="text-ink-400 text-sm">to</span>
                        <input
                          type="time"
                          value={h.closeTime}
                          onChange={e => updateHours({ id: h.id!, data: { closeTime: e.target.value } })}
                          className="input-base py-1.5 text-sm w-28"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Add Service Modal */}
      <Modal isOpen={showNewService} onClose={() => setShowNewService(false)} title="Add Service" size="sm">
        <form onSubmit={svcForm.handleSubmit(onCreateService)} className="space-y-4">
          <Input label="Service name *" placeholder="Hair Cut & Style" {...svcForm.register('name')} error={svcForm.formState.errors.name?.message} />
          <div>
            <label className="label">Category *</label>
            <select {...svcForm.register('category')} className="input-base w-full">
              <option value="">Select…</option>
              {['Hair', 'Nails', 'Spa', 'Grooming', 'Skincare', 'Massage', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (min) *" type="number" placeholder="60" {...svcForm.register('duration')} error={svcForm.formState.errors.duration?.message} />
            <Input label="Price ($) *" type="number" step="0.01" placeholder="85" {...svcForm.register('price')} error={svcForm.formState.errors.price?.message} />
          </div>
          <Textarea label="Description" placeholder="Service description…" rows={2} {...svcForm.register('description')} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setShowNewService(false)}>Cancel</Button>
            <Button className="flex-1" type="submit">Add Service</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
