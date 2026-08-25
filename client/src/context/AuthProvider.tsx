import { useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  getMe,
  updateProfile,
  setUserRole as apiSetUserRole,
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
              setUser(profile)
              setIsLoading(false)
            }
            return
          }
        }
      } catch {
        clearTokens()
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
      role: data.role || 'USER',
    })
    if (res?.access) {
      setTokens(res.access, res.refresh)
    }
    const profile = res?.user || (await getMe())
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
    if (res && typeof res.is_new_user === 'boolean') {
      profile.is_new_user = res.is_new_user
    }
    setUser(profile)
    return profile
  }

  const updateUserRole = async (role: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role } : null))
    try {
      const updated = await apiSetUserRole(role)
      if (updated) {
        setUser(updated)
      }
    } catch (err) {
      console.error('Failed to sync updated role to backend:', err)
    }
  }

  const updateUserProfile = async (data: { name: string }): Promise<AuthUser> => {
    const updated = await updateProfile(data)
    if (updated) {
      setUser(updated)
    }
    return updated
  }

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const profile = await getMe()
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
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
