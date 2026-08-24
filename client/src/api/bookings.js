import { apiGet, apiPost } from './client.js'

/**
 * List all bookings for the currently authenticated user.
 */
export function getBookings() {
  return apiGet('/bookings/')
}

/**
 * Retrieve booking details by ID.
 * @param {number|string} id
 */
export function getBooking(id) {
  return apiGet(`/bookings/${id}/`)
}

/**
 * Cancel an active booking.
 * @param {number|string} id - Booking ID
 */
export function cancelBooking(id) {
  return apiPost(`/bookings/${id}/cancel/`)
}
