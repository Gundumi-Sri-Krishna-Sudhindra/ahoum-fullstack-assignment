import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SignOutModal } from '../components/auth/SignOutModal'

export const ProfilePage = () => {
  const { user, logout } = useAuth()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Ahoum | My Profile'
  }, [])

  const handleConfirmLogout = () => {
    setShowSignOutModal(false)
    logout()
    navigate('/', { replace: true })
  }

  const isCreator = user?.role === 'CREATOR'

  return (
    <PageContainer maxWidth="6xl">
      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <PageHeader
        title="User Profile"
        description="View your verified account details, role permissions, and session access settings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details Card */}
        <div className="lg:col-span-2 border border-slate-200 p-8 sm:p-10 rounded-sm bg-white shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Account Information
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Personal credentials and platform role assignment
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isCreator ? 'primary' : 'neutral'} size="lg">
                {user?.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <div className="text-base font-semibold text-slate-900">
                {user?.name || 'Not provided'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="text-base font-semibold text-slate-900 break-all">
                {user?.email}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Role
              </label>
              <div className="text-base font-semibold text-slate-900">
                {isCreator ? 'Creator (Host & Instructor)' : 'Standard User (Learner)'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />
                <span className="text-base font-semibold text-slate-900">
                  Active & Verified
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Authenticated session with JWT bearer encryption.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignOutModal(true)}
              className="text-red-700 hover:text-red-800 hover:border-red-300"
            >
              Sign Out of Account
            </Button>
          </div>
        </div>

        {/* Role Permissions & Quick Navigation */}
        <div className="border border-slate-200 p-8 rounded-sm bg-slate-50/70 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isCreator ? 'Creator Privileges' : 'Learner Capabilities'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {isCreator
                ? 'Your account has permission to publish sessions and manage attendee capacity.'
                : 'Your account can discover workshops and book guaranteed seats.'}
            </p>
          </div>

          <ul className="text-sm text-slate-700 space-y-3">
            {isCreator ? (
              <>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Publish and schedule live workshop sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Set participant limits and seat capacities</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Monitor confirmed registrations and attendee rosters</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Browse upcoming catalog with live seat meters</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reserve seats with row-locked concurrency protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Manage and cancel registered reservations anytime</span>
                </li>
              </>
            )}
          </ul>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            {isCreator ? (
              <>
                <Link to="/creator" className="block">
                  <Button variant="primary" size="md" className="w-full">
                    View My Sessions
                  </Button>
                </Link>
                <Link to="/creator/sessions/new" className="block">
                  <Button variant="outline" size="md" className="w-full">
                    + Host New Session
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/sessions" className="block">
                  <Button variant="primary" size="md" className="w-full">
                    Explore Sessions Catalog
                  </Button>
                </Link>
                <Link to="/bookings" className="block">
                  <Button variant="outline" size="md" className="w-full">
                    View My Bookings
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
