import OpenAI from 'openai'
import type { ChatMessage } from '@/types/ai.types'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

// ── Action types ───────────────────────────────────────────────────────────────
export type ManagerAction =
  // Bookings
  | { type: 'create_booking'; customerName: string; customerPhone?: string; serviceName: string; date: string; startTime: string; amount: number; notes?: string }
  | { type: 'update_booking_status'; bookingId: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }
  | { type: 'delete_booking'; bookingId: string }
  // Employees
  | { type: 'create_employee'; name: string; role: string; email?: string; phone?: string; hourlyRate: number }
  | { type: 'update_employee'; employeeId: string; name?: string; role?: string; email?: string; phone?: string; hourlyRate?: number; activeStatus?: boolean }
  | { type: 'delete_employee'; employeeId: string }
  // Attendance
  | { type: 'clock_in_employee'; employeeId: string; employeeName: string; date: string }
  | { type: 'clock_out_employee'; recordId: string; clockIn: unknown }
  // Invoices
  | { type: 'create_invoice'; customerName: string; customerEmail?: string; items: Array<{ description: string; quantity: number; unitPrice: number }>; dueDate: string; notes?: string }
  // Payroll
  | { type: 'run_payroll'; periodStart: string; periodEnd: string }
  // Business config
  | { type: 'update_business_info'; name?: string; phone?: string; email?: string; address?: string; website?: string }
  | { type: 'create_service'; name: string; price: number; duration?: number; description?: string }
  | { type: 'update_service'; serviceId: string; name?: string; price?: number; duration?: number; description?: string }

// Backward-compat alias
export type BookingAction = ManagerAction
export type ActionHandler = (action: ManagerAction) => Promise<string>

// ── System prompt ──────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are FlacronAI, the Universal AI Business Manager for FlacronControl.
You are a senior operations manager with full CRUD authority over all business modules.

YOUR DOMAINS:
1. Operations & Bookings — create, confirm, cancel, complete, or delete appointments.
2. Human Resources — add, update, or remove employees. Trigger clock-in / clock-out events.
3. Financials — generate professional invoices and run payroll for any date range.
4. Business Configuration — update operating hours, service menu, and business info.
5. Reporting — read and summarize dashboard data (revenue, bookings, employees, attendance).

EXECUTION RULES:
- You have explicit permission to create, read, update, and delete data. Act immediately when asked.
- NEVER ask for information already present in the business context.
- Identify records by name or description in the context to get their IDs before using them.
- For clock-out: look up the employee's open attendance record (clockOut = null) in the ATTENDANCE section.
- After every action, confirm what was done with the key details.
- If a required field is missing (e.g., no date for a booking), ask for it before proceeding.
- Be direct, confident, and concise — you are a manager, not a chatbot.
- Respond in the same language as the user.
- Adapt your terminology to the current industry (e.g., "patients" for clinics, "guests" for restaurants, "clients" for salons).

