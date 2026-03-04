// ─────────────────────────────────────────────────────────────────────────────
// IndustryPicker
// Searchable grid of 12 industry cards used in the registration wizard.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { INDUSTRY_TEMPLATE_LIST } from '@/constants/industryTemplates'
import type { IndustryType } from '@/types/industry.types'

interface IndustryPickerProps {
  value:    IndustryType | null
  onChange: (key: IndustryType) => void
  error?:   string
}

export function IndustryPicker({ value, onChange, error }: IndustryPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? INDUSTRY_TEMPLATE_LIST.filter(t =>
        t.label.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase()),
      )
    : INDUSTRY_TEMPLATE_LIST

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search industries…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={cn(
            'w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border',
            'bg-white dark:bg-ink-900',
            'border-ink-200 dark:border-ink-700',
            'text-ink-900 dark:text-white',
            'placeholder:text-ink-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'transition-colors',
          )}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-0.5">
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-ink-400 py-6">
            No industries match "{query}"
          </p>
        )}

        {filtered.map(template => {
          const isSelected = value === template.key
          return (
            <motion.button
              key={template.key}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(template.key)}
              className={cn(
                'relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border-2 text-left transition-all duration-200',
                isSelected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 shadow-sm'
                  : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600 hover:bg-ink-50 dark:hover:bg-ink-800/50',
              )}
            >
              {/* Accent bar */}
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r opacity-0 transition-opacity duration-200',
                  template.gradientClass,
                  isSelected && 'opacity-100',
                )}
              />

              <span className="text-2xl leading-none">{template.emoji}</span>

              <div className="min-w-0">
                <p className={cn(
                  'text-xs font-semibold leading-tight',
                  isSelected
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-ink-800 dark:text-ink-200',
                )}>
                  {template.label}
                </p>
                <p className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5 leading-snug line-clamp-2">
                  {template.description}
                </p>
              </div>

              {/* Check badge */}
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
