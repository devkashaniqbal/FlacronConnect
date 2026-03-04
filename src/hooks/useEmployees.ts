import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  createDoc, updateDocById, deleteDocById,
  subColPath, orderBy,
} from '@/lib/firestore'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { Employee } from '@/types/employee.types'

export function useEmployees() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const path = subColPath(businessId, SUB_COLLECTIONS.EMPLOYEES)

  const { data: employees, isLoading } = useRealtimeCollection<Employee>(
    path,
    [orderBy('name')],
    !!businessId,
  )

  const createMutation = useMutation({
    mutationFn: (data: Omit<Employee, 'id'>) => createDoc(path, { ...data, businessId }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      updateDocById(path, id, data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocById(path, id),
  })

  return {
    employees,
    isLoading,
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    deleteEmployee: deleteMutation.mutateAsync,
    isCreating:     createMutation.isPending,
  }
}