FORMATTING: Never use markdown. No hashtags (#), no asterisks (*), no bold, no italic, no bullet dashes. Write in plain sentences and numbered lists only. Use line breaks between sections.`

// ── Tool definitions ───────────────────────────────────────────────────────────
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  // ── Bookings ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Create a new appointment or booking for a customer',
      parameters: {
        type: 'object',
        properties: {
          customerName:  { type: 'string', description: 'Full name of the customer' },
          customerPhone: { type: 'string', description: 'Customer phone number (optional)' },
          serviceName:   { type: 'string', description: 'Name of the service or appointment type' },
          date:          { type: 'string', description: 'Date in YYYY-MM-DD format' },
          startTime:     { type: 'string', description: 'Start time in HH:MM 24-hour format' },
          amount:        { type: 'number', description: 'Price in dollars' },
          notes:         { type: 'string', description: 'Special notes or requests (optional)' },
        },
        required: ['customerName', 'serviceName', 'date', 'startTime', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_booking_status',
      description: 'Change the status of an existing booking to confirmed, completed, cancelled, or pending',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', description: 'The booking ID from the business context' },
          status:    { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'], description: 'New status' },
        },
        required: ['bookingId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_booking',
      description: 'Permanently delete a booking',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', description: 'The booking ID to delete' },
        },
        required: ['bookingId'],
      },
    },
  },
  // ── Employees ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_employee',
      description: 'Add a new employee to the business',
      parameters: {
        type: 'object',
        properties: {
          name:       { type: 'string', description: 'Full name' },
          role:       { type: 'string', description: 'Job role or title (e.g. Stylist, Manager, Technician)' },
          email:      { type: 'string', description: 'Email address (optional)' },
          phone:      { type: 'string', description: 'Phone number (optional)' },
          hourlyRate: { type: 'number', description: 'Hourly pay rate in dollars' },
        },
        required: ['name', 'role', 'hourlyRate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_employee',
      description: 'Update an existing employee profile or active status',
      parameters: {
        type: 'object',
        properties: {
          employeeId:   { type: 'string', description: 'The employee ID from the business context' },
          name:         { type: 'string', description: 'New name (optional)' },
          role:         { type: 'string', description: 'New role (optional)' },
          email:        { type: 'string', description: 'New email (optional)' },
          phone:        { type: 'string', description: 'New phone (optional)' },
          hourlyRate:   { type: 'number', description: 'New hourly rate (optional)' },
          activeStatus: { type: 'boolean', description: 'Set to false to deactivate, true to reactivate' },
        },
        required: ['employeeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_employee',
      description: 'Remove an employee from the business',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'The employee ID from the business context' },
        },
        required: ['employeeId'],
      },
    },
  },
  // ── Attendance ───────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'clock_in_employee',
      description: 'Clock in an employee — starts their work shift',
      parameters: {
        type: 'object',
        properties: {
          employeeId:   { type: 'string', description: 'The employee ID from the business context' },
          employeeName: { type: 'string', description: 'The employee name' },
          date:         { type: 'string', description: 'Date in YYYY-MM-DD format' },
        },
        required: ['employeeId', 'employeeName', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clock_out_employee',
      description: 'Clock out an employee — ends their work shift. Use the attendance record ID from the ATTENDANCE section of the context.',
      parameters: {
        type: 'object',
        properties: {
          recordId: { type: 'string', description: 'The attendance record ID (open shift, clockOut = null) from the ATTENDANCE section' },
          clockIn:  { type: 'string', description: 'The clockIn timestamp string from the attendance record (used to calculate hours)' },
        },
        required: ['recordId'],
      },
    },
  },
  // ── Invoices ──────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Generate a professional invoice for a customer',
      parameters: {
        type: 'object',
        properties: {
          customerName:  { type: 'string', description: 'Name of the customer / client' },
          customerEmail: { type: 'string', description: 'Customer email address (optional)' },
          items: {
            type: 'array',
            description: 'Line items on the invoice',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string', description: 'Item description or service name' },
                quantity:    { type: 'number', description: 'Number of units' },
                unitPrice:   { type: 'number', description: 'Price per unit in dollars' },
              },
              required: ['description', 'quantity', 'unitPrice'],
            },
          },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          notes:   { type: 'string', description: 'Additional notes on the invoice (optional)' },
        },
        required: ['customerName', 'items', 'dueDate'],
      },
    },
  },
  // ── Payroll ───────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'run_payroll',
      description: 'Calculate and run payroll for all active employees for a given period based on their attendance records',
      parameters: {
        type: 'object',
        properties: {
          periodStart: { type: 'string', description: 'Start date of the pay period in YYYY-MM-DD format' },
          periodEnd:   { type: 'string', description: 'End date of the pay period in YYYY-MM-DD format' },
        },
        required: ['periodStart', 'periodEnd'],
      },
    },
  },
  // ── Business Config ───────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'update_business_info',
      description: 'Update business profile details such as name, phone, email, address, or website',
      parameters: {
        type: 'object',
        properties: {
          name:    { type: 'string', description: 'Business name' },
          phone:   { type: 'string', description: 'Business phone number' },
          email:   { type: 'string', description: 'Business email address' },
          address: { type: 'string', description: 'Street address' },
          website: { type: 'string', description: 'Website URL' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_service',
      description: 'Add a new service or offering to the business menu',
      parameters: {
        type: 'object',
        properties: {
          name:        { type: 'string', description: 'Service name' },
          price:       { type: 'number', description: 'Price in dollars' },
          duration:    { type: 'number', description: 'Duration in minutes (optional)' },
          description: { type: 'string', description: 'Short description of the service (optional)' },
        },
        required: ['name', 'price'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_service',
      description: 'Update an existing service — price, duration, name, or description',
      parameters: {
        type: 'object',
        properties: {
          serviceId:   { type: 'string', description: 'The service ID from the business context' },
          name:        { type: 'string', description: 'New name (optional)' },
          price:       { type: 'number', description: 'New price (optional)' },
          duration:    { type: 'number', description: 'New duration in minutes (optional)' },
          description: { type: 'string', description: 'New description (optional)' },
        },
        required: ['serviceId'],
      },
    },
  },
]

// ── Main export ────────────────────────────────────────────────────────────────
export async function sendOpenAIMessage(
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  businessContext?: string,
  onAction?: ActionHandler,
): Promise<string> {
  const systemContent = businessContext
    ? `${BASE_SYSTEM_PROMPT}\n\n${businessContext}`
    : BASE_SYSTEM_PROMPT

  const mapped: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(m => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const stream = await client.chat.completions.create({
    model:       'gpt-4o-mini',
    messages:    [{ role: 'system', content: systemContent }, ...mapped],
    tools:       onAction ? TOOLS : undefined,
    tool_choice: onAction ? 'auto' : undefined,
    stream:      true,
    max_tokens:  900,
  })

  let textContent  = ''
  let toolCallId   = ''
  let toolCallName = ''
  let toolCallArgs = ''
  let isToolCall   = false

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta

    if (delta?.content) {
      textContent += delta.content
      onChunk?.(delta.content)
    }

    if (delta?.tool_calls?.[0]) {
      isToolCall = true
      const tc = delta.tool_calls[0]
      if (tc.id)                  toolCallId   = tc.id
      if (tc.function?.name)      toolCallName = tc.function.name
      if (tc.function?.arguments) toolCallArgs += tc.function.arguments
    }
  }

  // ── Execute tool call & stream follow-up ──────────────────────────────────
  if (isToolCall && onAction && toolCallArgs) {
    let action: ManagerAction
    try {
      const args = JSON.parse(toolCallArgs)
      action = { type: toolCallName as ManagerAction['type'], ...args } as ManagerAction
    } catch {
      return 'Sorry, I had trouble processing that action. Please try again.'
    }

    const toolResult = await onAction(action)

    const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...mapped,
      {
        role:       'assistant',
        content:    null,
        tool_calls: [{
          id:       toolCallId,
          type:     'function',
          function: { name: toolCallName, arguments: toolCallArgs },
        }],
      } as OpenAI.Chat.ChatCompletionAssistantMessageParam,
      {
        role:         'tool',
        tool_call_id: toolCallId,
        content:      toolResult,
      } as OpenAI.Chat.ChatCompletionToolMessageParam,
    ]

    const followUpStream = await client.chat.completions.create({
      model:      'gpt-4o-mini',
      messages:   followUpMessages,
      stream:     true,
      max_tokens: 400,
    })

    let followUpContent = ''
    for await (const chunk of followUpStream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      followUpContent += delta
      if (delta) onChunk?.(delta)
    }
    return followUpContent
  }

  return textContent
}
