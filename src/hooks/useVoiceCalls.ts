import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById,
  subColPath, orderBy, limit,
} from '@/lib/firestore'
import { functions } from '@/lib/firebase'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import { isDemoMode } from '@/lib/demoMode'
import { MOCK_VOICE_CALLS, buildMockAnalytics } from '@/lib/voiceMock'
import type { VoiceCall, InitiateCallData, VoiceAnalytics } from '@/types/voice.types'

export function useVoiceCalls(limitCount = 50) {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc         = useQueryClient()
  const path       = subColPath(businessId, SUB_COLLECTIONS.VOICE_CALLS)

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['voiceCalls', businessId, limitCount],
    queryFn:  () => {
      if (!businessId) return Promise.resolve([])
      if (isDemoMode()) return Promise.resolve(MOCK_VOICE_CALLS)
      return fetchCollection<VoiceCall>(path, [orderBy('createdAt', 'desc'), limit(limitCount)])
    },
    enabled: !!businessId,
  })

  const analytics: VoiceAnalytics = useMemo(() => buildMockAnalytics(calls), [calls])

  const initiateCallMutation = useMutation({
    mutationFn: async (data: InitiateCallData) => {
      if (isDemoMode()) {
        return { callSid: `DEMO_SID_${Date.now()}`, callId: `demo-call-${Date.now()}` }
      }
      const fn = httpsCallable<InitiateCallData, { callSid: string; callId: string }>(functions, 'initiateOutboundCall')
      const result = await fn(data)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voiceCalls', businessId] }),
  })

  const updateCallMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VoiceCall> }) =>
      isDemoMode()
        ? Promise.resolve()
        : updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voiceCalls', businessId] }),
  })

  // Save a new call record to Firestore (called by Cloud Function webhook, but also usable client-side for demo)
  const createCallMutation = useMutation({
    mutationFn: (data: Omit<VoiceCall, 'id'>) =>
      isDemoMode()
        ? Promise.resolve('demo-call-id')
        : createDoc(path, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voiceCalls', businessId] }),
  })

  return {
    calls,
    analytics,
    isLoading,
    initiateCall: initiateCallMutation.mutateAsync,
    updateCall:   updateCallMutation.mutateAsync,
    createCall:   createCallMutation.mutateAsync,
    isInitiating: initiateCallMutation.isPending,
  }
}
