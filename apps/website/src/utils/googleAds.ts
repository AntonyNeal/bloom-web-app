// Google Ads Conversion & Remarketing Tag

// Type definitions for Google Ads/Google Tag Manager for accuracy.
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

import { getEnvVar } from './env';

// Note: we intentionally read Google Ads IDs at runtime using getEnvVar()
// so runtime-injected configs (public/runtime-config.json or window globals)
// are respected instead of only build-time import.meta.env values.

function readRuntimeFirst(key: string): string {
  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown> & {
      __ENV_VARS__?: Record<string, unknown>;
    };
    const envObj = w.__ENV_VARS__;
    if (
      envObj &&
      envObj[key] !== undefined &&
      envObj[key] !== null &&
      envObj[key] !== ''
    ) {
      const v = envObj[key];
      if (
        typeof v === 'string' &&
        v.startsWith('__RUNTIME_') &&
        v.endsWith('__')
      ) {
        // ignore placeholder
      } else {
        return String(v);
      }
    }

    const globalVal = w[key];
    if (
      globalVal !== undefined &&
      globalVal !== null &&
      globalVal !== '' &&
      typeof globalVal === 'string' &&
      !(globalVal as string).startsWith('__RUNTIME_')
    ) {
      return String(globalVal);
    }
  }

  return getEnvVar(key, '');
}

function getGoogleAdsId() {
  return readRuntimeFirst('VITE_GOOGLE_ADS_ID');
}

function getConversionLabel() {
  return readRuntimeFirst('VITE_GOOGLE_ADS_CONVERSION_LABEL');
}

export function injectGoogleAdsTag() {
  if (typeof window === 'undefined') return;
  // If gtag has already been defined on the page (e.g. by index.html), don't re-inject
  if (typeof (window as unknown as { gtag?: unknown }).gtag === 'function') {
    console.log('[GoogleAds] window.gtag already present - skipping injection');
    return;
  }
  if (document.getElementById('google-ads-tag')) return;
  const GOOGLE_ADS_ID = getGoogleAdsId();
  if (!GOOGLE_ADS_ID) {
    console.warn('[GoogleAds] Google Ads ID not configured');
    return;
  }
  try {
    const script = document.createElement('script');
    script.id = 'google-ads-tag';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      // Push the arguments as a single array element so the dataLayer
      // receives the full gtag command (e.g. ['config', 'AW-...']) instead
      // of spreading strings into individual characters.
      try {
        window.dataLayer.push(args);
      } catch {
        // Fallback: if push fails for some reason, try pushing each arg as a single entry
        // (this is not ideal but keeps the site from crashing).
        try {
          window.dataLayer.push(args as unknown as Record<string, unknown>);
        } catch {
          console.error('[GoogleAds] Failed to push to dataLayer');
        }
      }
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GOOGLE_ADS_ID);
  } catch (err) {
    console.error('[GoogleAds] Failed to inject global site tag:', err);
  }
}

