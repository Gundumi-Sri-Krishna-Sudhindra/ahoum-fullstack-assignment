import { apiGet, apiPost } from './client.js'

/**
 * Retrieve GitHub OAuth authorization URL to initiate the OAuth flow.
 * @param {string} [redirectUri] - Optional custom redirect URI
 */
export function getGitHubAuthUrl(redirectUri) {
  const query = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''
  return apiGet(`/auth/github/url/${query}`)
}

/**
 * Exchange the GitHub authorization code for application JWT tokens.
 * @param {string} code - GitHub authorization code from callback query string
 * @param {string} [redirectUri] - Matching redirect URI used during authorization
 */
export function loginWithGitHub(code, redirectUri) {
  const payload = { code }
  if (redirectUri) {
    payload.redirect_uri = redirectUri
  }
  return apiPost('/auth/github/', payload)
}
