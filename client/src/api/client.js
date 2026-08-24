/**
 * Base API Client configured with VITE_API_BASE_URL.
 * Handles standardized headers, authentication token attachment, automatic token refresh,
 * and JSON response parsing.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
).replace(/\/+$/, '')

/**
 * Custom API Error class containing status and payload details.
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Retrieve the current access token from localStorage.
 */
export function getAccessToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    null
  )
}

/**
 * Retrieve the current refresh token from localStorage.
 */
export function getRefreshToken() {
  return (
    localStorage.getItem('refresh_token') ||
    localStorage.getItem('refreshToken') ||
    null
  )
}

/**
 * Store the access and refresh tokens in localStorage.
 */
export function setTokens(access, refresh) {
  if (access) {
    localStorage.setItem('access_token', access)
  }
  if (refresh) {
    localStorage.setItem('refresh_token', refresh)
  }
}

/**
 * Remove stored tokens on logout or session expiration.
 */
export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('refreshToken')
}

// In-flight refresh promise to prevent multiple parallel refresh calls
let isRefreshing = null

/**
 * Internal token refresh handler that calls POST /auth/refresh/
 */
async function performTokenRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearTokens()
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      window.dispatchEvent(new CustomEvent('auth:expired'))
      return null
    }

    const data = await response.json()
    if (data && data.access) {
      setTokens(data.access, data.refresh || refreshToken)
      return data.access
    }

    clearTokens()
    window.dispatchEvent(new CustomEvent('auth:expired'))
    return null
  } catch {
    clearTokens()
    window.dispatchEvent(new CustomEvent('auth:expired'))
    return null
  }
}

/**
 * Core fetch wrapper that prefixes requests with API_BASE_URL, adds auth headers,
 * and handles token expiration and retries.
 *
 * @param {string} endpoint - Relative path (e.g. '/auth/login/')
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @param {boolean} [isRetry=false] - Internal flag preventing recursive retries
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${cleanEndpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getAccessToken()
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(url, config)

  // 204 No Content has no body
  if (response.status === 204) {
    return null
  }

  // If 401 Unauthorized occurs on an authenticated endpoint and we haven't retried yet
  const isAuthEndpoint =
    cleanEndpoint.includes('/auth/login/') ||
    cleanEndpoint.includes('/auth/register/') ||
    cleanEndpoint.includes('/auth/refresh/') ||
    cleanEndpoint.includes('/auth/github/')

  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = performTokenRefresh().finally(() => {
        isRefreshing = null
      })
    }

    const newAccessToken = await isRefreshing
    if (newAccessToken) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      }
      return apiFetch(
        endpoint,
        {
          ...options,
          headers: retryHeaders,
        },
        true
      )
    }
  }

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null)
  } else {
    data = await response.text().catch(() => null)
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.'

    if (data) {
      if (typeof data === 'string') {
        errorMessage = data
      } else if (data.detail) {
        errorMessage = data.detail
      } else if (data.message) {
        errorMessage = data.message
      } else if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors)
          ? data.non_field_errors.join(' ')
          : String(data.non_field_errors)
      } else if (typeof data === 'object') {
        // Collect field validation errors e.g. { email: ["A user with this email already exists."], password: [...] }
        const fieldErrors = Object.entries(data)
          .map(([key, val]) => {
            const valStr = Array.isArray(val) ? val.join(' ') : String(val)
            return `${key.replace('_', ' ')}: ${valStr}`
          })
          .join('\n')
        if (fieldErrors) {
          errorMessage = fieldErrors
        }
      }
    } else {
      errorMessage = `Request failed with status ${response.status}`
    }

    throw new ApiError(errorMessage, response.status, data)
  }

  return data
}

export const apiGet = (endpoint, options = {}) =>
  apiFetch(endpoint, { ...options, method: 'GET' })

export const apiPost = (endpoint, body = null, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: body !== null ? JSON.stringify(body) : undefined,
  })

export const apiPut = (endpoint, body = null, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== null ? JSON.stringify(body) : undefined,
  })

export const apiPatch = (endpoint, body = null, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== null ? JSON.stringify(body) : undefined,
  })

export const apiDelete = (endpoint, options = {}) =>
  apiFetch(endpoint, { ...options, method: 'DELETE' })
