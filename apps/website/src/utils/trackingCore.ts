/**
 * Core Tracking Primitives
 * Pure, reusable functions for all tracking systems
 *
 * These are the building blocks used by:
 * - trackingEvents.ts (high-level event tracking)
 * - UnifiedTracker.ts (orchestration layer)
 * - microConversions.ts (Google Ads micro-conversions)
 */

import { log } from './logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GtagCommand {
  command: 'event' | 'config' | 'get' | 'set' | 'js';
  args: unknown[];
}

export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

export interface GA4Session {
  client_id: string | null;
  session_id: string | null;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
}

// ============================================================================
// GTAG WRAPPER
// ============================================================================

/**
 * Check if gtag is available
 */
export const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Safe gtag wrapper with error handling
 * Pure function - no side effects beyond the gtag call
 */
export const callGtag = (command: string, ...args: unknown[]): boolean => {
  if (!isGtagAvailable()) {
    log.warn('gtag not available', 'TrackingCore', { command, args });
    return false;
  }

  try {
    window.gtag(command, ...args);
    return true;
  } catch (error) {
    log.error('gtag call failed', 'TrackingCore', { command, args, error });
    return false;
  }
};

/**
 * Fire a gtag event
 */
export const fireGtagEvent = (
  eventName: string,
  params?: Record<string, unknown>
): boolean => {
  return callGtag('event', eventName, params);
};

/**
 * Configure gtag
 */
export const configureGtag = (
  measurementId: string,
  config?: Record<string, unknown>
): boolean => {
  return callGtag('config', measurementId, config);
};

// ============================================================================
// DATALAYER UTILITIES
// ============================================================================

/**
 * Check if dataLayer is available
 */
export const isDataLayerAvailable = (): boolean => {
  return typeof window !== 'undefined' && Array.isArray(window.dataLayer);
};

/**
 * Initialize dataLayer if not exists
 */
export const ensureDataLayer = (): void => {
  if (typeof window === 'undefined') return;

  if (!window.dataLayer) {
    window.dataLayer = [];
  }
};

/**
 * Push event to dataLayer
 * Pure function for dataLayer operations
 */
export const pushToDataLayer = (event: DataLayerEvent): boolean => {
  ensureDataLayer();

  if (!isDataLayerAvailable()) {
    log.warn('dataLayer not available', 'TrackingCore', { event });
    return false;
  }

  try {
    window.dataLayer.push(event);
    return true;
  } catch (error) {
    log.error('dataLayer push failed', 'TrackingCore', { event, error });
    return false;
  }
};

// ============================================================================
// SESSION STORAGE UTILITIES
// ============================================================================

/**
 * Check if sessionStorage is available
 */
export const isSessionStorageAvailable = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
    );
  } catch {
    return false;
  }
};

/**
 * Check if a session flag is set
 */
export const hasSessionFlag = (key: string): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    return sessionStorage.getItem(key) === 'true';
  } catch (error) {
    log.warn('Failed to read session flag', 'TrackingCore', { key, error });
    return false;
  }
};

/**
 * Set a session flag
 */
export const setSessionFlag = (key: string, value = true): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    sessionStorage.setItem(key, value ? 'true' : 'false');
    return true;
  } catch (error) {
    log.error('Failed to set session flag', 'TrackingCore', { key, error });
    return false;
  }
};

/**
 * Get session data as string
 */
export const getSessionData = (key: string): string | null => {
  if (!isSessionStorageAvailable()) return null;

  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    log.warn('Failed to get session data', 'TrackingCore', { key, error });
    return null;
  }
};

/**
 * Set session data
 */
export const setSessionData = (key: string, value: string): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    log.error('Failed to set session data', 'TrackingCore', { key, error });
    return false;
  }
};

/**
 * Clear session data by key
 */
export const clearSessionData = (key: string): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    log.error('Failed to clear session data', 'TrackingCore', { key, error });
    return false;
  }
};

// ============================================================================
// CONVERSION TRACKING HELPERS
// ============================================================================

/**
 * Check if a conversion has fired in this session
 */
export const hasConverted = (conversionType: string): boolean => {
  return hasSessionFlag(`lpa_micro_${conversionType}`);
};

/**
 * Mark a conversion as fired
 */
export const markConverted = (conversionType: string): boolean => {
  const key = `lpa_micro_${conversionType}`;
  const success = setSessionFlag(key, true);

  if (success) {
    setSessionData(`${key}_timestamp`, Date.now().toString());
  }

  return success;
};

/**
 * Get conversion timestamp
 */
export const getConversionTimestamp = (
  conversionType: string
): number | null => {
  const key = `lpa_micro_${conversionType}_timestamp`;
  const timestamp = getSessionData(key);
  return timestamp ? parseInt(timestamp, 10) : null;
};

// ============================================================================
// GA4 SESSION EXTRACTION
// ============================================================================

/**
 * Extract GA4 client_id from _ga cookie
 * Format: GA1.1.XXXXXX.XXXXXX where last two parts are client_id
 */
