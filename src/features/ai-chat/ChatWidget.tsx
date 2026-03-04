import { useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, X, Send, Loader2, Bot, Trash2 } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { formatTime } from '@/utils/formatters'
import { useState } from 'react'

export function ChatWidget() {
  const { messages, isStreaming, isOpen, sendMessage, toggleChat, clearMessages } = useChat()
  const user = useAuthStore(s => s.user)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  function handleSend() {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-brand shadow-brand-lg flex items-center justify-center"
          >
            <MessageSquare size={24} className="text-white" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {messages.filter(m => m.role === 'assistant').length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-40 w-[380px] max-h-[600px] flex flex-col card shadow-glass-dark overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-800 bg-gradient-to-r from-brand-600 to-accent-600">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">AI Assistant</p>
                <p className="text-xs text-white/70">Always here to help</p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={clearMessages} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
                <button onClick={toggleChat} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-3">
                    <Bot size={28} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="font-medium text-ink-900 dark:text-white text-sm mb-1">Hi there! I'm your AI assistant</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Ask me anything about your business, bookings, or customers.</p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {['Book an appointment', 'Business hours?', 'Available services'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); sendMessage(q) }}
                        className="text-xs px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
                  className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  {msg.role === 'assistant'
                    ? <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5"><Bot size={14} className="text-white" /></div>
                    : <Avatar name={user?.displayName || 'U'} size="xs" className="flex-shrink-0 mt-0.5" />
                  }
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-sm'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-100 rounded-tl-sm'
                  )}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={cn('text-xs mt-1', msg.role === 'user' ? 'text-white/60' : 'text-ink-400')}>
                      {formatTime(msg.timestamp)}
                      {msg.provider && <span className="ml-1 opacity-60">· {msg.provider}</span>}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isStreaming && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-ink-100 dark:bg-ink-800 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin text-brand-500" />
                    <span className="text-xs text-ink-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-ink-100 dark:border-ink-800">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className="flex-1 resize-none input-base py-2.5 max-h-24"
                  style={{ height: 'auto' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send size={16} className="text-white" />
                </motion.button>
              </div>
              <p className="text-xs text-ink-400 mt-1.5 text-center">Powered by OpenAI & WatsonX AI</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
