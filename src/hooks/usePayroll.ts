import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  fetchCollection, createDoc, updateDocById,
  subColPath, where, orderBy,
} from '@/lib/firestore'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { SUB_COLLECTIONS } from '@/constants/firestore'
import type { AttendanceRecord, Employee, PayrollSummary } from '@/types/employee.types'

const TAX_RATE = 0.15  // 15% flat tax

export function usePayroll() {
  const businessId = useAuthStore(s => s.user?.businessId) ?? ''
  // Payroll records stored as a sub-collection
  const payrollPath    = subColPath(businessId, 'payroll')
  const attendancePath = subColPath(businessId, SUB_COLLECTIONS.ATTENDANCE)
  const employeePath   = subColPath(businessId, SUB_COLLECTIONS.EMPLOYEES)

  const { data: payrolls, isLoading } = useRealtimeCollection<PayrollSummary>(
    payrollPath,
    [orderBy('periodEnd', 'desc')],
    !!businessId,
  )

  // Run payroll for a period
  const runPayrollMutation = useMutation({
    mutationFn: async ({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) => {
      // 1. Fetch all employees
      const employees = await fetchCollection<Employee>(employeePath, [])

      // 2. Fetch attendance records in range
      const attendance = await fetchCollection<AttendanceRecord>(attendancePath, [
        where('date', '>=', periodStart),
        where('date', '<=', periodEnd),
      ])

      // 3. Aggregate hours per employee
      const hoursMap = new Map<string, number>()
      for (const rec of attendance) {
        const h = (rec.hours ?? 0) as number
        hoursMap.set(rec.employeeId, (hoursMap.get(rec.employeeId) ?? 0) + h)
      }

      // 4. Create payroll records for each employee
      const results: PayrollSummary[] = []
      for (const emp of employees) {
        if (!emp.activeStatus) continue
        const hours     = hoursMap.get(emp.id) ?? 0
        const grossPay  = Math.round(hours * emp.hourlyRate * 100) / 100
        const tax       = Math.round(grossPay * TAX_RATE * 100) / 100
        const netPay    = Math.round((grossPay - tax) * 100) / 100

        const record: Omit<PayrollSummary, 'id'> = {
          employeeId:   emp.id,
          employeeName: emp.name,
          periodStart,
          periodEnd,
          hoursWorked:  hours,
          hourlyRate:   emp.hourlyRate,
          grossPay,
          deductions:   tax,
          netPay,
          status:       'pending',
        }
        const id = await createDoc(payrollPath, record)
        results.push({ id, ...record })
      }
      return results
    },
    onSuccess: () => {},   // real-time subscription auto-updates
  })

  // Mark payroll as paid
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => updateDocById(payrollPath, id, { status: 'paid' }),
    onSuccess:  () => {},  // real-time subscription auto-updates
  })

  return {
    payrolls,
    isLoading,
    runPayroll:   runPayrollMutation.mutateAsync,
    markPaid:     markPaidMutation.mutateAsync,
    isRunning:    runPayrollMutation.isPending,
  }
}
