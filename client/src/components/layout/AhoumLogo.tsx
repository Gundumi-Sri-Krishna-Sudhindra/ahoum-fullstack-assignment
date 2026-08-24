import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export const AhoumLogo = ({ className = '' }: { className?: string }) => {
  const { user, isAuthenticated } = useAuth()
  const destination = isAuthenticated
    ? user?.role === 'CREATOR'
      ? '/creator'
      : '/dashboard'
    : '/'

  return (
    <Link
      to={destination}
      className={`inline-flex items-center gap-3 text-slate-900 font-bold tracking-tight hover:opacity-90 transition-opacity ${className}`}
    >
      <img
        src="/logo.png"
        alt="Ahoum Logo"
        className="h-9 w-9 object-contain"
      />
      <span className="text-xl font-extrabold tracking-wide text-slate-900">
        AHOUM
      </span>
    </Link>
  )
}
