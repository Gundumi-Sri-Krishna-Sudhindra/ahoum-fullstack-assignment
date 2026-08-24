import { useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  refreshToken as apiRefreshToken,
} from '../api/auth.js'
import { loginWithGitHub as apiLoginWithGitHub } from '../api/github.js'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/client.js'
import { AuthContext } from './AuthContext'
import type { AuthUser, UserRole } from './types'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(() => {
    clearTokens()
    localStorage.removeItem('user_role_override')
    setUser(null)
    setError(null)
  }, [])

  // Restore authenticated session from stored token
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      const token = getAccessToken()
      const refresh = getRefreshToken()

      if (!token && !refresh) {
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        if (token) {
          try {
            const profile = await getMe()
            if (isMounted) {
              const savedRole = localStorage.getItem('user_role_override') as UserRole
              if (savedRole && (savedRole === 'USER' || savedRole === 'CREATOR')) {
                profile.role = savedRole
              }
              setUser(profile)
              setIsLoading(false)
            }
            return
          } catch (err: unknown) {
            const apiErr = err as { status?: number }
            if (apiErr?.status === 401 && refresh) {
              const refreshRes = await apiRefreshToken(refresh)
              if (refreshRes?.access) {
                setTokens(refreshRes.access, refreshRes.refresh || refresh)
                const profile = await getMe()
                if (isMounted) {
                  const savedRole = localStorage.getItem('user_role_override') as UserRole
                  if (savedRole && (savedRole === 'USER' || savedRole === 'CREATOR')) {
                    profile.role = savedRole
                  }
                  setUser(profile)
                  setIsLoading(false)
                }
                return
              }
            }
            throw err
          }
        } else if (refresh) {
          const refreshRes = await apiRefreshToken(refresh)
          if (refreshRes?.access) {
            setTokens(refreshRes.access, refreshRes.refresh || refresh)
            const profile = await getMe()
            if (isMounted) {
              const savedRole = localStorage.getItem('user_role_override') as UserRole
              if (savedRole && (savedRole === 'USER' || savedRole === 'CREATOR')) {
                profile.role = savedRole
              }
              setUser(profile)
              setIsLoading(false)
            }
            return
          }
        }
      } catch {
        clearTokens()
        localStorage.removeItem('user_role_override')
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    initAuth()

    const handleAuthExpired = () => {
      if (isMounted) {
        logout()
      }
    }

    window.addEventListener('auth:expired', handleAuthExpired)

    return () => {
      isMounted = false
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [logout])

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setError(null)
    const res = await apiLogin({ email, password })
    if (res?.access) {
      setTokens(res.access, res.refresh)
    }
    const profile = res?.user || (await getMe())
    const savedRole = localStorage.getItem('user_role_override') as UserRole
    if (savedRole && (savedRole === 'USER' || savedRole === 'CREATOR')) {
      profile.role = savedRole
    }
    setUser(profile)
    return profile
  }

  const register = async (data: {
    email: string
    name: string
    password: string
    role?: UserRole
  }): Promise<AuthUser> => {
    setError(null)
    const res = await apiRegister({
      email: data.email,
      name: data.name,
      password: data.password,
    })
    if (res?.access) {
      setTokens(res.access, res.refresh)
    }
    const profile = res?.user || (await getMe())
    if (data.role) {
      profile.role = data.role
      localStorage.setItem('user_role_override', data.role)
    }
    setUser(profile)
    return profile
  }

  const loginWithGitHub = async (
    code: string,
    redirectUri?: string
  ): Promise<AuthUser> => {
    setError(null)
    const res = await apiLoginWithGitHub(code, redirectUri)
    if (res?.access) {
      setTokens(res.access, res.refresh)
    }
    const profile = res?.user || (await getMe())
    const savedRole = localStorage.getItem('user_role_override') as UserRole
    if (savedRole && (savedRole === 'USER' || savedRole === 'CREATOR')) {
      profile.role = savedRole
    }
    setUser(profile)
    return profile
  }

  const updateUserRole = (role: UserRole) => {
    localStorage.setItem('user_role_override', role)
    setUser((prev) => (prev ? { ...prev, role } : null))
  }

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const profile = await getMe()
      const savedRole = localStorage.getItem('user_role_override') as UserRole
      if (savedRole && (savedRole === 'USER' || savedRole === 'CREATOR')) {
        profile.role = savedRole
      }
      setUser(profile)
      return profile
    } catch {
      logout()
      return null
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        loginWithGitHub,
        logout,
        refreshUser,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
