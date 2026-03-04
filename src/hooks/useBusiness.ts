import { useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useBusinessStore } from '@/store/businessStore'
import { COLLECTIONS, SUB_COLLECTIONS } from '@/constants/firestore'
import type { Business, Service } from '@/types/business.types'
import { fetchCollection } from '@/lib/firestore'

export function useBusiness() {
  const businessId = useAuthStore(s => s.user?.businessId)
  const { business, services, setBusiness, setServices, setLoading } = useBusinessStore()

  useEffect(() => {
    if (!businessId) return
    setLoading(true)

    const unsubBiz = onSnapshot(
      doc(db, COLLECTIONS.BUSINESSES, businessId),
      snap => {
        if (snap.exists()) {
          setBusiness({ id: snap.id, ...snap.data() } as Business)
        }
        setLoading(false)
      }
    )

    // Load services
    const servicesPath = `${COLLECTIONS.BUSINESSES}/${businessId}/${SUB_COLLECTIONS.SERVICES}`
    fetchCollection<Service>(servicesPath).then(setServices).catch(console.error)

    return () => unsubBiz()
  }, [businessId, setBusiness, setServices, setLoading])

  return { business, services }
}
