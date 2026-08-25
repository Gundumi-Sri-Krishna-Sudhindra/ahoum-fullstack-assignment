import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getGitHubAuthUrl } from '../api/github.js'
import { PageContainer } from '../components/ui/PageContainer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import type { UserRole } from '../context/types'

export const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Ahoum | Register'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    if (!password) {
      setErrorMsg('Please enter a password.')
      return
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: selectedRole,
      })

      if (newUser.role === 'CREATOR') {
        navigate('/creator', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(
        e?.message || 'Registration failed. Please verify your details.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGitHubLogin = async () => {
    setErrorMsg(null)
    setIsOAuthLoading(true)
    try {
      localStorage.setItem('ahoum_oauth_role', selectedRole)
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
            Create an Account
          </h1>
          <p className="text-base text-slate-600">
            Join Ahoum to book and participate in live workshops
          </p>
        </div>

        {errorMsg && (
          <ErrorMessage
            title="Registration Error"
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
          Sign Up with GitHub
        </Button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-500 absolute">
            Or register with email
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            disabled={isSubmitting || isOAuthLoading}
          />
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

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              I Want to Join As
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('USER')}
                className={`p-3.5 border text-left rounded-sm transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  selectedRole === 'USER'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-slate-900">
                    Learner / Attendee
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedRole === 'USER'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedRole === 'USER' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Browse catalog & book seats in live workshops
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('CREATOR')}
                className={`p-3.5 border text-left rounded-sm transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  selectedRole === 'CREATOR'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-slate-900">
                    Creator / Host
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedRole === 'CREATOR'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedRole === 'CREATOR' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Create sessions & manage attendee rosters
                </p>
              </button>
            </div>
          </div>

          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            disabled={isSubmitting || isOAuthLoading}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
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
            Create {selectedRole === 'CREATOR' ? 'Creator' : 'Learner'} Account
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-700 font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
