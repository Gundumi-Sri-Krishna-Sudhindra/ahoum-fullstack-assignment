import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface DeleteSessionModalProps {
  isOpen: boolean
  sessionTitle?: string
  bookingCount?: number
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteSessionModal = ({
  isOpen,
  sessionTitle,
  bookingCount = 0,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteSessionModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="danger" size="md">
            Creator Action
          </Badge>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Delete Workshop Session
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900">
              {sessionTitle ? `"${sessionTitle}"` : 'this session'}
            </strong>
            ? This action cannot be undone and will remove the workshop from the catalog.
          </p>
          {bookingCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs font-semibold text-amber-900 text-left">
              ⚠️ Note: This session currently has{' '}
              <span className="font-bold">{bookingCount}</span> confirmed attendee
              {bookingCount === 1 ? '' : 's'}.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Session
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="w-full"
            onClick={onConfirm}
            isLoading={isLoading}
            id="btn-confirm-delete-session"
          >
            Yes, Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
