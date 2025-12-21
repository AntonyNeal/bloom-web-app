// Direct gtag.js tracking functions for Google Analytics 4 and Google Ads
// These functions use the global gtag() function directly (no React GA4 library)

declare global {
  function gtag(command: string, ...args: unknown[]): void;
  interface Window {
    VITE_GA_MEASUREMENT_ID?: string;
  }
}

// Environment-based GA4 Measurement ID Detection
function getGa4MeasurementId(): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return 'G-XGGBRLPBKK';
  }

  const hostname = window.location.hostname;

  // Production domain
  if (
    hostname === 'www.life-psychology.com.au' ||
    hostname === 'life-psychology.com.au'
  ) {
    return 'G-XGGBRLPBKK';
  }

  // Staging domain (Azure Static Web Apps)
  if (
    hostname.includes('azurestaticapps.net') ||
    hostname.includes('red-desert')
  ) {
    return 'G-XGGBRLPBKK';
  }

  // Local development fallback
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('localhost')
  ) {
    return 'G-XGGBRLPBKK'; // Use production ID for local testing
  }

  // Environment variable fallback (if available)
  if (
    window.VITE_GA_MEASUREMENT_ID &&
    !window.VITE_GA_MEASUREMENT_ID.startsWith('__RUNTIME_')
  ) {
    return window.VITE_GA_MEASUREMENT_ID;
  }

  // Default fallback
  console.warn(
    '[GA4] Unknown hostname, using production measurement ID:',
    hostname
  );
  return 'G-XGGBRLPBKK';
}

// Book Now Click Tracking
export function trackBookNowClick(params: {
  page_section: string;
  button_location: string;
  service_type?: string;
}) {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, skipping book_now_click tracking');
    return;
  }

  // GA4 Event (conversion tracking handled internally)
  gtag('event', 'book_now_click', {
    event_category: 'conversion',
    event_label: 'book_now_button',
    value: 100,
    custom_parameter_1: params.page_section,
    custom_parameter_2: params.button_location,
    custom_parameter_3: params.service_type || 'general_psychology',
    page_path: window.location.pathname,
    page_title: document.title,
  });

  console.log('[GA4] Tracked book_now_click:', params);
}

// Contact Form Submission Tracking
export function trackContactFormSubmit(params: {
  form_type: string;
  form_location: string;
  has_phone?: boolean;
  has_email?: boolean;
}) {
  if (typeof gtag === 'undefined') {
    console.warn(
      '[GA4] gtag not loaded, skipping contact_form_submit tracking'
    );
    return;
  }

  gtag('event', 'contact_form_submit', {
    event_category: 'conversion',
    event_label: 'contact_form',
    value: 75,
    form_type: params.form_type,
    form_location: params.form_location,
    has_phone: params.has_phone || false,
    has_email: params.has_email || false,
    page_path: window.location.pathname,
  });

  console.log('[GA4] Tracked contact_form_submit:', params);
}

// Key Page Engagement Tracking
export function trackPageEngagement(params: {
  page_type:
    | 'services_page'
    | 'about_page'
    | 'appointments_page'
    | 'pricing_page';
}) {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, skipping page_engagement tracking');
    return;
  }

  gtag('event', 'page_engagement', {
    event_category: 'engagement',
    event_label: 'key_page_view',
    value: 25,
    page_type: params.page_type,
    page_path: window.location.pathname,
    page_title: document.title,
  });

  console.log('[GA4] Tracked page_engagement:', params);
}

// Scroll Depth Tracking
export function trackScrollDepth(scrollPercent: number) {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, skipping scroll_depth tracking');
    return;
  }

  if (scrollPercent >= 25 && scrollPercent % 25 === 0) {
    gtag('event', 'scroll_depth', {
      event_category: 'engagement',
      event_label: `scroll_${scrollPercent}_percent`,
      value: scrollPercent,
      scroll_depth: scrollPercent,
      page_path: window.location.pathname,
    });

    console.log('[GA4] Tracked scroll_depth:', scrollPercent + '%');
  }
}

// File Download Tracking
export function trackFileDownload(params: {
  file_name: string;
  file_type: string;
}) {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, skipping file_download tracking');
    return;
  }

  gtag('event', 'file_download', {
    event_category: 'engagement',
    event_label: 'resource_download',
    value: 10,
    file_name: params.file_name,
    file_type: params.file_type,
    page_path: window.location.pathname,
  });

  console.log('[GA4] Tracked file_download:', params);
}

// Time on Page Tracking
export function trackTimeOnPage(seconds: number) {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, skipping time_on_page tracking');
    return;
  }

  gtag('event', 'time_on_page', {
    event_category: 'engagement',
    event_label: 'page_time',
    value: Math.round(seconds),
    time_on_page: Math.round(seconds),
    page_path: window.location.pathname,
  });

  console.log('[GA4] Tracked time_on_page:', seconds + ' seconds');
}

// Debug Mode Setup (temporary)
export function enableGtagDebug() {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, cannot enable debug mode');
    return;
  }

  const measurementId = getGa4MeasurementId();
  gtag('config', measurementId, {
    debug_mode: true,
  });

  console.log('[GA4] Debug mode enabled for:', measurementId);
}

// Disable Debug Mode (for production)
export function disableGtagDebug() {
  if (typeof gtag === 'undefined') {
    console.warn('[GA4] gtag not loaded, cannot disable debug mode');
    return;
  }

  const measurementId = getGa4MeasurementId();
  gtag('config', measurementId, {
    debug_mode: false,
  });

  console.log('[GA4] Debug mode disabled for:', measurementId);
}
