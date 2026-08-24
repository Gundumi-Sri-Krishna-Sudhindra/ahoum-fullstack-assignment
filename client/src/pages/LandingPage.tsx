import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/ui/PageContainer'
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

export const LandingPage = () => {
  const { user, isAuthenticated } = useAuth()
  const dashboardUrl = user?.role === 'CREATOR' ? '/creator' : '/dashboard'

  useEffect(() => {
    document.title = 'Ahoum'
  }, [])

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50/60 pt-8 sm:pt-12 pb-10 sm:pb-14">
        <PageContainer className="bg-transparent text-center space-y-6 py-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider rounded-sm">
            <span>Interactive Knowledge & Wellness Marketplace</span>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Live Interactive Sessions with Expert Creators
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Join hands-on workshops, group classes, and interactive sessions with real-time seat availability and conflict-free booking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link to={dashboardUrl}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Go to {user?.role === 'CREATOR' ? 'Creator Dashboard' : 'Dashboard'} &rarr;
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Get Started Free &rarr;
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In to Account
                  </Button>
                </Link>
              </>
            )}
            <Link to="/sessions">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Sessions
              </Button>
            </Link>
          </div>

          <div className="pt-4 text-sm text-slate-500 flex flex-wrap items-center justify-center gap-6 font-medium">
            <span>&bull; Real-time seat tracking</span>
            <span>&bull; Atomic row-level concurrency</span>
            <span>&bull; Role-based creator management</span>
          </div>
        </PageContainer>
      </section>

      {/* Value Pillars */}
      <PageContainer className="space-y-8 py-0">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Ahoum Works
          </h2>
          <p className="text-base text-slate-600">
            A reliable, transparent ecosystem designed for engaged learners and verified creators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-800 font-bold rounded-sm flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Discover Live Sessions</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore scheduled workshops across tech, wellness, and business. Filter by date and track exact remaining capacity in real-time.
            </p>
          </div>

          <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-800 font-bold rounded-sm flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Conflict-Free Booking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our atomic transaction engine with row-level locking guarantees zero double-booking or capacity overruns under high traffic.
            </p>
          </div>

          <div className="border border-slate-200 p-6 rounded-sm bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-800 font-bold rounded-sm flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. Creator Hub</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Creators can launch interactive sessions, set strict attendee limits, track confirmed registrations, and manage schedules.
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Featured Sessions Preview */}
      <PageContainer className="space-y-5 py-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Featured Upcoming Sessions
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Sample interactive sessions starting this week.
            </p>
          </div>
          <Link to="/sessions">
            <Button variant="outline" size="sm">
              View Full Catalog &rarr;
            </Button>
          </Link>
        </div>

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
            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                React Basics
              </TableCell>
              <TableCell>John Doe</TableCell>
              <TableCell>25 Aug • 10:00 AM</TableCell>
              <TableCell>
                <Badge variant="success" size="md">8/20</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link to="/sessions">
                  <Button variant="outline" size="sm">
                    VIEW
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                Python Intro
              </TableCell>
              <TableCell>Jane Smith</TableCell>
              <TableCell>26 Aug • 02:00 PM</TableCell>
              <TableCell>
                <Badge variant="warning" size="md">3/15</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link to="/sessions">
                  <Button variant="outline" size="sm">
                    VIEW
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
                <Link to="/sessions">
                  <Button variant="outline" size="sm">
                    VIEW
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </PageContainer>

      {/* Call to Action Box */}
      <PageContainer className="py-0">
        <div className="border border-slate-200 bg-slate-50/80 p-8 sm:p-10 rounded-sm text-center space-y-5 shadow-xs">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ready to Join an Interactive Session?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Create your account to reserve seats, connect with instructors, or publish your own live workshops.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            {isAuthenticated ? (
              <Link to={dashboardUrl}>
                <Button variant="primary" size="md">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="md">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="md">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            <Link to="/sessions">
              <Button variant="secondary" size="md">
                Browse Full Catalog
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
