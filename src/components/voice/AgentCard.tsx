import { motion } from 'framer-motion'
import { Phone, PhoneCall, Settings, Trash2, Mic, MicOff, Globe } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { VoiceAgent } from '@/types/voice.types'

const PERSONALITY_COLORS: Record<VoiceAgent['personality'], string> = {
  formal:  'from-sky-500 to-sky-600',
  friendly:'from-emerald-500 to-emerald-600',
  sales:   'from-brand-500 to-brand-600',
  support: 'from-accent-500 to-accent-600',
  survey:  'from-violet-500 to-violet-600',
}

const GOAL_LABELS: Record<VoiceAgent['goal'], string> = {
  booking: 'Booking',
  sales:   'Sales',
  support: 'Support',
  survey:  'Survey',
  info:    'Info',
}

interface AgentCardProps {
  agent:       VoiceAgent
  index:       number
  onCall:      (agent: VoiceAgent) => void
  onEdit:      (agent: VoiceAgent) => void
  onDelete:    (agent: VoiceAgent) => void
  onToggle:    (agent: VoiceAgent) => void
}

export function AgentCard({ agent, index, onCall, onEdit, onDelete, onToggle }: AgentCardProps) {
  const gradientColor = PERSONALITY_COLORS[agent.personality]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card p-5 group flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0',
            gradientColor
          )}>
            <Mic size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 dark:text-white truncate text-sm leading-tight">
              {agent.name}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400 capitalize">{agent.personality} · {GOAL_LABELS[agent.goal]}</p>
          </div>
        </div>
        <Badge variant={agent.isActive ? 'success' : 'default'} dot>
          {agent.isActive ? 'Active' : 'Paused'}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed line-clamp-2">
        {agent.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Calls',   value: agent.callCount.toString() },
          { label: 'Minutes', value: agent.totalMinutes.toString() },
          { label: 'Language', value: agent.language.split('-')[0].toUpperCase() },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-xl bg-ink-50 dark:bg-ink-800/60">
            <p className="font-display font-bold text-sm text-ink-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-ink-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Phone number */}
      {agent.phoneNumber && (
        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          <Globe size={12} />
          <span className="font-mono">{agent.phoneNumber}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-ink-100 dark:border-ink-800">
        <Button
          variant="primary"
          size="sm"
          icon={<PhoneCall size={13} />}
          onClick={() => onCall(agent)}
          disabled={!agent.isActive}
          className="flex-1"
        >
          Call
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(agent)}
          title={agent.isActive ? 'Pause agent' : 'Activate agent'}
        >
          {agent.isActive ? <MicOff size={15} /> : <Mic size={15} />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(agent)} title="Edit agent">
          <Settings size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(agent)}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          title="Delete agent"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </motion.div>
  )
}
