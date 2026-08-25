import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../api/sessions.js'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export const NewSessionPage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Ahoum | Host Session'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg('Please enter a session title.')
      return
    }

    if (!startTime || !endTime) {
      setErrorMsg('Please specify both start and end dates/times.')
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()

    if (start <= now) {
      setErrorMsg('Session start time must be in the future.')
      return
    }

    if (end <= start) {
      setErrorMsg('Session end time must be after the start time.')
      return
    }

    if (!capacity || Number(capacity) <= 0) {
      setErrorMsg('Session capacity must be at least 1 seat.')
      return
    }

    setIsSubmitting(true)
    try {
      await createSession({
        title: title.trim(),
        description: description.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        capacity: Number(capacity),
      })

      navigate('/creator/sessions', { replace: true })
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrorMsg(
        e?.message || 'Failed to publish new session. Please check your inputs.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Host New Session"
        description="Publish an interactive live workshop or teaching session for learners to book."
        actions={
          <Link to="/creator/sessions">
            <Button variant="outline" size="md">
              &larr; Back to Sessions
            </Button>
          </Link>
        }
      />

      <div className="border border-slate-200 p-8 sm:p-10 rounded-sm bg-white shadow-xs space-y-6">
        {errorMsg && (
          <ErrorMessage
            title="Publication Error"
            message={errorMsg}
            variant="error"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Session Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Modern System Architecture Workshop"
            disabled={isSubmitting}
          />

          <Textarea
            label="Session Description & Agenda"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline the curriculum, prerequisites, and key takeaways..."
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Capacity (Maximum Available Seats)"
            type="number"
            min={1}
            required
            value={capacity}
            onChange={(e) =>
              setCapacity(e.target.value ? Number(e.target.value) : '')
            }
            placeholder="e.g. 20"
            disabled={isSubmitting}
          />

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link to="/creator/sessions">
              <Button variant="outline" size="md" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Publish Live Session
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
