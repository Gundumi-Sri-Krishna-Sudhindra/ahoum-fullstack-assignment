import { Link } from 'react-router-dom'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'

import { useEffect } from 'react'

export const NewSessionPage = () => {
  useEffect(() => {
    document.title = 'Ahoum | Host Session'
  }, [])
  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Host New Session"
        description="Publish an interactive live workshop or teaching session."
        actions={
          <Link to="/creator">
            <Button variant="outline" size="sm">
              &larr; Back to Dashboard
            </Button>
          </Link>
        }
      />

      <div className="border border-slate-200 p-6 rounded-sm bg-white space-y-4">
        <Input label="Session Title" placeholder="e.g. Advanced TypeScript Patterns" />
        <Textarea label="Description" placeholder="Provide an overview of the session curriculum..." rows={4} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Start Date & Time" type="datetime-local" />
          <Input label="End Date & Time" type="datetime-local" />
        </div>
        <Input label="Capacity (Seats)" type="number" min={1} placeholder="20" />

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
          <Link to="/creator">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="primary">Publish Session</Button>
        </div>
      </div>
    </PageContainer>
  )
}
