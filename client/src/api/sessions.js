import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client.js'

/**
 * Browse marketplace sessions with optional search and filter params.
 * @param {{ search?: string, filter?: 'upcoming' | 'past' }} [params={}]
 */
export function getSessions(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.search) {
    searchParams.append('search', params.search)
  }
  if (params.filter) {
    searchParams.append('filter', params.filter)
  }
  const queryString = searchParams.toString()
  const endpoint = `/sessions/${queryString ? `?${queryString}` : ''}`
  return apiGet(endpoint)
}

/**
 * Retrieve single session details by ID.
 * @param {number|string} id
 */
export function getSession(id) {
  return apiGet(`/sessions/${id}/`)
}

/**
 * Create a new session (Creator accounts only).
 * @param {{ title: string, description?: string, start_time: string, end_time: string, capacity: number }} data
 */
export function createSession(data) {
  return apiPost('/sessions/', data)
}

/**
 * Update an existing session (Session creator only).
 * @param {number|string} id
 * @param {{ title: string, description?: string, start_time: string, end_time: string, capacity: number }} data
 */
export function updateSession(id, data) {
  return apiPut(`/sessions/${id}/`, data)
}

/**
 * Partially update an existing session (Session creator only).
 * @param {number|string} id
 * @param {Partial<{ title: string, description?: string, start_time: string, end_time: string, capacity: number }>} data
 */
export function patchSession(id, data) {
  return apiPatch(`/sessions/${id}/`, data)
}

/**
 * Delete a session (Session creator only).
 * @param {number|string} id
 */
export function deleteSession(id) {
  return apiDelete(`/sessions/${id}/`)
}

/**
 * List all sessions created by the currently authenticated creator, including attendee details.
 */
export function getMySessions() {
  return apiGet('/sessions/mine/')
}

/**
 * Book a seat in the specified session (USER role only).
 * @param {number|string} id - Session ID
 */
export function bookSession(id) {
  return apiPost(`/sessions/${id}/book/`)
}
