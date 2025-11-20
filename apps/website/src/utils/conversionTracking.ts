/**
 * Conversion Tracking Utility for Life Psychology Australia
 * Handles all conversion tracking including Google Ads, GA4, and Microsoft Clarity
 */

import { STORAGE_KEYS } from '../config/constants';

// TypeScript interfaces
export interface BookingData {
  timestamp: number;
  gclid?: string;
  sessionId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  bookingValue: number;
  currency: string;
}

export interface ConversionResult {
  success: boolean;
  eventType: string;
  error?: string;
}

// Constants
const DEFAULT_BOOKING_VALUE = 250; // $250 AUD

/**
 * Store GCLID from URL to localStorage for later conversion tracking
 * Call this before redirecting to Halaxy
 */
export function captureGCLID(): void {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const gclid = urlParams.get('gclid');

    if (gclid) {
      const gclidData = {
        gclid,
        timestamp: Date.now(),
        url: window.location.href,
      };
      localStorage.setItem(STORAGE_KEYS.GCLID, JSON.stringify(gclidData));
      console.log('[ConversionTracking] GCLID captured:', gclid);
    }
  } catch (error) {
    console.error('[ConversionTracking] Error capturing GCLID:', error);
  }
}

/**
 * Get stored GCLID if it exists and is recent (within 90 days)
 */
export function getStoredGCLID(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GCLID);
    if (!stored) return null;

    const gclidData = JSON.parse(stored);
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    if (gclidData.timestamp > ninetyDaysAgo) {
      console.log(
        '[ConversionTracking] Retrieved stored GCLID:',
        gclidData.gclid
      );
      return gclidData.gclid;
    } else {
      console.log('[ConversionTracking] Stored GCLID expired');
      localStorage.removeItem(STORAGE_KEYS.GCLID);
      return null;
    }
  } catch (error) {
    console.error('[ConversionTracking] Error retrieving GCLID:', error);
    return null;
  }
}

/**
 * Store booking intent before redirecting to Halaxy
 * This helps with offline conversion matching
 */
export function storeBookingIntent(data: Partial<BookingData> = {}): void {
  try {
    const bookingIntent: BookingData = {
      timestamp: Date.now(),
      gclid: getStoredGCLID() || undefined,
      bookingValue: DEFAULT_BOOKING_VALUE,
      currency: 'AUD',
      ...data,
    };

    localStorage.setItem(BOOKING_INTENT_KEY, JSON.stringify(bookingIntent));
    console.log('[ConversionTracking] Booking intent stored:', bookingIntent);
  } catch (error) {
    console.error('[ConversionTracking] Error storing booking intent:', error);
  }
}

/**
 * Get stored booking intent
 */
export function getBookingIntent(): BookingData | null {
  try {
    const stored = localStorage.getItem(BOOKING_INTENT_KEY);
    if (!stored) return null;

    const intent = JSON.parse(stored);
    console.log('[ConversionTracking] Retrieved booking intent:', intent);
    return intent;
  } catch (error) {
    console.error(
      '[ConversionTracking] Error retrieving booking intent:',
      error
    );
    return null;
  }
}

/**
 * Fire Google Ads conversion
 */
