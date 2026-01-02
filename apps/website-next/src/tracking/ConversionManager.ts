/**
 * Conversion Manager
 * 
 * Central orchestrator for all conversion tracking in LPA.
 * Provides a unified API for tracking events across the user journey.
 */

import type {
  TrackingResult,
  BookingStep,
  ViewServiceParams,
  ClickBookNowParams,
  ClickPhoneParams,
  SubmitContactFormParams,
  StartBookingParams,
  CompleteDetailsParams,
  SelectDatetimeParams,
  InitiatePaymentParams,
  ConfirmBookingParams,
  CompleteBookingParams,
} from './types';

import {
  pushSimpleEvent,
  fireGtagConversion,
  debugDataLayer,
} from './core/dataLayer';

import {
  initializeSession,
  getIntentScore,
  updateIntentScore,
  recordPageView,
  recordServiceInterest,
  getStoredGCLID,
  getStoredUTMParams,
  getSessionDuration,
  hasConversionFired,
  markConversionFired,
} from './core/session';

import {
  trackBookingStart,
  trackDetailsComplete,
  trackDatetimeSelected,
  trackPaymentInitiated,
  trackBookingConfirmed,
  trackBookingComplete,
  trackBookingAbandonment,
  getBookingFunnelMetrics,
} from './events/booking';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_ADS_CONVERSION_ID = 'AW-11563740075';

// Micro-conversion labels (update with actual labels from Google Ads)
const CONVERSION_LABELS = {
  booking_intent: 'booking_intent_label',
  click_book_now: 'book_now_click_label',
  submit_contact_form: 'contact_form_label',
  click_phone: 'phone_click_label',
} as const;

// Conversion values
const CONVERSION_VALUES = {
  complete_booking: 250,
  booking_intent: 10,
  click_book_now: 25,
  submit_contact_form: 50,
  click_phone: 75,
  view_service: 5,
} as const;

// ============================================================================
// SINGLETON MANAGER CLASS
// ============================================================================

class ConversionManager {
  private static instance: ConversionManager;
  private initialized = false;
  private debugMode = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ConversionManager {
    if (!ConversionManager.instance) {
      ConversionManager.instance = new ConversionManager();
    }
    return ConversionManager.instance;
  }

