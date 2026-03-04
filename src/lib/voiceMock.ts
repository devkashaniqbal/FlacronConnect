import type { VoiceAgent, VoiceCall, VoiceAnalytics, CallOutcome } from '@/types/voice.types'

// ── Mock Agents ───────────────────────────────────────────────────────────────

export const MOCK_VOICE_AGENTS: VoiceAgent[] = [
  {
    id:                    'agent-001',
    businessId:            'demo-business-001',
    name:                  'Sarah — Booking Assistant',
    description:           'Handles inbound appointment booking, availability queries, and rescheduling.',
    personality:           'friendly',
    goal:                  'booking',
    language:              'en-US',
    voiceGender:           'female',
    systemPrompt:          'You are Sarah, a friendly booking assistant. Help callers schedule, reschedule, or cancel appointments. Always confirm details before booking.',
    enableMemory:          true,
    injectBusinessContext: true,
    isActive:              true,
    phoneNumber:           '+1 (555) 123-4567',
    phoneNumberSid:        'PN_demo_001',
    callCount:             142,
    totalMinutes:          287,
    createdAt:             new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt:             new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id:                    'agent-002',
    businessId:            'demo-business-001',
    name:                  'Max — Sales Agent',
    description:           'Outbound sales calls for promotions and follow-ups.',
    personality:           'sales',
    goal:                  'sales',
    language:              'en-US',
    voiceGender:           'male',
    systemPrompt:          'You are Max, a professional sales representative. Engage leads, explain our services, and guide them toward booking a consultation.',
    enableMemory:          false,
    injectBusinessContext: true,
    isActive:              true,
    phoneNumber:           '+1 (555) 234-5678',
    phoneNumberSid:        'PN_demo_002',
    callCount:             68,
    totalMinutes:          134,
    createdAt:             new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt:             new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id:                    'agent-003',
    businessId:            'demo-business-001',
    name:                  'Alex — Support Bot',
    description:           'Handles FAQs, business hours, pricing, and general queries.',
    personality:           'support',
    goal:                  'info',
    language:              'en-US',
    voiceGender:           'neutral',
    systemPrompt:          'You are Alex, a helpful support agent. Answer questions about the business clearly and concisely. If you cannot help, offer to connect them with a human.',
    enableMemory:          false,
    injectBusinessContext: true,
    isActive:              false,
    callCount:             23,
    totalMinutes:          41,
    createdAt:             new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt:             new Date(Date.now() - 7 * 86400000).toISOString(),
  },
]

// ── Mock Calls ────────────────────────────────────────────────────────────────

const DAY = 86400000

