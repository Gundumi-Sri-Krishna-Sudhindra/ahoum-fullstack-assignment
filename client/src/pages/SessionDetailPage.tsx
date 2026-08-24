import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
  const [session, setSession] = useState<SessionItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { user } = useAuth()
  const navigate = useNavigate()

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
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(e?.message || 'Failed to book session. Please try again.')
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
  const isUserRole = user?.role === 'USER'

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={session?.title || `Session Detail #${id}`}
        description="Comprehensive agenda, creator profile, and live reservation details."
        actions={
          <Link to="/sessions">
            <Button variant="outline" size="md">
              &larr; Back to Sessions
            </Button>
          </Link>
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
          <Link to="/sessions">
            <Button variant="primary">Return to Catalog</Button>
          </Link>
        </div>
      ) : session ? (
        <div className="space-y-6">
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
              <div className="flex items-center gap-2.5">
                {isPast ? (
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
                {successMsg ? (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/bookings')}
                  >
                    View in My Bookings &rarr;
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">
                    Row-locked atomic concurrency reservation.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Link to="/sessions">
                  <Button variant="outline" size="md">
                    Back to Catalog
                  </Button>
                </Link>

                {isUserRole && !isPast && !isFull && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleBookSession}
                    isLoading={isBooking}
                  >
                    Book This Seat Now
                  </Button>
                )}

                {isPast && (
                  <Button variant="secondary" size="md" disabled>
                    Session Has Ended
                  </Button>
                )}

                {!isPast && isFull && (
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
