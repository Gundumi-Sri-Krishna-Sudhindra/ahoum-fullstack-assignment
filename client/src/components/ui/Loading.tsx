import type React from 'react'

export interface LoadingProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({
  label = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const sizeMap: Record<NonNullable<LoadingProps['size']>, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  }

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2.5 text-slate-600 text-sm py-4 ${className}`}
    >
      <svg
        className={`animate-spin text-blue-700 ${sizeMap[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      {label && <span className="font-medium text-slate-700">{label}</span>}
    </div>
  )
}
