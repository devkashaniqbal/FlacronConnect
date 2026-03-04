export type AIProvider = 'openai' | 'watsonx'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  provider?: AIProvider
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  businessId: string
  customerId: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface AIRequest {
  query: string
  conversationId?: string
  businessId: string
  context?: string
}

export interface AIResponse {
  message: string
  provider: AIProvider
  conversationId: string
  tokensUsed: number
}
