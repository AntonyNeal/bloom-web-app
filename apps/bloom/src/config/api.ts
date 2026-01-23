/**
 * API Configuration
 * Uses VITE_API_URL from environment if available
 * In development: Uses Vite proxy (/api -> production backend)
 * In production: Uses configured API URL
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://bloom-functions-dev.azurewebsites.net/api'
    : '/api'); // Proxied to bloom-functions-dev via Vite

export const API_ENDPOINTS = {
  applications: `${API_BASE_URL}/applications`,
  upload: `${API_BASE_URL}/upload`,
  sendOffer: (id: number) => `${API_BASE_URL}/send-offer/${id}`,
  acceptOffer: (token: string) => `${API_BASE_URL}/accept-offer/${token}`,
  scheduleInterview: `${API_BASE_URL}/schedule-interview`,
  interview: `${API_BASE_URL}/interview`,
  interviewTranscribe: (token: string) => `${API_BASE_URL}/interview/${token}/transcribe`,
  interviewTranscribeAudio: (token: string) => `${API_BASE_URL}/interview/${token}/transcribe-audio`,
  interviewAnalyze: (token: string) => `${API_BASE_URL}/interview/${token}/analyze`,
  interviewAnalysis: (token: string) => `${API_BASE_URL}/interview/${token}/analysis`,
} as const;
