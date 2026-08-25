import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { AhoumLogo } from './AhoumLogo'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SignOutModal } from '../auth/SignOutModal'

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const navigate = useNavigate()

  const handleConfirmLogout = () => {
    setShowSignOutModal(false)
    logout()
    navigate('/', { replace: true })
  }

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-base font-semibold transition-colors px-2 py-1.5 border-b-2 ${
      isActive
        ? 'border-blue-700 text-slate-900'
        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
    }`

  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block text-base font-semibold py-2.5 px-4 rounded-sm ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Primary Nav */}
        <div className="flex items-center gap-10">
          <AhoumLogo />

          {/* Desktop Nav Links (Only visible when authenticated) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-8">
              {user?.role === 'USER' && (
                <>
                  <NavLink to="/dashboard" className={navLinkClasses}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/sessions" className={navLinkClasses}>
                    Sessions
                  </NavLink>
                  <NavLink to="/bookings" className={navLinkClasses}>
                    My Bookings
                  </NavLink>
                  <NavLink to="/profile" className={navLinkClasses}>
                    Profile
                  </NavLink>
                </>
              )}

              {user?.role === 'CREATOR' && (
                <>
                  <NavLink to="/creator" end className={navLinkClasses}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/creator/sessions" className={navLinkClasses}>
                    My Sessions
                  </NavLink>
                  <NavLink to="/creator/sessions/new" className={navLinkClasses}>
                    + New Session
                  </NavLink>
                  <NavLink to="/profile" className={navLinkClasses}>
                    Profile
                  </NavLink>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Desktop User Section */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                title="View Profile"
              >
                <Badge
                  variant={user.role === 'CREATOR' ? 'primary' : 'neutral'}
                  size="sm"
                >
                  {user.role}
                </Badge>
                <span className="text-sm font-bold text-slate-900 leading-tight">
                  {user.name || user.email}
                </span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignOutModal(true)}
                id="btn-logout"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-sm border border-slate-200"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated && user?.role === 'USER' && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/sessions"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                Sessions
              </NavLink>
              <NavLink
                to="/bookings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                My Bookings
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                Profile
              </NavLink>
            </>
          )}

          {isAuthenticated && user?.role === 'CREATOR' && (
            <>
              <NavLink
                to="/creator"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/creator/sessions"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                My Sessions
              </NavLink>
              <NavLink
                to="/creator/sessions/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                + New Session
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                Profile
              </NavLink>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 mt-3">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between py-2">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <Badge
                    variant={user.role === 'CREATOR' ? 'primary' : 'neutral'}
                    size="sm"
                  >
                    {user.role}
                  </Badge>
                  <span className="text-base font-bold text-slate-900">
                    {user.name || user.email}
                  </span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setShowSignOutModal(true)
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
