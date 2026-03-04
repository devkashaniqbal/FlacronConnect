import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Timestamp } from 'firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById,
  subColPath, where, orderBy,
} from '@/lib/firestore'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { AttendanceRecord } from '@/types/employee.types'

export function useAttendance(dateFilter?: string) {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const qc = useQueryClient()
  const path = subColPath(businessId, SUB_COLLECTIONS.ATTENDANCE)

  // Only filter by date — adding orderBy on a different field needs a composite
  // Firestore index. Sort client-side instead.
  const constraints = dateFilter
    ? [where('date', '==', dateFilter)]
    : [orderBy('clockIn', 'desc')]

  const { data: rawRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', businessId, dateFilter],
    queryFn:  () => fetchCollection<AttendanceRecord>(path, constraints),
    enabled:  !!businessId,
  })

  // Sort date-filtered results by clockIn descending on the client
  const records = dateFilter
    ? [...rawRecords].sort((a, b) => {
        const aMs = (a.clockIn as unknown as Timestamp)?.toMillis?.() ?? 0
        const bMs = (b.clockIn as unknown as Timestamp)?.toMillis?.() ?? 0
        return bMs - aMs
      })
    : rawRecords

  // Clock in — creates a new attendance record
  const clockInMutation = useMutation({
    mutationFn: async ({ employeeId, employeeName, date, jobsiteId, jobsiteName }: {
      employeeId:   string
      employeeName: string
      date:         string
      jobsiteId?:   string
      jobsiteName?: string
    }) => {
      return createDoc(path, {
        employeeId,
        employeeName,
        businessId,
        date,
        clockIn:     Timestamp.now(),
        clockOut:    null,
        hours:       null,
        jobsiteId:   jobsiteId ?? null,
        jobsiteName: jobsiteName ?? null,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance', businessId] }),
  })

  // Clock out — pass the clockIn Timestamp so we can calculate hours without
  // a second Firestore read (avoids the broken `where('id', '==', ...)` pattern)
  const clockOutMutation = useMutation({
    mutationFn: async ({ recordId, clockIn }: { recordId: string; clockIn: unknown }) => {
      const now = Timestamp.now()
      let hours = 0
      if (clockIn) {
        const inMs  = (clockIn as Timestamp).toMillis?.() ?? 0
        const outMs = now.toMillis()
        hours = Math.round(((outMs - inMs) / 3600000) * 100) / 100
      }
      return updateDocById(path, recordId, { clockOut: now, hours })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance', businessId] }),
  })

  return {
    records,
    isLoading,
    clockIn:     clockInMutation.mutateAsync,
    clockOut:    clockOutMutation.mutateAsync,
    isClockinIn: clockInMutation.isPending,
  }
}

// Get attendance records for a date range (used by payroll)
export function useAttendanceRange(startDate: string, endDate: string) {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  const path = subColPath(businessId, SUB_COLLECTIONS.ATTENDANCE)

  return useQuery({
    queryKey: ['attendance-range', businessId, startDate, endDate],
    queryFn:  () => fetchCollection<AttendanceRecord>(path, [
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
    ]),
    enabled: !!businessId && !!startDate && !!endDate,
  })
}
