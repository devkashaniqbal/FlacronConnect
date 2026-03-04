import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneCall } from 'lucide-react'
import { Modal, Button, Input, Select } from '@/components/ui'
import type { VoiceAgent } from '@/types/voice.types'

const schema = z.object({
  agentId:  z.string().min(1, 'Select an agent'),
  toNumber: z.string().min(7, 'Enter a valid phone number'),
})

type FormData = z.infer<typeof schema>

interface OutboundCallModalProps {
  isOpen:    boolean
  onClose:   () => void
  onCall:    (agentId: string, toNumber: string) => Promise<void>
  agents:    VoiceAgent[]
  defaultAgentId?: string
}

export function OutboundCallModal({ isOpen, onClose, onCall, agents, defaultAgentId }: OutboundCallModalProps) {
  const [isCalling, setIsCalling] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agentId: defaultAgentId ?? '', toNumber: '' },
  })

  // Re-seed agentId whenever the modal opens or the default agent changes
  useEffect(() => {
    if (isOpen) reset({ agentId: defaultAgentId ?? '', toNumber: '' })
  }, [isOpen, defaultAgentId, reset])

  async function onSubmit(data: FormData) {
    setIsCalling(true)
    try {
      await onCall(data.agentId, data.toNumber)
      reset()
      onClose()
    } finally {
      setIsCalling(false)
    }
  }

  const activeAgents = agents.filter(a => a.isActive)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start Outbound Call" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Voice Agent"
          placeholder="Select agent..."
          options={activeAgents.map(a => ({ value: a.id, label: a.name }))}
          {...register('agentId')}
          error={errors.agentId?.message}
        />
        <Input
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          type="tel"
          {...register('toNumber')}
          error={errors.toNumber?.message}
        />
        <p className="text-xs text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-800 rounded-xl p-3">
          The selected agent will call this number. A consent announcement will play at the start of the call.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isCalling} icon={<PhoneCall size={15} />} className="flex-1">
            Start Call
          </Button>
        </div>
      </form>
    </Modal>
  )
}
