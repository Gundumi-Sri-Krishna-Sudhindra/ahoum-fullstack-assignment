import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/ui/PageContainer'
import { Loading } from '../components/ui/Loading'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Button } from '../components/ui/Button'
import { RoleConfirmationModal } from '../components/auth/RoleConfirmationModal'
import type { UserRole, AuthUser } from '../context/types'

export const GitHubCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(
    null
  )

  const { loginWithGitHub, updateUserRole } = useAuth()
  const navigate = useNavigate()
  const hasExecutedRef = useRef(false)

  useEffect(() => {
    document.title = 'Ahoum | GitHub Authentication'
  }, [])

  useEffect(() => {
    if (hasExecutedRef.current) return
    hasExecutedRef.current = true

    const processOAuth = async () => {
      const code = searchParams.get('code')
      if (!code) {
        setErrorMsg(
          'No authorization code was provided in the GitHub OAuth callback URL.'
        )
        return
      }

      try {
        const redirectUri = window.location.origin + window.location.pathname
        const loggedInUser = await loginWithGitHub(code, redirectUri)

        // Check if role has already been confirmed previously
        const existingRoleOverride = localStorage.getItem('user_role_override')
        if (existingRoleOverride) {
          if (loggedInUser.role === 'CREATOR') {
            navigate('/creator', { replace: true })
          } else {
            navigate('/dashboard', { replace: true })
          }
        } else {
          // Present role confirmation modal to finalize account role setup
          setAuthenticatedUser(loggedInUser)
          setShowRoleModal(true)
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        setErrorMsg(
          e?.message ||
            'GitHub authentication failed or the code has expired. Please try signing in again.'
        )
      }
    }

    processOAuth()
  }, [searchParams, loginWithGitHub, navigate])

  const handleRoleConfirmed = (role: UserRole) => {
    updateUserRole(role)
    setShowRoleModal(false)
    if (role === 'CREATOR') {
      navigate('/creator', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <PageContainer maxWidth="sm" className="py-20 sm:py-28">
      {/* Role Selection Modal */}
      <RoleConfirmationModal
        isOpen={showRoleModal}
        userName={authenticatedUser?.name}
        defaultRole="USER"
        onConfirm={handleRoleConfirmed}
      />

      <div className="border border-slate-200 p-8 sm:p-12 rounded-sm bg-white text-center space-y-6 shadow-xs">
        {errorMsg ? (
          <div className="space-y-6">
            <ErrorMessage
              title="GitHub Authorization Failed"
              message={errorMsg}
              variant="error"
            />
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" size="md">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Loading size="lg" label="Completing GitHub authorization..." />
            <p className="text-sm text-slate-600">
              Securing tokens and finalizing your account setup...
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
