import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById, deleteDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import { isDemoMode } from '@/lib/demoMode'
import { MOCK_VOICE_AGENTS } from '@/lib/voiceMock'
import type { VoiceAgent, CreateVoiceAgentData } from '@/types/voice.types'

export function useVoiceAgents() {
  const user       = useAuthStore(s => s.user)
  const businessId = user?.businessId ?? ''
  const qc         = useQueryClient()
  const path       = subColPath(businessId, SUB_COLLECTIONS.VOICE_AGENTS)

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['voiceAgents', businessId],
    queryFn:  async () => {
      // No businessId yet (new account) — show demo agents for preview
      if (!businessId) return MOCK_VOICE_AGENTS
      if (isDemoMode() || businessId.startsWith('demo-')) return MOCK_VOICE_AGENTS
      const real = await fetchCollection<VoiceAgent>(path, [orderBy('createdAt', 'desc')])
      return real.length > 0 ? real : MOCK_VOICE_AGENTS
    },
    // Always run — even without businessId we show mock agents
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateVoiceAgentData) =>
      isDemoMode()
        ? Promise.resolve('demo-agent-new')
        : createDoc(path, {
            ...data,
            businessId,
            callCount:    0,
            totalMinutes: 0,
            isActive:     true,
          }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voiceAgents', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VoiceAgent> }) =>
      isDemoMode()
        ? Promise.resolve()
        : updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voiceAgents', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      isDemoMode()
        ? Promise.resolve()
        : deleteDocById(path, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voiceAgents', businessId] }),
  })

  return {
    agents,
    isLoading,
    createAgent:  createMutation.mutateAsync,
    updateAgent:  updateMutation.mutateAsync,
    deleteAgent:  deleteMutation.mutateAsync,
    isCreating:   createMutation.isPending,
    isUpdating:   updateMutation.isPending,
  }
}
