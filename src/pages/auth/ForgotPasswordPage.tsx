import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { Input, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { forgotPasswordSchema } from '@/utils/validators'
import { ROUTES } from '@/constants/routes'

interface FormData { email: string }

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const { resetPassword } = useAuth()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit({ email }: FormData) {
    try {
      await resetPassword(email)
      setSentEmail(email)
      setSent(true)
    } catch {
      toast.error('Failed to send reset email. Check the address and try again.')
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent password reset instructions.">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-ink-600 dark:text-ink-400 mb-2">
            We sent a reset link to
          </p>
          <p className="font-semibold text-ink-900 dark:text-white mb-6">{sentEmail}</p>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-8">
            Check your inbox and follow the instructions. The link expires in 1 hour.
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button variant="secondary" icon={<ArrowLeft size={16} />}>Back to sign in</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@business.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