export const MOCK_VOICE_CALLS: VoiceCall[] = [
  {
    id: 'call-001', businessId: 'demo-business-001', agentId: 'agent-001', agentName: 'Sarah — Booking Assistant',
    direction: 'inbound', status: 'completed', from: '+15551234000', to: '+15551234567',
    duration: 187, recordingUrl: 'https://example.com/rec1.mp3',
    transcript: [
      { speaker: 'agent',  text: 'Thank you for calling. This call may be recorded. How can I help you today?', timestamp: 0 },
      { speaker: 'caller', text: "Hi, I'd like to book a haircut for tomorrow morning.", timestamp: 4200 },
      { speaker: 'agent',  text: "Of course! I have slots available at 9am and 11am tomorrow. Which would you prefer?", timestamp: 7800 },
      { speaker: 'caller', text: "9am works great.", timestamp: 11000 },
      { speaker: 'agent',  text: "Perfect. I've booked you in for tomorrow at 9am. You'll get a confirmation SMS shortly.", timestamp: 13500 },
    ],
    sentiment: 'positive', outcome: 'booking_created',
    workflowActions: [{ type: 'booking', status: 'completed', data: { service: 'Haircut', time: '9:00 AM' }, executedAt: new Date().toISOString() }],
    twilioCallSid: 'CA_demo_001',
    startedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    endedAt:   new Date(Date.now() - 2 * 3600000 + 187000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000 + 187000).toISOString(),
  },
  {
    id: 'call-002', businessId: 'demo-business-001', agentId: 'agent-002', agentName: 'Max — Sales Agent',
    direction: 'outbound', status: 'completed', from: '+15552345678', to: '+15559876543',
    duration: 142, recordingUrl: 'https://example.com/rec2.mp3',
    transcript: [
      { speaker: 'agent',  text: 'Hi, this is Max calling from FlacronControl. Do you have a moment?', timestamp: 0 },
      { speaker: 'caller', text: "Sure, what's this about?", timestamp: 3200 },
      { speaker: 'agent',  text: "We're offering 20% off new appointments this month. Would you like to schedule a consultation?", timestamp: 5100 },
      { speaker: 'caller', text: "That sounds interesting. Can you send me more details?", timestamp: 9400 },
    ],
    sentiment: 'neutral', outcome: 'sms_sent',
    workflowActions: [{ type: 'sms', status: 'completed', data: { message: 'Promo details sent' }, executedAt: new Date().toISOString() }],
    twilioCallSid: 'CA_demo_002',
    startedAt: new Date(Date.now() - 1 * DAY - 3600000).toISOString(),
    endedAt:   new Date(Date.now() - 1 * DAY - 3600000 + 142000).toISOString(),
    createdAt: new Date(Date.now() - 1 * DAY - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * DAY - 3600000 + 142000).toISOString(),
  },
  {
    id: 'call-003', businessId: 'demo-business-001', agentId: 'agent-001', agentName: 'Sarah — Booking Assistant',
    direction: 'inbound', status: 'completed', from: '+15554443333', to: '+15551234567',
    duration: 94, recordingUrl: 'https://example.com/rec3.mp3',
    transcript: [
      { speaker: 'agent',  text: 'Thank you for calling. How can I help you today?', timestamp: 0 },
      { speaker: 'caller', text: "I need to reschedule my appointment.", timestamp: 3100 },
      { speaker: 'agent',  text: "I can help with that. What day works better for you?", timestamp: 5600 },
      { speaker: 'caller', text: "Can we do Friday at 2pm?", timestamp: 8900 },
      { speaker: 'agent',  text: "Friday at 2pm is available. I've updated your booking.", timestamp: 11200 },
    ],
    sentiment: 'positive', outcome: 'booking_created',
    workflowActions: [{ type: 'booking', status: 'completed', data: { service: 'Reschedule', time: 'Friday 2:00 PM' }, executedAt: new Date().toISOString() }],
    twilioCallSid: 'CA_demo_003',
    startedAt: new Date(Date.now() - 2 * DAY - 1800000).toISOString(),
    endedAt:   new Date(Date.now() - 2 * DAY - 1800000 + 94000).toISOString(),
    createdAt: new Date(Date.now() - 2 * DAY - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * DAY - 1800000 + 94000).toISOString(),
  },
  {
    id: 'call-004', businessId: 'demo-business-001', agentId: 'agent-001', agentName: 'Sarah — Booking Assistant',
    direction: 'inbound', status: 'no-answer', from: '+15557778888', to: '+15551234567',
    duration: 0, transcript: [], sentiment: undefined, outcome: 'no_outcome',
    workflowActions: [],
    twilioCallSid: 'CA_demo_004',
    startedAt: new Date(Date.now() - 3 * DAY).toISOString(),
    createdAt: new Date(Date.now() - 3 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 3 * DAY).toISOString(),
  },
  {
    id: 'call-005', businessId: 'demo-business-001', agentId: 'agent-002', agentName: 'Max — Sales Agent',
    direction: 'outbound', status: 'completed', from: '+15552345678', to: '+15551112222',
    duration: 213, recordingUrl: 'https://example.com/rec5.mp3',
    transcript: [
      { speaker: 'agent',  text: "Hi there, I'm Max from FlacronControl. Have you heard about our premium services?", timestamp: 0 },
      { speaker: 'caller', text: "Remove me from your list please.", timestamp: 5000 },
      { speaker: 'agent',  text: "Of course, I'll remove you immediately. Have a great day!", timestamp: 7200 },
    ],
    sentiment: 'negative', outcome: 'no_outcome',
    workflowActions: [],
    twilioCallSid: 'CA_demo_005',
    startedAt: new Date(Date.now() - 4 * DAY).toISOString(),
    endedAt:   new Date(Date.now() - 4 * DAY + 213000).toISOString(),
    createdAt: new Date(Date.now() - 4 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 4 * DAY + 213000).toISOString(),
  },
  {
    id: 'call-006', businessId: 'demo-business-001', agentId: 'agent-003', agentName: 'Alex — Support Bot',
    direction: 'inbound', status: 'completed', from: '+15553334444', to: '+15551234567',
    duration: 67,
    transcript: [
      { speaker: 'agent',  text: "Hi, this is Alex. How can I help you today?", timestamp: 0 },
      { speaker: 'caller', text: "What are your business hours?", timestamp: 3200 },
      { speaker: 'agent',  text: "We're open Monday through Saturday, 9am to 6pm. Sundays we're closed.", timestamp: 5400 },
      { speaker: 'caller', text: "Great, thanks!", timestamp: 10100 },
    ],
    sentiment: 'positive', outcome: 'info_provided',
    workflowActions: [],
    twilioCallSid: 'CA_demo_006',
    startedAt: new Date(Date.now() - 5 * DAY).toISOString(),
    endedAt:   new Date(Date.now() - 5 * DAY + 67000).toISOString(),
    createdAt: new Date(Date.now() - 5 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 5 * DAY + 67000).toISOString(),
  },
]