export const extractClientIdFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;

  try {
    const gaCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('_ga='));

    if (!gaCookie) {
      log.debug('_ga cookie not found', 'TrackingCore');
      return null;
    }

    const cookieValue = gaCookie.split('=')[1];
    const parts = cookieValue.split('.');

    if (parts.length >= 4) {
      return parts.slice(2).join('.');
    }

    log.warn('Invalid _ga cookie format', 'TrackingCore', { cookieValue });
    return null;
  } catch (error) {
    log.error('Error extracting client_id from cookie', 'TrackingCore', error);
    return null;
  }
};

/**
 * Get GA4 session_id using gtag
 */
export const getSessionId = (
  measurementId: string,
  timeout = 1000
): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!isGtagAvailable()) {
      log.debug('gtag not available for session_id', 'TrackingCore');
      resolve(null);
      return;
    }

    try {
      window.gtag('get', measurementId, 'session_id', (sessionId: string) => {
        resolve(sessionId || null);
      });

      // Timeout fallback
      setTimeout(() => {
        resolve(null);
      }, timeout);
    } catch (error) {
      log.error('Error getting session_id', 'TrackingCore', error);
      resolve(null);
    }
  });
};

/**
 * Get complete GA4 session information
 */
export const getGA4Session = async (
  measurementId: string
): Promise<GA4Session> => {
  const [client_id, session_id] = await Promise.all([
    Promise.resolve(extractClientIdFromCookie()),
    getSessionId(measurementId),
  ]);

  return { client_id, session_id };
};

// ============================================================================
// UTM PARAMETER EXTRACTION
// ============================================================================

/**
 * Extract UTM parameters from URL
 */
export const extractUtmParameters = (url?: string): UTMParameters => {
  if (typeof window === 'undefined') return {};

  const targetUrl = url || window.location.search;
  const urlParams = new URLSearchParams(targetUrl);
  const utmParams: UTMParameters = {};

  // Extract all UTM parameters
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmContent = urlParams.get('utm_content');
  const utmTerm = urlParams.get('utm_term');
  const gclid = urlParams.get('gclid');

  if (utmSource) utmParams.utm_source = utmSource;
  if (utmMedium) utmParams.utm_medium = utmMedium;
  if (utmCampaign) utmParams.utm_campaign = utmCampaign;
  if (utmContent) utmParams.utm_content = utmContent;
  if (utmTerm) utmParams.utm_term = utmTerm;
  if (gclid) utmParams.gclid = gclid;

  return utmParams;
};

/**
 * Store UTM parameters in sessionStorage
 */
export const storeUtmParameters = (utmParams: UTMParameters): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    sessionStorage.setItem('lpa_utm_params', JSON.stringify(utmParams));
    sessionStorage.setItem('lpa_utm_timestamp', Date.now().toString());
    return true;
  } catch (error) {
    log.error('Failed to store UTM parameters', 'TrackingCore', error);
    return false;
  }
};

/**
 * Retrieve stored UTM parameters
 */
export const getStoredUtmParameters = (): UTMParameters | null => {
  if (!isSessionStorageAvailable()) return null;

  try {
    const stored = sessionStorage.getItem('lpa_utm_params');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    log.warn('Failed to retrieve UTM parameters', 'TrackingCore', error);
    return null;
  }
};

// ============================================================================
// GCLID UTILITIES
// ============================================================================

/**
 * Extract GCLID from URL or sessionStorage
 */
export const getGCLID = (): string | null => {
  // First check URL
  const urlParams = new URLSearchParams(window.location.search);
  const gclidFromUrl = urlParams.get('gclid');

  if (gclidFromUrl) {
    return gclidFromUrl;
  }

  // Check sessionStorage
  const utmParams = getStoredUtmParameters();
  return utmParams?.gclid || null;
};

/**
 * Store GCLID with metadata
 */
export const storeGCLID = (gclid: string): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    const gclidData = {
      gclid,
      timestamp: Date.now(),
      url: window.location.href,
    };

    sessionStorage.setItem('lpa_gclid', JSON.stringify(gclidData));
    return true;
  } catch (error) {
    log.error('Failed to store GCLID', 'TrackingCore', error);
    return false;
  }
};

/**
 * Retrieve stored GCLID with metadata
 */
export const getStoredGCLID = (): {
  gclid: string;
  timestamp: number;
  url: string;
} | null => {
  if (!isSessionStorageAvailable()) return null;

  try {
    const stored = sessionStorage.getItem('lpa_gclid');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    log.warn('Failed to retrieve GCLID', 'TrackingCore', error);
    return null;
  }
};

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detect current environment
 */
export const detectEnvironment = ():
  | 'development'
  | 'staging'
  | 'production' => {
  if (typeof window === 'undefined') return 'production';

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }

  if (
    hostname.includes('azurestaticapps.net') ||
    hostname.includes('red-desert')
  ) {
    return 'staging';
  }

  return 'production';
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return detectEnvironment() === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return detectEnvironment() === 'development';
};
