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
  const invoicePath = subColPath(businessId, SUB_COLLECTIONS.INVOICES)

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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Booking> }) => {
      await updateDocById(path, id, data)

      // Auto-create invoice when payment is marked as paid
      if (data.paymentStatus === 'paid') {
        const booking = bookings?.find(b => b.id === id)
        if (booking && !booking.invoiceCreated) {
          const dueDate = new Date()
          const subtotal = booking.amount ?? 0
          const tax      = Math.round(subtotal * 0.1 * 100) / 100
          const total    = subtotal + tax
          await createDoc(invoicePath, {
            businessId,
            customerName:  booking.customerName,
            customerEmail: booking.customerEmail ?? null,
            items: [{
              description: booking.serviceName,
              quantity:    1,
              unitPrice:   subtotal,
            }],
            subtotal,
            tax,
            total,
            dueDate:   dueDate.toISOString().split('T')[0],
            status:    'paid' as const,
            pdfUrl:    null,
            notes:     `Auto-generated from booking on ${booking.date} at ${booking.startTime}`,
          })
          await updateDocById(path, id, { invoiceCreated: true })
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices', businessId] }),
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
