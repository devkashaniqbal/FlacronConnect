// Shared types for Cloud Functions (mirrors src/types/voice.types.ts)
export type AgentPersonality = 'formal' | 'friendly' | 'sales' | 'support' | 'survey'
export type AgentGoal        = 'booking' | 'sales' | 'support' | 'survey' | 'info'
export type VoiceGender      = 'male' | 'female' | 'neutral'

export interface VoiceAgent {
  id:                    string
  businessId:            string
  name:                  string
  personality:           AgentPersonality
  goal:                  AgentGoal
  voiceGender:           VoiceGender
  systemPrompt:          string
  enableMemory:          boolean
  injectBusinessContext: boolean
  isActive:              boolean
  phoneNumber?:          string
  phoneNumberSid?:       string
}

export interface VoiceCall {
  id:            string
  businessId:    string
  agentId:       string
  agentName:     string
  direction:     'inbound' | 'outbound'
  status:        string
  from:          string
  to:            string
  duration:      number
  transcript:    TranscriptEntry[]
  twilioCallSid: string
}

export interface TranscriptEntry {
  speaker:   'agent' | 'caller'
  text:      string
  timestamp: number
}

export interface WorkflowAction {
  type:    'booking' | 'sms' | 'webhook'
  status:  'pending' | 'completed' | 'failed'
  data:    Record<string, unknown>
  executedAt?: string
}
