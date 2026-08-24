import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
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

export const UserDashboardPage = () => {
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Ahoum | Dashboard'
  }, [])

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

      <div className="space-y-10">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Bookings
            </div>
            <div className="text-3xl font-extrabold text-slate-900">1</div>
            <p className="text-xs text-slate-600">Confirmed seats in upcoming sessions</p>
          </div>

          <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Next Live Session
            </div>
            <div className="text-xl font-bold text-slate-900 truncate">
              React Basics
            </div>
            <p className="text-xs text-blue-700 font-semibold">Tomorrow • 10:00 AM</p>
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
        <div className="border border-slate-200 bg-slate-50/70 p-6 sm:p-8 rounded-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-sm mb-2">
                Confirmed Reservation
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                React Basics Interactive Workshop
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Hosted by <span className="font-semibold text-slate-800">John Doe</span> • Starts 25 Aug at 10:00 AM
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/bookings">
                <Button variant="outline" size="sm">
                  Manage Booking
                </Button>
              </Link>
              <Link to="/sessions/1">
                <Button variant="primary" size="sm">
                  Join Session Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recommended Sessions Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Recommended Upcoming Workshops
            </h2>
            <Link to="/sessions">
              <Button variant="outline" size="sm">
                View All Sessions &rarr;
              </Button>
            </Link>
          </div>

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
              <TableRow>
                <TableCell className="font-semibold text-slate-900">
                  Python Intro
                </TableCell>
                <TableCell>Jane Smith</TableCell>
                <TableCell>26 Aug • 02:00 PM</TableCell>
                <TableCell>
                  <Badge variant="warning" size="md">3/15 Left</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to="/sessions/2">
                    <Button variant="outline" size="sm">
                      Reserve Seat
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-slate-900">
                  System Design
                </TableCell>
                <TableCell>Alex</TableCell>
                <TableCell>28 Aug • 11:00 AM</TableCell>
                <TableCell>
                  <Badge variant="danger" size="md">FULL</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to="/sessions/3">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  )
}
