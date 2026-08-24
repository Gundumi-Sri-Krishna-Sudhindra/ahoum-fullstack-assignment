import type React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 border-blue-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-300',
    outline: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-300 shadow-sm',
    danger: 'bg-red-700 text-white hover:bg-red-800 border-red-700 shadow-sm',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent',
  }

  const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3.5 py-1.5 text-sm gap-2',
    md: 'px-5 py-2.5 text-base gap-2.5',
    lg: 'px-7 py-3.5 text-lg gap-3',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5 text-current"
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
      )}
      {children}
    </button>
  )
}
