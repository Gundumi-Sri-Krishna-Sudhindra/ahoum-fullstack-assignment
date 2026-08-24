import { useParams, Link } from 'react-router-dom'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'

import { useEffect } from 'react'

export const EditSessionPage = () => {
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    document.title = id ? `Ahoum | Edit Session #${id}` : 'Ahoum | Edit Session'
  }, [id])

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={`Edit Session #${id}`}
        description="Update session schedule, details, or capacity limit."
        actions={
          <Link to="/creator">
            <Button variant="outline" size="sm">
              &larr; Back to Dashboard
            </Button>
          </Link>
        }
      />

      <div className="border border-slate-200 p-6 rounded-sm bg-white space-y-4">
        <Input
          label="Session Title"
          defaultValue="React Basics"
        />
        <Textarea
          label="Description"
          defaultValue="Comprehensive hands-on session covering core React fundamentals."
          rows={4}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Start Date & Time" type="datetime-local" />
          <Input label="End Date & Time" type="datetime-local" />
        </div>
        <Input
          label="Capacity (Seats)"
          type="number"
          min={1}
          defaultValue={20}
        />

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Link to="/creator">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>
    </PageContainer>
  )
}
