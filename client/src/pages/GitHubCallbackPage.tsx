import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getGitHubAuthUrl } from '../api/github.js'
import { PageContainer } from '../components/ui/PageContainer'
import { Loading } from '../components/ui/Loading'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Button } from '../components/ui/Button'
import { RoleConfirmationModal } from '../components/auth/RoleConfirmationModal'
import type { UserRole, AuthUser } from '../context/types'

export const GitHubCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
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
      // 1. Check for OAuth error / cancellation query params from GitHub
      const errorParam = searchParams.get('error')
      const errorDesc = searchParams.get('error_description')

      if (errorParam) {
        if (errorParam === 'access_denied' || errorParam === 'user_cancelled_authorize') {
          setIsCancelled(true)
          setErrorMsg(
            'GitHub authorization was cancelled. You can sign in with your email or try connecting with GitHub again.'
          )
        } else {
          setErrorMsg(
            errorDesc || `GitHub authorization failed with error: ${errorParam}`
          )
        }
        return
      }

      // 2. Check for authorization code
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

        // Check if this is a newly registered user account via GitHub
        if (loggedInUser.is_new_user) {
          const preselectedRole = localStorage.getItem(
            'ahoum_oauth_role'
          ) as UserRole | null
          localStorage.removeItem('ahoum_oauth_role')

          if (preselectedRole === 'CREATOR' || preselectedRole === 'USER') {
            await updateUserRole(preselectedRole)
            if (preselectedRole === 'CREATOR') {
              navigate('/creator', { replace: true })
            } else {
              navigate('/dashboard', { replace: true })
            }
          } else {
            setAuthenticatedUser(loggedInUser)
            setShowRoleModal(true)
          }
        } else {
          localStorage.removeItem('ahoum_oauth_role')
          // Existing user logging in -> directly redirect based on database role
          if (loggedInUser.role === 'CREATOR') {
            navigate('/creator', { replace: true })
          } else {
            navigate('/dashboard', { replace: true })
          }
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        setErrorMsg(
          e?.message ||
            'GitHub authentication failed or the authorization code has expired. Please try signing in again.'
        )
      }
    }

    processOAuth()
  }, [searchParams, loginWithGitHub, updateUserRole, navigate])

  const handleRoleConfirmed = async (role: UserRole) => {
    await updateUserRole(role)
    setShowRoleModal(false)
    if (role === 'CREATOR') {
      navigate('/creator', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleRetryGitHub = async () => {
    setIsRetrying(true)
    setErrorMsg(null)
    try {
      const res = await getGitHubAuthUrl()
      if (res && res.url) {
        window.location.href = res.url
      } else {
        setErrorMsg('Failed to initialize GitHub OAuth flow.')
        setIsRetrying(false)
      }
    } catch {
      setErrorMsg('Failed to connect to GitHub. Please try again.')
      setIsRetrying(false)
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
        {isCancelled ? (
          /* User explicitly cancelled OAuth on GitHub */
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Authorization Cancelled
              </h2>
              <p className="text-sm text-slate-600">
                You chose not to complete the GitHub authorization request. No account was modified.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={handleRetryGitHub}
                isLoading={isRetrying}
              >
                Try Again with GitHub
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" className="w-full">
                  <Button variant="outline" size="md" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="w-full">
                  <Button variant="outline" size="md" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : errorMsg ? (
          /* General OAuth Error / Failure */
          <div className="space-y-6">
            <ErrorMessage
              title="GitHub Authorization Failed"
              message={errorMsg}
              variant="error"
            />
            <div className="pt-2 flex flex-col gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={handleRetryGitHub}
                isLoading={isRetrying}
              >
                Retry GitHub Authorization
              </Button>
              <Link to="/login" className="w-full">
                <Button variant="outline" size="md" className="w-full">
                  Return to Email Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* In-Flight Processing */
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
