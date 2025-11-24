/**
 * Tracking Event Types
 * Centralizes analytics and tracking event definitions
 */

/**
 * Base tracking event interface
 */
export interface TrackingEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  customParams?: Record<string, unknown>;
}

/**
 * Page view tracking event
 */
export interface PageViewEvent {
  page_path: string;
  page_title: string;
  page_location?: string;
  referrer?: string;
}

/**
 * Conversion tracking event
 */
export interface ConversionEvent {
  conversion_type: string;
  value: number;
  currency: string;
  page_section?: string;
  button_location?: string;
  service_type?: string;
}

/**
 * Booking click event
 */
export interface BookingClickEvent {
  page_section: string;
  button_location: string;
  service_type?: string;
  appointment_type?: string;
}

/**
 * A/B test event
 */
export interface ABTestEvent {
  test_id: string;
  variant: string;
  user_id: string;
}

/**
 * Micro-conversion event
 */
export interface MicroConversionEvent {
  conversion_name: string;
  conversion_value: number;
  page_type: string;
  time_on_page?: number;
}

/**
 * Navigation event
 */
export interface NavigationEvent {
  destination_page: string;
  navigation_location: 'header' | 'footer' | 'inline' | 'mobile';
  link_text: string;
}

/**
 * Form interaction event
 */
export interface FormInteractionEvent {
  form_name: string;
  field_name: string;
  interaction_type: 'focus' | 'blur' | 'change' | 'submit';
}

/**
 * Error tracking event
 */
export interface ErrorEvent {
  error_message: string;
  error_type: string;
  component?: string;
  stack_trace?: string;
}

/**
 * Performance tracking event
 */
export interface PerformanceEvent {
  metric_name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP';
  metric_value: number;
  page_path: string;
}

/**
 * Union type of all tracking events
 */
export type AnyTrackingEvent =
  | TrackingEvent
  | PageViewEvent
  | ConversionEvent
  | BookingClickEvent
  | ABTestEvent
  | MicroConversionEvent
  | NavigationEvent
  | FormInteractionEvent
  | ErrorEvent
  | PerformanceEvent;

/**
 * Event category constants
 */
export const EventCategory = {
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',
  CONVERSION: 'conversion',
  BOOKING: 'booking',
  AB_TEST: 'ab_test',
  MICRO_CONVERSION: 'micro_conversion',
  FORM_INTERACTION: 'form_interaction',
  ERROR: 'error',
  PERFORMANCE: 'performance',
} as const;

/**
 * Event action constants
 */
export const EventAction = {
  CLICK: 'click',
  SUBMIT: 'submit',
  VIEW: 'view',
  FOCUS: 'focus',
  BLUR: 'blur',
  CHANGE: 'change',
  ERROR: 'error',
  SCROLL: 'scroll',
} as const;
