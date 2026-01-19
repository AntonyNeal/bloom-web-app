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
 * NO FALLBACKS: If VITE_API_URL is not set in production, the app should fail fast.
 */

const isDevelopmentServer = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Validate API URL is set in non-local environments
function getApiUrl(): string {
  if (isDevelopmentServer) {
    return '/api'; // Vite proxy for local development
  }
  
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    const error = 'FATAL: VITE_API_URL environment variable is not set. Build configuration error.';
    console.error(error);
    // Show error to user in production
    if (typeof document !== 'undefined') {
      document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">${error}</div>`;
    }
    throw new Error(error);
  }
  return apiUrl;
}

export const API_BASE_URL = getApiUrl();

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
