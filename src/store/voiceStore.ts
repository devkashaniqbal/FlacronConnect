import { create } from 'zustand'
import type { ActiveCallSession, CallDirection, TranscriptEntry } from '@/types/voice.types'

interface VoiceState {
  session: ActiveCallSession
  hudVisible: boolean

  // Setters
  startCall:         (agentId: string, agentName: string, direction: CallDirection, toNumber: string) => void
  setCallId:         (callId: string) => void
  setStatus:         (status: ActiveCallSession['status']) => void
  appendTranscript:  (entry: TranscriptEntry) => void
  incrementDuration: () => void
  toggleMute:        () => void
  endCall:           () => void
  showHud:           () => void
  hideHud:           () => void
}

const IDLE_SESSION: ActiveCallSession = {
  callId:     null,
  agentId:    null,
  agentName:  '',
  direction:  'outbound',
  status:     'idle',
  toNumber:   '',
  startedAt:  null,
  duration:   0,
  transcript: [],
  isMuted:    false,
  isRecording: true,
}

export const useVoiceStore = create<VoiceState>((set) => ({
  session:    IDLE_SESSION,
  hudVisible: false,

  startCall: (agentId, agentName, direction, toNumber) =>
    set({
      hudVisible: true,
      session: {
        ...IDLE_SESSION,
        agentId,
        agentName,
        direction,
        toNumber,
        status:    'connecting',
        startedAt: new Date(),
      },
    }),

  setCallId: (callId) =>
    set(s => ({ session: { ...s.session, callId } })),

  setStatus: (status) =>
    set(s => ({ session: { ...s.session, status } })),

  appendTranscript: (entry) =>
    set(s => ({ session: { ...s.session, transcript: [...s.session.transcript, entry] } })),

  incrementDuration: () =>
    set(s => ({ session: { ...s.session, duration: s.session.duration + 1 } })),

  toggleMute: () =>
    set(s => ({ session: { ...s.session, isMuted: !s.session.isMuted } })),

  endCall: () =>
    set({ session: { ...IDLE_SESSION }, hudVisible: false }),

  showHud: () => set({ hudVisible: true }),
  hideHud: () => set({ hudVisible: false }),
}))
