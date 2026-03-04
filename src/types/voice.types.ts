// ── Voice Agent Types ──────────────────────────────────────────────────────────

export type AgentPersonality = 'formal' | 'friendly' | 'sales' | 'support' | 'survey'
export type AgentGoal        = 'booking' | 'sales' | 'support' | 'survey' | 'info'
export type VoiceGender      = 'male' | 'female' | 'neutral'
export type CallDirection    = 'inbound' | 'outbound'
export type CallStatus       = 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy'
export type CallSentiment    = 'positive' | 'neutral' | 'negative'
export type CallOutcome      = 'booking_created' | 'info_provided' | 'transferred' | 'voicemail' | 'no_outcome' | 'sms_sent'

export interface TranscriptEntry {
  speaker:   'agent' | 'caller'
  text:      string
  timestamp: number // ms from call start
}

export interface WorkflowAction {
  type:      'booking' | 'sms' | 'webhook'
  status:    'pending' | 'completed' | 'failed'
  data:      Record<string, unknown>
  executedAt?: string
}

export interface PhoneNumber {
  sid:          string
  number:       string
  friendlyName: string
  country:      string
  capabilities: { voice: boolean; sms: boolean }
  assignedAt:   string
}

export interface TwilioAccount {
  subAccountSid:       string
  subAccountAuthToken: string
  phoneNumbers:        PhoneNumber[]
  monthlyMinutesUsed:  number
  billingPeriodStart:  string
  createdAt:           string
  updatedAt:           string
}

export interface VoiceAgent {
  id:                    string
  businessId:            string
  name:                  string
  description:           string
  personality:           AgentPersonality
  goal:                  AgentGoal
  language:              string
  voiceGender:           VoiceGender
  systemPrompt:          string
  enableMemory:          boolean
  injectBusinessContext: boolean
  isActive:              boolean
  phoneNumberSid?:       string
  phoneNumber?:          string
  callCount:             number
  totalMinutes:          number
  createdAt:             string
  updatedAt:             string
}

export interface CreateVoiceAgentData {
  name:                  string
  description:           string
  personality:           AgentPersonality
  goal:                  AgentGoal
  language:              string
  voiceGender:           VoiceGender
  systemPrompt:          string
  enableMemory:          boolean
  injectBusinessContext: boolean
}

export interface VoiceCall {
  id:              string
  businessId:      string
  agentId:         string
  agentName:       string
  direction:       CallDirection
  status:          CallStatus
  from:            string
  to:              string
  duration:        number    // seconds
  recordingUrl?:   string
  transcript:      TranscriptEntry[]
  sentiment?:      CallSentiment
  outcome?:        CallOutcome
  workflowActions: WorkflowAction[]
  twilioCallSid:   string
  startedAt:       string
  endedAt?:        string
  createdAt:       string
  updatedAt:       string
}

export interface InitiateCallData {
  agentId: string
  to:      string
  from:    string
}

export interface VoiceAnalytics {
  totalCalls:        number
  completedCalls:    number
  totalMinutes:      number
  avgDuration:       number
  successRate:       number
  bookingsCreated:   number
  smsSent:           number
  sentimentBreakdown: { positive: number; neutral: number; negative: number }
  callsByDay:        { day: string; calls: number; minutes: number }[]
  callsByHour:       { hour: number; calls: number }[]
  topOutcomes:       { outcome: CallOutcome; count: number }[]
}

// ── Active Call Session (client-side only) ────────────────────────────────────

export type ActiveCallStatus = 'connecting' | 'ringing' | 'active' | 'ending' | 'idle'

export interface ActiveCallSession {
  callId:        string | null
  agentId:       string | null
  agentName:     string
  direction:     CallDirection
  status:        ActiveCallStatus
  toNumber:      string
  startedAt:     Date | null
  duration:      number  // seconds, incremented by interval
  transcript:    TranscriptEntry[]
  isMuted:       boolean
  isRecording:   boolean
}
