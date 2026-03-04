import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Spinner } from '@/components/ui'
import { formatDate, formatTime, formatHours } from '@/utils/formatters'
import { useAttendance } from '@/hooks/useAttendance'
import { useEmployees } from '@/hooks/useEmployees'
import { useProjects } from '@/hooks/useProjects'
import { useIndustryFeature } from '@/hooks/useIndustryTemplate'
import { useAuthStore } from '@/store/authStore'

const today = new Date().toISOString().split('T')[0]

export function AttendancePage() {
  const { records, isLoading, clockIn, clockOut } = useAttendance(today)
  const { employees } = useEmployees()
  const { projects }  = useProjects()
  const hasJobsite    = useIndustryFeature('jobsiteAttendance')
  const user = useAuthStore(s => s.user)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedJobsite,  setSelectedJobsite]  = useState('')

  const activeRecords = records.filter(r => !r.clockOut)
  const closedRecords = records.filter(r =>  r.clockOut)
  const totalHours    = closedRecords.reduce((s, r) => s + ((r.hours as number) ?? 0), 0)

  // Check if selected employee is already clocked in
  const myRecord = records.find(r => r.employeeId === selectedEmployee && !r.clockOut)

  async function handleClockIn() {
    if (!selectedEmployee) { toast.error('Select an employee first'); return }
    const emp = employees.find(e => e.id === selectedEmployee)
    if (!emp) return
    if (records.find(r => r.employeeId === selectedEmployee && !r.clockOut)) {
      toast.error(`${emp.name} is already clocked in`)
      return
    }
    const site = projects.find(p => p.id === selectedJobsite)
    await toast.promise(
      clockIn({
        employeeId:   emp.id,
        employeeName: emp.name,
        date:         today,
        jobsiteId:    site?.id,
        jobsiteName:  site?.name,
      }),
      { loading: 'Clocking in…', success: `${emp.name} clocked in!`, error: 'Failed' }
    )
  }

  async function handleClockOut(recordId: string, name: string, clockIn: unknown) {
    await toast.promise(
      clockOut({ recordId, clockIn }),
      { loading: 'Clocking out…', success: `${name} clocked out!`, error: 'Failed' }
    )
  }

  return (
    <DashboardShell title="Attendance">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Attendance</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm">
          {formatDate(today)} · {activeRecords.length} employees clocked in
        </p>
      </div>

      {/* Clock-in widget + stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="sm:col-span-1 bg-gradient-to-br from-brand-600 to-accent-600 border-0">
          <div className="text-white text-center py-2">
            <p className="text-sm font-medium opacity-80 mb-2">Clock In / Out</p>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Clock size={32} className="text-white" />
            </div>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 text-sm"
            >
              <option value="" className="text-ink-900">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id} className="text-ink-900">{e.name}</option>
              ))}
            </select>
            {hasJobsite && projects.length > 0 && (
              <select
                value={selectedJobsite}
                onChange={e => setSelectedJobsite(e.target.value)}
                className="w-full mb-2 px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 text-sm"
              >
                <option value="" className="text-ink-900">No jobsite</option>
                {projects.filter(p => p.status === 'active' || p.status === 'planning').map(p => (
                  <option key={p.id} value={p.id} className="text-ink-900">{p.name}</option>
                ))}
              </select>
            )}
            <p className="text-xs opacity-70 mb-3">{new Date().toLocaleTimeString()}</p>
            {myRecord ? (
              <Button
                variant="secondary"
                className="w-full text-brand-700"
                onClick={() => handleClockOut(myRecord.id, myRecord.employeeName, myRecord.clockIn)}
              >
                Clock Out
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full text-brand-700"
                onClick={handleClockIn}
              >
                Clock In
              </Button>
            )}
          </div>
        </Card>

        <div className="sm:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: 'Total Hours Today', value: `${totalHours.toFixed(1)}h`, icon: Clock,        color: 'text-brand-600' },
            { label: 'Clocked In Now',    value: `${activeRecords.length}`,   icon: CheckCircle,  color: 'text-emerald-600' },
            { label: 'Absent Today',      value: `${Math.max(0, employees.length - records.length)}`, icon: XCircle, color: 'text-red-500' },
            { label: 'Total Records',     value: `${records.length}`,         icon: MapPin,       color: 'text-amber-600' },
          ].map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="flex items-center gap-3">
                <Icon size={24} className={s.color} />
                <div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
                  <p className="font-bold text-ink-900 dark:text-white text-xl">{s.value}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Log */}
      <Card>
        <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Today's Log</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : records.length === 0 ? (
          <p className="text-center text-ink-400 py-8">No attendance records for today.</p>
        ) : (
          <div className="space-y-3">
            {records.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-800/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={record.employeeName} size="sm" />
                  <div>
                    <p className="font-medium text-ink-900 dark:text-white text-sm">{record.employeeName}</p>
                    <p className="text-xs text-ink-500">
                      In: {formatTime(record.clockIn)}
                      {record.clockOut ? ` · Out: ${formatTime(record.clockOut)}` : ''}
                    </p>
                    {record.jobsiteName && (
                      <p className="text-xs text-brand-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />{record.jobsiteName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {record.hours ? (
                    <Badge variant="success">{formatHours(record.hours as number)}</Badge>
                  ) : (
                    <Badge variant="warning" dot>Active</Badge>
                  )}
                  {!record.clockOut && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleClockOut(record.id, record.employeeName, record.clockIn)}
                    >
                      Clock Out
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  )
}
