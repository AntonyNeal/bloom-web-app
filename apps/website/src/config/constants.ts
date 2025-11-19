/**
 * Application Constants
 *
 * Centralized configuration values used throughout the application
 */

// Application metadata
export const APP_NAME = 'Life Psychology Australia';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  BOOKING_SESSION: '/api/store-booking-session',
  AB_TEST_ALLOCATE: '/api/ab-test/allocate',
  AB_TEST_TRACK: '/api/ab-test/track',
  HALAXY_WEBHOOK: '/api/halaxy-webhook',
  RUNTIME_CONFIG: '/api/runtime-config',
} as const;

// A/B Testing configuration
export const AB_TEST_CONFIG = {
  STORAGE_KEY: 'ab-test-variant',
  USER_ID_KEY: 'ab-test-user-id',
  ALLOCATION_COOKIE_NAME: 'ab_variant',
  COOKIE_MAX_AGE_DAYS: 30,
} as const;

// Booking configuration
export const BOOKING_CONFIG = {
  SESSION_STORAGE_KEY: 'booking_session_id',
  GCLID_STORAGE_KEY: 'gclid',
  SESSION_EXPIRY_HOURS: 24,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// Tracking configuration
export const TRACKING_CONFIG = {
  SCROLL_DEPTH_THRESHOLDS: [25, 50, 75, 90, 100],
  HIGH_INTENT_TIMER_SECONDS: 30,
  DEBOUNCE_MS: 300,
} as const;

// Performance configuration
export const PERFORMANCE_CONFIG = {
  LAZY_LOAD_THRESHOLD: '50px',
  IMAGE_QUALITY: 85,
  CACHE_MAX_AGE_DAYS: 7,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  API_ERROR: 'Service temporarily unavailable. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  BOOKING_ERROR:
    'Unable to process booking. Please try again or contact us directly.',
  AB_TEST_ERROR: 'Unable to load test configuration. Using default experience.',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
  INDIVIDUAL_THERAPY: '/individual-therapy',
  COUPLES_THERAPY: '/couples-therapy',
  ANXIETY_DEPRESSION: '/anxiety-depression',
  NEURODIVERSITY: '/neurodiversity',
  NDIS_SERVICES: '/ndis-services',
  PRICING: '/pricing',
  BOOKING_SUCCESS: '/booking-success',
  CONTACT: '/contact',
  JOIN_US: 'https://bloom.life-psychology.com.au',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// Feature flags (defaults - can be overridden by runtime config)
export const FEATURE_FLAGS = {
  ENABLE_AB_TESTING: true,
  ENABLE_CHAT: false,
  ENABLE_ASSESSMENT: false,
  ENABLE_ANALYTICS: true,
  ENABLE_DEBUG_PANEL: false,
} as const;

// Business information
export const BUSINESS_INFO = {
  NAME: 'Life Psychology Australia',
  EMAIL: 'contact@life-psychology.com.au',
  ADDRESS: {
    LOCALITY: 'Newcastle',
    REGION: 'NSW',
    COUNTRY: 'AU',
  },
  GEO: {
    LATITUDE: -32.9283,
    LONGITUDE: 151.7817,
  },
  OPENING_HOURS: 'Mo-Sa 09:00-17:00',
} as const;

// Social media (when available)
export const SOCIAL_MEDIA = {
  FACEBOOK: '',
  INSTAGRAM: '',
  LINKEDIN: '',
} as const;

// Type exports for const assertions
export type ApiEndpoint = keyof typeof API_ENDPOINTS;
export type Route = keyof typeof ROUTES;
export type FeatureFlag = keyof typeof FEATURE_FLAGS;
