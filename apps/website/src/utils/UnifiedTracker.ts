/**
 * Unified Tracking System
 * High-level orchestration layer for all analytics tracking
 *
 * Now delegates to trackingEvents.ts for actual event firing
 * while maintaining singleton pattern for state management
 *
 * Maintains:
 * - Session state and tracking timers
 * - Scroll depth tracking
 * - High intent visitor detection
 * - Convenience methods for common workflows
 */

import {
  trackPageView as trackPageViewEvent,
  trackBookNowClick as trackBookNowClickEvent,
  trackContactFormSubmit as trackContactFormSubmitEvent,
  trackScrollDepth,
  fireMicroConversion as fireMicroConversionEvent,
  fireServicePageConversion,
  fireAboutPageConversion,
  firePricingPageConversion,
  fireHighIntentConversion,
  GOOGLE_ADS_ID,
  GA4_MEASUREMENT_ID,
  MICRO_CONVERSIONS,
  type MicroConversionType,
} from './trackingEvents';
import {
  detectEnvironment,
  hasConverted as hasConvertedCore,
  getConversionTimestamp,
  isSessionStorageAvailable,
  setSessionData,
  getSessionData,
  fireGtagEvent,
  configureGtag,
} from './trackingCore';

// Types and Interfaces
export interface TrackingConfig {
  ga4MeasurementId: string;
  googleAdsId: string;
  environment: 'development' | 'staging' | 'production';
  debugMode: boolean;
}

export interface PageEngagementData {
  page_type: string;
  time_on_page?: number;
  max_scroll_depth?: string;
  interactions?: number;
}

export interface ConversionData {
  conversion_type: string;
  value: number;
  currency: string;
  page_section?: string;
  button_location?: string;
  service_type?: string;
}

/**
 * Unified Tracking System
 * Single source of truth for all analytics and conversion tracking
 */
export class UnifiedTracker {
  private static instance: UnifiedTracker;
  private readonly config: TrackingConfig;
  private readonly sessionData: Map<string, unknown> = new Map();
  private readonly scrollDepthTracked: Set<number> = new Set();
  private readonly timeTrackers: Map<string, number> = new Map();

  private constructor(config?: Partial<TrackingConfig>) {
    this.config = {
      ga4MeasurementId: GA4_MEASUREMENT_ID,
      googleAdsId: GOOGLE_ADS_ID,
      environment: detectEnvironment(),
      debugMode: detectEnvironment() === 'development',
      ...config,
    };

    this.initializeTracking();
  }

  static getInstance(config?: Partial<TrackingConfig>): UnifiedTracker {
    if (!UnifiedTracker.instance) {
      UnifiedTracker.instance = new UnifiedTracker(config);
    }
    return UnifiedTracker.instance;
  }

  /**
   * Initialize tracking systems
   */
  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Initialize session data
    this.sessionData.set('session_start', Date.now());
    this.sessionData.set('page_views', 0);

    // Start high intent timer
    this.initHighIntentTimer();

