import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, MapPin, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/constants/firestore'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { Input, Select, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { IndustryPicker } from '@/components/onboarding/IndustryPicker'
import { applyIndustryTemplate } from '@/services/templateEngine'
import {
  signupStep1Schema, signupStep2Schema, signupStepIndustrySchema,
  signupStep3Schema, signupStep4Schema, signupStep5Schema,
} from '@/utils/validators'
import { ROUTES } from '@/constants/routes'
import { PLANS } from '@/constants/plans'
import { cn } from '@/utils/cn'
import { INDUSTRY_TEMPLATES } from '@/constants/industryTemplates'
import type { Plan } from '@/types/auth.types'
import type { IndustryType } from '@/types/industry.types'
import type {
  SignupStep1, SignupStep2, SignupStepIndustry,
  SignupStep3, SignupStep4, SignupStep5,
} from '@/types/auth.types'

// ─── Step indices ─────────────────────────────────────────────────────────────
// 0 Account | 1 Business | 2 Industry | 3 Location | 4 Plan | 5 Confirm
const TOTAL_STEPS = 5  // 0-based index of the last step

const STEP_LABELS = ['Account', 'Business', 'Industry', 'Location', 'Plan', 'Confirm']

const STEP_SCHEMAS = [
  signupStep1Schema,        // 0
  signupStep2Schema,        // 1
  signupStepIndustrySchema, // 2 – handled separately (IndustryPicker)
  signupStep3Schema,        // 3
  signupStep4Schema,        // 4
  signupStep5Schema,        // 5
]

type StepData = SignupStep1
  & Partial<SignupStep2 & SignupStepIndustry & SignupStep3 & SignupStep4 & SignupStep5>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = (typeof STEP_SCHEMAS)[number] extends { parse: (v: any) => infer T } ? T : never

