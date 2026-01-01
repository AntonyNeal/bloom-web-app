/**
 * Event Tracking Library
 * High-level, reusable tracking functions for all analytics events
 *
 * This is the main API for tracking across the application.
 * All functions use trackingCore.ts primitives for consistency.
 *
 * Usage:
 *   import { trackBookNowClick, trackPageView } from './utils/trackingEvents';
 *   trackBookNowClick({ page_section: 'hero', button_location: 'cta' });
 */

import {
  fireGtagEvent,
  hasConverted,
  markConverted,
  isGtagAvailable,
} from './trackingCore';
import { log } from './logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const GOOGLE_ADS_ID = 'AW-11563740075';
export const GA4_MEASUREMENT_ID = 'G-XGGBRLPBKK';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BookNowClickParams {
  page_section: string;
  button_location: string;
  service_type?: string;
  value?: number;
}

export interface ContactFormParams {
  form_type: string;
  form_location: string;
  has_phone?: boolean;
  has_email?: boolean;
  value?: number;
}

export interface PageEngagementParams {
  page_type: string;
  engagement_time?: number;
  scroll_depth?: number;
  interactions?: number;
}

export interface PageViewParams {
  page_title?: string;
  page_location?: string;
  page_type?: string;
  [key: string]: unknown;
}

export interface MicroConversionConfig {
  label: string;
  value: number;
  name: string;
}

// ============================================================================
// MICRO-CONVERSION DEFINITIONS
// ============================================================================

export const MICRO_CONVERSIONS: Record<string, MicroConversionConfig> = {
  service_page: {
    label: 'HzXKCMGAw6UbEKvXgoor',
    value: 2,
    name: 'Service Page View',
  },
  about_page: {
    label: 'LrW6CBgmwElbEKvXgoor',
    value: 3,
    name: 'About Zoe View',
  },
  pricing_page: {
    label: 'ECh0CIzJv6UbEKvXgoor',
    value: 5,
    name: 'Pricing View',
  },
  high_intent: {
    label: 'ppNdCIyCwKUbEKvXgoor',
    value: 10,
    name: 'High Intent Visitor',
  },
} as const;

// Main booking conversion (not a micro-conversion)
export const BOOKING_CONVERSION = {
  label: 'FqhOCJgmqfDzEKvXgoor',
  value: 250,
  name: 'Booking Completed - Halaxy',
} as const;

export type MicroConversionType = keyof typeof MICRO_CONVERSIONS;

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

/**
 * Track Book Now button click
 * Fires GA4 event for analytics
 */
export const trackBookNowClick = (params: BookNowClickParams): boolean => {
  const success = fireGtagEvent('book_now_click', {
    event_category: 'conversion',
    event_label: 'book_now_button',
    value: params.value || 100,
    custom_parameter_1: params.page_section,
    custom_parameter_2: params.button_location,
    custom_parameter_3: params.service_type || 'general_psychology',
    page_path: window.location.pathname,
    page_title: document.title,
  });

  if (success) {
    log.debug('Book Now click tracked', 'TrackingEvents', params);
  }

  return success;
};



/**
 * Track contact form submission
 * Fires GA4 event for analytics
 */
export const trackContactFormSubmit = (params: ContactFormParams): boolean => {
  const success = fireGtagEvent('contact_form_submit', {
    event_category: 'conversion',
    event_label: 'contact_form',
    value: params.value || 75,
    form_type: params.form_type,
    form_location: params.form_location,
    has_phone: params.has_phone || false,
    has_email: params.has_email || false,
    page_path: window.location.pathname,
  });

  if (success) {
    log.debug('Contact form submit tracked', 'TrackingEvents', params);
  }

  return success;
};

/**
 * Track page engagement
 * Fires GA4 event for analytics
 */
export const trackPageEngagement = (params: PageEngagementParams): boolean => {
  const success = fireGtagEvent('page_engagement', {
    event_category: 'engagement',
    event_label: 'key_page_view',
    page_type: params.page_type,
    engagement_time: params.engagement_time,
    scroll_depth: params.scroll_depth,
    interactions: params.interactions,
    value: 25,
    page_path: window.location.pathname,
    page_title: document.title,
  });

  if (success) {
    log.debug('Page engagement tracked', 'TrackingEvents', params);
  }

  return success;
};

/**
 * Track page view
 * Fires GA4 page_view event
 */
export const trackPageView = (params?: PageViewParams): boolean => {
  const success = fireGtagEvent('page_view', {
    page_title: params?.page_title || document.title,
    page_location: params?.page_location || window.location.href,
    page_type: params?.page_type,
    ...params,
  });

  if (success) {
    log.debug('Page view tracked', 'TrackingEvents', params);
  }

  return success;
};

