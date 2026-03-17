import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { Input, Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/utils/validators'
import { ROUTES } from '@/constants/routes'
import { DEMO_ACCOUNTS } from '@/lib/demoMode'
import type { LoginCredentials } from '@/types/auth.types'

export function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function quickLogin(email: string, password: string) {
    try {
      await login({ email, password })
      toast.success('Welcome back!')
      navigate(ROUTES.DASHBOARD)
    } catch {
      toast.error('Quick login failed')
    }
  }

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

      {/* Quick accounts panel — always visible for testing */}
      <div className="mt-6">
        <div className="rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAccounts(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-ink-50 dark:bg-ink-800 text-xs font-semibold text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Zap size={13} />
                Quick-Login — 12 Industry Accounts (Enterprise)
              </span>
              {showAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAccounts && (
              <div className="grid grid-cols-2 gap-px bg-ink-200 dark:bg-ink-700">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => quickLogin(acc.email, acc.password)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-ink-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors text-left"
                  >
                    <span className="text-base leading-none">{acc.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink-800 dark:text-ink-200 truncate">{acc.businessName}</p>
                      <p className="text-[10px] text-ink-400 truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>
    </AuthLayout>
  )
}