export function SignupPage() {
  const [step, setStep]               = useState(0)
  const [showPass, setShowPass]       = useState(false)
  const [formData, setFormData]       = useState<Partial<StepData>>({})
  // Industry step (step 2) is driven by local state + setValue
  const [industryError, setIndustryError] = useState<string | null>(null)

  const { register: fbRegister } = useAuth()
  const setUser = useAuthStore(s => s.setUser)
  const navigate = useNavigate()

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<AnySchema>({
    resolver:      zodResolver(STEP_SCHEMAS[step] as never),
    defaultValues: formData as AnySchema,
  })

  const selectedPlan     = watch('plan') as Plan | undefined
  const selectedIndustry = (watch('industryType') ?? formData.industryType ?? null) as IndustryType | null

  // ── Step 2 (industry) uses a manual advance, all others use handleSubmit ──
  function handleIndustryContinue() {
    if (!selectedIndustry) {
      setIndustryError('Please select an industry to continue.')
      return
    }
    setIndustryError(null)
    setFormData(prev => ({ ...prev, industryType: selectedIndustry }))
    setStep(s => s + 1)
  }

  async function onNext(data: AnySchema) {
    const merged = { ...formData, ...data }
    setFormData(merged)

    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      // ── Final submit ────────────────────────────────────────────────────
      try {
        const d          = merged as StepData
        const plan       = (d.plan as Plan) || 'starter'
        const industry   = d.industryType as IndustryType
        const template   = INDUSTRY_TEMPLATES[industry]

        const fbUser = await fbRegister(
          d.email,
          d.password,
          `${d.firstName} ${d.lastName}`,
          plan,
          industry,
        )

        // businessId is now computed in register() as `biz_${uid}` and already
        // written to the user doc and auth store — derive it consistently here
        const businessId = `biz_${fbUser.uid}`

        // Create business document (category will be overwritten by template engine)
        await setDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
          name:      d.businessName  ?? '',
          category:  template?.businessCategory ?? '',
          address:   d.address  ?? '',
          city:      d.city     ?? '',
          state:     d.state    ?? '',
          country:   d.country  ?? '',
          phone:     d.phone    ?? '',
          ownerId:   fbUser.uid,
          plan,
          industryType: industry,
          createdAt: serverTimestamp(),
        })

        // Seed default services + write industryFeatures to business doc
        await applyIndustryTemplate(businessId, industry)

        toast.success('Account created! Welcome to FlacronControl 🎉')
        navigate(ROUTES.DASHBOARD)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('Registration error:', err)
        if (msg.includes('auth/email-already-in-use')) {
          toast.error('Email already in use. Please sign in.')
        } else if (msg.includes('auth/weak-password')) {
          toast.error('Password must be at least 6 characters.')
        } else if (msg.includes('auth/invalid-email')) {
          toast.error('Invalid email address.')
        } else if (msg.includes('auth/operation-not-allowed')) {
          toast.error('Email/password sign-up is not enabled.')
        } else {
          toast.error(`Registration failed: ${msg}`)
        }
      }
    }
  }

  // ── Subtitles per step ────────────────────────────────────────────────────
  const subtitles = [
    'Start your 14-day free trial, no credit card required.',
    'Tell us about your business.',
    'What type of business are you running?',
    'Where is your business located?',
    'Choose a plan that fits your needs.',
    'Review and confirm your details.',
  ]

  const progressPercent = (step / TOTAL_STEPS) * 100

  return (
    <AuthLayout
      title={step === 0 ? 'Create your account' : STEP_LABELS[step]}
      subtitle={subtitles[step]}
    >
      {/* ── Progress bar ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300',
                i < step
                  ? 'bg-brand-600 text-white'
                  : i === step
                  ? 'bg-brand-600 text-white ring-4 ring-brand-200 dark:ring-brand-900'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-400',
              )}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] mt-1 hidden sm:block',
                i <= step
                  ? 'text-brand-600 dark:text-brand-400 font-medium'
                  : 'text-ink-400',
              )}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-brand rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ── Step content ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ── Step 2: Industry Picker (outside RHF) ─────────────────── */}
        {step === 2 ? (
          <motion.div
            key="step-industry"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <IndustryPicker
              value={selectedIndustry}
              onChange={key => {
                setValue('industryType', key as never)
                setFormData(prev => ({ ...prev, industryType: key }))
                setIndustryError(null)
              }}
              error={industryError ?? undefined}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(s => s - 1)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleIndustryContinue}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        ) : (
          /* ── All other steps: standard RHF form ────────────────────── */
          <motion.form
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit(onNext as never)}
            className="space-y-4"
          >
            {/* Step 0 – Account */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First name" placeholder="Jane" icon={<User size={16} />}
                    error={(errors as Record<string, { message?: string }>).firstName?.message}
                    {...register('firstName')} />
                  <Input label="Last name" placeholder="Smith"
                    error={(errors as Record<string, { message?: string }>).lastName?.message}
                    {...register('lastName')} />
                </div>
                <Input label="Email" type="email" placeholder="jane@business.com" icon={<Mail size={16} />}
                  error={(errors as Record<string, { message?: string }>).email?.message}
                  {...register('email')} />
                <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  icon={<Lock size={16} />}
                  iconRight={
                    <button type="button" onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  error={(errors as Record<string, { message?: string }>).password?.message}
                  hint="At least 8 chars, one uppercase, one number"
                  {...register('password')} />
                <Input label="Confirm password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  icon={<Lock size={16} />}
                  error={(errors as Record<string, { message?: string }>).confirmPassword?.message}
                  {...register('confirmPassword')} />
              </>
            )}

            {/* Step 1 – Business */}
            {step === 1 && (
              <>
                <Input label="Business name" placeholder="Bloom Salon" icon={<Building2 size={16} />}
                  error={(errors as Record<string, { message?: string }>).businessName?.message}
                  {...register('businessName')} />
                <Input label="Phone number" type="tel" placeholder="+1 (555) 000-0000" icon={<Phone size={16} />}
                  error={(errors as Record<string, { message?: string }>).phone?.message}
                  {...register('phone')} />
              </>
            )}

            {/* Step 3 – Location */}
            {step === 3 && (
              <>
                <Input label="Street address" placeholder="123 Main St" icon={<MapPin size={16} />}
                  error={(errors as Record<string, { message?: string }>).address?.message}
                  {...register('address')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" placeholder="New York"
                    error={(errors as Record<string, { message?: string }>).city?.message}
                    {...register('city')} />
                  <Input label="State / Province" placeholder="NY"
                    error={(errors as Record<string, { message?: string }>).state?.message}
                    {...register('state')} />
                </div>
                <Input label="Country" placeholder="United States"
                  error={(errors as Record<string, { message?: string }>).country?.message}
                  {...register('country')} />
              </>
            )}

            {/* Step 4 – Plan */}
            {step === 4 && (
              <div className="space-y-3">
                {PLANS.map(plan => (
                  <label
                    key={plan.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedPlan === plan.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                        : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
                    )}
                  >
                    <input type="radio" value={plan.id} {...register('plan')} className="mt-1 accent-brand-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink-900 dark:text-white">{plan.name}</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">${plan.price}/mo</span>
                      </div>
                      <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{plan.description}</p>
                    </div>
                  </label>
                ))}
                {(errors as Record<string, { message?: string }>).plan?.message && (
                  <p className="text-xs text-red-500">
                    {(errors as Record<string, { message?: string }>).plan?.message}
                  </p>
                )}
              </div>
            )}

            {/* Step 5 – Confirm */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="card p-4 space-y-2">
                  <h3 className="font-semibold text-ink-900 dark:text-white text-sm">Account summary</h3>
                  {[
                    ['Name',     `${formData.firstName} ${formData.lastName}`],
                    ['Email',    formData.email],
                    ['Business', formData.businessName],
                    ['Industry', formData.industryType
                      ? INDUSTRY_TEMPLATES[formData.industryType]?.label
                      : '—'],
                    ['Location', `${formData.city}, ${formData.country}`],
                    ['Plan',     formData.plan],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-ink-500">{k}</span>
                      <span className="text-ink-900 dark:text-white font-medium capitalize">{v}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" {...register('acceptTerms')} className="mt-0.5 accent-brand-600 w-4 h-4" />
                  <span className="text-sm text-ink-600 dark:text-ink-400">
                    I agree to the{' '}
                    <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a>
                  </span>
                </label>
                {(errors as Record<string, { message?: string }>).acceptTerms?.message && (
                  <p className="text-xs text-red-500">
                    {(errors as Record<string, { message?: string }>).acceptTerms?.message}
                  </p>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" {...register('acceptMarketing')} className="mt-0.5 accent-brand-600 w-4 h-4" />
                  <span className="text-sm text-ink-600 dark:text-ink-400">
                    Send me product updates and tips (optional)
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(s => s - 1)}
                >
                  Back
                </Button>
              )}
              <Button type="submit" className="flex-1" loading={isSubmitting}>
                {step === TOTAL_STEPS ? 'Create account' : 'Continue'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {step === 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
