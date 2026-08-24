import { apiGet, apiPost } from './client.js'

/**
 * Register a new user account (defaults to USER role).
 * @param {{ email: string, name: string, password: string, role?: string }} data
 */
export function register(data) {
  return apiPost('/auth/register/', data)
}

/**
 * Log in with email and password to receive JWT tokens.
 * @param {{ email: string, password: string }} data
 */
export function login(data) {
  return apiPost('/auth/login/', data)
}

/**
 * Refresh an expired JWT access token using a valid refresh token.
 * @param {string} refresh
 */
export function refreshToken(refresh) {
  return apiPost('/auth/refresh/', { refresh })
}

/**
 * Retrieve the profile of the currently authenticated user.
 */
export function getMe() {
  return apiGet('/auth/me/')
}
