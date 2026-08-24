import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { Loading } from '../ui/Loading'

export interface PublicRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard for routes only accessible when NOT logged in (e.g. /login, /register).
 * Redirects authenticated users to their corresponding dashboard based on role.
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loading label="Checking authentication..." />
      </div>
    )
  }

  if (isAuthenticated && user) {
    // Redirect to the location they came from or role dashboard
    const fromLocation = (location.state as { from?: { pathname?: string } })?.from?.pathname
    if (fromLocation && fromLocation !== '/login' && fromLocation !== '/register') {
      return <Navigate to={fromLocation} replace />
    }

    if (user.role === 'CREATOR') {
      return <Navigate to="/creator" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