export function trackHalaxyConversion(data: {
  value: number;
  psychologist?: string;
  service?: string;
  conversion_label?: string;
}) {
  const GOOGLE_ADS_ID = getGoogleAdsId();
  const CONVERSION_LABEL = getConversionLabel();
  if (!GOOGLE_ADS_ID || !CONVERSION_LABEL) {
    console.warn(
      '[GoogleAds] Google Ads ID or Conversion Label not configured'
    );
    return;
  }
  // Only send real events in production mode
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    import.meta.env.MODE !== 'production'
  ) {
    return;
  }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${data.conversion_label || CONVERSION_LABEL}`,
        value: data.value,
        currency: 'AUD',
        custom_parameters: {
          psychologist: data.psychologist,
          service: data.service,
        },
      });
      console.log('Halaxy conversion tracked');
    }
  } catch (err) {
    console.error('[GoogleAds] Failed to track Halaxy conversion:', err);
  }
}

/**
 * Track Halaxy booking conversion with specific parameters (value: 250, currency: AUD)
 * This is the standardized tracking function for all Halaxy booking links
 */
export function trackHalaxyBookingConversion() {
  const GOOGLE_ADS_ID = getGoogleAdsId();
  const CONVERSION_LABEL = getConversionLabel();

  if (!GOOGLE_ADS_ID || !CONVERSION_LABEL) {
    console.warn(
      '[GoogleAds] Google Ads ID or Conversion Label not configured for booking tracking'
    );
    return;
  }

  // Only send real events in production mode
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    import.meta.env.MODE !== 'production'
  ) {
    return;
  }

  // NOTE: Deprecated: previously this helper sent a hard-coded A$250 conversion
  // directly from the page. That caused duplicate conversions when analytics also
  // sent a conversion. We intentionally make this a NO-OP so conversions are
  // handled centrally using the dataLayer events pushed by the site.
  // Keep the exported function to avoid breaking any callers.
  console.warn(
    '[GoogleAds] trackHalaxyBookingConversion() is deprecated and will not send a conversion. Use dataLayer-driven tracking (book_now / halaxy_booking) and configure analytics to send conversions.'
  );
  return;
}

/**
 * Track a GA4 event (friendly wrapper). This will attempt to call gtag if available
 * and will always push an event object to dataLayer so GA4 can pick it up.
 */
export function trackGA4Event(
  eventName: string,
  params: Record<string, unknown> = {}
) {
  const GA_ID = getEnvVar('VITE_GA_MEASUREMENT_ID', '');

  if (!GA_ID) {
    console.warn(
      '[GoogleAds] GA Measurement ID not configured - GA4 event skipped'
    );
    // Still push to dataLayer so GTM can pick it up if configured
  }

  // Only send real events in production mode
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    import.meta.env.MODE !== 'production'
  ) {
    // push to dataLayer even in non-prod so preview/debugging can see it
    try {
      (window as unknown as { dataLayer?: unknown[] }).dataLayer =
        (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
      (window as unknown as { dataLayer?: unknown[] }).dataLayer!.push({
        event: eventName,
        ...params,
      });
    } catch {
      // ignore
    }
    return;
  }

  try {
    // Ensure dataLayer exists and push a friendly event object for GTM
    (window as unknown as { dataLayer?: unknown[] }).dataLayer =
      (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
    (window as unknown as { dataLayer?: unknown[] }).dataLayer!.push({
      event: eventName,
      ...params,
    });

    // If gtag is available, send the event directly to GA4 as well
    if (typeof (window as unknown as { gtag?: unknown }).gtag === 'function') {
      try {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
          'event',
          eventName,
          params
        );
      } catch (err) {
        console.warn('[GoogleAds] gtag call for GA4 event failed', err);
      }
    }

    console.log('[GoogleAds] GA4 event pushed', eventName, params);
  } catch (err) {
    console.error('[GoogleAds] Failed to push GA4 event to dataLayer:', err);
  }
}

export function trackEnhancedConversion(data: {
  email_hash?: string;
  phone_hash?: string;
  postcode?: string;
}) {
  const GOOGLE_ADS_ID = getGoogleAdsId();
  if (!GOOGLE_ADS_ID) {
    console.warn('[GoogleAds] Google Ads ID not configured');
    return;
  }
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    import.meta.env.MODE !== 'production'
  ) {
    return;
  }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/enhanced`,
        custom_parameters: {
          email_hash: data.email_hash,
          phone_hash: data.phone_hash,
          postcode: data.postcode,
        },
      });
    }
  } catch (err) {
    console.error('[GoogleAds] Failed to track enhanced conversion:', err);
  }
}

export function trackBookingConversion(value: number = 300) {
  const GOOGLE_ADS_ID = getGoogleAdsId();
  const CONVERSION_LABEL = getConversionLabel();
  if (!GOOGLE_ADS_ID || !CONVERSION_LABEL) {
    console.warn(
      '[GoogleAds] Google Ads ID or Conversion Label not configured'
    );
    return;
  }
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    import.meta.env.MODE !== 'production'
  ) {
    return;
  }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${CONVERSION_LABEL}`,
        value: value,
        currency: 'AUD',
      });
    }
  } catch (err) {
    console.error('[GoogleAds] Failed to track booking conversion:', err);
  }
}

export function trackRemarketingTag(audience?: string) {
  const GOOGLE_ADS_ID = getGoogleAdsId();
  if (!GOOGLE_ADS_ID) {
    console.warn('[GoogleAds] Google Ads ID not configured');
    return;
  }
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    import.meta.env.MODE !== 'production'
  ) {
    return;
  }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'remarketing', {
        send_to: GOOGLE_ADS_ID,
        custom_parameters: {
          audience: audience,
        },
      });
    }
  } catch (err) {
    console.error('[GoogleAds] Failed to track remarketing event:', err);
  }
}
