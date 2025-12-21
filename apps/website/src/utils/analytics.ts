import ReactGA from 'react-ga4';
import { getEnvVar } from './env';

// Environment-based GA4 Measurement ID Detection
function getGa4MeasurementId(): string {
  if (typeof window === 'undefined') {
    // Server-side fallback - use environment variable
    return getEnvVar('VITE_GA_MEASUREMENT_ID', 'G-XGGBRLPBKK');
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
    '[Analytics] Unknown hostname, using production measurement ID:',
    hostname
  );
  return 'G-XGGBRLPBKK';
}

function getGaMeasurementId() {
  // Use the new environment-based detection
  return getGa4MeasurementId();
}

let initialized = false;
let debugMode = false;

export function initAnalytics() {
  const GA_MEASUREMENT_ID = getGaMeasurementId();
  if (initialized || !GA_MEASUREMENT_ID) return;
  if (getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production') {
    console.log(
      '[Analytics] Development mode detected - initializing for testing'
    );
    // Still initialize in development for testing purposes
    try {
      ReactGA.initialize(GA_MEASUREMENT_ID);
      initialized = true;
      console.log(
        '[Analytics] GA4 initialized successfully in development mode'
      );
    } catch (err) {
      console.error(
        '[Analytics] Failed to initialize GA4 in development:',
        err
      );
    }
    return;
  }
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    initialized = true;
  } catch (err) {
    console.error('[Analytics] Failed to initialize GA4:', err);
  }
}

export function enableAnalyticsDebug() {
  debugMode = true;
  console.log('[Analytics] Debug mode enabled');
}

export function validateAnalyticsTags(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasGA = !!(window as any).gtag;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasDataLayer = !!(window as any).dataLayer;
  console.log('[Analytics] Tag validation:', {
    hasGA,
    hasDataLayer,
    initialized,
  });
  return hasGA && hasDataLayer && initialized;
}

export function trackPageView(path: string) {
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    !debugMode
  ) {
    console.log(`[Analytics] Would track page view: ${path}`);
    return;
  }
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
    if (debugMode) console.log(`[Analytics] Tracked page view: ${path}`);
  } catch (err) {
    console.error('[Analytics] Failed to track page view:', err);
  }
}

export function trackBookingIntent(source: string) {
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    !debugMode
  ) {
    console.log(`[Analytics] Would track booking intent: ${source}`);
    return;
  }
  try {
    ReactGA.event({
      category: 'Booking',
      action: 'Intent',
      label: source,
      value: 50,
    });
    if (debugMode) console.log(`[Analytics] Tracked booking intent: ${source}`);
  } catch (err) {
    console.error('[Analytics] Failed to track booking intent:', err);
  }
}

export function trackServicePageView(service: string) {
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    !debugMode
  ) {
    console.log(`[Analytics] Would track service page view: ${service}`);
    return;
  }
  try {
    ReactGA.event({
      category: 'Service',
      action: 'Page View',
      label: service,
      value: 25,
    });
    if (debugMode)
      console.log(`[Analytics] Tracked service page view: ${service}`);
  } catch (err) {
    console.error('[Analytics] Failed to track service page view:', err);
  }
}

export function trackEvent(
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
) {
  if (
    getEnvVar('VITE_BUILD_MODE', import.meta.env.MODE) !== 'production' &&
    !debugMode
  ) {
    console.log(`[Analytics] Would track event: ${eventName}`, params);
    return;
  }
  try {
    ReactGA.event(eventName, params);
    if (debugMode)
      console.log(`[Analytics] Tracked event: ${eventName}`, params);
  } catch (err) {
    console.error(`[Analytics] Failed to track event: ${eventName}`, err);
  }
}

export function trackHighIntentUser(data: {
  pages_viewed: number;
  time_on_site: number;
  services_interested: string[];
}) {
  trackEvent('high_intent_user', {
    pages_viewed: data.pages_viewed,
    time_on_site: data.time_on_site,
    services_interested: data.services_interested.join(','),
  });
}

export function trackFAQViewed(data: { question: string; category: string }) {
  trackEvent('faq_viewed', {
    question: data.question,
    category: data.category,
  });
}

export function trackLocationInterest(data: {
  suburb: string;
  service?: string;
}) {
  trackEvent('location_interest', {
    suburb: data.suburb,
    service: data.service,
  });
}

export function tagForRemarketing(
  audience:
    | 'visited_no_action'
    | 'high_intent_no_book'
    | 'viewed_anxiety_service'
    | 'viewed_couples_service'
    | 'viewed_trauma_service'
    | 'ndis_interested'
    | 'returned_from_halaxy'
) {
  trackEvent('remarketing_tag', { audience });
}

export function trackBookingStarted() {
  trackEvent('booking_started');
}

export function trackBookingCompleted() {
  trackEvent('booking_completed');
}

export function trackContactFormSubmitted() {
  trackEvent('contact_form_submitted');
}

export function trackPhoneNumberClicked() {
  trackEvent('phone_number_clicked');
}

export function trackServicePageViewed(serviceName: string) {
  trackEvent('service_page_viewed', { service_name: serviceName });
}

