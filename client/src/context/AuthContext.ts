import { createContext } from 'react'
import type { AuthContextType } from './types'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export type { UserRole, AuthUser, AuthContextType } from './types'
export { AuthProvider } from './AuthProvider'
export { useAuth } from './useAuth'