  /**
   * Initialize the conversion tracking system
   * Call this once on app startup
   */
  initialize(): void {
    if (this.initialized) return;

    initializeSession();
    this.initialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('[ConversionManager] Initialized', {
        gclid: getStoredGCLID(),
        utmParams: getStoredUTMParams(),
      });
    }
  }

  /**
   * Enable debug mode for verbose logging
   */
  enableDebugMode(): void {
    this.debugMode = true;
    console.log('[ConversionManager] Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
  }

  // ==========================================================================
  // AWARENESS STAGE
  // ==========================================================================

  /**
   * Track page view
   */
  trackPageView(path?: string): TrackingResult {
    const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    // Record for intent scoring
    recordPageView(pagePath);

    const success = pushSimpleEvent('page_view', 'awareness', {
      page_path: pagePath,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'page_view',
      timestamp: Date.now(),
    };
  }

  /**
   * Track landing page view (with UTM params)
   */
  trackLandingView(variant?: string): TrackingResult {
    const utmParams = getStoredUTMParams() || {};

    const success = pushSimpleEvent('landing_view', 'awareness', {
      landing_variant: variant,
      ...utmParams,
      gclid: getStoredGCLID(),
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'landing_view',
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // INTEREST STAGE
  // ==========================================================================

  /**
   * Track service page view
   */
  trackServiceView(params: Partial<ViewServiceParams> & {
    serviceType?: string;
    serviceSlug?: string;
  }): TrackingResult {
    const serviceType = params.serviceType || params.service_type || 'unknown';
    const serviceSlug = params.serviceSlug || params.service_slug || serviceType;

    // Record for intent scoring
    recordServiceInterest(serviceType);

    const success = pushSimpleEvent('view_service', 'interest', {
      service_type: serviceType,
      service_slug: serviceSlug,
      lpa_service_type: serviceType,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'view_service',
      timestamp: Date.now(),
    };
  }

  /**
   * Track psychologist profile view
   */
  trackPsychologistView(psychologistId: string, psychologistName?: string): TrackingResult {
    updateIntentScore(15, `viewed psychologist: ${psychologistName || psychologistId}`);

    const success = pushSimpleEvent('view_psychologist', 'interest', {
      psychologist_id: psychologistId,
      psychologist_name: psychologistName,
      lpa_psychologist_id: psychologistId,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'view_psychologist',
      timestamp: Date.now(),
    };
  }

  /**
   * Track FAQ view
   */
  trackFAQView(question: string, category: string): TrackingResult {
    updateIntentScore(10, `FAQ: ${category}`);

    const success = pushSimpleEvent('view_faq', 'interest', {
      faq_question: question,
      faq_category: category,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'view_faq',
      timestamp: Date.now(),
    };
  }

  /**
   * Track scroll depth milestone
   */
  trackScrollDepth(percentage: 25 | 50 | 75 | 90 | 100): TrackingResult {
    if (percentage >= 50) {
      updateIntentScore(5, `scroll ${percentage}%`);
    }

    const success = pushSimpleEvent('scroll_depth', 'interest', {
      scroll_percentage: percentage,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'scroll_depth',
      timestamp: Date.now(),
    };
  }

  /**
   * Track time on page milestone
   */
  trackTimeOnPage(seconds: number): TrackingResult {
    if (seconds >= 60) {
      updateIntentScore(10, `time on page: ${seconds}s`);
    }

    const success = pushSimpleEvent('time_on_page', 'interest', {
      time_seconds: seconds,
      session_duration: getSessionDuration(),
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'time_on_page',
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // DECISION STAGE
  // ==========================================================================

  /**
   * Track booking intent (high-value signal)
   */
  trackBookingIntent(source: string): TrackingResult {
    updateIntentScore(25, `booking intent: ${source}`);

    // Prevent duplicate intent conversions
    if (hasConversionFired('booking_intent')) {
      return {
        success: true,
        event: 'booking_intent',
        timestamp: Date.now(),
        error: 'Already tracked this session',
      };
    }

    const success = pushSimpleEvent('booking_intent', 'decision', {
      intent_source: source,
      intent_score: getIntentScore(),
      lpa_intent_score: getIntentScore(),
      gclid: getStoredGCLID(),
    });

    // Fire micro-conversion
    if (CONVERSION_LABELS.booking_intent && CONVERSION_VALUES.booking_intent) {
      fireGtagConversion(
        GOOGLE_ADS_CONVERSION_ID,
        CONVERSION_LABELS.booking_intent,
        CONVERSION_VALUES.booking_intent,
        `intent_${Date.now()}`
      );
    }

    markConversionFired('booking_intent');

    return {
      success,
      event: 'booking_intent',
      timestamp: Date.now(),
    };
  }

  /**
   * Track Book Now button click
   */
  trackBookNowClick(params: Partial<ClickBookNowParams> & {
    buttonLocation?: string;
    buttonText?: string;
    serviceType?: string;
  }): TrackingResult {
    updateIntentScore(30, 'book now clicked');

    const success = pushSimpleEvent('click_book_now', 'decision', {
      button_location: params.buttonLocation || params.button_location || 'unknown',
      button_text: params.buttonText || params.button_text,
      service_type: params.serviceType || params.service_type,
      lpa_intent_score: getIntentScore(),
      gclid: getStoredGCLID(),
    });

    // Fire micro-conversion (if not duplicate)
    if (!hasConversionFired('click_book_now')) {
      fireGtagConversion(
        GOOGLE_ADS_CONVERSION_ID,
        CONVERSION_LABELS.click_book_now,
        CONVERSION_VALUES.click_book_now,
        `booknow_${Date.now()}`
      );
      markConversionFired('click_book_now');
    }

    return {
      success,
      event: 'click_book_now',
      timestamp: Date.now(),
    };
  }

  /**
   * Track phone number click
   */
  trackPhoneClick(params: Partial<ClickPhoneParams> & {
    phoneNumber?: string;
    clickLocation?: string;
  }): TrackingResult {
    updateIntentScore(40, 'phone clicked');

    const success = pushSimpleEvent('click_phone', 'decision', {
      phone_number: params.phoneNumber || params.phone_number || '',
      click_location: params.clickLocation || params.click_location || 'unknown',
      lpa_intent_score: getIntentScore(),
      gclid: getStoredGCLID(),
    });

    // Fire phone lead conversion (if not duplicate)
    if (!hasConversionFired('click_phone')) {
      fireGtagConversion(
        GOOGLE_ADS_CONVERSION_ID,
        CONVERSION_LABELS.click_phone,
        CONVERSION_VALUES.click_phone,
        `phone_${Date.now()}`
      );
      markConversionFired('click_phone');
    }

    return {
      success,
      event: 'click_phone',
      timestamp: Date.now(),
    };
  }

  /**
   * Track contact form submission
   */
  trackContactFormSubmit(params: Partial<SubmitContactFormParams> & {
    formType?: string;
    hasPhone?: boolean;
    hasEmail?: boolean;
  }): TrackingResult {
    updateIntentScore(35, 'contact form submitted');

    const success = pushSimpleEvent('submit_contact_form', 'decision', {
      form_type: params.formType || params.form_type || 'general',
      has_phone: params.hasPhone ?? params.has_phone ?? false,
      has_email: params.hasEmail ?? params.has_email ?? true,
      lpa_intent_score: getIntentScore(),
      gclid: getStoredGCLID(),
    });

    // Fire contact form lead conversion (if not duplicate)
    if (!hasConversionFired('submit_contact_form')) {
      fireGtagConversion(
        GOOGLE_ADS_CONVERSION_ID,
        CONVERSION_LABELS.submit_contact_form,
        CONVERSION_VALUES.submit_contact_form,
        `contact_${Date.now()}`
      );
      markConversionFired('submit_contact_form');
    }

    return {
      success,
      event: 'submit_contact_form',
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // BOOKING WORKFLOW (Delegated to booking.ts)
  // ==========================================================================

  /**
   * Track booking start
   */
  trackBookingStart(params?: Partial<StartBookingParams>): TrackingResult {
    return trackBookingStart(params);
  }

  /**
   * Track details completion
   */
  trackBookingDetailsComplete(params?: Partial<CompleteDetailsParams> & {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    appointmentType?: string;
  }): TrackingResult {
    return trackDetailsComplete(params);
  }

  /**
   * Track datetime selection
   */
  trackBookingDatetimeSelected(params?: Partial<SelectDatetimeParams> & {
    selectedDate?: string;
    selectedTime?: string;
  }): TrackingResult {
    return trackDatetimeSelected(params);
  }

  /**
   * Track payment initiation
   */
  trackBookingPaymentInitiated(params?: Partial<InitiatePaymentParams>): TrackingResult {
    return trackPaymentInitiated(params);
  }

  /**
   * Track booking confirmation
   */
  trackBookingConfirmed(params?: Partial<ConfirmBookingParams> & {
    bookingId?: string;
    psychologistId?: string;
    psychologistName?: string;
  }): TrackingResult {
    return trackBookingConfirmed(params);
  }

  /**
   * Track booking completion (PRIMARY CONVERSION)
   */
  trackBookingComplete(params?: Partial<CompleteBookingParams> & {
    bookingId?: string;
  }): TrackingResult {
    return trackBookingComplete(params);
  }

  /**
   * Track booking abandonment
   */
  trackBookingAbandonment(step?: BookingStep): TrackingResult {
    return trackBookingAbandonment({ abandon_step: step });
  }

  // ==========================================================================
  // RETENTION STAGE
  // ==========================================================================

  /**
   * Track feedback submission
   */
  trackFeedbackSubmit(rating: number, feedbackType: 'session' | 'general' = 'general'): TrackingResult {
    const success = pushSimpleEvent('submit_feedback', 'retention', {
      rating,
      feedback_type: feedbackType,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'submit_feedback',
      timestamp: Date.now(),
    };
  }

  /**
   * Track rebooking initiation
   */
  trackRebookingStart(previousBookingId: string, daysSinceLast: number): TrackingResult {
    const success = pushSimpleEvent('start_rebooking', 'retention', {
      previous_booking_id: previousBookingId,
      days_since_last: daysSinceLast,
      lpa_intent_score: getIntentScore(),
    });

    return {
      success,
      event: 'start_rebooking',
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get current intent score
   */
  getIntentScore(): number {
    return getIntentScore();
  }

  /**
   * Get booking funnel metrics
   */
  getBookingFunnelMetrics() {
    return getBookingFunnelMetrics();
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return getSessionDuration();
  }

  /**
   * Debug: Show current dataLayer state
   */
  debug(): void {
    debugDataLayer();
    console.log('[ConversionManager] Session data:', {
      intentScore: getIntentScore(),
      sessionDuration: getSessionDuration(),
      gclid: getStoredGCLID(),
      utmParams: getStoredUTMParams(),
      bookingFunnel: getBookingFunnelMetrics(),
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const conversionManager = ConversionManager.getInstance();

// Export class for testing
export { ConversionManager };

// Export convenience functions for direct import
export const trackPageView = (path?: string) => conversionManager.trackPageView(path);
export const trackServiceView = (params: Parameters<ConversionManager['trackServiceView']>[0]) => 
  conversionManager.trackServiceView(params);
export const trackBookNowClick = (params: Parameters<ConversionManager['trackBookNowClick']>[0]) => 
  conversionManager.trackBookNowClick(params);
export const trackPhoneClick = (params: Parameters<ConversionManager['trackPhoneClick']>[0]) => 
  conversionManager.trackPhoneClick(params);
export const trackContactFormSubmit = (params: Parameters<ConversionManager['trackContactFormSubmit']>[0]) => 
  conversionManager.trackContactFormSubmit(params);
