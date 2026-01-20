/**
 * API Configuration
 * Uses VITE_API_URL from environment if available
 * In development: Uses Vite proxy (/api -> production backend)
 * In production: Uses configured API URL
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://bloom-platform-functions-v2.azurewebsites.net/api'
    : '/api'); // Proxied to production via Vite

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  upload: `${API_BASE_URL}/upload`,
} as const;
