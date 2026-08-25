import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getSession, bookSession } from '../api/sessions.js'
import { cancelBooking } from '../api/bookings.js'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { CancelBookingModal } from '../components/bookings/CancelBookingModal'
import type { SessionItem } from './SessionsPage'

export const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [session, setSession] = useState<SessionItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
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

  const handleConfirmCancelSeat = async () => {
    const activeBookingId = session?.booking_id || location.state?.bookingId
    if (!activeBookingId) {
      setErrorMsg('No active booking reference found to cancel.')
      setShowCancelModal(false)
      return
    }

    setIsCancelling(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await cancelBooking(activeBookingId)
      setSuccessMsg('Your seat reservation was successfully cancelled.')
      setAlreadyBookedByError(false)
      setShowCancelModal(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(e?.message || 'Failed to cancel booking. Please try again.')
    } finally {
      setIsCancelling(false)
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
  const effectiveBookingStatus =
    session?.booking_status || location.state?.bookingStatus

  const isBooked = Boolean(
    (session?.is_booked || alreadyBookedByError) &&
      effectiveBookingStatus !== 'CANCELLED'
  )

  const isCancelled =
    effectiveBookingStatus === 'CANCELLED' && !session?.is_booked

  return (
    <PageContainer maxWidth="lg">
      {/* Custom Seat Cancellation Modal */}
      <CancelBookingModal
        isOpen={showCancelModal}
        sessionTitle={session?.title}
        isLoading={isCancelling}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancelSeat}
      />

      <PageHeader
        title={session?.title || `Session Detail #${id}`}
        description={
          isUserRole && isBooked
            ? 'Your seat is confirmed. Review your live workshop schedule, access details, and host credentials.'
            : isCancelled
            ? 'Your previous reservation was cancelled. Check updated schedule or re-book available seats.'
            : 'Comprehensive agenda, creator profile, and live reservation details.'
        }
        actions={
          <div className="flex items-center gap-3">
            {/* Creator Actions */}
            {isCreatorRole && (
              <>
                <Link to="/creator/sessions">
                  <Button variant="outline" size="md">
                    &larr; Back to My Sessions
                  </Button>
                </Link>
                {id && (
                  <Link to={`/creator/sessions/${id}/edit`}>
                    <Button variant="primary" size="md">
                      Edit Session
                    </Button>
                  </Link>
                )}
              </>
            )}

            {/* Learner: Explored from My Bookings -> ONLY 1 button (Back to My Bookings) */}
            {isUserRole && isFromBookings && (
              <Link to="/bookings">
                <Button variant="outline" size="md">
                  &larr; Back to My Bookings
                </Button>
              </Link>
            )}

            {/* Learner: Explored from Sessions / Catalog and is already booked -> EXACTLY 2 buttons */}
            {isUserRole && !isFromBookings && isBooked && (
              <>
                <Link to="/sessions">
                  <Button variant="outline" size="md">
                    &larr; Back to Catalog
                  </Button>
                </Link>
                <Link to="/bookings">
                  <Button variant="primary" size="md">
                    Show in My Bookings &rarr;
                  </Button>
                </Link>
              </>
            )}

            {/* Learner: Explored from Catalog and is NOT booked -> 1 button (Back to Catalog) */}
            {isUserRole && !isFromBookings && !isBooked && (
              <Link to="/sessions">
                <Button variant="outline" size="md">
                  &larr; Back to Catalog
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
          <Link to={isFromBookings ? '/bookings' : '/sessions'}>
            <Button variant="primary">
              {isFromBookings ? 'Back to My Bookings' : 'Back to Catalog'}
            </Button>
          </Link>
        </div>
      ) : session ? (
        <div className="space-y-6">
          {/* Confirmed Reservation Pass for Active Booked Learners */}
          {isUserRole && isBooked && (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-sm p-6 sm:p-7 shadow-md border border-blue-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-sm">
                    ✓ Active Confirmed Reservation
                  </span>
                  <span className="text-xs text-blue-200">
                    Session ID: #{session.id}
                  </span>
                </div>
                <span className="text-xs text-blue-200">
                  Attendee: <strong className="text-white">{user?.name || user?.email}</strong>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {session.title}
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Hosted by <span className="font-semibold text-white">{session.creator?.name || 'Verified Creator'}</span> ({session.creator?.email})
                  </p>
                </div>
                {!isPast && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Reservation
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Notice Banner if Previous Booking was Cancelled */}
          {isUserRole && isCancelled && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Booking Status
                </div>
                <p className="text-sm font-semibold text-amber-950">
                  Your reservation for this workshop was cancelled.
                </p>
                <p className="text-xs text-amber-800">
                  You can reserve a new seat below if the session is upcoming and has capacity.
                </p>
              </div>
              {!isPast && !isFull && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBookSession}
                  isLoading={isBooking}
                >
                  Re-book Seat Now
                </Button>
              )}
            </div>
          )}

          {successMsg && (
            <ErrorMessage
              title="Status Updated"
              message={successMsg}
              variant="success"
            />
          )}

          {errorMsg && (
            <ErrorMessage
              title="Notice"
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
                ) : isUserRole && isCancelled ? (
                  <Badge variant="neutral" size="lg">
                    Reservation Cancelled
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

            {/* Actions Bottom Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                {isUserRole && isBooked ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span>✓</span> Your reservation is active and locked.
                  </span>
                ) : isUserRole && isCancelled ? (
                  <span className="text-xs text-amber-800 font-medium">
                    Previous seat reservation was cancelled.
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

                {/* When explored from Bookings: 1 button */}
                {isUserRole && isFromBookings && (
                  <Link to="/bookings">
                    <Button variant="outline" size="md">
                      &larr; Back to My Bookings
                    </Button>
                  </Link>
                )}

                {/* When explored from Sessions/Catalog and already booked: 2 buttons */}
                {isUserRole && !isFromBookings && isBooked && (
                  <>
                    <Link to="/sessions">
                      <Button variant="outline" size="md">
                        &larr; Back to Catalog
                      </Button>
                    </Link>
                    <Link to="/bookings">
                      <Button variant="primary" size="md">
                        Show in My Bookings &rarr;
                      </Button>
                    </Link>
                  </>
                )}

                {/* Unbooked / Cancelled upcoming session: Book seat button */}
                {isUserRole && !isBooked && !isPast && !isFull && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleBookSession}
                    isLoading={isBooking}
                  >
                    {isCancelled ? 'Re-book Seat' : 'Book This Seat Now'}
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
