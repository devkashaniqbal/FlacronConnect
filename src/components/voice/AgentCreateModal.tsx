import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Select, Badge } from '@/components/ui'
import type { VoiceAgent, CreateVoiceAgentData } from '@/types/voice.types'

const schema = z.object({
  name:                  z.string().min(2, 'Name must be at least 2 characters'),
  description:           z.string().min(10, 'Add a short description'),
  personality:           z.enum(['formal', 'friendly', 'sales', 'support', 'survey']),
  goal:                  z.enum(['booking', 'sales', 'support', 'survey', 'info']),
  language:              z.string().min(1),
  voiceGender:           z.enum(['male', 'female', 'neutral']),
  systemPrompt:          z.string().min(20, 'System prompt must be at least 20 characters'),
  enableMemory:          z.boolean(),
  injectBusinessContext: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface AgentCreateModalProps {
  isOpen:     boolean
  onClose:    () => void
  onSave:     (data: CreateVoiceAgentData) => Promise<void>
  editAgent?: VoiceAgent | null
  isSaving:  boolean
}

const PERSONALITY_TEMPLATES: Record<string, Partial<FormData>> = {
  'Booking Assistant': {
    personality:           'friendly',
    goal:                  'booking',
    systemPrompt:          'You are a friendly booking assistant. Help callers schedule, reschedule, or cancel appointments. Always confirm customer name, service, preferred date and time before booking. Be warm, efficient, and professional.',
    enableMemory:          true,
    injectBusinessContext: true,
  },
  'Sales Agent': {
    personality:           'sales',
    goal:                  'sales',
    systemPrompt:          "You are an energetic sales representative. Introduce our services, highlight key benefits, handle objections confidently, and guide prospects toward booking a consultation or trial. Be persuasive but not pushy.",
    enableMemory:          false,
    injectBusinessContext: true,
  },
  'Support Agent': {
    personality:           'support',
    goal:                  'support',
    systemPrompt:          'You are a helpful support agent. Answer questions clearly, resolve issues patiently, and escalate to a human when needed. Always make the caller feel heard and valued.',
    enableMemory:          false,
    injectBusinessContext: true,
  },
  'FAQ Bot': {
    personality:           'formal',
    goal:                  'info',
    systemPrompt:          'You are an informational assistant. Answer frequently asked questions about business hours, pricing, services, and location clearly and concisely. Do not make appointments or promises.',
    enableMemory:          false,
    injectBusinessContext: true,
  },
}

export function AgentCreateModal({ isOpen, onClose, onSave, editAgent, isSaving }: AgentCreateModalProps) {
  const isEdit = !!editAgent

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      personality:           'friendly',
      goal:                  'booking',
      language:              'en-US',
      voiceGender:           'female',
      enableMemory:          true,
      injectBusinessContext: true,
      systemPrompt:          '',
    },
  })

  useEffect(() => {
    if (editAgent) {
      reset({
        name:                  editAgent.name,
        description:           editAgent.description,
        personality:           editAgent.personality,
        goal:                  editAgent.goal,
        language:              editAgent.language,
        voiceGender:           editAgent.voiceGender,
        systemPrompt:          editAgent.systemPrompt,
        enableMemory:          editAgent.enableMemory,
        injectBusinessContext: editAgent.injectBusinessContext,
      })
    } else {
      reset({
        personality: 'friendly', goal: 'booking', language: 'en-US',
        voiceGender: 'female', enableMemory: true, injectBusinessContext: true, systemPrompt: '',
      })
    }
  }, [editAgent, isOpen, reset])

  function applyTemplate(name: string) {
    const tpl = PERSONALITY_TEMPLATES[name]
    if (!tpl) return
    Object.entries(tpl).forEach(([k, v]) => setValue(k as keyof FormData, v as never))
    setValue('name', name)
    setValue('description', `AI agent optimized for ${name.toLowerCase()} workflows.`)
  }

  async function onSubmit(data: FormData) {
    await onSave(data)
    onClose()
  }

  const enableMemory          = watch('enableMemory')
  const injectBusinessContext = watch('injectBusinessContext')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Voice Agent' : 'Create Voice Agent'} size="lg">
      {/* Quick templates */}
      {!isEdit && (
        <div className="mb-5">
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400 mb-2 uppercase tracking-wider">Quick Templates</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PERSONALITY_TEMPLATES).map(name => (
              <button
                key={name}
                type="button"
                onClick={() => applyTemplate(name)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Agent Name"
            placeholder="e.g. Sarah — Booking Assistant"
            {...register('name')}
            error={errors.name?.message}
          />
          <Select
            label="Language"
            options={[
              { value: 'en-US', label: 'English (US)' },
              { value: 'en-GB', label: 'English (UK)' },
              { value: 'es-ES', label: 'Spanish' },
              { value: 'fr-FR', label: 'French' },
              { value: 'de-DE', label: 'German' },
              { value: 'pt-BR', label: 'Portuguese (Brazil)' },
              { value: 'ar-SA', label: 'Arabic' },
            ]}
            {...register('language')}
            error={errors.language?.message}
          />
        </div>

        <Input
          label="Description"
          placeholder="What does this agent do?"
          {...register('description')}
          error={errors.description?.message}
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <Select
            label="Personality"
            options={[
              { value: 'friendly', label: 'Friendly' },
              { value: 'formal',   label: 'Formal' },
              { value: 'sales',    label: 'Sales' },
              { value: 'support',  label: 'Support' },
              { value: 'survey',   label: 'Survey' },
            ]}
            {...register('personality')}
            error={errors.personality?.message}
          />
          <Select
            label="Goal"
            options={[
              { value: 'booking', label: 'Booking' },
              { value: 'sales',   label: 'Sales' },
              { value: 'support', label: 'Support' },
              { value: 'survey',  label: 'Survey' },
              { value: 'info',    label: 'Information' },
            ]}
            {...register('goal')}
            error={errors.goal?.message}
          />
          <Select
            label="Voice"
            options={[
              { value: 'female',  label: 'Female' },
              { value: 'male',    label: 'Male' },
              { value: 'neutral', label: 'Neutral' },
            ]}
            {...register('voiceGender')}
            error={errors.voiceGender?.message}
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">
            System Prompt
          </label>
          <textarea
            rows={4}
            placeholder="Describe how the agent should behave, its persona, rules, and goals..."
            className="w-full input-base py-3 resize-none text-sm"
            {...register('systemPrompt')}
          />
          {errors.systemPrompt && (
            <p className="text-xs text-red-500 mt-1">{errors.systemPrompt.message}</p>
          )}
        </div>

        {/* Toggles */}
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { key: 'injectBusinessContext' as const, label: 'Inject Business Context', desc: 'Give agent access to services, hours, pricing, and bookings', value: injectBusinessContext },
            { key: 'enableMemory' as const, label: 'Enable Conversation Memory', desc: 'Agent remembers previous turns in the same call', value: enableMemory },
          ].map(toggle => (
            <label
              key={toggle.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-brand-600"
                {...register(toggle.key)}
              />
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-white">{toggle.label}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{toggle.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} className="flex-1">
            {isEdit ? 'Save Changes' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