    if (this.config.debugMode) {
      console.log('[UnifiedTracker] Initialized with config:', this.config);
    }
  }

  /**
   * CORE TRACKING METHODS (delegating to trackingEvents)
   */

  /**
   * Track page view and engagement
   */
  trackPageView(
    pageType: string,
    additionalData?: Record<string, unknown>
  ): void {
    const currentViews = (this.sessionData.get('page_views') as number) || 0;
    this.sessionData.set('page_views', currentViews + 1);

    // Delegate to trackingEvents
    trackPageViewEvent({
      page_type: pageType,
      session_page_count: currentViews + 1,
      ...additionalData,
    });

    // Start page-specific tracking
    this.initPageTracking(pageType);

    if (this.config.debugMode) {
      console.log(`[UnifiedTracker] Page view tracked: ${pageType}`);
    }
  }

  /**
   * Initialize page-specific tracking (scroll, time, etc.)
   */
  private initPageTracking(pageType: string): void {
    const startTime = Date.now();
    this.timeTrackers.set(pageType, startTime);

    // Scroll depth tracking
    const handleScroll = () => {
      if (typeof window === 'undefined') return;

      const scrollPercent = Math.round(
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
          100
      );

      // Track at 25%, 50%, 75%, 90% milestones
      [25, 50, 75, 90].forEach((milestone) => {
        if (
          scrollPercent >= milestone &&
          !this.scrollDepthTracked.has(milestone)
        ) {
          this.scrollDepthTracked.add(milestone);
          trackScrollDepth(milestone);
        }
      });
    };

    // Time on page tracking
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      fireGtagEvent('page_engagement', {
        event_category: 'engagement',
        page_type: pageType,
        time_on_page: timeSpent,
        max_scroll_depth: `${Math.max(...this.scrollDepthTracked)}%`,
      });
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Use pagehide instead of deprecated beforeunload for better browser compatibility
    // pagehide is recommended for tracking user sessions and is not deprecated
    window.addEventListener('pagehide', trackTimeOnPage);

    // Cleanup on page change (if using SPA routing)
    const cleanup = () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', trackTimeOnPage);
      trackTimeOnPage(); // Final tracking
    };

    // Store cleanup function for potential future use
    this.sessionData.set(`cleanup_${pageType}`, cleanup);
  }

  /**
   * Track conversion events (Book Now, Contact, etc.)
   * Delegates to trackingEvents functions
   */
  trackConversion(data: ConversionData): void {
    // Delegate to specific tracking functions
    switch (data.conversion_type) {
      case 'book_now_click':
        trackBookNowClickEvent({
          page_section: data.page_section || 'unknown',
          button_location: data.button_location || 'unknown',
          service_type: data.service_type,
          value: data.value,
        });
        break;
      case 'contact_form_submit':
        trackContactFormSubmitEvent({
          form_type: 'contact_form',
          form_location: data.button_location || 'unknown',
          value: data.value,
        });
        break;
    }

    if (this.config.debugMode) {
      console.log(`[UnifiedTracker] Conversion tracked:`, data);
    }
  }

  /**
   * MICRO-CONVERSIONS SYSTEM
   */

  /**
   * Fire a micro-conversion (Google Ads)
   * Delegates to trackingEvents
   */
  fireMicroConversion(
    conversionType: MicroConversionType,
    additionalParams?: Record<string, unknown>
  ): void {
    fireMicroConversionEvent(conversionType, additionalParams);

    if (this.config.debugMode) {
      const conversion = MICRO_CONVERSIONS[conversionType];
      console.log(
        `[UnifiedTracker] Micro-conversion delegated: ${conversion.name}`
      );
    }
  }

  /**
   * Initialize high intent visitor timer
   */
  private initHighIntentTimer(): void {
    if (!isSessionStorageAvailable()) {
      return;
    }

    // Check if already started or converted
    const timerStarted = getSessionData('lpa_intent_timer_started') === 'true';
    const alreadyConverted = hasConvertedCore('high_intent');

    if (timerStarted || alreadyConverted) {
      return;
    }

    // Mark timer as started
    setSessionData('lpa_intent_timer_started', 'true');
    setSessionData('lpa_intent_timer_start_time', Date.now().toString());

    // Set 3-minute timer for high intent conversion
    setTimeout(
      () => {
        fireHighIntentConversion();
      },
      3 * 60 * 1000
    ); // 3 minutes

    if (this.config.debugMode) {
      console.log('[UnifiedTracker] High intent timer started (3 minutes)');
    }
  }

  /**
   * CONVENIENCE METHODS FOR COMMON TRACKING
   */

  /**
   * Track service page views
   */
  trackServicePage(): void {
    this.trackPageView('services_page');
    fireServicePageConversion();
  }

  /**
   * Track about page views
   */
  trackAboutPage(): void {
    this.trackPageView('about_page');
    fireAboutPageConversion();
  }

  /**
   * Track pricing page views
   */
  trackPricingPage(): void {
    this.trackPageView('pricing_page');
    firePricingPageConversion();
  }

  /**
   * Track booking button clicks
   */
  trackBookingClick(location: string, serviceType?: string): void {
    this.trackConversion({
      conversion_type: 'book_now_click',
      value: 100,
      currency: 'AUD',
      button_location: location,
      service_type: serviceType,
      page_section: this.getCurrentPageSection(),
    });
  }

  /**
   * Track email clicks
   */
  trackEmailClick(emailAddress: string, location: string): void {
    fireGtagEvent('email_click', {
      event_category: 'engagement',
      event_label: 'email_link_click',
      email_address: emailAddress,
      button_location: location,
      page_path: window.location.pathname,
      value: 30,
    });
  }

  /**
   * Track service card clicks
   */
  trackServiceCardClick(
    serviceName: string,
    price: string,
    position: number
  ): void {
    fireGtagEvent('service_card_click', {
      event_category: 'navigation',
      service_name: serviceName,
      service_price: price,
      card_position: position,
      page_path: window.location.pathname,
    });
  }

  /**
   * Track calculator completion
   */
  trackCalculatorCompletion(sessionData: Record<string, unknown>): void {
    fireGtagEvent('calculator_completion', {
      event_category: 'conversion',
      event_label: 'pricing_calculator_completed',
      value: 80,
      ...sessionData,
      page_path: window.location.pathname,
    });
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Get current page section for context
   */
  private getCurrentPageSection(): string {
    const path = window.location.pathname;
    if (path.includes('/pricing')) return 'pricing';
    if (path.includes('/services')) return 'services';
    if (path.includes('/about')) return 'about';
    return 'homepage';
  }

  /**
   * Get session statistics
   */
  getSessionStats(): Record<string, unknown> {
    const stats: Record<string, unknown> = {};

    // Basic session data
    stats.session_start = this.sessionData.get('session_start');
    stats.page_views = this.sessionData.get('page_views');

    // Micro-conversion status
    Object.keys(MICRO_CONVERSIONS).forEach((key) => {
      const converted = hasConvertedCore(key);
      const timestamp = getConversionTimestamp(key);

      stats[`micro_${key}`] = {
        fired: converted,
        timestamp: timestamp ? new Date(timestamp).toISOString() : null,
      };
    });

    return stats;
  }

  /**
   * Track custom events (for A/B testing, etc.)
   */
  trackCustomEvent(
    eventName: string,
    parameters: Record<string, unknown> = {}
  ): void {
    if (this.config.debugMode) {
      console.log(`[UnifiedTracker] Custom Event: ${eventName}`, parameters);
    }

    fireGtagEvent(eventName, {
      ...parameters,
      timestamp: Date.now(),
      environment: this.config.environment,
    });
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    this.config.debugMode = true;
    configureGtag(this.config.ga4MeasurementId, { debug_mode: true });
    console.log('[UnifiedTracker] Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    this.config.debugMode = false;
    configureGtag(this.config.ga4MeasurementId, { debug_mode: false });
    console.log('[UnifiedTracker] Debug mode disabled');
  }
}

// Export singleton instance
export const tracker = UnifiedTracker.getInstance();

// Export convenience functions for easy migration
export const trackServicePage = () => tracker.trackServicePage();
export const trackAboutPage = () => tracker.trackAboutPage();
export const trackPricingPage = () => tracker.trackPricingPage();
export const trackBookingClick = (location: string, serviceType?: string) =>
  tracker.trackBookingClick(location, serviceType);
export const trackEmailClick = (email: string, location: string) =>
  tracker.trackEmailClick(email, location);
export const trackServiceCardClick = (
  name: string,
  price: string,
  position: number
) => tracker.trackServiceCardClick(name, price, position);
export const trackCalculatorCompletion = (data: Record<string, unknown>) =>
  tracker.trackCalculatorCompletion(data);
export const trackCustomEvent = (
  eventName: string,
  parameters: Record<string, unknown> = {}
) => tracker.trackCustomEvent(eventName, parameters);

// Legacy compatibility exports - use trackingEvents.ts exports directly
// Do NOT re-export these as they create circular references
export const trackPageEngagement = (data: { page_type: string }) =>
  tracker.trackPageView(data.page_type);
