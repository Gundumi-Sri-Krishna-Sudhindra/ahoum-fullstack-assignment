import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getSession, bookSession } from '../api/sessions.js'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import type { SessionItem } from './SessionsPage'

export const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [session, setSession] = useState<SessionItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [alreadyBookedByError, setAlreadyBookedByError] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { user } = useAuth()

  useEffect(() => {
    document.title = id ? `Ahoum | Session #${id}` : 'Ahoum | Session Details'
  }, [id])

  useEffect(() => {
    let isMounted = true
    if (!id) return

    const loadDetail = async () => {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const data = await getSession(id)
        if (isMounted) {
          setSession(data)
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (isMounted) {
          setErrorMsg(e?.message || 'Failed to retrieve session details.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [id, refreshTrigger])

  const handleBookSession = async () => {
    if (!id) return
    setIsBooking(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await bookSession(id)
      setSuccessMsg('Your seat has been successfully confirmed!')
      setAlreadyBookedByError(true)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const e = err as { message?: string }
      const msg = e?.message || 'Failed to book session. Please try again.'
      if (msg.toLowerCase().includes('already have an active booking')) {
        setAlreadyBookedByError(true)
      }
      setErrorMsg(msg)
    } finally {
      setIsBooking(false)
    }
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'TBD'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const isFull = (session?.remaining_seats ?? 0) <= 0
  const isPast = session?.is_past ?? false
  const isCreatorRole = user?.role === 'CREATOR'
  const isUserRole = user?.role === 'USER'

  const isFromBookings =
    location.state?.from === 'bookings' || location.state?.from === '/bookings'
  const isBooked = Boolean(
    session?.is_booked || alreadyBookedByError || successMsg || (isFromBookings && isUserRole)
  )

  const backUrl = isCreatorRole
    ? '/creator/sessions'
    : isFromBookings || isBooked
    ? '/bookings'
    : '/sessions'

  const backLabel = isCreatorRole
    ? 'Back to My Sessions'
    : isFromBookings || isBooked
    ? 'Back to My Bookings'
    : 'Back to Catalog'

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={session?.title || `Session Detail #${id}`}
        description={
          isUserRole && isBooked
            ? 'Your seat is confirmed. Review your live workshop schedule, access details, and host credentials.'
            : 'Comprehensive agenda, creator profile, and live reservation details.'
        }
        actions={
          <div className="flex items-center gap-3">
            <Link to={backUrl}>
              <Button variant="outline" size="md">
                &larr; {backLabel}
              </Button>
            </Link>
            {isCreatorRole && id && (
              <Link to={`/creator/sessions/${id}/edit`}>
                <Button variant="primary" size="md">
                  Edit Session
                </Button>
              </Link>
            )}
            {isUserRole && isBooked && !isFromBookings && (
              <Link to="/bookings">
                <Button variant="primary" size="md">
                  My Bookings &rarr;
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center border border-slate-200 rounded-sm bg-white p-12">
          <Loading size="lg" label="Loading session details..." />
        </div>
      ) : errorMsg && !session ? (
        <div className="space-y-4">
          <ErrorMessage
            title="Session Not Found"
            message={errorMsg}
            variant="error"
          />
          <Link to={backUrl}>
            <Button variant="primary">{backLabel}</Button>
          </Link>
        </div>
      ) : session ? (
        <div className="space-y-6">
          {/* Confirmed Reservation Pass for Booked Learners */}
          {isUserRole && isBooked && (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-sm p-6 sm:p-7 shadow-md border border-blue-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-sm">
                    ✓ Confirmed Reservation Pass
                  </span>
                  <span className="text-xs text-blue-200">
                    Session ID: #{session.id}
                  </span>
                </div>
                <span className="text-xs text-blue-200">
                  Attendee: <strong className="text-white">{user?.name || user?.email}</strong>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    {session.title}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Hosted by <span className="font-semibold text-white">{session.creator?.name || 'Verified Creator'}</span> ({session.creator?.email})
                  </p>
                </div>
                <Link to="/bookings">
                  <Button variant="secondary" size="sm">
                    View in My Bookings &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {successMsg && (
            <ErrorMessage
              title="Booking Confirmed"
              message={successMsg}
              variant="success"
            />
          )}

          {errorMsg && (
            <ErrorMessage
              title="Booking Notice"
              message={errorMsg}
              variant="error"
            />
          )}

          <div className="border border-slate-200 p-8 sm:p-10 rounded-sm bg-white shadow-xs space-y-8">
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2.5 flex-wrap">
                {isUserRole && isBooked ? (
                  <Badge variant="primary" size="lg">
                    ✓ Already Booked
                  </Badge>
                ) : isPast ? (
                  <Badge variant="neutral" size="lg">
                    Past Session
                  </Badge>
                ) : isFull ? (
                  <Badge variant="danger" size="lg">
                    Session Full
                  </Badge>
                ) : (
                  <Badge variant="success" size="lg">
                    {session.remaining_seats} / {session.capacity} Seats Available
                  </Badge>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  ID: #{session.id}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Host / Creator
                </div>
                <div className="text-base font-bold text-slate-900">
                  {session.creator?.name || 'Verified Creator'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">
                Session Overview & Curriculum
              </h2>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {session.description ||
                  'No description provided for this session.'}
              </p>
            </div>

            {/* Schedule Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-sm border border-slate-200">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Start Schedule
                </div>
                <div className="text-base font-bold text-slate-900">
                  {formatDateTime(session.start_time)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  End Schedule
                </div>
                <div className="text-base font-bold text-slate-900">
                  {formatDateTime(session.end_time)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Capacity
                </div>
                <div className="text-base font-bold text-slate-900">
                  {session.capacity} Participants
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Bookings
                </div>
                <div className="text-base font-bold text-slate-900">
                  {session.booking_count} Confirmed
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                {isUserRole && isBooked ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span>✓</span> Your reservation is active and locked.
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Row-locked atomic concurrency reservation.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {isCreatorRole && id && (
                  <Link to={`/creator/sessions/${id}/edit`}>
                    <Button variant="primary" size="md">
                      Edit Session
                    </Button>
                  </Link>
                )}

                {isUserRole && isBooked && (
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" size="md" disabled className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                      ✓ Already Booked
                    </Button>
                    <Link to="/bookings">
                      <Button variant="primary" size="md">
                        View in My Bookings &rarr;
                      </Button>
                    </Link>
                  </div>
                )}

                {isUserRole && !isBooked && !isPast && !isFull && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleBookSession}
                    isLoading={isBooking}
                  >
                    Book This Seat Now
                  </Button>
                )}

                {isUserRole && !isBooked && isPast && (
                  <Button variant="secondary" size="md" disabled>
                    Session Has Ended
                  </Button>
                )}

                {isUserRole && !isBooked && !isPast && isFull && (
                  <Button variant="secondary" size="md" disabled>
                    Session Fully Booked
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}
