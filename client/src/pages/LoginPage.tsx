import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getGitHubAuthUrl } from '../api/github.js'
import { PageContainer } from '../components/ui/PageContainer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.title = 'Ahoum | Login'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const loggedInUser = await login(email.trim(), password)
      const fromLocation = (
        location.state as { from?: { pathname?: string } }
      )?.from?.pathname

      if (
        fromLocation &&
        fromLocation !== '/login' &&
        fromLocation !== '/register'
      ) {
        navigate(fromLocation, { replace: true })
      } else if (loggedInUser.role === 'CREATOR') {
        navigate('/creator', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(
        e?.message ||
          'Unable to sign in. Please verify your email and password.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGitHubLogin = async () => {
    setErrorMsg(null)
    setIsOAuthLoading(true)
    try {
      const res = await getGitHubAuthUrl()
      if (res && res.url) {
        window.location.href = res.url
      } else {
        setErrorMsg('Failed to initialize GitHub OAuth flow.')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(
        e?.message || 'Failed to connect to GitHub. Please try again later.'
      )
    } finally {
      setIsOAuthLoading(false)
    }
  }

  return (
    <PageContainer maxWidth="sm" className="py-12 sm:py-16">
      <div className="border border-slate-200 p-8 sm:p-10 rounded-sm bg-white shadow-xs space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Ahoum
          </h1>
          <p className="text-base text-slate-600">
            Access your interactive sessions and dashboard
          </p>
        </div>

        {errorMsg && (
          <ErrorMessage
            title="Authentication Error"
            message={errorMsg}
            variant="error"
          />
        )}

        {/* GitHub OAuth Button */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center gap-3 border-slate-300 hover:bg-slate-50 font-semibold"
          onClick={handleGitHubLogin}
          isLoading={isOAuthLoading}
          disabled={isSubmitting || isOAuthLoading}
        >
          <svg
            className="w-5 h-5 fill-current text-slate-900"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          Continue with GitHub
        </Button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-500 absolute">
            Or continue with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isSubmitting || isOAuthLoading}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting || isOAuthLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={isSubmitting || isOAuthLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="text-blue-700 font-bold hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
