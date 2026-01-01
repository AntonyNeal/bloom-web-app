'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

// Google Analytics and Ads configuration
const GA4_MEASUREMENT_ID = 'G-QZ3CJMXV5P';
const GOOGLE_ADS_ID = 'AW-16753733973';

// AnalyticsProvider defers loading until after the page is fully interactive
// This prevents analytics from blocking LCP and TBT
export function AnalyticsProvider() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Wait for page to be fully loaded and idle before loading analytics
    const loadAnalytics = () => setShouldLoad(true);

    if (typeof window !== 'undefined') {
      // Use requestIdleCallback if available, otherwise use a longer timeout
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
          .requestIdleCallback(loadAnalytics, { timeout: 4000 });
      } else {
        // Fallback: wait 3 seconds after load
        setTimeout(loadAnalytics, 3000);
      }
    }
  }, []);

  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 - load after page is interactive */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}');
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}

// Tracking utilities
export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
}

export function trackServicePage() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'service_page_viewed', {
      event_category: 'Service',
    });
  }
}

export function trackBookingClick(location: string, serviceType?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_cta_click', {
      event_category: 'Booking',
      event_label: location,
      service_type: serviceType,
    });
  }
}

export function trackContactFormSubmit(formData: {
  form_type: string;
  form_location: string;
  has_phone?: boolean;
  has_email?: boolean;
}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'contact_form_submit', formData);
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
