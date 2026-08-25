import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getMySessions } from '../api/sessions.js'
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
import { ErrorMessage } from '../components/ui/ErrorMessage'
import type { CreatorSessionItem } from './CreatorSessionsPage'

export const CreatorDashboardPage = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<CreatorSessionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Selected session for viewing roster modal
  const [selectedSessionForRoster, setSelectedSessionForRoster] =
    useState<CreatorSessionItem | null>(null)

  useEffect(() => {
    document.title = 'Ahoum | Creator Dashboard'
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const data = await getMySessions()
        if (isMounted) {
          setSessions(Array.isArray(data) ? data : data?.results || [])
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (isMounted) {
          setErrorMsg(e?.message || 'Failed to load creator analytics.')
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

  // Analytics Computations
  const totalSessions = sessions.length
  const upcomingSessions = sessions.filter((s) => !s.is_past)
  const completedSessions = sessions.filter((s) => s.is_past)
  const totalBookings = sessions.reduce((acc, s) => acc + (s.booking_count || 0), 0)
  const totalCapacity = sessions.reduce((acc, s) => acc + (s.capacity || 0), 0)
  const averageOccupancy =
    totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0

  // Sort upcoming sessions ascending by start time
  const sortedUpcoming = [...upcomingSessions].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
  const nextSession = sortedUpcoming[0]

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

  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <PageContainer maxWidth="7xl">
      <PageHeader
        title="Creator Dashboard"
        description={`Welcome back, ${user?.name || user?.email}. Monitor your workshop engagement, upcoming schedule, and learner bookings.`}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/creator/sessions">
              <Button variant="outline" size="md">
                My Sessions
              </Button>
            </Link>
            <Link to="/creator/sessions/new">
              <Button variant="primary" size="md">
                + Host New Session
              </Button>
            </Link>
          </div>
        }
      />

      {/* Attendee Roster Modal */}
      {selectedSessionForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Confirmed Attendee Roster
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Session:{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedSessionForRoster.title}
                  </span>{' '}
                  ({selectedSessionForRoster.booking_count} /{' '}
                  {selectedSessionForRoster.capacity} seats confirmed)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionForRoster(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {!selectedSessionForRoster.attendees ||
            selectedSessionForRoster.attendees.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No active bookings registered for this session yet.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LEARNER NAME</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>REGISTERED</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSessionForRoster.attendees.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {item.user?.name || 'Learner'}
                        </TableCell>
                        <TableCell>{item.user?.email}</TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatDateTime(item.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionForRoster(null)}
              >
                Close Roster
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {errorMsg && (
          <ErrorMessage
            title="Dashboard Notice"
            message={errorMsg}
            variant="error"
          />
        )}

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center border border-slate-200 rounded-sm bg-white p-12 shadow-xs">
            <Loading size="lg" label="Loading creator analytics and schedule..." />
          </div>
        ) : (
          <>
            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Hosted Sessions
                  </span>
                  <span className="text-xl">📚</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {totalSessions}
                </div>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600">
                    {upcomingSessions.length} active
                  </span>{' '}
                  &bull; {completedSessions.length} completed
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Learners Booked
                  </span>
                  <span className="text-xl">👥</span>
                </div>
                <div className="text-3xl font-extrabold text-blue-700">
                  {totalBookings}
                </div>
                <p className="text-xs text-slate-500">
                  Across all published workshop sessions
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Average Fill Rate
                  </span>
                  <span className="text-xl">📈</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {averageOccupancy}%
                </div>
                <p className="text-xs text-slate-500">
                  {totalBookings} booked of {totalCapacity} total seat capacity
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Upcoming Live Sessions
                  </span>
                  <span className="text-xl">⏳</span>
                </div>
                <div className="text-3xl font-extrabold text-indigo-600">
                  {upcomingSessions.length}
                </div>
                <p className="text-xs text-slate-500">
                  Scheduled and open for booking
                </p>
              </div>
            </div>

            {/* Next Live Session Spotlight */}
            {nextSession ? (
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-sm p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 text-9xl pointer-events-none font-bold">
                  LIVE
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 text-xs uppercase font-bold tracking-wider bg-blue-500 text-white rounded-sm">
                      Next Live Session
                    </span>
                    <span className="text-xs text-blue-200 font-medium">
                      {formatDateTime(nextSession.start_time)} &ndash;{' '}
                      {formatTimeOnly(nextSession.end_time)}
                    </span>
                  </div>

                  <div className="space-y-1 max-w-3xl">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {nextSession.title}
                    </h3>
                    {nextSession.description && (
                      <p className="text-sm text-blue-100 line-clamp-2">
                        {nextSession.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-blue-800/60">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/10 px-3 py-1.5 rounded-sm backdrop-blur-xs">
                        <span className="text-xs text-blue-200 block">
                          Confirmed Bookings
                        </span>
                        <span className="text-base font-bold text-white">
                          {nextSession.booking_count} / {nextSession.capacity} seats
                        </span>
                      </div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-sm backdrop-blur-xs">
                        <span className="text-xs text-blue-200 block">
                          Remaining
                        </span>
                        <span className="text-base font-bold text-emerald-300">
                          {nextSession.remaining_seats} available
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedSessionForRoster(nextSession)}
                      >
                        View Attendee Roster
                      </Button>
                      <Link to={`/creator/sessions/${nextSession.id}/edit`}>
                        <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/sessions/${nextSession.id}`}>
                        <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                          Public Page &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-sm p-8 text-center space-y-3">
                <div className="text-3xl">🚀</div>
                <h3 className="text-lg font-bold text-slate-900">
                  No Upcoming Sessions Scheduled
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Keep your learners engaged! Host a new workshop or teaching session to open up bookings.
                </p>
                <div className="pt-2">
                  <Link to="/creator/sessions/new">
                    <Button variant="primary" size="md">
                      + Host New Session
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Upcoming Schedule Quick Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Upcoming Workshop Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your scheduled sessions ordered by earliest start date
                  </p>
                </div>
                <Link
                  to="/creator/sessions"
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  View All Sessions ({sessions.length}) &rarr;
                </Link>
              </div>

              {sortedUpcoming.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-sm p-8 text-center text-slate-500 text-sm">
                  You have no upcoming sessions scheduled. Check the{' '}
                  <Link
                    to="/creator/sessions"
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    My Sessions
                  </Link>{' '}
                  tab to view your past workshop history.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SESSION TITLE</TableHead>
                      <TableHead>START TIME</TableHead>
                      <TableHead>ATTENDEE ROSTER</TableHead>
                      <TableHead className="text-right">QUICK ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUpcoming.slice(0, 5).map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-bold text-slate-900">
                          <Link
                            to={`/sessions/${session.id}`}
                            className="hover:text-blue-700 hover:underline text-base font-semibold"
                          >
                            {session.title}
                          </Link>
                          {session.description && (
                            <span className="text-xs text-slate-500 block truncate font-normal">
                              {session.description}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                          {formatDateTime(session.start_time)}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedSessionForRoster(session)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            title="Click to view attendee roster"
                          >
                            <Badge
                              variant={
                                session.booking_count > 0 ? 'primary' : 'neutral'
                              }
                              size="md"
                            >
                              {session.booking_count} / {session.capacity} Booked &#128065;
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/sessions/${session.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link to={`/creator/sessions/${session.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-3">
                <div className="text-2xl">✨</div>
                <h4 className="text-base font-bold text-slate-900">
                  Host New Session
                </h4>
                <p className="text-xs text-slate-600">
                  Publish a new interactive workshop with custom agenda, time limits, and capacity.
                </p>
                <div className="pt-2">
                  <Link to="/creator/sessions/new">
                    <Button variant="primary" size="sm">
                      Create Workshop &rarr;
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-3">
                <div className="text-2xl">📋</div>
                <h4 className="text-base font-bold text-slate-900">
                  Manage All Sessions
                </h4>
                <p className="text-xs text-slate-600">
                  Filter upcoming and completed sessions, inspect attendee lists, or modify bookings.
                </p>
                <div className="pt-2">
                  <Link to="/creator/sessions">
                    <Button variant="outline" size="sm">
                      Go to My Sessions &rarr;
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-xs space-y-3">
                <div className="text-2xl">👤</div>
                <h4 className="text-base font-bold text-slate-900">
                  Creator Profile
                </h4>
                <p className="text-xs text-slate-600">
                  Review your profile information, manage security credentials, or switch roles.
                </p>
                <div className="pt-2">
                  <Link to="/profile">
                    <Button variant="outline" size="sm">
                      View Profile &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  )
}
