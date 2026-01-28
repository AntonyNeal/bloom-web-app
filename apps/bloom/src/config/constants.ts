/**
 * Application Constants
 * 
 * Centralized constants for the Bloom application.
 * Use these instead of magic strings throughout the codebase.
 * 
 * @example
 * import { APP_STATUS, BLOOM_COLORS, ERROR_MESSAGES } from '@/config/constants';
 */

// =============================================================================
// Application Status
// =============================================================================

/**
 * Application status values
 * Used in admin workflow and status badges
 */
export const APP_STATUS = {
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  ACCEPTED: 'accepted',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  DENIED: 'denied',
  WAITLISTED: 'waitlisted',
  WITHDRAWN: 'withdrawn',
} as const;

export type AppStatus = typeof APP_STATUS[keyof typeof APP_STATUS];

/**
 * Session status values
 * Used in clinician dashboard
 */
export const SESSION_STATUS = {
  BOOKED: 'booked',
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  SCHEDULED: 'scheduled',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// =============================================================================
// Design System Colors
// =============================================================================

/**
 * Bloom design system color palette
 * Based on natural, botanical theme (Miyazaki/Studio Ghibli inspired)
 */
export const BLOOM_COLORS = {
  // Primary greens (sage family)
  eucalyptusSage: '#6B8E7F',
  softFern: '#8FA892',
  sage: '#6B8E7F',
  fern: '#8FA892',
  
  // Extended palette
  deepSage: '#4A6B5C',
  forestShadow: '#3D5A4C',
  forest: '#3D5A4C',
  softStone: '#E8E4DF',
  stone: '#E8E4DF',
  moss: '#6A6A6A',
  
  // Warm accents
  paleAmber: '#F5E6D3',
  softTerracotta: '#D4A28F',
  honeyAmber: '#E8B77D',
  clayTerracotta: '#C89B7B',
  
  // Neutrals
  warmCream: '#FAF7F2',
  cream: '#FAF7F2',
  paperWhite: '#FEFDFB',
  
  // Text colors
  textPrimary: '#3A3A3A',
  textSecondary: '#4A4A4A',
  textTertiary: '#6A6A6A',
  
  // Semantic colors (shared with NEXT-WEBSITE)
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
} as const;

// =============================================================================
// Qualification Types
// =============================================================================

/**
 * Practitioner qualification levels
 * Determines which "tier" of flower they receive
 */
export const QUALIFICATION_TYPE = {
  CLINICAL: 'clinical',      // Clinical psychologist - Tier 3 (most complex flower)
  EXPERIENCED: 'experienced', // 10+ years AHPRA - Tier 2
  STANDARD: 'standard',       // < 10 years - Tier 1
  PHD: 'phd',                // PhD holder - Tier 2
} as const;

export type QualificationType = typeof QUALIFICATION_TYPE[keyof typeof QUALIFICATION_TYPE];

// =============================================================================
// Location Types
// =============================================================================

/**
 * Session location types
 * Used in appointment/session management
 */
export const LOCATION_TYPE = {
  IN_PERSON: 'in-person',
  TELEHEALTH: 'telehealth',
  PHONE: 'phone',
} as const;

export type LocationType = typeof LOCATION_TYPE[keyof typeof LOCATION_TYPE];

// =============================================================================
// Error Messages
// =============================================================================

/**
 * Standardized error messages
 * Use these for consistent user-facing errors
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  TIMEOUT_ERROR: 'The request took too long. Please try again.',
  
  // Auth errors
  AUTH_REQUIRED: 'Please sign in to continue.',
  AUTH_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_DENIED: 'You don\'t have permission to access this resource.',
  
  // Form errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_AHPRA: 'Please enter a valid AHPRA registration number.',
  FILE_TOO_LARGE: 'File size must be less than 10MB.',
  INVALID_FILE_TYPE: 'Please upload a PDF, DOC, or image file.',
  
  // Application errors
  APPLICATION_NOT_FOUND: 'Application not found.',
  APPLICATION_UPDATE_FAILED: 'Failed to update application. Please try again.',
  
  // Upload errors
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// =============================================================================
// Loading Messages
// =============================================================================

/**
 * Loading state messages
 * Consistent messaging for async operations
 */
export const LOADING_MESSAGES = {
  DEFAULT: 'Loading...',
  SUBMITTING: 'Submitting...',
  UPLOADING: 'Uploading...',
  SAVING: 'Saving...',
  LOADING_SESSION: 'Preparing therapy room...',
  LOADING_DASHBOARD: 'Loading your dashboard...',
  VERIFYING_AUTH: 'Verifying authentication...',
  CONNECTING: 'Connecting to your session...',
} as const;

// =============================================================================
// Animation Durations
// =============================================================================

/**
 * Standard animation durations (in milliseconds)
 * For consistent motion design
 */
export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PAGE_TRANSITION: 600,
  BLOB_FLOAT: 60000, // 60 seconds for ambient blobs
} as const;

// =============================================================================
// Breakpoints
// =============================================================================

/**
 * Responsive breakpoints (in pixels)
 * Match TailwindCSS defaults
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// =============================================================================
// Feature Flags
// =============================================================================

/**
 * Feature flags for enabling/disabling features
 * Set via environment variables
 */
export const FEATURE_FLAGS = {
  ENABLE_AB_TESTING: import.meta.env.VITE_ENABLE_AB_TESTING === 'true',
  ENABLE_TRANSCRIPTION: import.meta.env.VITE_ENABLE_TRANSCRIPTION === 'true',
  ENABLE_AI_NOTES: import.meta.env.VITE_ENABLE_AI_NOTES === 'true',
  ENABLE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
} as const;
