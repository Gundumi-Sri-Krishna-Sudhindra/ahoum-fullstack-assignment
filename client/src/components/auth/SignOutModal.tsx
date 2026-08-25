import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface SignOutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const SignOutModal = ({
  isOpen,
  onClose,
  onConfirm,
}: SignOutModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="neutral" size="md">
            Session Security
          </Badge>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Confirm Sign Out
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to end your current session? You will need to sign in again to book workshops or manage your hosted sessions.
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
          >
            Stay Signed In
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="w-full"
            onClick={onConfirm}
            id="btn-confirm-signout"
          >
            Yes, Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
