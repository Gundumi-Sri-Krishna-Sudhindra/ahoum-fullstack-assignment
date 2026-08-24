import { Link } from 'react-router-dom'
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

import { useEffect } from 'react'

export const BookingsPage = () => {
  useEffect(() => {
    document.title = 'Ahoum | My Bookings'
  }, [])
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
            <TableRow>
              <TableCell className="font-bold text-slate-900">
                React Basics
              </TableCell>
              <TableCell>John Doe</TableCell>
              <TableCell>25 Aug • 10:00 AM</TableCell>
              <TableCell>
                <Badge variant="success" size="md">ACTIVE</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  Cancel Seat
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  )
}
