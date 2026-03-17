import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById, deleteDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { COLLECTIONS, SUB_COLLECTIONS } from '@/constants/firestore'
import type { Business, Service, BusinessHours } from '@/types/business.types'

const isDemoId = (id: string) => id.includes('demo-biz-') || id.includes('demo-uid-')

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const DEFAULT_HOURS: Omit<BusinessHours, 'id'>[] = DAYS.map(day => ({
  day,
  openTime:  '09:00',
  closeTime: '18:00',
  isClosed:  day === 'Sunday',
}))

export function useBusinessSetup() {
  const user       = useAuthStore(s => s.user)
  const businessId = user?.businessId ?? ''
  const qc         = useQueryClient()

  // ── Business Profile ─────────────────────────────────────────────────────
  const [business, setBusiness] = useState<Business | null>(null)
  const [bizLoading, setBizLoading] = useState(true)

  useEffect(() => {
    if (!businessId || isDemoId(businessId)) { setBizLoading(false); return }
    getDoc(doc(db, COLLECTIONS.BUSINESSES, businessId))
      .then(snap => { if (snap.exists()) setBusiness({ id: snap.id, ...snap.data() } as Business) })
      .catch(() => {})
      .finally(() => setBizLoading(false))
  }, [businessId])

  const saveBusiness = async (data: Partial<Business>) => {
    if (!businessId || isDemoId(businessId)) return
    await setDoc(
      doc(db, COLLECTIONS.BUSINESSES, businessId),
      { ...data, ownerId: user?.uid, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {})
    setBusiness(prev => ({ ...(prev ?? {} as Business), ...data }))
  }

  // ── Services ─────────────────────────────────────────────────────────────
  const servicesPath = subColPath(businessId, SUB_COLLECTIONS.SERVICES)

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', businessId],
    queryFn:  () => fetchCollection<Service>(servicesPath, [orderBy('name')]),
    enabled:  !!businessId,
  })

  const createServiceMutation = useMutation({
    mutationFn: (data: Omit<Service, 'id'>) => createDoc(servicesPath, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['services', businessId] }),
  })

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      updateDocById(servicesPath, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', businessId] }),
  })

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(servicesPath, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['services', businessId] }),
  })

  // ── Business Hours ────────────────────────────────────────────────────────
  const hoursPath = subColPath(businessId, SUB_COLLECTIONS.BUSINESS_HOURS)

  const { data: hours = [], isLoading: hoursLoading } = useQuery({
    queryKey: ['business-hours', businessId],
    queryFn:  async () => {
      const existing = await fetchCollection<BusinessHours>(hoursPath, [])
      if (existing.length > 0) return existing
      // Seed default hours if none exist
      await Promise.all(DEFAULT_HOURS.map(h => createDoc(hoursPath, h)))
      return fetchCollection<BusinessHours>(hoursPath, [])
    },
    enabled: !!businessId,
  })

  const updateHoursMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BusinessHours> }) =>
      updateDocById(hoursPath, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-hours', businessId] }),
  })

  return {
    business,
    bizLoading,
    saveBusiness,
    services,
    servicesLoading,
    createService:  createServiceMutation.mutateAsync,
    updateService:  updateServiceMutation.mutateAsync,
    deleteService:  deleteServiceMutation.mutateAsync,
    hours,
    hoursLoading,
    updateHours:    updateHoursMutation.mutateAsync,
    isLoading:      bizLoading || servicesLoading || hoursLoading,
  }
}
