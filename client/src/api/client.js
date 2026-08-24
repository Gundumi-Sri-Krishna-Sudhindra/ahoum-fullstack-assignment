/**
 * Base API Client configured with VITE_API_BASE_URL.
 * Handles standardized headers, authentication token attachment, and JSON response parsing.
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
  return localStorage.getItem('access_token') || localStorage.getItem('accessToken') || null
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
 * Remove stored tokens on logout.
 */
export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('refreshToken')
}

/**
 * Core fetch wrapper that prefixes requests with API_BASE_URL and adds auth headers.
 * 
 * @param {string} endpoint - Relative path (e.g. '/auth/login/')
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
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

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null)
  } else {
    data = await response.text().catch(() => null)
  }

  if (!response.ok) {
    const errorMessage =
      (data && (data.detail || data.message || (typeof data === 'string' ? data : JSON.stringify(data)))) ||
      `Request failed with status ${response.status}`
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
