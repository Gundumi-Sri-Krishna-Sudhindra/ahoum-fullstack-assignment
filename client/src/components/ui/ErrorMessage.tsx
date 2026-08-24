import type React from 'react'

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  variant?: 'error' | 'warning' | 'info' | 'success'
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  children,
  variant = 'error',
  className = '',
  ...props
}) => {
  const variantStyles: Record<NonNullable<ErrorMessageProps['variant']>, string> = {
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }

  return (
    <div
      role="alert"
      className={`border rounded-sm p-3 text-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {title && <div className="font-semibold mb-0.5">{title}</div>}
      <div>{message || children}</div>
    </div>
  )
}
