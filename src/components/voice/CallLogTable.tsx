import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneIncoming, PhoneOutgoing, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { Badge, Avatar } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { VoiceCall } from '@/types/voice.types'

const STATUS_VARIANT: Record<VoiceCall['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  completed:   'success',
  'in-progress': 'warning',
  initiated:   'warning',
  ringing:     'warning',
  failed:      'danger',
  'no-answer': 'default',
  busy:        'default',
}

const SENTIMENT_COLORS = {
  positive: 'text-emerald-600',
  neutral:  'text-ink-400',
  negative: 'text-red-500',
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

interface CallRowProps {
  call:  VoiceCall
  index: number
}

function CallRow({ call, index }: CallRowProps) {
  const [expanded, setExpanded] = useState(false)
  const hasTranscript = call.transcript && call.transcript.length > 0

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.04 }}
        className="hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors cursor-pointer"
        onClick={() => hasTranscript && setExpanded(e => !e)}
      >
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            {call.direction === 'inbound'
              ? <PhoneIncoming size={14} className="text-emerald-500 flex-shrink-0" />
              : <PhoneOutgoing size={14} className="text-brand-500 flex-shrink-0" />
            }
            <span className="text-xs font-mono text-ink-600 dark:text-ink-400">
              {call.direction === 'inbound' ? call.from : call.to}
            </span>
          </div>
        </td>
        <td className="py-3 pr-4 text-sm text-ink-700 dark:text-ink-300 max-w-[140px]">
          <p className="truncate text-xs">{call.agentName}</p>
        </td>
        <td className="py-3 pr-4">
          <Badge variant={STATUS_VARIANT[call.status]} dot size="sm">
            {call.status}
          </Badge>
        </td>
        <td className="py-3 pr-4 text-sm text-ink-600 dark:text-ink-400 font-mono text-xs">
          {formatDuration(call.duration)}
        </td>
        <td className="py-3 pr-4 text-xs text-ink-500 dark:text-ink-400">
          {call.sentiment && (
            <span className={cn('font-medium capitalize', SENTIMENT_COLORS[call.sentiment])}>
              {call.sentiment}
            </span>
          )}
        </td>
        <td className="py-3 pr-4 text-xs text-ink-500 dark:text-ink-400">
          <div>
            <p>{formatDate(call.createdAt)}</p>
            <p className="text-ink-400">{formatTime(call.createdAt)}</p>
          </div>
        </td>
        <td className="py-3 text-xs">
          {hasTranscript && (
            <button className="text-brand-500 hover:text-brand-600 flex items-center gap-1">
              Transcript
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && hasTranscript && (
          <tr>
            <td colSpan={7} className="pb-3 px-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-ink-50/70 dark:bg-ink-800/40 rounded-xl p-4 mx-2 space-y-2"
              >
                <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-3">
                  Transcript
                </p>
                {call.transcript.map((entry, i) => (
                  <div key={i} className={cn(
                    'flex gap-2 text-xs',
                    entry.speaker === 'agent' ? 'flex-row' : 'flex-row-reverse'
                  )}>
                    <div className={cn(
                      'px-3 py-2 rounded-xl max-w-[80%] leading-relaxed',
                      entry.speaker === 'agent'
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-ink-700 dark:text-ink-300 rounded-tl-sm'
                        : 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white rounded-tr-sm shadow-sm'
                    )}>
                      <span className="font-medium text-[10px] text-ink-400 block mb-0.5 capitalize">
                        {entry.speaker}
                      </span>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

interface CallLogTableProps {
  calls:     VoiceCall[]
  isLoading: boolean
}

export function CallLogTable({ calls, isLoading }: CallLogTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 skeleton rounded-xl" />
        ))}
      </div>
    )
  }

  if (!calls.length) {
    return (
      <div className="py-16 text-center">
        <PhoneIncoming size={36} className="text-ink-300 mx-auto mb-3" />
        <p className="text-ink-500 dark:text-ink-400">No calls yet. Start a call or configure an inbound number.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink-100 dark:border-ink-800">
            {['Number', 'Agent', 'Status', 'Duration', 'Sentiment', 'Time', ''].map((h, i) => (
              <th key={i} className="text-left pb-3 text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
          {calls.map((call, i) => (
            <CallRow key={call.id} call={call} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
