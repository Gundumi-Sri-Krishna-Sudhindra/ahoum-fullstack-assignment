import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookings, cancelBooking } from '../api/bookings.js'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Loading } from '../components/ui/Loading'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export interface BookingItem {
  id: number | string
  session: {
    id: number | string
    title: string
    description?: string
    start_time: string
    end_time: string
    capacity: number
    creator?: {
      id: number | string
      name: string
      email: string
    }
    is_past: boolean
  }
  status: 'ACTIVE' | 'CANCELLED'
  created_at: string
  is_past: boolean
}

export const BookingsPage = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    document.title = 'Ahoum | My Bookings'
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const data = await getBookings()
        if (isMounted) {
          setBookings(Array.isArray(data) ? data : data?.results || [])
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (isMounted) {
          setErrorMsg(e?.message || 'Failed to load bookings.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBookings()

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  const handleCancelBooking = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancellingId(id)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await cancelBooking(id)
      setSuccessMsg('Booking has been successfully cancelled.')
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(e?.message || 'Failed to cancel booking. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'TBD'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <PageContainer maxWidth="7xl">
      <PageHeader
        title="My Registered Bookings"
        description="View your confirmed workshop reservations, check host details, and manage seat cancellations."
        actions={
          <Link to="/sessions">
            <Button variant="primary" size="md">
              + Find New Session
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {successMsg && (
          <ErrorMessage
            title="Success"
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

        {isLoading ? (
          <div className="min-h-[35vh] flex items-center justify-center border border-slate-200 rounded-sm bg-white p-12">
            <Loading size="lg" label="Loading your bookings..." />
          </div>
        ) : bookings.length === 0 ? (
          <div className="border border-slate-200 rounded-sm bg-white p-12 text-center space-y-4">
            <div className="text-3xl text-slate-400">&bull; &bull; &bull;</div>
            <h3 className="text-xl font-bold text-slate-900">
              No Registered Bookings Yet
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              You haven't reserved seats in any sessions yet. Browse our live catalog to join interactive workshops.
            </p>
            <div className="pt-2">
              <Link to="/sessions">
                <Button variant="primary" size="md">
                  Explore Live Sessions
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SESSION</TableHead>
                <TableHead>HOST</TableHead>
                <TableHead>START TIME</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const isCancelled = booking.status === 'CANCELLED'
                const isPast = booking.session?.is_past || booking.is_past

                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-bold text-slate-900">
                      <Link
                        to={`/sessions/${booking.session?.id}`}
                        state={{ from: 'bookings', bookingId: booking.id, bookingStatus: booking.status }}
                        className="hover:text-blue-700 hover:underline"
                      >
                        {booking.session?.title || `Session #${booking.session?.id}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {booking.session?.creator?.name || 'Verified Creator'}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(booking.session?.start_time)}
                    </TableCell>
                    <TableCell>
                      {isCancelled ? (
                        <Badge variant="neutral" size="md">
                          CANCELLED
                        </Badge>
                      ) : isPast ? (
                        <Badge variant="neutral" size="md">
                          COMPLETED
                        </Badge>
                      ) : (
                        <Badge variant="success" size="md">
                          ACTIVE RESERVATION
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/sessions/${booking.session?.id}`}
                          state={{ from: 'bookings', bookingId: booking.id, bookingStatus: booking.status }}
                        >
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        {!isCancelled && !isPast && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            isLoading={cancellingId === booking.id}
                          >
                            Cancel Seat
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  )
}
