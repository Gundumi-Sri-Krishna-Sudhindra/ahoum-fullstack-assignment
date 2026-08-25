import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSessions } from '../api/sessions.js'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
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

export interface SessionAttendee {
  id: number | string
  user: {
    id: number | string
    name: string
    email: string
  }
  status: string
  created_at: string
}

export interface SessionItem {
  id: number | string
  title: string
  description?: string
  start_time: string
  end_time: string
  capacity: number
  booking_count: number
  remaining_seats: number
  is_past: boolean
  is_booked?: boolean
  booking_id?: number | string | null
  booking_status?: 'ACTIVE' | 'CANCELLED' | string | null
  attendees?: SessionAttendee[] | null
  creator?: {
    id: number | string
    name: string
    email: string
  }
}

export const SessionsPage = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [filterInput, setFilterInput] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedFilter, setAppliedFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    document.title = 'Ahoum | Sessions'
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadSessions = async () => {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const params: { search?: string; filter?: 'upcoming' | 'past' } = {}
        if (appliedSearch.trim()) {
          params.search = appliedSearch.trim()
        }
        if (appliedFilter !== 'all') {
          params.filter = appliedFilter
        }

        const data = await getSessions(params)
        if (isMounted) {
          setSessions(Array.isArray(data) ? data : data?.results || [])
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (isMounted) {
          setErrorMsg(
            e?.message || 'Failed to load sessions catalog. Please try again.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSessions()

    return () => {
      isMounted = false
    }
  }, [appliedSearch, appliedFilter, refreshTrigger])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedSearch(searchInput)
    setAppliedFilter(filterInput)
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setFilterInput('upcoming')
    setAppliedSearch('')
    setAppliedFilter('upcoming')
  }

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'TBD'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <PageContainer maxWidth="7xl">
      <PageHeader
        title="Sessions Catalog"
        description="Discover, filter, and book interactive live sessions hosted by certified creators with real-time seat tracking."
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
            isLoading={isLoading}
          >
            Refresh Catalog
          </Button>
        }
      />

      <div className="space-y-8">
        {/* Search & Filter Controls Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-end gap-4 bg-slate-50/70 p-5 sm:p-6 border border-slate-200 rounded-sm shadow-xs"
        >
          <div className="flex-1">
            <Input
              label="Search Sessions"
              placeholder="Search by topic, instructor name, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="w-full md:w-56">
            <Select
              label="Filter Schedule"
              value={filterInput}
              onChange={(e) =>
                setFilterInput(e.target.value as 'upcoming' | 'past' | 'all')
              }
              options={[
                { value: 'upcoming', label: 'Upcoming Sessions' },
                { value: 'past', label: 'Past Sessions' },
                { value: 'all', label: 'All Sessions' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="h-[46px] px-7"
              isLoading={isLoading}
            >
              Search
            </Button>
            {(appliedSearch || appliedFilter !== 'upcoming') && (
              <Button
                type="button"
                variant="outline"
                size="md"
                className="h-[46px]"
                onClick={handleResetFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <ErrorMessage
            title="Failed to Retrieve Sessions"
            message={errorMsg}
            variant="error"
          />
        )}

        {/* Active Filter Indicators */}
        {(appliedSearch || appliedFilter !== 'upcoming') && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Active Filters:</span>
            {appliedSearch && (
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-sm text-slate-800 font-medium">
                Keyword: "{appliedSearch}"
              </span>
            )}
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-sm font-medium capitalize">
              {appliedFilter} Sessions
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center border border-slate-200 rounded-sm bg-white p-12">
            <Loading size="lg" label="Searching available sessions..." />
          </div>
        ) : sessions.length === 0 ? (
          /* Empty Results State */
          <div className="border border-slate-200 rounded-sm bg-white p-12 text-center space-y-4">
            <div className="text-3xl text-slate-400">&bull; &bull; &bull;</div>
            <h3 className="text-xl font-bold text-slate-900">
              No Sessions Found
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {appliedSearch
                ? `We couldn't find any sessions matching "${appliedSearch}" with the "${appliedFilter}" filter.`
                : `There are currently no ${appliedFilter} sessions available in the catalog.`}
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Search Filters
              </Button>
            </div>
          </div>
        ) : (
          /* Tabular Sessions Table */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TITLE</TableHead>
                <TableHead>CREATOR</TableHead>
                <TableHead>START TIME</TableHead>
                <TableHead>SEATS AVAILABLE</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((item) => {
                const isFull = item.remaining_seats <= 0
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-slate-900 max-w-xs">
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {item.creator?.name || 'Instructor'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.creator?.email}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(item.start_time)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.is_booked && (
                          <Badge variant="primary" size="md">
                            ✓ Booked
                          </Badge>
                        )}
                        {isFull ? (
                          <Badge variant="danger" size="md">
                            SEAT IS FULL ({item.capacity} / {item.capacity})
                          </Badge>
                        ) : item.is_past ? (
                          <Badge variant="neutral" size="md">
                            PAST SESSION
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
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/sessions/${item.id}`}>
                        <Button variant="outline" size="sm">
                          VIEW
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
    </PageContainer>
  )
}
