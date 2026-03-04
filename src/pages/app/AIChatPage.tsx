import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Trash2, Loader2 } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Button, Avatar, Card } from '@/components/ui'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { formatTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const suggestions = [
  'Book an appointment for Sarah Johnson — Hair Cut tomorrow at 10am for $85',
  'Show me all pending bookings',
  'Mark the latest booking as completed',
  'Cancel the booking for John Smith',
  "What's my total revenue this month?",
  'How many bookings do I have today?',
  'List all my active employees',
  'Analyze my booking patterns and suggest improvements',
]

export function AIChatPage() {
  const { messages, isStreaming, sendMessage, clearMessages } = useChat()
  const user = useAuthStore(s => s.user)
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <DashboardShell title="AI Chat">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        {/* Main chat */}
        <div className="flex-1 flex flex-col card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-ink-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-ink-900 dark:text-white">Business AI Assistant</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online · Ready to help
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearMessages}>
                Clear
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mb-4 shadow-brand">
                  <Bot size={36} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">
                  Your AI Business Assistant
                </h3>
                <p className="text-ink-500 dark:text-ink-400 max-w-md text-sm leading-relaxed">
                  I can help with business insights, customer management, bookings, analytics,
                  and strategic recommendations. Ask me anything!
                </p>
              </div>
            )}

            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {msg.role === 'assistant'
                  ? <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"><Bot size={18} className="text-white" /></div>
                  : <Avatar name={user?.displayName || 'U'} size="sm" className="flex-shrink-0 mt-1" />
                }
                <div className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-100 rounded-tl-sm'
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className={cn('flex items-center gap-2 mt-1.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <span className={cn('text-xs', msg.role === 'user' ? 'text-white/60' : 'text-ink-400')}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {isStreaming && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="bg-ink-100 dark:bg-ink-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-brand-500" />
                  <span className="text-sm text-ink-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-ink-100 dark:border-ink-800">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Ask about your business, customers, analytics..."
                rows={1}
                className="flex-1 input-base py-3 resize-none"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isStreaming} icon={<Send size={16} />}>
                Send
              </Button>
            </div>
            <p className="text-xs text-ink-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Suggestions panel */}
        <div className="lg:w-72 space-y-4">
          <Card>
            <h3 className="font-semibold text-ink-900 dark:text-white mb-3 text-sm">Suggested prompts</h3>
            <div className="space-y-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s) }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-brand-600 dark:hover:text-brand-400 transition-all border border-ink-100 dark:border-ink-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </DashboardShell>
  )
}
