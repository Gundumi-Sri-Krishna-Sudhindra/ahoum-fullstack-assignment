import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMySessions, deleteSession } from '../api/sessions.js'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
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

export interface AttendeeItem {
  id: number | string
  user: {
    id: number | string
    name: string
    email: string
  }
  status: string
  created_at: string
}

export interface CreatorSessionItem {
  id: number | string
  title: string
  description?: string
  start_time: string
  end_time: string
  capacity: number
  booking_count: number
  remaining_seats: number
  is_past: boolean
  attendees?: AttendeeItem[]
}

export const CreatorSessionsPage = () => {
  const [sessions, setSessions] = useState<CreatorSessionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Search and Filter tab states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

  // Roster Modal state
  const [selectedSessionForRoster, setSelectedSessionForRoster] =
    useState<CreatorSessionItem | null>(null)

  useEffect(() => {
    document.title = 'Ahoum | My Hosted Sessions'
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadMySessions = async () => {
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
          setErrorMsg(e?.message || 'Failed to load your hosted sessions.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMySessions()

    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  const handleDeleteSession = async (id: number | string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete session "${title}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(id)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await deleteSession(id)
      setSuccessMsg(`Session "${title}" was successfully deleted.`)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(e?.message || 'Failed to delete session. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'TBD'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Filter sessions by status tab and search query
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.description && session.description.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (statusFilter === 'upcoming') {
      return !session.is_past
    }
    if (statusFilter === 'completed') {
      return session.is_past
    }
    return true
  })

  const upcomingCount = sessions.filter((s) => !s.is_past).length
  const completedCount = sessions.filter((s) => s.is_past).length

  return (
    <PageContainer maxWidth="7xl">
      <PageHeader
        title="My Hosted Sessions"
        description="View and manage all your live workshops, inspect attendee rosters, edit schedules, and manage seat capacities."
        actions={
          <div className="flex items-center gap-3">
            <Link to="/creator">
              <Button variant="outline" size="md">
                &larr; Dashboard
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
                  Session: <span className="font-semibold text-slate-800">{selectedSessionForRoster.title}</span> ({selectedSessionForRoster.booking_count} / {selectedSessionForRoster.capacity} seats confirmed)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionForRoster(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {(!selectedSessionForRoster.attendees || selectedSessionForRoster.attendees.length === 0) ? (
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

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-sm shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                statusFilter === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[35vh] flex items-center justify-center border border-slate-200 rounded-sm bg-white p-12">
            <Loading size="lg" label="Loading your hosted sessions..." />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="border border-slate-200 rounded-sm bg-white p-12 text-center space-y-4 shadow-xs">
            <div className="text-3xl text-slate-400">&bull; &bull; &bull;</div>
            <h3 className="text-xl font-bold text-slate-900">
              {searchQuery || statusFilter !== 'all'
                ? 'No matching sessions found'
                : 'No Hosted Sessions Yet'}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or switching the status filter tab.'
                : "You haven't created any workshop sessions yet. Launch your first live session to start accepting attendees."}
            </p>
            <div className="pt-2">
              <Link to="/creator/sessions/new">
                <Button variant="primary" size="md">
                  + Host Your First Session
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SESSION TITLE</TableHead>
                <TableHead>START TIME</TableHead>
                <TableHead>END TIME</TableHead>
                <TableHead>STATUS & ROSTER</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => {
                const isPast = session.is_past

                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-bold text-slate-900">
                      <div className="flex flex-col">
                        <Link
                          to={`/sessions/${session.id}`}
                          className="hover:text-blue-700 hover:underline text-base font-semibold"
                        >
                          {session.title}
                        </Link>
                        {session.description && (
                          <span className="text-xs text-slate-500 line-clamp-1 font-normal mt-0.5">
                            {session.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                      {formatDateTime(session.start_time)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                      {formatDateTime(session.end_time)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isPast ? (
                          <Badge variant="neutral" size="sm">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Upcoming
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedSessionForRoster(session)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          title="Click to view attendee roster"
                        >
                          <Badge
                            variant={session.booking_count > 0 ? 'primary' : 'neutral'}
                            size="md"
                          >
                            {session.booking_count} / {session.capacity} Booked &#128065;
                          </Badge>
                        </button>
                      </div>
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
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteSession(session.id, session.title)
                          }
                          isLoading={deletingId === session.id}
                        >
                          Delete
                        </Button>
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
