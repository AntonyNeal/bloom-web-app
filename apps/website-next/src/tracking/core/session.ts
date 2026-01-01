/**
 * Session Management for Conversion Tracking
 * 
 * Handles GA4 session data, GCLID capture, and UTM parameters.
 */

import type { UTMParams } from '../types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  GCLID: 'lpa_gclid',
  UTM_PARAMS: 'lpa_utm_params',
  SESSION_START: 'lpa_session_start',
  INTENT_SCORE: 'lpa_intent_score',
  BOOKING_FLOW: 'lpa_booking_flow',
  PAGES_VIEWED: 'lpa_pages_viewed',
  CONVERSIONS_FIRED: 'lpa_conversions_fired',
} as const;

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Safe sessionStorage get
 */
function getSessionItem(key: string): string | null {
  if (!isSessionStorageAvailable()) return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe sessionStorage set
 */
function setSessionItem(key: string, value: string): boolean {
  if (!isSessionStorageAvailable()) return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe localStorage get
 */
function getLocalItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe localStorage set
 */
function setLocalItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// GCLID MANAGEMENT
// ============================================================================

interface GCLIDData {
  gclid: string;
  timestamp: number;
  url: string;
}

/**
 * Capture GCLID from URL and store it
 * GCLIDs are valid for 90 days
 */
export function captureGCLID(): string | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');

  if (gclid) {
    const gclidData: GCLIDData = {
      gclid,
      timestamp: Date.now(),
      url: window.location.href,
    };
    setLocalItem(STORAGE_KEYS.GCLID, JSON.stringify(gclidData));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] GCLID captured:', gclid);
    }
    
    return gclid;
  }

  return null;
}

/**
 * Get stored GCLID if valid (within 90 days)
 */
export function getStoredGCLID(): string | null {
  const stored = getLocalItem(STORAGE_KEYS.GCLID);
  if (!stored) return null;

  try {
    const gclidData: GCLIDData = JSON.parse(stored);
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    
    if (Date.now() - gclidData.timestamp < ninetyDaysMs) {
      return gclidData.gclid;
    } else {
      // Expired, remove it
      localStorage.removeItem(STORAGE_KEYS.GCLID);
      return null;
    }
  } catch {
    return null;
  }
}

// ============================================================================
// UTM PARAMETER MANAGEMENT
// ============================================================================

/**
 * Extract UTM parameters from current URL
 */
export function extractUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UTMParams = {};

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
}

/**
 * Store UTM parameters for the session
 */
export function storeUTMParams(params?: UTMParams): void {
  const utmParams = params || extractUTMParams();
  
  if (Object.keys(utmParams).length > 0) {
    setSessionItem(STORAGE_KEYS.UTM_PARAMS, JSON.stringify(utmParams));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] UTM params stored:', utmParams);
    }
  }
}

/**
 * Get stored UTM parameters
 */
