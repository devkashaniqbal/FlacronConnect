import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { Input, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/utils/validators'
import { ROUTES } from '@/constants/routes'
import { isDemoMode } from '@/lib/demoMode'
import type { LoginCredentials } from '@/types/auth.types'

export function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginCredentials) {
    try {
      await login(data)
      toast.success('Welcome back!')
      navigate(ROUTES.DASHBOARD)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found')) {
        toast.error('Invalid email or password')
      } else if (msg.includes('auth/too-many-requests')) {
        toast.error('Too many attempts. Try again later.')
      } else {
        toast.error('Login failed. Please try again.')
      }
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your FlacronControl account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          iconRight={
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="text-ink-400 hover:text-ink-600 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Don't have an account?{' '}
          <Link
            to={ROUTES.SIGNUP}
            className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            Create one free
          </Link>
        </p>
      </div>

      {/* Demo mode banner */}
      {isDemoMode() && (
        <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-950/50 rounded-xl border border-brand-200 dark:border-brand-800">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Demo Mode Active</span>
          </div>
          <p className="text-xs text-brand-600 dark:text-brand-400">
            Enter <strong>any email</strong> and <strong>any password</strong> (8+ chars) to explore the full app.
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
