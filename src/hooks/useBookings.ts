import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  createDoc, updateDocById, deleteDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { Booking, CreateBookingData } from '@/types/booking.types'

export function useBookings() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc   = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.BOOKINGS)

  // Real-time subscription — updates immediately when Firestore changes
  const { data: bookings, isLoading } = useRealtimeCollection<Booking>(
    path,
    [orderBy('date', 'desc')],
    !!businessId,
  )

  const createMutation = useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const id = await createDoc(path, {
        ...data,
        businessId,
        status:        'pending' as const,
        paymentStatus: 'unpaid'  as const,
      })
      // Push notification (fire-and-forget)
      if (businessId) {
        createDoc(subColPath(businessId, 'notifications'), {
          type:    'booking',
          title:   'New Booking Created',
          message: `${data.customerName} booked ${data.serviceName} for ${data.date} at ${data.startTime}`,
          read:    false,
        }).catch(() => {})
      }
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
      updateDocById(path, id, data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
  })

  return {
    bookings,
    isLoading,
    createBooking: createMutation.mutateAsync,
    updateBooking: updateMutation.mutateAsync,
    deleteBooking: deleteMutation.mutateAsync,
    isCreating:    createMutation.isPending,
  }
}
