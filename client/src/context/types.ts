export type UserRole = 'USER' | 'CREATOR'

export interface AuthUser {
  id: number | string
  email: string
  name: string
  role: UserRole
  is_active?: boolean
  is_new_user?: boolean
}

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: {
    email: string
    name: string
    password: string
    role?: UserRole
  }) => Promise<AuthUser>
  loginWithGitHub: (code: string, redirectUri?: string) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => Promise<AuthUser | null>
  updateUserRole: (role: UserRole) => Promise<void>
  updateUserProfile: (data: { name: string }) => Promise<AuthUser>
}
