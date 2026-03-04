import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, PhoneCall, BarChart3, List, Settings, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Button, Badge, Card, Spinner } from '@/components/ui'
import { AgentCard } from '@/components/voice/AgentCard'
import { AgentCreateModal } from '@/components/voice/AgentCreateModal'
import { OutboundCallModal } from '@/components/voice/OutboundCallModal'
import { CallLogTable } from '@/components/voice/CallLogTable'
import { VoiceAnalyticsDashboard } from '@/components/voice/VoiceAnalyticsDashboard'
import { VoiceUpgradePrompt } from '@/components/voice/VoiceUpgradePrompt'
import { useVoiceAgents } from '@/hooks/useVoiceAgents'
import { useVoiceCalls } from '@/hooks/useVoiceCalls'
import { useBookings } from '@/hooks/useBookings'
import { useHasFeature, useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useVoiceStore } from '@/store/voiceStore'
import { useAuthStore } from '@/store/authStore'
import { isDemoMode } from '@/lib/demoMode'
import { MOCK_TRANSCRIPT_SIMULATION } from '@/lib/voiceMock'
import type { VoiceAgent, CreateVoiceAgentData } from '@/types/voice.types'

type Tab = 'agents' | 'calls' | 'analytics'

export function VoiceAgentPage() {
  const hasVoice     = useHasFeature('voiceCalling')
  const voiceMinutes = useFeatureFlag('voiceMinutes') as number
  const voiceAgentLimit = useFeatureFlag('voiceAgents') as number

  const [tab, setTab]           = useState<Tab>('agents')
  const [createOpen, setCreate] = useState(false)
  const [editAgent, setEdit]    = useState<VoiceAgent | null>(null)
  const [callOpen, setCallOpen] = useState(false)
  const [callAgentId, setCallAgentId] = useState<string | undefined>()

  const { agents, isLoading: agentsLoading, createAgent, updateAgent, deleteAgent, isCreating } = useVoiceAgents()
  const { calls, analytics, isLoading: callsLoading, initiateCall } = useVoiceCalls()
  const { createBooking } = useBookings()
  const { startCall, setStatus, appendTranscript, endCall, setCallId } = useVoiceStore()
  const user = useAuthStore(s => s.user)
  const simulationRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup simulation timeouts on unmount
  useEffect(() => () => { simulationRef.current.forEach(clearTimeout) }, [])

  if (!hasVoice) return (
    <DashboardShell title="Voice Agent">
      <VoiceUpgradePrompt />
    </DashboardShell>
  )

  // ── Demo call simulation ────────────────────────────────────────────────────
  function simulateDemoCall(agent: VoiceAgent, toNumber: string) {
    startCall(agent.id, agent.name, 'outbound', toNumber)
    setCallId(`demo-call-${Date.now()}`)

    // Transition to ringing after 1s
    const t1 = setTimeout(() => setStatus('ringing'), 1000)
    // Transition to active after 2.5s
    const t2 = setTimeout(() => setStatus('active'), 2500)

    // Stream mock transcript entries
    MOCK_TRANSCRIPT_SIMULATION.forEach(entry => {
      const tid = setTimeout(() => {
        appendTranscript({ speaker: entry.speaker, text: entry.text, timestamp: entry.delay })

        // Create real appointment when the booking line fires
        if (entry.bookingTrigger) {
          const thursday = new Date()
          const daysUntilThursday = (4 - thursday.getDay() + 7) % 7 || 7
          thursday.setDate(thursday.getDate() + daysUntilThursday)
          const dateStr = thursday.toISOString().split('T')[0]
          const bd = entry.bookingData

          createBooking({
            serviceName:   bd?.serviceName  ?? 'Service',
            customerName:  bd?.customerName ?? 'Voice Caller',
            customerPhone: toNumber,
            date:          dateStr,
            startTime:     '14:00',
            endTime:       '14:30',
            amount:        bd?.amount,
            notes:         `Booked via AI Voice Agent (${agent.name})`,
          })
            .then(() => toast.success(`Appointment booked — ${bd?.customerName ?? 'Customer'} · ${bd?.serviceName ?? 'Service'} · $${bd?.amount ?? 0}`, { icon: '📅', duration: 5000 }))
            .catch(() => {/* silent — demo call still works */})
        }
      }, entry.delay)
      simulationRef.current.push(tid)
    })

    // Auto-end after last transcript + 3s
    const lastDelay = MOCK_TRANSCRIPT_SIMULATION[MOCK_TRANSCRIPT_SIMULATION.length - 1].delay
    const tEnd = setTimeout(() => {
      setStatus('ending')
      const tFinal = setTimeout(endCall, 1500)
      simulationRef.current.push(tFinal)
    }, lastDelay + 3000)

    simulationRef.current.push(t1, t2, tEnd)
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleCreateAgent(data: CreateVoiceAgentData) {
    await toast.promise(
      createAgent(data),
      { loading: 'Creating agent…', success: 'Agent created!', error: 'Failed to create agent' }
    )
  }

  async function handleUpdateAgent(data: CreateVoiceAgentData) {
    if (!editAgent) return
    await toast.promise(
      updateAgent({ id: editAgent.id, data }),
      { loading: 'Saving changes…', success: 'Agent updated!', error: 'Failed to update agent' }
    )
    setEdit(null)
  }

  async function handleDeleteAgent(agent: VoiceAgent) {
    if (!confirm(`Delete "${agent.name}"? This cannot be undone.`)) return
    await toast.promise(
      deleteAgent(agent.id),
      { loading: 'Deleting…', success: 'Agent deleted', error: 'Failed to delete' }
    )
  }

  async function handleToggleAgent(agent: VoiceAgent) {
    await toast.promise(
      updateAgent({ id: agent.id, data: { isActive: !agent.isActive } }),
      {
        loading: agent.isActive ? 'Pausing agent…' : 'Activating agent…',
        success: agent.isActive ? 'Agent paused' : 'Agent activated',
        error: 'Failed to update agent',
      }
    )
  }

  function handleCallAgent(agent: VoiceAgent) {
    setCallAgentId(agent.id)
    setCallOpen(true)
  }

  async function handleStartCall(agentId: string, toNumber: string) {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    // Demo agents or demo mode → always simulate locally
    if (isDemoMode() || agentId.startsWith('agent-00') || !agent.phoneNumberSid || agent.phoneNumberSid.startsWith('PN_demo')) {
      simulateDemoCall(agent, toNumber)
      toast.success('Demo call started — watch the HUD!')
      return
    }

    // Real call — fall back to demo if Cloud Functions not yet deployed
    try {
      const result = await initiateCall({ agentId, to: toNumber, from: agent.phoneNumber ?? '' })
      if (result) {
        startCall(agentId, agent.name, 'outbound', toNumber)
        setCallId(result.callId)
        toast.success('Call connected!')
      }
    } catch {
      simulateDemoCall(agent, toNumber)
      toast('Cloud Functions not deployed yet — running demo call instead.', { icon: '⚡' })
    }
  }

  const agentLimitReached =
    voiceAgentLimit !== -1 && agents.length >= voiceAgentLimit

  const TABS: { id: Tab; label: string; icon: typeof List }[] = [
    { id: 'agents',    label: 'Agents',    icon: Zap },
    { id: 'calls',     label: 'Call Log',  icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <DashboardShell title="Voice Agent">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
              <span>AI Voice Agents</span>
              <Badge variant="brand" size="sm">
                {voiceMinutes === -1 ? 'Unlimited' : `${voiceMinutes} min/mo`}
              </Badge>
            </h2>
            <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">
              Create intelligent voice agents that handle calls automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<PhoneCall size={14} />}
              onClick={() => setCallOpen(true)}
              disabled={agents.filter(a => a.isActive).length === 0}
            >
              Start Call
            </Button>
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setCreate(true)}
              disabled={agentLimitReached}
              title={agentLimitReached ? `Agent limit (${voiceAgentLimit}) reached — upgrade to add more` : undefined}
            >
              New Agent
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl mb-6 w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-white shadow-sm'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
              }`}
            >
              <Icon size={14} />
              {t.label}
              {t.id === 'calls' && calls.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                  {calls.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Agents Tab */}
      {tab === 'agents' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {agentsLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : agents.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white mb-2">
                No voice agents yet
              </h3>
              <p className="text-ink-500 dark:text-ink-400 mb-5 text-sm max-w-sm mx-auto">
                Create your first AI voice agent to start handling calls automatically.
                Use a template or build from scratch.
              </p>
              <Button icon={<Plus size={15} />} onClick={() => setCreate(true)}>
                Create First Agent
              </Button>
            </Card>
          ) : (
            <>
              {agentLimitReached && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Zap size={14} />
                  Agent limit reached ({voiceAgentLimit}). Upgrade to Enterprise for unlimited agents.
                </div>
              )}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map((agent, i) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    index={i}
                    onCall={handleCallAgent}
                    onEdit={a => { setEdit(a); setCreate(true) }}
                    onDelete={handleDeleteAgent}
                    onToggle={handleToggleAgent}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Calls Tab */}
      {tab === 'calls' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-white">Call Log</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">{calls.length} calls recorded</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<PhoneCall size={14} />}
                onClick={() => setCallOpen(true)}
              >
                Start Call
              </Button>
            </div>
            <CallLogTable calls={calls} isLoading={callsLoading} />
          </Card>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <VoiceAnalyticsDashboard analytics={analytics} />
        </motion.div>
      )}

      {/* Modals */}
      <AgentCreateModal
        isOpen={createOpen || !!editAgent}
        onClose={() => { setCreate(false); setEdit(null) }}
        onSave={editAgent ? handleUpdateAgent : handleCreateAgent}
        editAgent={editAgent}
        isSaving={isCreating}
      />

      <OutboundCallModal
        isOpen={callOpen}
        onClose={() => setCallOpen(false)}
        onCall={handleStartCall}
        agents={agents}
        defaultAgentId={callAgentId}
      />
    </DashboardShell>
  )
}
