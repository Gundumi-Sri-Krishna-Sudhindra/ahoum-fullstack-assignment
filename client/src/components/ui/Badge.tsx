import type React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    neutral: 'bg-slate-100 text-slate-800 border-slate-300',
    primary: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-300',
  }

  const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'text-xs px-2.5 py-0.5 font-semibold',
    md: 'text-sm px-3.5 py-1 font-semibold',
    lg: 'text-base px-4 py-1.5 font-bold',
  }

  return (
    <span
      className={`inline-flex items-center rounded-sm border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
