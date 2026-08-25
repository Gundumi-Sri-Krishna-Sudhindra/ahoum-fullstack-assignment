import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getBookings } from '../api/bookings.js'
import { getSessions } from '../api/sessions.js'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table'
import { Loading } from '../components/ui/Loading'
import type { BookingItem } from './BookingsPage'
import type { SessionItem } from './SessionsPage'

export const UserDashboardPage = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [recommendedSessions, setRecommendedSessions] = useState<SessionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = 'Ahoum | Dashboard'
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        const [bookingsData, sessionsData] = await Promise.all([
          getBookings().catch(() => []),
          getSessions({ filter: 'upcoming' }).catch(() => []),
        ])

        if (isMounted) {
          const bList = Array.isArray(bookingsData)
            ? bookingsData
            : bookingsData?.results || []
          const sList = Array.isArray(sessionsData)
            ? sessionsData
            : sessionsData?.results || []

          setBookings(bList)
          setRecommendedSessions(sList.slice(0, 4))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const activeBookings = bookings.filter(
    (b) => b.status === 'ACTIVE' && !(b.session?.is_past || b.is_past)
  )
  const nextBooking = activeBookings[0]

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
        title="Learner Dashboard"
        description={`Welcome back, ${user?.name || user?.email}. Track your upcoming registered sessions and explore new workshops.`}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button variant="outline" size="md">
                My Profile
              </Button>
            </Link>
            <Link to="/sessions">
              <Button variant="primary" size="md">
                Browse Sessions
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center border border-slate-200 rounded-sm bg-white p-12">
          <Loading size="lg" label="Loading dashboard summary..." />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Bookings
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {activeBookings.length}
              </div>
              <p className="text-xs text-slate-600">
                {activeBookings.length === 1
                  ? '1 confirmed seat in an upcoming session'
                  : `${activeBookings.length} confirmed seats in upcoming sessions`}
              </p>
            </div>

            <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Next Live Session
              </div>
              {nextBooking ? (
                <>
                  <div className="text-xl font-bold text-slate-900 truncate">
                    {nextBooking.session?.title}
                  </div>
                  <p className="text-xs text-blue-700 font-semibold">
                    {formatDateTime(nextBooking.session?.start_time)}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-base font-semibold text-slate-500">
                    No Upcoming Sessions
                  </div>
                  <p className="text-xs text-slate-400">
                    Reserve a seat from the catalog
                  </p>
                </>
              )}
            </div>

            <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Status
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="md">
                  Active Learner
                </Badge>
              </div>
              <p className="text-xs text-slate-600">Verified participant account</p>
            </div>
          </div>

          {/* Next Upcoming Session Card */}
          {nextBooking && (
            <div className="border border-slate-200 bg-slate-50/70 p-6 sm:p-8 rounded-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-sm mb-2">
                    Confirmed Reservation
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {nextBooking.session?.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Hosted by{' '}
                    <span className="font-semibold text-slate-800">
                      {nextBooking.session?.creator?.name || 'Verified Creator'}
                    </span>{' '}
                    • Starts {formatDateTime(nextBooking.session?.start_time)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/bookings">
                    <Button variant="outline" size="sm">
                      Manage Booking
                    </Button>
                  </Link>
                  <Link
                    to={`/sessions/${nextBooking.session?.id}`}
                    state={{ from: 'bookings' }}
                  >
                    <Button variant="primary" size="sm">
                      View Booking Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Sessions Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Recommended Upcoming Workshops
              </h2>
              <Link to="/sessions">
                <Button variant="outline" size="sm">
                  View Full Catalog &rarr;
                </Button>
              </Link>
            </div>

            {recommendedSessions.length === 0 ? (
              <div className="border border-slate-200 rounded-sm bg-white p-8 text-center space-y-2">
                <p className="text-sm text-slate-600">
                  No upcoming sessions found in catalog.
                </p>
                <Link to="/sessions">
                  <Button variant="outline" size="sm">
                    Browse All Sessions
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TITLE</TableHead>
                    <TableHead>CREATOR</TableHead>
                    <TableHead>START TIME</TableHead>
                    <TableHead>SEATS</TableHead>
                    <TableHead className="text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendedSessions.map((item) => {
                    const isFull = item.remaining_seats <= 0
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          {item.creator?.name || 'Verified Creator'}
                        </TableCell>
                        <TableCell>{formatDateTime(item.start_time)}</TableCell>
                        <TableCell>
                          {isFull ? (
                            <Badge variant="danger" size="md">
                              SEAT IS FULL
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                item.remaining_seats <= 3 ? 'warning' : 'success'
                              }
                              size="md"
                            >
                              {item.remaining_seats} / {item.capacity} Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/sessions/${item.id}`}>
                            <Button variant="outline" size="sm">
                              {isFull ? 'View Details' : 'Reserve Seat'}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
