import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import type { UserRole } from '../../context/types'
import { Loading } from '../ui/Loading'

export interface RoleProtectedRouteProps {
  allowedRoles: UserRole[]
  children?: React.ReactNode
}

/**
 * Route guard enforcing specific user roles (e.g. CREATOR only or USER only).
 * Redirects unauthenticated users to /login and unauthorized roles to their default page.
 */
export const RoleProtectedRoute = ({
  allowedRoles,
  children,
}: RoleProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loading label="Verifying role permissions..." />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // If a CREATOR tries to access USER bookings -> redirect to /creator
    if (user.role === 'CREATOR') {
      return <Navigate to="/creator" replace />
    }
    // If a USER tries to access CREATOR pages -> redirect to /dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
