import type React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-800 tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={disabled}
        className={`w-full bg-white border text-slate-900 placeholder-slate-400 text-base px-4 py-2.5 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-sm ${
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  )
}
