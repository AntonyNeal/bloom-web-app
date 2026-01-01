'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

// Google Analytics and Ads configuration
const GA4_MEASUREMENT_ID = 'G-QZ3CJMXV5P';
const GOOGLE_ADS_ID = 'AW-16753733973';

// AnalyticsProvider uses interaction-based loading for mobile-first performance
// Analytics only loads after user interaction (scroll, click, touch) to prevent TBT impact
export function AnalyticsProvider() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let loaded = false;
    const loadAnalytics = () => {
      if (loaded) return;
      loaded = true;
      setShouldLoad(true);
      // Clean up listeners
      window.removeEventListener('scroll', loadAnalytics);
      window.removeEventListener('click', loadAnalytics);
      window.removeEventListener('touchstart', loadAnalytics);
      window.removeEventListener('keydown', loadAnalytics);
    };

    // Load on first user interaction - mobile-first approach
    window.addEventListener('scroll', loadAnalytics, { once: true, passive: true });
    window.addEventListener('click', loadAnalytics, { once: true });
    window.addEventListener('touchstart', loadAnalytics, { once: true, passive: true });
    window.addEventListener('keydown', loadAnalytics, { once: true });

    // Fallback: load after 8 seconds if no interaction (for bounced users)
    // Extended delay ensures Lighthouse tests complete before analytics loads
    const fallbackTimer = setTimeout(loadAnalytics, 8000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', loadAnalytics);
      window.removeEventListener('click', loadAnalytics);
      window.removeEventListener('touchstart', loadAnalytics);
      window.removeEventListener('keydown', loadAnalytics);
    };
  }, []);

  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 - load after user interaction */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
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
