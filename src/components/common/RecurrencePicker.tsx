// ─────────────────────────────────────────────────────────────────────────────
// RecurrencePicker — inline recurring appointment selector
// Used in: Beauty Spa, Cleaning, Medical, Gym booking forms
// ─────────────────────────────────────────────────────────────────────────────
import { RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { BookingRecurrence, RecurrenceRule } from '@/types/booking.types'

interface Props {
  value?:    BookingRecurrence | null
  onChange:  (val: BookingRecurrence | null) => void
}

const RULES: { label: string; value: RecurrenceRule }[] = [
  { label: 'Daily',     value: 'daily'    },
  { label: 'Weekly',    value: 'weekly'   },
  { label: 'Bi-weekly', value: 'biweekly' },
  { label: 'Monthly',   value: 'monthly'  },
]

export function RecurrencePicker({ value, onChange }: Props) {
  const enabled = !!value

  function toggle() {
    onChange(enabled ? null : { rule: 'weekly' })
  }

  function setRule(rule: RecurrenceRule) {
    onChange({ ...(value ?? { rule: 'weekly' }), rule })
  }

  function setEndDate(date: string) {
    if (!value) return
    onChange({ ...value, endDate: date || undefined })
  }

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all w-full',
          enabled
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
            : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:border-ink-300',
        )}
      >
        <RefreshCw size={14} />
        {enabled ? 'Recurring appointment' : 'Make this recurring'}
      </button>

      {/* Rule selector */}
      {enabled && (
        <div className="pl-2 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {RULES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRule(r.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  value?.rule === r.value
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:border-brand-300',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-ink-500 dark:text-ink-400 block mb-1">
              End date (optional)
            </label>
            <input
              type="date"
              value={value?.endDate ?? ''}
              onChange={e => setEndDate(e.target.value)}
              className="input-base text-sm w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
