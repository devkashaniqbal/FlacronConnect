import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { fetchCollection, createDoc, updateDocById, deleteDocById, subColPath, orderBy, where } from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id?:          string
  businessId:   string
  name:         string
  clientName:   string
  clientEmail?: string
  clientPhone?: string
  status:       ProjectStatus
  budget?:      number
  startDate?:   string
  endDate?:     string
  description?: string
  address?:     string
  createdAt?:   unknown
  updatedAt?:   unknown
}

export interface Milestone {
  id?:          string
  projectId:    string
  title:        string
  description?: string
  dueDate?:     string
  amount?:      number
  completed:    boolean
  invoiceId?:   string
  createdAt?:   unknown
}

export function useProjects() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.PROJECTS)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', businessId],
    queryFn:  () => fetchCollection<Project>(path, [orderBy('createdAt', 'desc')]),
    enabled:  !!businessId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Project, 'id'>) => createDoc(path, { ...data, businessId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['projects', businessId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', businessId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['projects', businessId] }),
  })

  return {
    projects, isLoading,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

export function useMilestones(projectId: string) {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.MILESTONES)

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', businessId, projectId],
    queryFn:  () => fetchCollection<Milestone>(path, [
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc'),
    ]),
    enabled:  !!businessId && !!projectId,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Milestone, 'id'>) =>
      createDoc(path, { ...data, projectId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones', businessId, projectId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Milestone> }) =>
      updateDocById(path, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones', businessId, projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['milestones', businessId, projectId] }),
  })

  return {
    milestones, isLoading,
    createMilestone: createMutation.mutateAsync,
    updateMilestone: updateMutation.mutateAsync,
    deleteMilestone: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
