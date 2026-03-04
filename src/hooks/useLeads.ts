import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type LeadStage = 'new' | 'contacted' | 'viewing' | 'offer' | 'closed_won' | 'closed_lost'
export type LeadSource = 'referral' | 'website' | 'social' | 'walk_in' | 'advertising' | 'other'

export interface Lead {
  id?:           string
  businessId:    string
  name:          string
  email?:        string
  phone?:        string
  stage:         LeadStage
  source:        LeadSource
  propertyAddress?: string
  estimatedValue?:  number
  assignedAgentId?: string
  assignedAgent?:   string
  notes?:        string
  lastContactDate?: string
  createdAt?:    unknown
  updatedAt?:    unknown
}

export function useLeads() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.LEADS)

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', businessId],
    queryFn:  () => fetchCollection<Lead>(path, [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Lead, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['leads', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['leads', businessId] }),
  })

  return {
    leads, isLoading,
    createLead: createMutation.mutateAsync,
    updateLead: updateMutation.mutateAsync,
    deleteLead: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
