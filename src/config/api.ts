/**
 * API Configuration
 * In development: Uses Vite proxy (/api -> production backend)
 * In production: Uses production API directly
 */

export const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://bloom-functions-new.azurewebsites.net/api'
    : '/api'; // Proxied to production via Vite

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  upload: `${API_BASE_URL}/upload`,
} as const;
