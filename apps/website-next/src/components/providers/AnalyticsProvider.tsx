'use client';

import Script from 'next/script';

// Google Analytics and Ads configuration
const GA4_MEASUREMENT_ID = 'G-QZ3CJMXV5P';
const GOOGLE_ADS_ID = 'AW-16753733973';

// AnalyticsProvider now renders scripts only, no children wrapper
// This allows it to be placed at the end of body for deferred loading
export function AnalyticsProvider() {
  return (
    <>
      {/* Google Analytics 4 - load with lazyOnload for best performance */}
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