// ── Demo Simulation ───────────────────────────────────────────────────────────

export const MOCK_TRANSCRIPT_SIMULATION: {
  speaker: 'agent' | 'caller'
  text: string
  delay: number
  bookingTrigger?: true
  bookingData?: { customerName: string; serviceName: string; amount: number }
}[] = [
  { speaker: 'agent',  text: 'Thank you for calling. This call may be recorded for quality purposes. How can I assist you today?', delay: 2000 },
  { speaker: 'caller', text: "Hi, I'd like to book an appointment.", delay: 5500 },
  { speaker: 'agent',  text: "I'd be happy to help! Could I get your name please?", delay: 8000 },
  { speaker: 'caller', text: "Sure, it's Jamie Williams.", delay: 11500 },
  { speaker: 'agent',  text: "Thanks Jamie! We offer: Haircut ($35), Hair Color ($85), and Facial Treatment ($65). Which service would you like?", delay: 14500 },
  { speaker: 'caller', text: "I'll go with the Hair Color please.", delay: 19000 },
  { speaker: 'agent',  text: "Great choice! Hair Color is $85. I have Thursday at 2pm available — shall I confirm that booking for you?", delay: 22000 },
  { speaker: 'caller', text: "Yes please!", delay: 26500 },
  { speaker: 'agent',  text: "Perfect! I've booked Jamie Williams for Hair Color on Thursday at 2pm for $85. You'll receive a confirmation text shortly. Is there anything else I can help with?", delay: 29500, bookingTrigger: true, bookingData: { customerName: 'Jamie Williams', serviceName: 'Hair Color', amount: 85 } },
  { speaker: 'caller', text: "No, that's all. Thank you!", delay: 34000 },
  { speaker: 'agent',  text: "My pleasure, Jamie! See you Thursday at 2pm. Have a wonderful day!", delay: 36500 },
]

// ── Analytics Builder ─────────────────────────────────────────────────────────

export function buildMockAnalytics(calls: VoiceCall[]): VoiceAnalytics {
  const completed = calls.filter(c => c.status === 'completed')
  const totalSecs = completed.reduce((s, c) => s + c.duration, 0)
  const bookings  = calls.filter(c => c.outcome === 'booking_created').length
  const smsSent   = calls.filter(c => c.outcome === 'sms_sent').length

  const sentPos = calls.filter(c => c.sentiment === 'positive').length
  const sentNeu = calls.filter(c => c.sentiment === 'neutral').length
  const sentNeg = calls.filter(c => c.sentiment === 'negative').length

  // Last 7 days buckets
  const callsByDay = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const dayCalls = calls.filter(c => c.createdAt.startsWith(key))
    return {
      day:     d.toLocaleDateString('en', { weekday: 'short' }),
      calls:   dayCalls.length,
      minutes: Math.round(dayCalls.reduce((s, c) => s + c.duration, 0) / 60),
    }
  })

  // By hour
  const callsByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    calls: calls.filter(c => new Date(c.createdAt).getHours() === hour).length,
  }))

  // Top outcomes
  const outcomeCounts = {} as Record<string, number>
  calls.forEach(c => {
    if (c.outcome) outcomeCounts[c.outcome] = (outcomeCounts[c.outcome] ?? 0) + 1
  })
  const topOutcomes = Object.entries(outcomeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([outcome, count]) => ({ outcome: outcome as CallOutcome, count }))

  return {
    totalCalls:         calls.length,
    completedCalls:     completed.length,
    totalMinutes:       Math.round(totalSecs / 60),
    avgDuration:        completed.length ? Math.round(totalSecs / completed.length) : 0,
    successRate:        calls.length ? Math.round((completed.length / calls.length) * 100) : 0,
    bookingsCreated:    bookings,
    smsSent,
    sentimentBreakdown: { positive: sentPos, neutral: sentNeu, negative: sentNeg },
    callsByDay,
    callsByHour,
    topOutcomes,
  }
}