export function fireGoogleAdsConversion(
  value: number = DEFAULT_BOOKING_VALUE
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    try {
      console.log('[ConversionTracking] 🎯 Firing Google Ads conversion...');
      console.log(
        `[ConversionTracking] Conversion ID: ${GOOGLE_ADS_CONVERSION_ID}`
      );
      console.log(`[ConversionTracking] Label: ${GOOGLE_ADS_CONVERSION_LABEL}`);
      console.log(`[ConversionTracking] Value: $${value} AUD`);

      if (typeof window.gtag !== 'function') {
        console.warn('[ConversionTracking] ⚠️ gtag not available');
        resolve({
          success: false,
          eventType: 'google_ads_conversion',
          error: 'gtag not loaded',
        });
        return;
      }

      // Fire the conversion
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
        value: value,
        currency: 'AUD',
        transaction_id: `booking_${Date.now()}`,
      });

      console.log(
        '[ConversionTracking] ✅ Google Ads conversion fired successfully'
      );
      resolve({
        success: true,
        eventType: 'google_ads_conversion',
      });
    } catch (error) {
      console.error(
        '[ConversionTracking] ❌ Error firing Google Ads conversion:',
        error
      );
      resolve({
        success: false,
        eventType: 'google_ads_conversion',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

/**
 * Fire GA4 purchase event (e-commerce standard)
 */
export function fireGA4PurchaseEvent(
  value: number = DEFAULT_BOOKING_VALUE
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    try {
      console.log('[ConversionTracking] 🛒 Firing GA4 purchase event...');

      if (typeof window.gtag !== 'function') {
        console.warn('[ConversionTracking] ⚠️ gtag not available for GA4');
        resolve({
          success: false,
          eventType: 'ga4_purchase',
          error: 'gtag not loaded',
        });
        return;
      }

      const transactionId = `booking_${Date.now()}`;

      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'AUD',
        items: [
          {
            item_id: 'psychology_session',
            item_name: 'Psychology Session',
            item_category: 'Service',
            price: value,
            quantity: 1,
          },
        ],
      });

      console.log(
        '[ConversionTracking] ✅ GA4 purchase event fired:',
        transactionId
      );
      resolve({
        success: true,
        eventType: 'ga4_purchase',
      });
    } catch (error) {
      console.error(
        '[ConversionTracking] ❌ Error firing GA4 purchase event:',
        error
      );
      resolve({
        success: false,
        eventType: 'ga4_purchase',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

/**
 * Fire custom GA4 booking_completed event
 */
export function fireGA4BookingCompletedEvent(): Promise<ConversionResult> {
  return new Promise((resolve) => {
    try {
      console.log(
        '[ConversionTracking] 📋 Firing GA4 booking_completed event...'
      );

      if (typeof window.gtag !== 'function') {
        console.warn(
          '[ConversionTracking] ⚠️ gtag not available for custom event'
        );
        resolve({
          success: false,
          eventType: 'ga4_booking_completed',
          error: 'gtag not loaded',
        });
        return;
      }

      window.gtag('event', 'booking_completed', {
        event_category: 'Booking',
        event_label: 'Halaxy Booking Completed',
        value: DEFAULT_BOOKING_VALUE,
        currency: 'AUD',
      });

      console.log('[ConversionTracking] ✅ GA4 booking_completed event fired');
      resolve({
        success: true,
        eventType: 'ga4_booking_completed',
      });
    } catch (error) {
      console.error(
        '[ConversionTracking] ❌ Error firing booking_completed event:',
        error
      );
      resolve({
        success: false,
        eventType: 'ga4_booking_completed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

/**
 * Fire Microsoft Clarity custom event
 */
export function fireClarityEvent(): Promise<ConversionResult> {
  return new Promise((resolve) => {
    try {
      console.log('[ConversionTracking] 👁️ Firing Microsoft Clarity event...');

      if (typeof window.clarity !== 'function') {
        console.warn('[ConversionTracking] ⚠️ Microsoft Clarity not available');
        resolve({
          success: false,
          eventType: 'clarity',
          error: 'clarity not loaded',
        });
        return;
      }

      window.clarity('event', 'booking_completed');

      console.log('[ConversionTracking] ✅ Microsoft Clarity event fired');
      resolve({
        success: true,
        eventType: 'clarity',
      });
    } catch (error) {
      console.error(
        '[ConversionTracking] ❌ Error firing Clarity event:',
        error
      );
      resolve({
        success: false,
        eventType: 'clarity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

/**
 * Store conversion data to localStorage for backup/analysis
 */
export function storeConversionData(data: Partial<BookingData> = {}): void {
  try {
    const conversionData: BookingData = {
      timestamp: Date.now(),
      gclid: getStoredGCLID() || undefined,
      bookingValue: DEFAULT_BOOKING_VALUE,
      currency: 'AUD',
      ...data,
    };

    const storageKey = `lpa_conversion_${conversionData.timestamp}`;
    localStorage.setItem(storageKey, JSON.stringify(conversionData));
    console.log('[ConversionTracking] 💾 Conversion data stored:', storageKey);
  } catch (error) {
    console.error('[ConversionTracking] Error storing conversion data:', error);
  }
}

/**
 * Fire all conversion tracking events in sequence
 * This is the main function to call on the booking success page
 */
export async function fireAllConversionEvents(
  value: number = DEFAULT_BOOKING_VALUE
): Promise<ConversionResult[]> {
  console.log(
    '[ConversionTracking] 🚀 Starting complete conversion tracking sequence...'
  );
  console.log('[ConversionTracking] Booking value: $' + value + ' AUD');

  const results: ConversionResult[] = [];

  // 1. Fire Google Ads conversion (highest priority)
  const googleAdsResult = await fireGoogleAdsConversion(value);
  results.push(googleAdsResult);

  // 2. Fire GA4 purchase event
  const ga4PurchaseResult = await fireGA4PurchaseEvent(value);
  results.push(ga4PurchaseResult);

  // 3. Fire GA4 custom booking_completed event
  const ga4BookingResult = await fireGA4BookingCompletedEvent();
  results.push(ga4BookingResult);

  // 4. Fire Microsoft Clarity event
  const clarityResult = await fireClarityEvent();
  results.push(clarityResult);

  // 5. Store conversion data locally
  storeConversionData({ bookingValue: value });

  // Clear booking intent since conversion is complete
  localStorage.removeItem(BOOKING_INTENT_KEY);

  console.log('[ConversionTracking] 🎉 Conversion tracking sequence complete!');
  console.log('[ConversionTracking] Results:', results);

  return results;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}
