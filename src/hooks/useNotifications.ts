import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
  subscribeToCollection, updateDocById, createDoc,
  subColPath, orderBy,
} from '@/lib/firestore'

export interface AppNotification {
  id: string
  type: 'booking' | 'payment' | 'employee' | 'chat' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: unknown
  link?: string
}

export function useNotifications() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = subColPath(businessId, 'notifications')

  useEffect(() => {
    if (!businessId) { setIsLoading(false); return }

    const unsub = subscribeToCollection<AppNotification>(
      path,
      [orderBy('createdAt', 'desc')],
      data => {
        setNotifications(data)
        setIsLoading(false)
      }
    )
    return unsub
  }, [businessId, path])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    await updateDocById(path, id, { read: true })
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read)
    await Promise.all(unread.map(n => updateDocById(path, n.id, { read: true })))
  }

  // Used by other hooks to push notifications
  async function pushNotification(
    n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
  ) {
    if (!businessId) return
    await createDoc(path, { ...n, read: false })
  }

  return { notifications, isLoading, unreadCount, markRead, markAllRead, pushNotification }
}
