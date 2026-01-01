/**
 * Conversion Tracking Type Definitions
 * 
 * Centralized type definitions for the LPA conversion tracking system.
 * All events and parameters are strongly typed for consistency.
 */

// ============================================================================
// FUNNEL STAGES
// ============================================================================

export type FunnelStage = 
  | 'awareness' 
  | 'interest' 
  | 'decision' 
  | 'action' 
  | 'retention';

export type BookingStep = 
  | 'start'
  | 'details' 
  | 'verify'
  | 'datetime' 
  | 'session'
  | 'payment' 
  | 'confirm' 
  | 'success'
  | 'error';

// ============================================================================
// EVENT NAMES
// ============================================================================

// Awareness events
export type AwarenessEvent = 
  | 'page_view' 
  | 'landing_view';

// Interest events
export type InterestEvent = 
  | 'view_service' 
  | 'view_psychologist' 
  | 'view_faq'
  | 'scroll_depth'
  | 'time_on_page';

// Decision events
export type DecisionEvent = 
  | 'booking_intent' 
  | 'click_book_now' 
  | 'click_phone' 
  | 'submit_contact_form';

// Booking workflow events
export type BookingEvent = 
  | 'start_booking'
  | 'complete_details'
  | 'select_datetime'
  | 'initiate_payment'
  | 'confirm_booking'
  | 'complete_booking'
  | 'abandon_booking';

// Retention events
export type RetentionEvent = 
  | 'submit_feedback'
  | 'start_rebooking';

// All event types
export type TrackingEvent = 
  | AwarenessEvent 
  | InterestEvent 
  | DecisionEvent 
  | BookingEvent 
  | RetentionEvent;

// ============================================================================
// EVENT PARAMETERS
// ============================================================================

/**
 * Base parameters included with every event
 */
export interface BaseEventParams {
  event_timestamp: number;
  page_path: string;
  page_title: string;
  session_id?: string;
  client_id?: string;
  user_intent_score?: number;
}

/**
 * UTM parameters from URL
 */
export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
}

/**
 * Awareness event parameters
 */
export interface PageViewParams extends BaseEventParams {
  referrer?: string;
}

export interface LandingViewParams extends BaseEventParams, UTMParams {
  landing_variant?: string;
}

/**
 * Interest event parameters
 */
export interface ViewServiceParams extends BaseEventParams {
  service_type: string;
  service_slug: string;
}

export interface ViewPsychologistParams extends BaseEventParams {
  psychologist_id: string;
  psychologist_name: string;
}

export interface ViewFAQParams extends BaseEventParams {
  faq_question: string;
  faq_category: string;
}

export interface ScrollDepthParams extends BaseEventParams {
  scroll_percentage: 25 | 50 | 75 | 90 | 100;
}

export interface TimeOnPageParams extends BaseEventParams {
  time_seconds: number;
}

/**
 * Decision event parameters
 */
export interface BookingIntentParams extends BaseEventParams {
  intent_source: string;
  intent_score: number;
}

export interface ClickBookNowParams extends BaseEventParams {
  button_location: string;
  button_text?: string;
  service_type?: string;
  page_section?: string;
}

export interface ClickPhoneParams extends BaseEventParams {
  phone_number: string;
  click_location: string;
}

export interface SubmitContactFormParams extends BaseEventParams {
  form_type: string;
  has_phone: boolean;
  has_email: boolean;
}

/**
 * Booking workflow parameters
 */
export interface StartBookingParams extends BaseEventParams {
  entry_point: string;
  service_preselected?: string;
}

export interface CompleteDetailsParams extends BaseEventParams {
  is_returning_user: boolean;
  appointment_type: string;
}

export interface SelectDatetimeParams extends BaseEventParams {
  days_in_advance: number;
  time_slot_type: 'morning' | 'afternoon' | 'evening';
  selected_date: string;
  selected_time: string;
}

export interface InitiatePaymentParams extends BaseEventParams {
  payment_method: string;
  booking_value: number;
}

export interface ConfirmBookingParams extends BaseEventParams {
  booking_id: string;
  booking_value: number;
  psychologist_id?: string;
  psychologist_name?: string;
  appointment_type: string;
}

export interface CompleteBookingParams extends BaseEventParams {
  transaction_id: string;
  booking_value: number;
  is_first_booking: boolean;
  booking_id?: string;
}

export interface AbandonBookingParams extends BaseEventParams {
  abandon_step: BookingStep;
  time_in_flow_seconds: number;
}

/**
 * Retention event parameters
 */
export interface SubmitFeedbackParams extends BaseEventParams {
  rating: number;
  feedback_type: 'session' | 'general';
}

export interface StartRebookingParams extends BaseEventParams {
  previous_booking_id: string;
  days_since_last: number;
}

// ============================================================================
// DATALAYER TYPES
// ============================================================================

/**
 * Ecommerce item for booking events
 */
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category: string;
  item_category2?: string;
  price: number;
  quantity: number;
}

/**
 * Ecommerce data for GA4
 */
export interface EcommerceData {
  currency: 'AUD';
  value: number;
  items?: EcommerceItem[];
  transaction_id?: string;
}

/**
 * User data for enhanced conversions (hashed)
 */
export interface UserData {
  email_address?: string;  // SHA256 hashed
  phone_number?: string;   // E.164 format, SHA256 hashed
}

/**
 * Complete dataLayer event structure
 */
export interface DataLayerEvent {
  event: TrackingEvent;
  event_category: FunnelStage;
  event_action: string;
  event_label?: string;
  event_value?: number;
  
  // Custom dimensions
  lpa_service_type?: string;
  lpa_psychologist_id?: string;
  lpa_booking_step?: BookingStep;
  lpa_intent_score?: number;
  
  // Ecommerce data
  ecommerce?: EcommerceData;
  
  // Enhanced conversions
  user_data?: UserData;
  
  // Allow additional properties
  [key: string]: unknown;
}

// ============================================================================
// CONVERSION CONFIGURATION
// ============================================================================

/**
 * Google Ads conversion configuration
 */
export interface GoogleAdsConversion {
  conversionId: string;
  conversionLabel: string;
  value?: number;
  currency?: string;
}

/**
 * Conversion event configuration
 */
export interface ConversionConfig {
  eventName: TrackingEvent;
  funnelStage: FunnelStage;
  defaultValue?: number;
  googleAdsConversion?: GoogleAdsConversion;
  isKeyConversion: boolean;
}

// ============================================================================
// MANAGER TYPES
// ============================================================================

/**
 * Tracking result from ConversionManager
 */
export interface TrackingResult {
  success: boolean;
  event: TrackingEvent;
  timestamp: number;
  error?: string;
}

/**
 * Booking flow state
 */
export interface BookingFlowState {
  currentStep: BookingStep;
  startTime: number;
  completedSteps: BookingStep[];
  formData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    appointmentType: string;
    selectedDate: string;
    selectedTime: string;
    psychologistId: string;
  }>;
}

// ============================================================================
// WINDOW EXTENSIONS
// ============================================================================

// DataLayer can contain events or ecommerce clear objects
export type DataLayerItem = DataLayerEvent | { ecommerce: null } | Record<string, unknown>;

export {};
