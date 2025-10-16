/**
 * API Configuration
 * Uses production API endpoint for both development and production
 */

export const API_BASE_URL = 'https://bloom-platform-functions-v2.azurewebsites.net/api';

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  upload: `${API_BASE_URL}/upload`,
} as const;
