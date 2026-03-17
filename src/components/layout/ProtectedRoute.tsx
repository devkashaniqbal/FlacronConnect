import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import { PageSpinner } from '@/components/ui'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'super_admin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized || isLoading || (user && !user.businessId)) {
    return <div className="min-h-screen bg-white dark:bg-ink-950 flex items-center justify-center"><PageSpinner /></div>
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <>{children}</>
}
