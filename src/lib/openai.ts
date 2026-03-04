import OpenAI from 'openai'
import type { ChatMessage } from '@/types/ai.types'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

// ── Action types ──────────────────────────────────────────────────────────────
export type BookingAction =
  | {
      type: 'create_booking'
      customerName: string
      customerPhone?: string
      serviceName: string
      date: string
      startTime: string
      amount: number
      notes?: string
    }
  | {
      type: 'update_booking_status'
      bookingId: string
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    }

export type ActionHandler = (action: BookingAction) => Promise<string>

// ── System prompt ─────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are FlacronAI, the built-in AI business manager for FlacronControl.
You act like an experienced business manager who already knows everything about this business — its bookings, customers, employees, and revenue.

RULES:
- NEVER ask for information you already have in the business context.
- When asked to book an appointment, call create_booking immediately with the info provided.
- When asked to complete/cancel/confirm/pend a booking, find it in the context by customer name or service, then call update_booking_status with the correct ID.
- After completing an action, confirm it clearly and briefly.
- Be direct, confident, and concise.
- Respond in the same language as the user.
- FORMATTING: Never use markdown. No hashtags (#), no asterisks (*), no bold, no italic, no bullet dashes. Write in plain sentences and numbered lists only. Use line breaks between sections.`

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Create a new appointment or booking for a customer',
      parameters: {
        type: 'object',
        properties: {
          customerName:  { type: 'string',  description: 'Full name of the customer' },
          customerPhone: { type: 'string',  description: 'Customer phone number (optional)' },
          serviceName:   { type: 'string',  description: 'Name of the service or appointment type' },
          date:          { type: 'string',  description: 'Date in YYYY-MM-DD format' },
          startTime:     { type: 'string',  description: 'Start time in HH:MM 24-hour format' },
          amount:        { type: 'number',  description: 'Price in dollars' },
          notes:         { type: 'string',  description: 'Special notes or requests (optional)' },
        },
        required: ['customerName', 'serviceName', 'date', 'startTime', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_booking_status',
      description: 'Change the status of an existing booking to complete, cancel, confirm, or pending',
      parameters: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', description: 'The booking ID from the business context' },
          status:    {
            type: 'string',
            enum: ['pending', 'confirmed', 'completed', 'cancelled'],
            description: 'New status',
          },
        },
        required: ['bookingId', 'status'],
      },
    },
  },
]

// ── Main export ───────────────────────────────────────────────────────────────
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

  // Stream the first response (may include tool calls)
  const stream = await client.chat.completions.create({
    model:        'gpt-4o-mini',
    messages:     [{ role: 'system', content: systemContent }, ...mapped],
    tools:        onAction ? TOOLS : undefined,
    tool_choice:  onAction ? 'auto' : undefined,
    stream:       true,
    max_tokens:   900,
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
      if (tc.id)                    toolCallId   = tc.id
      if (tc.function?.name)        toolCallName = tc.function.name
      if (tc.function?.arguments)   toolCallArgs += tc.function.arguments
    }
  }

  // ── Execute tool call & stream follow-up ─────────────────────────────────
  if (isToolCall && onAction && toolCallArgs) {
    let action: BookingAction
    try {
      const args = JSON.parse(toolCallArgs)
      if (toolCallName === 'create_booking') {
        action = { type: 'create_booking', ...args }
      } else {
        action = { type: 'update_booking_status', ...args }
      }
    } catch {
      return 'Sorry, I had trouble processing that action. Please try again.'
    }

    const toolResult = await onAction(action)

    // Follow-up call with tool result to get the final confirmation message
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
