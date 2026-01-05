/**
 * API Configuration
 * 
 * IMPORTANT: Bloom uses standalone Azure Functions, NOT managed functions with Static Web Apps.
 * 
 * Each environment has its own Function App:
 * - Development: bloom-functions-dev.azurewebsites.net (uses Dev DB)
 * - Staging: bloom-functions-staging-new.azurewebsites.net (uses Dev DB)
 * - Production: bloom-platform-functions-v2.azurewebsites.net (uses Prod DB)
 * 
 * The VITE_API_URL is injected at build time by the CI/CD pipeline.
 * Local development uses Vite proxy (/api -> dev backend) via vite.config.ts
 * 
 * SINGLE SOURCE OF TRUTH: Only VITE_API_URL is needed. All other URLs are derived.
 */

const isDevelopmentServer = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Use injected API URL from build, fallback to /api for local dev (Vite proxy)
export const API_BASE_URL = isDevelopmentServer
  ? '/api' // Vite proxy for local development
  : (import.meta.env.VITE_API_URL || 'https://bloom-platform-functions-v2.azurewebsites.net/api');

// Base URL without /api suffix (for endpoints that add /api themselves)
export const FUNCTIONS_BASE_URL = isDevelopmentServer
  ? '' // Empty for local dev (endpoints will be /api/...)
  : API_BASE_URL.replace(/\/api$/, '');

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  upload: `${API_BASE_URL}/upload`,
  // Halaxy endpoints
  availability: `${API_BASE_URL}/halaxy/availability`,
  createBooking: `${API_BASE_URL}/create-halaxy-booking`,
  // Offer endpoints (use FUNCTIONS_BASE_URL because they add /api/)
  acceptOffer: (token: string) => `${FUNCTIONS_BASE_URL}/api/accept-offer/${token}`,
} as const;