export function getStoredUTMParams(): UTMParams | null {
  const stored = getSessionItem(STORAGE_KEYS.UTM_PARAMS);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// ============================================================================
// GA4 SESSION DATA
// ============================================================================

/**
 * Extract GA4 client_id from _ga cookie
 * Cookie format: GA1.1.XXXXXX.XXXXXX (last two parts are client_id)
 */
export function extractGA4ClientId(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const gaCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('_ga='));

    if (!gaCookie) return null;

    const cookieValue = gaCookie.split('=')[1];
    const parts = cookieValue.split('.');

    if (parts.length >= 4) {
      return parts.slice(2).join('.');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get GA4 session_id using gtag API
 */
export function getGA4SessionId(measurementId: string = 'G-XGGBRLPBKK'): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      resolve(null);
      return;
    }

    try {
      window.gtag('get', measurementId, 'session_id', (sessionId: string) => {
        resolve(sessionId || null);
      });

      // Timeout fallback
      setTimeout(() => resolve(null), 1000);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Get complete GA4 session information
 */
export async function getGA4Session(): Promise<{ clientId: string | null; sessionId: string | null }> {
  const [clientId, sessionId] = await Promise.all([
    Promise.resolve(extractGA4ClientId()),
    getGA4SessionId(),
  ]);

  return { clientId, sessionId };
}

// ============================================================================
// INTENT SCORING
// ============================================================================

interface IntentScoreData {
  score: number;
  pagesViewed: string[];
  servicesViewed: string[];
  timeOnSite: number;
  lastUpdated: number;
}

/**
 * Get current intent score data
 */
export function getIntentScoreData(): IntentScoreData {
  const stored = getSessionItem(STORAGE_KEYS.INTENT_SCORE);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to default
    }
  }

  return {
    score: 0,
    pagesViewed: [],
    servicesViewed: [],
    timeOnSite: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Update intent score
 */
export function updateIntentScore(points: number, reason?: string): number {
  const data = getIntentScoreData();
  data.score = Math.min(100, data.score + points);
  data.lastUpdated = Date.now();
  
  setSessionItem(STORAGE_KEYS.INTENT_SCORE, JSON.stringify(data));
  
  if (process.env.NODE_ENV === 'development' && reason) {
    console.log(`[Intent] +${points} (${reason}) = ${data.score}`);
  }
  
  return data.score;
}

/**
 * Record page view for intent scoring
 */
export function recordPageView(path: string): number {
  const data = getIntentScoreData();
  
  if (!data.pagesViewed.includes(path)) {
    data.pagesViewed.push(path);
    data.score = Math.min(100, data.score + 5);
  }
  
  setSessionItem(STORAGE_KEYS.INTENT_SCORE, JSON.stringify(data));
  return data.score;
}

/**
 * Record service interest for intent scoring
 */
export function recordServiceInterest(service: string): number {
  const data = getIntentScoreData();
  
  if (!data.servicesViewed.includes(service)) {
    data.servicesViewed.push(service);
    // High-value services get more points
    const points = ['anxiety', 'depression', 'trauma', 'ndis'].includes(service.toLowerCase()) ? 20 : 10;
    data.score = Math.min(100, data.score + points);
  }
  
  setSessionItem(STORAGE_KEYS.INTENT_SCORE, JSON.stringify(data));
  return data.score;
}

/**
 * Get current intent score
 */
export function getIntentScore(): number {
  return getIntentScoreData().score;
}

// ============================================================================
// CONVERSION DEDUPLICATION
// ============================================================================

/**
 * Check if a conversion has already been fired this session
 */
export function hasConversionFired(conversionType: string): boolean {
  const stored = getSessionItem(STORAGE_KEYS.CONVERSIONS_FIRED);
  if (!stored) return false;

  try {
    const conversions: string[] = JSON.parse(stored);
    return conversions.includes(conversionType);
  } catch {
    return false;
  }
}

/**
 * Mark a conversion as fired
 */
export function markConversionFired(conversionType: string): void {
  const stored = getSessionItem(STORAGE_KEYS.CONVERSIONS_FIRED);
  let conversions: string[] = [];

  if (stored) {
    try {
      conversions = JSON.parse(stored);
    } catch {
      // Ignore parse errors
    }
  }

  if (!conversions.includes(conversionType)) {
    conversions.push(conversionType);
    setSessionItem(STORAGE_KEYS.CONVERSIONS_FIRED, JSON.stringify(conversions));
  }
}

// ============================================================================
// SESSION INITIALIZATION
// ============================================================================

/**
 * Initialize session tracking
 * Call this on app startup
 */
export function initializeSession(): void {
  // Capture GCLID if present
  captureGCLID();
  
  // Store UTM parameters
  storeUTMParams();
  
  // Record session start if not already set
  if (!getSessionItem(STORAGE_KEYS.SESSION_START)) {
    setSessionItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Session] Initialized', {
      gclid: getStoredGCLID(),
      utmParams: getStoredUTMParams(),
      intentScore: getIntentScore(),
    });
  }
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(): number {
  const startTime = getSessionItem(STORAGE_KEYS.SESSION_START);
  if (!startTime) return 0;
  
  return Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
}
