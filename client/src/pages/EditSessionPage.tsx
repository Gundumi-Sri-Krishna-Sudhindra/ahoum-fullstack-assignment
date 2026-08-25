import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getSession, updateSession } from '../api/sessions.js'
import { PageContainer } from '../components/ui/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Loading } from '../components/ui/Loading'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export const EditSessionPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    document.title = id ? `Ahoum | Edit Session #${id}` : 'Ahoum | Edit Session'
  }, [id])

  const formatForInput = (isoString?: string) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const offset = d.getTimezoneOffset() * 60000
    const local = new Date(d.getTime() - offset)
    return local.toISOString().slice(0, 16)
  }

  useEffect(() => {
    let isMounted = true
    if (!id) return

    const loadSession = async () => {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const data = await getSession(id)
        if (isMounted && data) {
          setTitle(data.title || '')
          setDescription(data.description || '')
          setStartTime(formatForInput(data.start_time))
          setEndTime(formatForInput(data.end_time))
          setCapacity(data.capacity || '')
        }
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (isMounted) {
          setErrorMsg(e?.message || 'Failed to load session for editing.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
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
      await updateSession(id, {
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
        e?.message || 'Failed to update session. Please check your inputs.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={`Edit Session #${id}`}
        description="Update session curriculum, schedules, or capacity limits."
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
            title="Update Notice"
            message={errorMsg}
            variant="error"
          />
        )}

        {isLoading ? (
          <div className="min-h-[30vh] flex items-center justify-center py-12">
            <Loading size="lg" label="Loading session data..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Session Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />

            <Textarea
              label="Session Description & Agenda"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageContainer>
  )
}
