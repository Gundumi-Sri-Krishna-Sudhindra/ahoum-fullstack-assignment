import type React from 'react'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '6xl' | '7xl' | 'full'
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '7xl',
  className = '',
  ...props
}) => {
  const maxWidthStyles: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <main
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white ${maxWidthStyles[maxWidth]} ${className}`}
      {...props}
    >
      {children}
    </main>
  )
}
