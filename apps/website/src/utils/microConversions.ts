/**
 * Google Ads Micro-Conversions for Life Psychology Australia
 * Tracks lower-value engagement actions to optimize ad campaigns
 *
 * IMPORTANT: These fire once per session using sessionStorage
 * Main $250 booking conversion handled separately by Halaxy/GTM
 */

import { log } from './logger';
import { TRACKING_CONFIG } from '../config/constants';

// Google Ads configuration
const GOOGLE_ADS_ID = TRACKING_CONFIG.GOOGLE_ADS_ID;

// Micro-conversion labels and values
const MICRO_CONVERSIONS = {
  service_page: {
    label: 'HzXKCMGAw6UbEKvXgoor',
    value: 2,
    name: 'Service Page View',
  },
  about_page: {
    label: 'IvW6CPqnw6UbEKvXgoor',
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

type MicroConversionType = keyof typeof MICRO_CONVERSIONS;

/**
 * Check if a micro-conversion has already fired in this session
 */
const hasConverted = (conversionType: MicroConversionType): boolean => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }
  const key = `lpa_micro_${conversionType}`;
  return sessionStorage.getItem(key) === 'true';
};

/**
 * Mark a micro-conversion as fired for this session
 */
const markConverted = (conversionType: MicroConversionType): void => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }
  const key = `lpa_micro_${conversionType}`;
  sessionStorage.setItem(key, 'true');
  sessionStorage.setItem(`${key}_timestamp`, Date.now().toString());

  if (import.meta.env.DEV) {
    log.debug(`Marked ${conversionType} as converted`, 'MicroConversion', {
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Generic function to fire a micro-conversion
 */
const fireMicroConversion = (
  conversionType: MicroConversionType,
  additionalParams?: Record<string, unknown>
): void => {
  // Check if already fired in this session
  if (hasConverted(conversionType)) {
    log.debug(
      `${MICRO_CONVERSIONS[conversionType].name} already fired in this session, skipping`,
      'MicroConversion'
    );
    return;
  }

  // Check if gtag is available
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    log.error(
      `gtag not available, cannot fire ${conversionType}`,
      'MicroConversion',
      {
        gtag_type: typeof window?.gtag,
        dataLayer_type: typeof window?.dataLayer,
      }
    );
    return;
  }

  try {
    const conversion = MICRO_CONVERSIONS[conversionType];
    const send_to = `${GOOGLE_ADS_ID}/${conversion.label}`;

    log.debug(
      `Firing ${conversion.name} ($${conversion.value} AUD)`,
      'MicroConversion',
      { send_to, additionalParams }
    );

    window.gtag('event', 'conversion', {
      send_to: send_to,
      value: conversion.value,
      currency: 'AUD',
      transaction_id: `micro_${conversionType}_${Date.now()}`,
      ...additionalParams,
    });

    // Mark as converted
    markConverted(conversionType);

    log.info(`${conversion.name} fired successfully`, 'MicroConversion', {
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error(`Error firing ${conversionType}`, 'MicroConversion', error);
  }
};

/**
 * Fire Service Page View conversion ($2)
 * Call this on /services and /services/* pages
 */
export const fireServicePageConversion = (): void => {
  fireMicroConversion('service_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

/**
 * Fire About Zoe View conversion ($3)
 * Call this on /about page
 */
export const fireAboutPageConversion = (): void => {
  fireMicroConversion('about_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

/**
 * Fire Pricing View conversion ($5)
 * Call this on /pricing page
 */
export const firePricingPageConversion = (): void => {
  fireMicroConversion('pricing_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
};

/**
 * Fire High Intent Visitor conversion ($10)
 * Call this after user has been on site for 3 minutes
 */
export const fireHighIntentConversion = (): void => {
  fireMicroConversion('high_intent', {
    time_on_site: 180, // seconds
    page_path: window.location.pathname,
  });
};

/**
 * Initialize High Intent Visitor timer
 * Call this once when the app mounts (in App.tsx or main.tsx)
 */
export const initHighIntentTimer = (): void => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }

  // Check if timer already started or conversion already fired
  const timerStarted =
    sessionStorage.getItem('lpa_intent_timer_started') === 'true';
  const alreadyFired = hasConverted('high_intent');

  if (timerStarted || alreadyFired) {
    if (import.meta.env.DEV) {
      log.debug(
        'High Intent timer already started or fired, skipping',
        'MicroConversion'
      );
    }
    return;
  }

  // Mark timer as started
  sessionStorage.setItem('lpa_intent_timer_started', 'true');
  sessionStorage.setItem('lpa_intent_timer_start_time', Date.now().toString());

  if (import.meta.env.DEV) {
    log.debug('High Intent timer started (3 minutes)', 'MicroConversion');
  }

  // Set 3-minute timer
  setTimeout(() => {
    fireHighIntentConversion();
  }, 180000); // 180,000ms = 3 minutes
};

/**
 * Get micro-conversion statistics (for debugging)
 */
export const getMicroConversionStats = (): Record<string, unknown> => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return {};
  }

  const stats: Record<string, unknown> = {};
  Object.keys(MICRO_CONVERSIONS).forEach((key) => {
    const converted = hasConverted(key as MicroConversionType);
    const timestamp = sessionStorage.getItem(`lpa_micro_${key}_timestamp`);
    stats[key] = {
      fired: converted,
      timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : null,
    };
  });

  const timerStarted =
    sessionStorage.getItem('lpa_intent_timer_started') === 'true';
  const timerStartTime = sessionStorage.getItem('lpa_intent_timer_start_time');
  stats['high_intent_timer'] = {
    started: timerStarted,
    start_time: timerStartTime
      ? new Date(parseInt(timerStartTime)).toISOString()
      : null,
  };

  return stats;
};

/**
 * Clear all micro-conversion data (for testing)
 */
export const clearMicroConversions = (): void => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }

  Object.keys(MICRO_CONVERSIONS).forEach((key) => {
    sessionStorage.removeItem(`lpa_micro_${key}`);
    sessionStorage.removeItem(`lpa_micro_${key}_timestamp`);
  });
  sessionStorage.removeItem('lpa_intent_timer_started');
  sessionStorage.removeItem('lpa_intent_timer_start_time');

  log.debug('All micro-conversion data cleared', 'MicroConversion');
};

// Export for use in other files
export { MICRO_CONVERSIONS, hasConverted };
