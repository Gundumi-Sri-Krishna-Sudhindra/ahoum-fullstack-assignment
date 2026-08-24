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

export const CreatorDashboardPage = () => {
  useEffect(() => {
    document.title = 'Ahoum | Creator Dashboard'
  }, [])
  return (
    <PageContainer maxWidth="7xl">
      <PageHeader
        title="Creator Dashboard"
        description="Manage your hosted sessions, view real-time attendee rosters, and launch new interactive workshops."
        actions={
          <Link to="/creator/sessions/new">
            <Button variant="primary" size="md">
              + Host New Session
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SESSION TITLE</TableHead>
              <TableHead>START TIME</TableHead>
              <TableHead>END TIME</TableHead>
              <TableHead>ATTENDEES</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold text-slate-900">
                React Basics
              </TableCell>
              <TableCell>25 Aug • 10:00 AM</TableCell>
              <TableCell>25 Aug • 11:30 AM</TableCell>
              <TableCell>
                <Badge variant="primary" size="md">12 / 20 Booked</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link to="/creator/sessions/1/edit">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button variant="danger" size="sm">
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  )
}
