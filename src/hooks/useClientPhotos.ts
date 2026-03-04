// Before/After Client Photos — Hair Salon, Beauty Spa, Event Planning
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { storage } from '@/lib/firebase'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export interface ClientPhoto {
  id?:          string
  businessId:   string
  clientName:   string
  serviceName?: string
  serviceDate:  string
  beforeUrl:    string
  afterUrl?:    string
  notes?:       string
  createdAt?:   unknown
}

export function useClientPhotos() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.CLIENT_PHOTOS)

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['clientPhotos', businessId],
    queryFn:  () => fetchCollection<ClientPhoto>(path, [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  /** Upload a file to Firebase Storage and return the public download URL */
  async function uploadPhoto(file: File, slot: 'before' | 'after', clientName: string): Promise<string> {
    const ts      = Date.now()
    const safeName = clientName.replace(/\s+/g, '_').toLowerCase()
    const storageRef = ref(storage, `businesses/${businessId}/clientPhotos/${safeName}_${slot}_${ts}`)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  }

  const createMutation = useMutation({
    mutationFn: async (data: {
      clientName:   string
      serviceName?: string
      serviceDate:  string
      beforeFile:   File
      afterFile?:   File
      notes?:       string
    }) => {
      const beforeUrl = await uploadPhoto(data.beforeFile, 'before', data.clientName)
      const afterUrl  = data.afterFile
        ? await uploadPhoto(data.afterFile, 'after', data.clientName)
        : undefined
      return createDoc(path, {
        businessId,
        clientName:   data.clientName,
        serviceName:  data.serviceName,
        serviceDate:  data.serviceDate,
        beforeUrl,
        afterUrl,
        notes:        data.notes,
      } satisfies Omit<ClientPhoto, 'id' | 'createdAt'>)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientPhotos', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['clientPhotos', businessId] }),
  })

  // Group photos by client name for gallery view
  const byClient = photos.reduce<Record<string, ClientPhoto[]>>((acc, p) => {
    const key = p.clientName
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return {
    photos, byClient, isLoading,
    addPhoto:     createMutation.mutateAsync,
    deletePhoto:  deleteMutation.mutateAsync,
    isUploading:  createMutation.isPending,
  }
}
