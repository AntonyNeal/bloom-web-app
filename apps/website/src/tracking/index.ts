/**
 * LPA Conversion Tracking System
 * 
 * Unified, normalized conversion tracking for Life Psychology Australia.
 * Integrates with Google Tag Manager and Google Ads.
 * 
 * @example
 * ```tsx
 * import { conversionManager, trackBookNowClick } from '@/tracking';
 * 
 * // Initialize on app startup
 * conversionManager.initialize();
 * 
 * // Track events throughout the app
 * trackBookNowClick({ buttonLocation: 'hero' });
 * conversionManager.trackBookingComplete({ bookingId: '123' });
 * ```
 */

// Core exports
export { conversionManager, ConversionManager } from './ConversionManager';

// Convenience function exports
export {
  trackPageView,
  trackServiceView,
  trackBookNowClick,
  trackPhoneClick,
  trackContactFormSubmit,
} from './ConversionManager';

// Booking workflow exports
export {
  trackBookingStart,
  trackDetailsComplete,
  trackDatetimeSelected,
  trackPaymentInitiated,
  trackBookingConfirmed,
  trackBookingComplete,
  trackBookingAbandonment,
  getBookingFlowState,
  clearBookingFlowState,
  getBookingFunnelMetrics,
} from './events/booking';

// Core utilities (for advanced use cases)
export {
  pushToDataLayer,
  pushSimpleEvent,
  pushEcommerceEvent,
  pushConversionEvent,
  fireGtagEvent,
  fireGtagConversion,
  debugDataLayer,
  isGtagAvailable,
  isDataLayerAvailable,
} from './core/dataLayer';

// Session utilities
export {
  initializeSession,
  captureGCLID,
  getStoredGCLID,
  extractUTMParams,
  getStoredUTMParams,
  getIntentScore,
  updateIntentScore,
  recordPageView,
  recordServiceInterest,
  getSessionDuration,
  hasConversionFired,
  markConversionFired,
  extractGA4ClientId,
  getGA4SessionId,
  getGA4Session,
} from './core/session';

// Type exports
export type {
  // Event types
  TrackingEvent,
  FunnelStage,
  BookingStep,
  TrackingResult,
  
  // Parameter types
  BaseEventParams,
  UTMParams,
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
  AbandonBookingParams,
  
  // Data types
  DataLayerEvent,
  EcommerceData,
  EcommerceItem,
  UserData,
  BookingFlowState,
  ConversionConfig,
  GoogleAdsConversion,
} from './types';
