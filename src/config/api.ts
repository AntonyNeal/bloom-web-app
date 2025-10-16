/**
 * API Configuration
 * Automatically switches between local and production API endpoints
 */

export const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://bloom-platform-functions-v2.azurewebsites.net/api'
    : 'http://localhost:7071/api';

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  upload: `${API_BASE_URL}/upload`,
} as const;
