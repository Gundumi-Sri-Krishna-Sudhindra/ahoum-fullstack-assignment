import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface CancelBookingModalProps {
  isOpen: boolean
  sessionTitle?: string
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export const CancelBookingModal = ({
  isOpen,
  sessionTitle,
  isLoading = false,
  onClose,
  onConfirm,
}: CancelBookingModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="danger" size="md">
            Cancel Reservation
          </Badge>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Confirm Cancellation
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to cancel your seat for{' '}
            <strong className="text-slate-900">
              {sessionTitle ? `"${sessionTitle}"` : 'this workshop'}
            </strong>
            ? Your seat will be released back to the catalog for other learners.
          </p>
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
            Keep Seat
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="w-full"
            onClick={onConfirm}
            isLoading={isLoading}
            id="btn-confirm-cancel-booking"
          >
            Yes, Cancel Seat
          </Button>
        </div>
      </div>
    </div>
  )
}
