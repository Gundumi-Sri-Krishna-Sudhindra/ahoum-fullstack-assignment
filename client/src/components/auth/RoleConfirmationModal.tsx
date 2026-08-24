import { useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { UserRole } from '../../context/types'

export interface RoleConfirmationModalProps {
  isOpen: boolean
  userName?: string
  defaultRole?: UserRole
  onConfirm: (selectedRole: UserRole) => void
}

export const RoleConfirmationModal = ({
  isOpen,
  userName,
  defaultRole = 'USER',
  onConfirm,
}: RoleConfirmationModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(selectedRole)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-200 pb-5">
          <Badge variant="primary" size="md">
            Welcome to Ahoum
          </Badge>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Confirm Your Account Role
          </h2>
          <p className="text-sm text-slate-600">
            {userName ? `Hi ${userName}, please ` : 'Please '}
            choose your primary account role. To ensure platform integrity, each account is assigned a single dedicated role.
          </p>
        </div>

        {/* Role Options */}
        <div className="space-y-3">
          {/* USER Role Option */}
          <div
            onClick={() => setSelectedRole('USER')}
            className={`p-5 rounded-sm border-2 cursor-pointer transition-all ${
              selectedRole === 'USER'
                ? 'border-blue-700 bg-blue-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    Learner (Standard User)
                  </span>
                  <Badge variant="neutral" size="sm">
                    USER
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover upcoming live sessions, reserve seats with row-level concurrency protection, and manage your booked schedule.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  selectedRole === 'USER'
                    ? 'border-blue-700 bg-blue-700'
                    : 'border-slate-300'
                }`}
              >
                {selectedRole === 'USER' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* CREATOR Role Option */}
          <div
            onClick={() => setSelectedRole('CREATOR')}
            className={`p-5 rounded-sm border-2 cursor-pointer transition-all ${
              selectedRole === 'CREATOR'
                ? 'border-blue-700 bg-blue-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    Creator (Instructor & Host)
                  </span>
                  <Badge variant="primary" size="sm">
                    CREATOR
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Schedule live workshops, set strict attendee seat limits, manage registrations, and review confirmed attendee rosters.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  selectedRole === 'CREATOR'
                    ? 'border-blue-700 bg-blue-700'
                    : 'border-slate-300'
                }`}
              >
                {selectedRole === 'CREATOR' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          Note: Accounts cannot have dual or overlapping roles.
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleConfirm}
          >
            Confirm & Go to {selectedRole === 'CREATOR' ? 'Creator Hub' : 'Dashboard'} &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}
