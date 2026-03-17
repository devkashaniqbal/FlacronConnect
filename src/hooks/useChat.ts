import { useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { routeAI } from '@/utils/aiRouter'
import { sendOpenAIMessage, type ManagerAction } from '@/lib/openai'
import { sendWatsonXMessage } from '@/lib/watsonx'
import { useBookings } from '@/hooks/useBookings'
import { useEmployees } from '@/hooks/useEmployees'
import { useAttendance } from '@/hooks/useAttendance'
import { useInvoices } from '@/hooks/useInvoices'
import { usePayroll } from '@/hooks/usePayroll'
import { useBusinessSetup } from '@/hooks/useBusinessSetup'
import { useBusinessContext } from '@/hooks/useBusinessContext'
import type { ChatMessage } from '@/types/ai.types'

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// Returns true for demo business IDs — write operations are simulated
function isDemo(businessId: string | null | undefined): boolean {
  return !!businessId?.startsWith('demo-biz-')
}

export function useChat() {
  const { messages, isStreaming, isOpen, addMessage, updateLastMessage, setStreaming, toggleChat, clearMessages } =
    useChatStore()
  const user = useAuthStore(s => s.user)

  // Live business data for context
  const { buildContext } = useBusinessContext()

  // All data hooks — active whenever the chat is mounted
  const { createBooking, updateBooking, deleteBooking } = useBookings()
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployees()
  const { clockIn, clockOut } = useAttendance()
  const { createInvoice } = useInvoices()
  const { runPayroll } = usePayroll()
  const { saveBusiness, createService, updateService } = useBusinessSetup()

  // ── Universal action handler ─────────────────────────────────────────────────
  const handleAction = useCallback(async (action: ManagerAction): Promise<string> => {
    const demo = isDemo(user?.businessId)

    try {
      // ── Bookings ────────────────────────────────────────────────────────────
      if (action.type === 'create_booking') {
        if (!demo) {
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
        }
        return `SUCCESS: Booking created — ${action.customerName} / ${action.serviceName} on ${action.date} at ${action.startTime} ($${action.amount})`
      }

      if (action.type === 'update_booking_status') {
        if (!demo) {
          const extra = action.status === 'completed' ? { paymentStatus: 'paid' as const } : {}
          await updateBooking({ id: action.bookingId, data: { status: action.status, ...extra } })
        }
        return `SUCCESS: Booking ${action.bookingId} updated to "${action.status}"`
      }

      if (action.type === 'delete_booking') {
        if (!demo) await deleteBooking(action.bookingId)
        return `SUCCESS: Booking ${action.bookingId} deleted.`
      }

      // ── Employees ───────────────────────────────────────────────────────────
      if (action.type === 'create_employee') {
        if (!demo) {
          await createEmployee({
            name:         action.name,
            role:         (action.role === 'manager' ? 'manager' : 'employee') as 'manager' | 'employee' | 'part_time',
            email:        action.email ?? '',
            phone:        action.phone ?? '',
            hourlyRate:   action.hourlyRate,
            activeStatus: true,
            hireDate:     new Date().toISOString().split('T')[0],
            userId:       null,
            avatar:       null,
            businessId:   user?.businessId ?? '',
          })
        }
        return `SUCCESS: Employee "${action.name}" added as ${action.role} at $${action.hourlyRate}/hr.`
      }

      if (action.type === 'update_employee') {
        const { employeeId, type: _, role, ...rest } = action
        const updates: Record<string, unknown> = { ...rest }
        if (role) updates.role = role as 'manager' | 'employee' | 'part_time'
        if (!demo) await updateEmployee({ id: employeeId, data: updates })
        return `SUCCESS: Employee ${employeeId} updated — ${Object.keys(updates).join(', ')}.`
      }

      if (action.type === 'delete_employee') {
        if (!demo) await deleteEmployee(action.employeeId)
        return `SUCCESS: Employee ${action.employeeId} removed.`
      }

      // ── Attendance ──────────────────────────────────────────────────────────
      if (action.type === 'clock_in_employee') {
        if (!demo) {
          await clockIn({
            employeeId:   action.employeeId,
            employeeName: action.employeeName,
            date:         action.date,
          })
        }
        return `SUCCESS: ${action.employeeName} clocked in at ${new Date().toLocaleTimeString()} on ${action.date}.`
      }

      if (action.type === 'clock_out_employee') {
        if (!demo) {
          await clockOut({ recordId: action.recordId, clockIn: action.clockIn })
        }
        return `SUCCESS: Employee clocked out. Record ${action.recordId} updated.`
      }

      // ── Invoices ────────────────────────────────────────────────────────────
      if (action.type === 'create_invoice') {
        const subtotal = action.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
        const total    = subtotal * 1.1
        if (!demo) {
          await createInvoice({
            customerName:  action.customerName,
            customerEmail: action.customerEmail,
            items:         action.items,
            dueDate:       action.dueDate,
            notes:         action.notes,
          })
        }
        return `SUCCESS: Invoice created for ${action.customerName} — ${action.items.length} item(s), total $${total.toFixed(2)}, due ${action.dueDate}.`
      }

      // ── Payroll ─────────────────────────────────────────────────────────────
      if (action.type === 'run_payroll') {
        if (!demo) {
          const results = await runPayroll({ periodStart: action.periodStart, periodEnd: action.periodEnd })
          const totalNet = results.reduce((s, r) => s + r.netPay, 0)
          return `SUCCESS: Payroll run for ${action.periodStart} – ${action.periodEnd}. ${results.length} employee(s) processed. Total net payout: $${totalNet.toFixed(2)}.`
        }
        return `DEMO: Payroll simulated for ${action.periodStart} – ${action.periodEnd}.`
      }

      // ── Business Config ─────────────────────────────────────────────────────
      if (action.type === 'update_business_info') {
        const { type: _, ...updates } = action
        if (!demo) await saveBusiness(updates)
        return `SUCCESS: Business info updated — ${Object.keys(updates).join(', ')}.`
      }

      if (action.type === 'create_service') {
        if (!demo) {
          await createService({
            name:        action.name,
            price:       action.price,
            duration:    action.duration ?? 60,
            description: action.description ?? '',
            category:    'General',
            active:      true,
          })
        }
        return `SUCCESS: Service "${action.name}" added at $${action.price}.`
      }

      if (action.type === 'update_service') {
        const { serviceId, type: _, ...updates } = action
        if (!demo) await updateService({ id: serviceId, data: updates })
        return `SUCCESS: Service ${serviceId} updated — ${Object.keys(updates).join(', ')}.`
      }

      return 'ERROR: Unknown action type.'
    } catch (err) {
      return `ERROR: ${err instanceof Error ? err.message : String(err)}`
    }
  }, [
    user,
    createBooking, updateBooking, deleteBooking,
    createEmployee, updateEmployee, deleteEmployee,
    clockIn, clockOut,
    createInvoice,
    runPayroll,
    saveBusiness, createService, updateService,
  ])

  // ── Send message ──────────────────────────────────────────────────────────────
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

    const businessContext = user?.businessId ? buildContext() : undefined
    const provider  = routeAI(content)
    const history   = [...messages, userMsg]

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
