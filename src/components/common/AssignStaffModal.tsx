// ─────────────────────────────────────────────────────────────────────────────
// AssignStaffModal — used by Construction, Cleaning, Transportation, Home Services, Gym
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Users, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Button, Avatar, Badge, Spinner } from '@/components/ui'
import { useEmployees } from '@/hooks/useEmployees'
import { useJobAssignments } from '@/hooks/useJobAssignments'
import { cn } from '@/utils/cn'

interface Props {
  isOpen:     boolean
  onClose:    () => void
  bookingId:  string
  bookingRef?: string   // display label e.g. "Job #ABC"
}

export function AssignStaffModal({ isOpen, onClose, bookingId, bookingRef }: Props) {
  const { employees } = useEmployees()
  const { assignments, assignEmployee, unassignEmployee, isAssigning } = useJobAssignments(bookingId)
  const [loading, setLoading] = useState<string | null>(null)

  const assignedIds = new Set(assignments.map(a => a.employeeId))

  async function toggle(emp: { id: string; name: string }) {
    setLoading(emp.id)
    try {
      if (assignedIds.has(emp.id)) {
        const existing = assignments.find(a => a.employeeId === emp.id)
        if (existing?.id) {
          await unassignEmployee(existing.id)
          toast.success(`${emp.name} removed`)
        }
      } else {
        await assignEmployee({ bookingId, employeeId: emp.id, employeeName: emp.name })
        toast.success(`${emp.name} assigned`)
      }
    } finally {
      setLoading(null)
    }
  }

  const activeEmployees = employees.filter(e => e.activeStatus)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Staff${bookingRef ? ` — ${bookingRef}` : ''}`} size="sm">
      <div className="space-y-3">
        {assignments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-brand-50 dark:bg-brand-950/30 rounded-xl">
            {assignments.map(a => (
              <Badge key={a.id} variant="brand" dot>{a.employeeName}</Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-ink-500 dark:text-ink-400">
          {activeEmployees.length} active staff — click to assign / remove
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {activeEmployees.map(emp => {
            const assigned = assignedIds.has(emp.id)
            const busy     = loading === emp.id
            return (
              <button
                key={emp.id}
                onClick={() => toggle(emp)}
                disabled={busy}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                  assigned
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                    : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
                )}
              >
                <Avatar name={emp.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{emp.name}</p>
                  <p className="text-xs text-ink-400 capitalize">{emp.role.replace('_', ' ')}</p>
                </div>
                {busy ? (
                  <Spinner size="sm" />
                ) : assigned ? (
                  <Check size={16} className="text-brand-600 flex-shrink-0" />
                ) : (
                  <Users size={16} className="text-ink-300 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        <Button variant="secondary" className="w-full" onClick={onClose}>Done</Button>
      </div>
    </Modal>
  )
}