/**
 * Track scroll depth
 * Fires GA4 event for engagement tracking
 */
export const trackScrollDepth = (depth: number): boolean => {
  const success = fireGtagEvent('scroll_depth', {
    event_category: 'engagement',
    event_label: `scroll_${depth}%`,
    value: depth,
    scroll_depth: `${depth}%`,
    page_path: window.location.pathname,
  });

  if (success) {
    log.debug('Scroll depth tracked', 'TrackingEvents', { depth });
  }

  return success;
};

/**
 * Track time on page
 * Fires GA4 event for engagement tracking
 */
export const trackTimeOnPage = (seconds: number): boolean => {
  const success = fireGtagEvent('time_on_page', {
    event_category: 'engagement',
    event_label: 'page_time',
    value: seconds,
    time_on_page: seconds,
    page_path: window.location.pathname,
  });

  if (success) {
    log.debug('Time on page tracked', 'TrackingEvents', { seconds });
  }

  return success;
};

// ============================================================================
// MICRO-CONVERSIONS (Google Ads)
// ============================================================================

/**
 * Fire a Google Ads micro-conversion
 * These are small-value ($2-$10) conversions for ad optimization
 * Only fires once per session
 */
export const fireMicroConversion = (
  conversionType: MicroConversionType,
  additionalParams?: Record<string, unknown>
): boolean => {
  // Check if already fired
  if (hasConverted(conversionType)) {
    log.debug(
      `Micro-conversion ${conversionType} already fired, skipping`,
      'TrackingEvents'
    );
    return false;
  }

  if (!isGtagAvailable()) {
    log.warn(
      `Cannot fire micro-conversion ${conversionType}: gtag not available`,
      'TrackingEvents'
    );
    return false;
  }

  try {
    const conversion = MICRO_CONVERSIONS[conversionType];
    const send_to = `${GOOGLE_ADS_ID}/${conversion.label}`;

    log.debug(
      `Firing ${conversion.name} ($${conversion.value} AUD)`,
      'TrackingEvents',
      { send_to }
    );

    const success = fireGtagEvent('conversion', {
      send_to,
      value: conversion.value,
      currency: 'AUD',
      transaction_id: `micro_${conversionType}_${Date.now()}`,
      ...additionalParams,
    });

    if (success) {
      markConverted(conversionType);
      log.info(`${conversion.name} fired successfully`, 'TrackingEvents', {
        timestamp: new Date().toISOString(),
      });
    }

    return success;
  } catch (error) {
    log.error(
      `Error firing micro-conversion ${conversionType}`,
      'TrackingEvents',
      error
    );
    return false;
  }
};

/**
 * Fire Service Page View conversion ($2)
 */
export const fireServicePageConversion = (): boolean => {
  return fireMicroConversion('service_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

/**
 * Fire About Page View conversion ($3)
 */
export const fireAboutPageConversion = (): boolean => {
  return fireMicroConversion('about_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

/**
 * Fire Pricing Page View conversion ($5)
 */
export const firePricingPageConversion = (): boolean => {
  return fireMicroConversion('pricing_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

/**
 * Fire High Intent Visitor conversion ($10)
 * Called after 3 minutes on site
 */
export const fireHighIntentConversion = (): boolean => {
  return fireMicroConversion('high_intent', {
    time_on_site: 180,
    page_path: window.location.pathname,
  });
};

// ============================================================================
// GOOGLE ADS CONVERSION (Main $250 booking)
// ============================================================================

/**
 * Fire main Google Ads booking conversion
 * This is the $250 conversion for actual bookings
 * Label: "Booking Completed - Halaxy" in Google Ads
 */
export const fireBookingConversion = (
  value: number = 250,
  transactionId?: string,
  additionalParams?: Record<string, unknown>
): boolean => {
  const CONVERSION_LABEL = 'FqhOCJgmqfDzEKvXgoor'; // Booking Completed - Halaxy

  const success = fireGtagEvent('conversion', {
    send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
    value,
    currency: 'AUD',
    transaction_id: transactionId || `booking_${Date.now()}`,
    ...additionalParams,
  });

  if (success) {
    log.info('Booking conversion fired', 'TrackingEvents', { value, transactionId });
  } else {
    log.error('Booking conversion failed', 'TrackingEvents', { value });
  }

  return success;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a micro-conversion has already fired
 * Re-exported from trackingCore for convenience
 */
export { hasConverted, markConverted } from './trackingCore';

/**
 * Get all conversion stats for debugging
 */
export const getMicroConversionStats = (): Record<string, boolean> => {
  const stats: Record<string, boolean> = {};

  for (const conversionType of Object.keys(MICRO_CONVERSIONS)) {
    stats[conversionType] = hasConverted(conversionType);
  }

  return stats;
};
