'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

// Google Analytics and Ads configuration from environment variables
// Fall back to production IDs if environment variables are not set
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-XGGBRLPBKK';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-11563740075';

// AnalyticsProvider manages analytics loading:
// - Google Ads loads IMMEDIATELY (critical for conversion tracking)
// - GA4 loads after user interaction (performance optimization)
export function AnalyticsProvider() {
  const [shouldLoadGA4, setShouldLoadGA4] = useState(false);

  // Initialize gtag immediately so conversions can be queued
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialize dataLayer and gtag function immediately
    // This allows conversions to be queued before scripts fully load
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
      window.gtag('js', new Date());
      // Configure Google Ads immediately - critical for conversion tracking
      window.gtag('config', GOOGLE_ADS_ID, { send_page_view: false });
    }
  }, []);

  // Lazy load GA4 after user interaction for performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let loaded = false;
    const loadGA4 = () => {
      if (loaded) return;
      loaded = true;
      setShouldLoadGA4(true);
      // Clean up listeners
      window.removeEventListener('scroll', loadGA4);
      window.removeEventListener('click', loadGA4);
      window.removeEventListener('touchstart', loadGA4);
      window.removeEventListener('keydown', loadGA4);
    };

    // Load GA4 on first user interaction - mobile-first approach
    window.addEventListener('scroll', loadGA4, { once: true, passive: true });
    window.addEventListener('click', loadGA4, { once: true });
    window.addEventListener('touchstart', loadGA4, { once: true, passive: true });
    window.addEventListener('keydown', loadGA4, { once: true });

    // Fallback: load after 5 seconds if no interaction
    const fallbackTimer = setTimeout(loadGA4, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', loadGA4);
      window.removeEventListener('click', loadGA4);
      window.removeEventListener('touchstart', loadGA4);
      window.removeEventListener('keydown', loadGA4);
    };
  }, []);

  return (
    <>
      {/* Google Ads - load IMMEDIATELY for conversion tracking */}
      {/* This is critical - conversions won't track without it */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      
      {/* GA4 - load after user interaction for performance */}
      {shouldLoadGA4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics-ga4" strategy="lazyOnload">
            {`
              window.gtag('config', '${GA4_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
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
