import { create } from 'zustand'
import type { ChatMessage } from '@/types/ai.types'

interface ChatState {
  messages: ChatMessage[]
  conversationId: string | null
  isStreaming: boolean
  isOpen: boolean

  addMessage:        (msg: ChatMessage) => void
  updateLastMessage: (id: string, chunk: string) => void
  setConversationId: (id: string) => void
  setStreaming:      (v: boolean)       => void
  toggleChat:        ()                 => void
  openChat:          ()                 => void
  closeChat:         ()                 => void
  clearMessages:     ()                 => void
}

export const useChatStore = create<ChatState>()(set => ({
  messages:       [],
  conversationId: null,
  isStreaming:    false,
  isOpen:         false,

  addMessage: msg => set(s => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (id, chunk) => set(s => ({
    messages: s.messages.map(m =>
      m.id === id ? { ...m, content: m.content + chunk } : m
    ),
  })),
  setConversationId: id  => set({ conversationId: id }),
  setStreaming:      v   => set({ isStreaming: v }),
  toggleChat:        ()  => set(s => ({ isOpen: !s.isOpen })),
  openChat:          ()  => set({ isOpen: true }),
  closeChat:         ()  => set({ isOpen: false }),
  clearMessages:     ()  => set({ messages: [], conversationId: null }),
}))
