// Before / After Client Photos — Hair Salon · Beauty Spa · Event Planning
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Trash2, Search, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Modal, Input, Spinner } from '@/components/ui'
import { useClientPhotos } from '@/hooks/useClientPhotos'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const schema = z.object({
  clientName:  z.string().min(2, 'Client name required'),
  serviceName: z.string().optional(),
  serviceDate: z.string().min(1, 'Date required'),
  notes:       z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ClientPhotosPage() {
  const { photos, byClient, isLoading, addPhoto, deletePhoto, isUploading } = useClientPhotos()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef  = useRef<HTMLInputElement>(null)
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile,  setAfterFile]  = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState<string | null>(null)
  const [afterPreview,  setAfterPreview]  = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { serviceDate: new Date().toISOString().split('T')[0] },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, slot: 'before' | 'after') {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (slot === 'before') { setBeforeFile(file); setBeforePreview(url) }
    else                   { setAfterFile(file);  setAfterPreview(url)  }
  }

  async function onSubmit(data: FormData) {
    if (!beforeFile) { toast.error('Upload a before photo'); return }
    await toast.promise(
      addPhoto({ ...data, beforeFile, afterFile: afterFile ?? undefined }),
      { loading: 'Uploading photos…', success: 'Photos saved!', error: 'Upload failed' }
    )
    reset()
    setBeforeFile(null); setAfterFile(null)
    setBeforePreview(null); setAfterPreview(null)
    setShowNew(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this photo record?')) return
    await toast.promise(deletePhoto(id), { loading: '…', success: 'Deleted', error: 'Failed' })
  }

  function closeNew() {
    setShowNew(false); reset()
    setBeforeFile(null); setAfterFile(null)
    setBeforePreview(null); setAfterPreview(null)
  }

  const filteredClients = Object.entries(byClient).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardShell title="Client Photos">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Before & After Gallery</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            {photos.length} photos · {Object.keys(byClient).length} clients
          </p>
        </div>
        <Button icon={<Camera size={14} />} onClick={() => setShowNew(true)}>Add Photos</Button>
      </div>

      <div className="mb-5">
        <Input
          placeholder="Search clients…"
          icon={<Search size={16} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filteredClients.length === 0 ? (
        <Card className="py-16 text-center">
          <Camera size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">No photos yet.</p>
          <p className="text-xs text-ink-400">Upload before & after photos to showcase your work.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredClients.map(([clientName, clientPhotos]) => (
            <div key={clientName}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-ink-400" />
                <h3 className="font-semibold text-ink-900 dark:text-white">{clientName}</h3>
                <span className="text-xs text-ink-400">({clientPhotos.length})</span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {clientPhotos.map((photo, i) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card overflow-hidden"
                  >
                    {/* Before / After images */}
                    <div className="grid grid-cols-2 gap-1">
                      <div className="relative">
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-black/50 text-white rounded px-1.5 py-0.5">BEFORE</span>
                        <img
                          src={photo.beforeUrl}
                          alt="Before"
                          className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightbox(photo.beforeUrl)}
                        />
                      </div>
                      <div className="relative bg-ink-100 dark:bg-ink-800 flex items-center justify-center">
                        {photo.afterUrl ? (
                          <>
                            <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-emerald-600/80 text-white rounded px-1.5 py-0.5">AFTER</span>
                            <img
                              src={photo.afterUrl}
                              alt="After"
                              className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightbox(photo.afterUrl!)}
                            />
                          </>
                        ) : (
                          <p className="text-xs text-ink-400 text-center px-2">No after photo</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          {photo.serviceName && (
                            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{photo.serviceName}</p>
                          )}
                          <p className="text-xs text-ink-400">{formatDate(photo.serviceDate, 'MMM d, yyyy')}</p>
                          {photo.notes && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{photo.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDelete(photo.id!)}
                          className="p-1.5 text-ink-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showNew} onClose={closeNew} title="Add Before & After Photos" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Client name" placeholder="Jane Smith" {...register('clientName')} error={errors.clientName?.message} />
            <Input label="Service (optional)" placeholder="Balayage" {...register('serviceName')} />
            <div className="col-span-2">
              <Input label="Service date" type="date" {...register('serviceDate')} error={errors.serviceDate?.message} />
            </div>
          </div>

          {/* Photo upload areas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Before */}
            <div>
              <label className="label">Before photo <span className="text-red-500">*</span></label>
              <div
                onClick={() => beforeRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl cursor-pointer transition-colors h-36 overflow-hidden flex items-center justify-center',
                  beforePreview ? 'border-transparent' : 'border-ink-200 dark:border-ink-700 hover:border-brand-400'
                )}
              >
                {beforePreview ? (
                  <img src={beforePreview} alt="Before preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload size={24} className="text-ink-300 mx-auto mb-2" />
                    <p className="text-xs text-ink-400">Click to upload</p>
                  </div>
                )}
              </div>
              <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'before')} />
            </div>

            {/* After */}
            <div>
              <label className="label">After photo (optional)</label>
              <div
                onClick={() => afterRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl cursor-pointer transition-colors h-36 overflow-hidden flex items-center justify-center',
                  afterPreview ? 'border-transparent' : 'border-ink-200 dark:border-ink-700 hover:border-emerald-400'
                )}
              >
                {afterPreview ? (
                  <img src={afterPreview} alt="After preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload size={24} className="text-ink-300 mx-auto mb-2" />
                    <p className="text-xs text-ink-400">Click to upload</p>
                  </div>
                )}
              </div>
              <input ref={afterRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'after')} />
            </div>
          </div>

          <Input label="Notes (optional)" placeholder="Technique used, client feedback…" {...register('notes')} />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={closeNew}>Cancel</Button>
            <Button className="flex-1" type="submit" loading={isUploading} icon={<Camera size={14} />}>Save Photos</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  )
}
