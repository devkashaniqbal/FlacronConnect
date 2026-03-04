import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, DollarSign, TrendingUp, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Avatar, Modal, Spinner } from '@/components/ui'
import { Input } from '@/components/ui'
import { formatCurrency, formatHours } from '@/utils/formatters'
import { usePayroll } from '@/hooks/usePayroll'
import type { PayrollSummary } from '@/types/employee.types'

function exportPayrollPDF(payrolls: PayrollSummary[], period: string) {
  const doc = new jsPDF()

  doc.setFillColor(234, 88, 12)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYROLL REPORT', 14, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${period}`, 196, 18, { align: 'right' })

  let y = 42
  doc.setTextColor(85, 85, 85)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const headers = ['Employee', 'Hours', 'Rate', 'Gross', 'Tax (15%)', 'Net Pay', 'Status']
  const cols    = [14, 70, 95, 120, 145, 165, 188]
  headers.forEach((h, i) => doc.text(h, cols[i], y))

  doc.setFillColor(245, 245, 245)
  doc.rect(14, y - 6, 182, 10, 'F')

  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(10, 10, 10)

  let totalGross = 0, totalNet = 0
  for (const p of payrolls) {
    doc.text(p.employeeName,             cols[0], y)
    doc.text(`${p.hoursWorked}h`,        cols[1], y)
    doc.text(`$${p.hourlyRate}/hr`,      cols[2], y)
    doc.text(`$${p.grossPay.toFixed(2)}`,cols[3], y)
    doc.text(`-$${p.deductions.toFixed(2)}`, cols[4], y)
    doc.text(`$${p.netPay.toFixed(2)}`,  cols[5], y)
    doc.text(p.status,                   cols[6], y)
    totalGross += p.grossPay
    totalNet   += p.netPay
    y += 9
    if (y > 265) { doc.addPage(); y = 20 }
  }

  y += 4
  doc.setDrawColor(229, 229, 229)
  doc.line(14, y, 196, y)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(234, 88, 12)
  doc.text('TOTALS', cols[0], y)
  doc.text(`$${totalGross.toFixed(2)}`, cols[3], y)
  doc.text(`$${totalNet.toFixed(2)}`,   cols[5], y)

  doc.save(`payroll-${period.replace(/\s/g, '-')}.pdf`)
}

export function PayrollPage() {
  const { payrolls, isLoading, runPayroll, markPaid, isRunning } = usePayroll()
  const [showRun, setShowRun] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd]     = useState('')

  const totalGross = payrolls.reduce((s, e) => s + e.grossPay, 0)
  const totalNet   = payrolls.reduce((s, e) => s + e.netPay, 0)
  const totalDed   = payrolls.reduce((s, e) => s + e.deductions, 0)

  async function handleRunPayroll() {
    if (!periodStart || !periodEnd) { toast.error('Select a period'); return }
    await toast.promise(
      runPayroll({ periodStart, periodEnd }),
      { loading: 'Calculating payroll…', success: 'Payroll generated!', error: 'Failed to run payroll' }
    )
    setShowRun(false)
  }

  const period = payrolls[0]
    ? `${payrolls[0].periodStart} – ${payrolls[0].periodEnd}`
    : 'No period'

  return (
    <DashboardShell title="Payroll">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Payroll</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">{payrolls.length} records</p>
        </div>
        <div className="flex gap-2">
          {payrolls.length > 0 && (
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={() => exportPayrollPDF(payrolls, period)}
            >
              Export PDF
            </Button>
          )}
          <Button icon={<Play size={14} />} onClick={() => setShowRun(true)}>Run Payroll</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Gross Pay',   value: formatCurrency(totalGross), icon: DollarSign,  color: 'from-brand-500 to-brand-600' },
          { label: 'Net Pay',     value: formatCurrency(totalNet),   icon: TrendingUp,  color: 'from-emerald-500 to-emerald-600' },
          { label: 'Deductions',  value: formatCurrency(totalDed),   icon: DollarSign,  color: 'from-red-500 to-red-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
                <p className="font-display font-bold text-xl text-ink-900 dark:text-white">{s.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign size={40} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500 dark:text-ink-400">No payroll records yet.</p>
            <p className="text-sm text-ink-400 mt-1">Run payroll to calculate employee compensation from attendance data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Employee', 'Hours', 'Rate', 'Gross', 'Tax (15%)', 'Net Pay', 'Status', ''].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                {payrolls.map((e, i) => (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.employeeName} size="xs" />
                        <span className="font-medium text-ink-900 dark:text-white text-sm">{e.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-ink-600 dark:text-ink-400">{formatHours(e.hoursWorked)}</td>
                    <td className="py-3 pr-4 text-sm text-ink-600 dark:text-ink-400">{formatCurrency(e.hourlyRate)}/hr</td>
                    <td className="py-3 pr-4 text-sm font-medium text-ink-900 dark:text-white">{formatCurrency(e.grossPay)}</td>
                    <td className="py-3 pr-4 text-sm text-red-500">-{formatCurrency(e.deductions)}</td>
                    <td className="py-3 pr-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(e.netPay)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={e.status === 'paid' ? 'success' : e.status === 'pending' ? 'warning' : 'default'}>
                        {e.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {e.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.promise(markPaid(e.id), {
                            loading: 'Marking paid…', success: 'Marked as paid!', error: 'Failed',
                          })}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Run Payroll Modal */}
      <Modal isOpen={showRun} onClose={() => setShowRun(false)} title="Run Payroll" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Select the pay period. FlacronControl will calculate pay from attendance records.
          </p>
          <Input label="Period start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          <Input label="Period end"   type="date" value={periodEnd}   onChange={e => setPeriodEnd(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRun(false)}>Cancel</Button>
            <Button className="flex-1" loading={isRunning} onClick={handleRunPayroll}>Calculate</Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  )
}