// GA4 Conversion Tracking - Book Now Click Event
export function trackBookNowClick(data: {
  button_location: string;
  button_text?: string;
  page_path?: string;
  intent_score?: number;
  service_type?: string;
}) {
  trackEvent('book_now_click', {
    button_location: data.button_location,
    button_text: data.button_text,
    page_path: data.page_path || window.location.pathname,
    intent_score: data.intent_score,
    service_type: data.service_type,
    value: 100, // High value for conversion tracking
  });
}

// Contact Form Submission Tracking
export function trackContactFormSubmit(data: {
  form_type: string;
  form_location: string;
  page_path?: string;
  has_phone?: boolean;
  has_email?: boolean;
}) {
  trackEvent('contact_form_submit', {
    form_type: data.form_type,
    form_location: data.form_location,
    page_path: data.page_path || window.location.pathname,
    has_phone: data.has_phone,
    has_email: data.has_email,
    value: 75, // Medium-high value for lead tracking
  });
}

// Enhanced Engagement Tracking
export function trackEngagement(data: {
  engagement_type:
    | 'scroll_depth'
    | 'time_on_page'
    | 'service_read'
    | 'faq_view';
  value: number;
  page_path?: string;
  element_id?: string;
}) {
  trackEvent('user_engagement', {
    engagement_type: data.engagement_type,
    value: data.value,
    page_path: data.page_path || window.location.pathname,
    element_id: data.element_id,
  });
}

// Intent Scoring System
class IntentScorer {
  private static instance: IntentScorer;
  private score = 0;
  private readonly startTime = Date.now();
  private readonly pagesViewed = new Set<string>();
  private readonly servicesInterested = new Set<string>();

  static getInstance(): IntentScorer {
    if (!IntentScorer.instance) {
      IntentScorer.instance = new IntentScorer();
    }
    return IntentScorer.instance;
  }

  addPoints(points: number, reason: string) {
    this.score += points;
    if (debugMode)
      console.log(
        `[Intent] +${points} points (${reason}) - Total: ${this.score}`
      );

    if (this.score >= 50 && !sessionStorage.getItem('high_intent_tracked')) {
      trackHighIntentUser({
        pages_viewed: this.pagesViewed.size,
        time_on_site: Math.floor((Date.now() - this.startTime) / 1000),
        services_interested: Array.from(this.servicesInterested),
      });
      sessionStorage.setItem('high_intent_tracked', 'true');
    }
  }

  trackPageView(path: string) {
    if (!this.pagesViewed.has(path)) {
      this.pagesViewed.add(path);
      this.addPoints(10, `Page view: ${path}`);
    }
  }

  trackServiceInterest(service: string) {
    if (!this.servicesInterested.has(service)) {
      this.servicesInterested.add(service);
      const points = ['anxiety', 'depression', 'trauma', 'ndis'].includes(
        service.toLowerCase()
      )
        ? 30
        : 20;
      this.addPoints(points, `Service interest: ${service}`);
    }
  }

  trackFAQView(category: string) {
    this.addPoints(25, `FAQ view: ${category}`);
  }

  trackReturnVisit() {
    if (sessionStorage.getItem('has_visited')) {
      this.addPoints(15, 'Return visit bonus');
    } else {
      sessionStorage.setItem('has_visited', 'true');
    }
  }

  getScore(): number {
    return this.score;
  }
}

export const intentScorer = IntentScorer.getInstance();

export function testAllConversions() {
  if (import.meta.env.MODE === 'production' && !debugMode) return;

  console.log('[Analytics] Testing all conversion events...');

  trackHalaxyHandoff({ source: 'test', intent_score: 75 });
  trackHighIntentUser({
    pages_viewed: 5,
    time_on_site: 300,
    services_interested: ['anxiety'],
  });
  trackFAQViewed({ question: 'How much does therapy cost?', category: 'cost' });
  trackLocationInterest({ suburb: 'newcastle', service: 'anxiety' });
  trackReturnFromHalaxy({ time_away: 120, presumed_abandoned: false });
  tagForRemarketing('high_intent_no_book');

  console.log('[Analytics] All test events fired');
}

// Performance Monitoring
export function trackPerformanceMetrics() {
  if (typeof window === 'undefined') return;

  // Custom performance metrics using native Performance API
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (perfData) {
        const metrics = {
          dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcpConnect: perfData.connectEnd - perfData.connectStart,
          serverResponse: perfData.responseStart - perfData.requestStart,
          pageLoad: perfData.loadEventEnd - perfData.startTime,
          domReady: perfData.domContentLoadedEventEnd - perfData.startTime,
          totalBlockingTime: 0, // Would need additional calculation
          largestContentfulPaint: 0, // Would need PerformanceObserver
        };

        console.log('[Performance]', metrics);

        // Track in analytics using ReactGA
        if (initialized) {
          ReactGA.event('page_load_performance', {
            page_load_time: metrics.pageLoad,
            dns_lookup: metrics.dnsLookup,
            tcp_connect: metrics.tcpConnect,
            server_response: metrics.serverResponse,
            dom_ready: metrics.domReady,
          });
        }
      }
    }, 0);
  });

  // Track Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[Performance] LCP:', lastEntry.startTime);

        if (initialized) {
          ReactGA.event('web_vitals', {
            lcp: Math.round(lastEntry.startTime),
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP not supported
    }
  }
}
