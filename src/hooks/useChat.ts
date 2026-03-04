import { useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { routeAI } from '@/utils/aiRouter'
import { sendOpenAIMessage, type BookingAction } from '@/lib/openai'
import { sendWatsonXMessage } from '@/lib/watsonx'
import { useBookings } from '@/hooks/useBookings'
import { useBusinessContext } from '@/hooks/useBusinessContext'
import type { ChatMessage } from '@/types/ai.types'

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function useChat() {
  const { messages, isStreaming, isOpen, addMessage, updateLastMessage, setStreaming, toggleChat, clearMessages } =
    useChatStore()
  const user = useAuthStore(s => s.user)

  // Live business data for context + actions
  const { buildContext } = useBusinessContext()
  const { createBooking, updateBooking } = useBookings()

  // Action handler — called by OpenAI when it decides to use a tool
  const handleAction = useCallback(async (action: BookingAction): Promise<string> => {
    try {
      if (action.type === 'create_booking') {
        await createBooking({
          customerName:  action.customerName,
          customerPhone: action.customerPhone ?? '',
          serviceName:   action.serviceName,
          date:          action.date,
          startTime:     action.startTime,
          endTime:       action.startTime,
          amount:        action.amount,
          notes:         action.notes ?? '',
          customerId:    '',
          serviceId:     '',
        })
        return `SUCCESS: Booking created — ${action.customerName} / ${action.serviceName} on ${action.date} at ${action.startTime} ($${action.amount})`
      }

      if (action.type === 'update_booking_status') {
        const extra = action.status === 'completed' ? { paymentStatus: 'paid' as const } : {}
        await updateBooking({ id: action.bookingId, data: { status: action.status, ...extra } })
        return `SUCCESS: Booking ${action.bookingId} updated to status "${action.status}"`
      }

      return 'ERROR: Unknown action type'
    } catch (err) {
      return `ERROR: ${err instanceof Error ? err.message : String(err)}`
    }
  }, [createBooking, updateBooking])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id:        generateId(),
      role:      'user',
      content,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setStreaming(true)

    // Build rich business context from live data
    const businessContext = user?.businessId ? buildContext() : undefined

    const provider = routeAI(content)
    const history  = [...messages, userMsg]

    // Placeholder assistant message for streaming
    const assistantId = generateId()
    addMessage({
      id:        assistantId,
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
      provider,
    })

    try {
      if (provider === 'openai') {
        await sendOpenAIMessage(
          history,
          (chunk) => updateLastMessage(assistantId, chunk),
          businessContext,
          handleAction,
        )
      } else {
        await sendWatsonXMessage(
          history,
          (chunk) => updateLastMessage(assistantId, chunk),
          businessContext,
        )
      }
    } catch {
      updateLastMessage(assistantId, 'Sorry, I encountered an error. Please try again.')
    } finally {
      setStreaming(false)
    }
  }, [messages, isStreaming, addMessage, updateLastMessage, setStreaming, buildContext, handleAction, user])

  return { messages, isStreaming, isOpen, sendMessage, toggleChat, clearMessages }
}
