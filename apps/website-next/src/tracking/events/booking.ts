/**
 * Booking Workflow Events
 * 
 * Comprehensive tracking for the entire booking funnel.
 * Each step is tracked to enable funnel analysis and drop-off detection.
 */

import type {
  BookingStep,
  StartBookingParams,
  CompleteDetailsParams,
  SelectDatetimeParams,
  InitiatePaymentParams,
  ConfirmBookingParams,
  CompleteBookingParams,
  AbandonBookingParams,
  BookingFlowState,
  TrackingResult,
} from '../types';

import {
  pushToDataLayer,
  createDataLayerEvent,
  pushConversionEvent,
  fireGtagConversion,
  fireGtagEvent,
  clearEcommerceData,
} from '../core/dataLayer';

import {
  getIntentScore,
  getStoredGCLID,
  getStoredUTMParams,
  hasConversionFired,
  markConversionFired,
} from '../core/session';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_ADS_CONVERSION_ID = 'AW-11563740075';
const BOOKING_CONVERSION_LABEL = 'FqhOCJgmqfDzEKvXgoor';
const DEFAULT_BOOKING_VALUE = 250;

const STORAGE_KEY = 'lpa_booking_flow_state';

// ============================================================================
// BOOKING FLOW STATE MANAGEMENT
// ============================================================================

/**
 * Get current booking flow state
 */
export function getBookingFlowState(): BookingFlowState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save booking flow state
 */
function saveBookingFlowState(state: BookingFlowState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear booking flow state
 */
export function clearBookingFlowState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Initialize or get booking flow state
 */
function ensureBookingFlowState(): BookingFlowState {
  let state = getBookingFlowState();
  
  if (!state) {
    state = {
      currentStep: 'start',
      startTime: Date.now(),
      completedSteps: [],
      formData: {},
    };
    saveBookingFlowState(state);
  }
  
  return state;
}

/**
 * Update booking flow state
 */
function updateBookingFlowState(
  step: BookingStep,
  formData?: Partial<BookingFlowState['formData']>
): BookingFlowState {
  const state = ensureBookingFlowState();
  
  state.currentStep = step;
  
  if (!state.completedSteps.includes(step)) {
    state.completedSteps.push(step);
  }
  
  if (formData) {
    state.formData = { ...state.formData, ...formData };
  }
  
  saveBookingFlowState(state);
  return state;
}

// ============================================================================
// BOOKING STEP TRACKING
// ============================================================================

/**
 * Track booking start (form opened)
 */
export function trackBookingStart(params: Partial<StartBookingParams> = {}): TrackingResult {
  const state = ensureBookingFlowState();
  updateBookingFlowState('start');
  
  const utmParams = getStoredUTMParams() || {};
  
  const event = createDataLayerEvent('start_booking', 'action', 'booking_funnel_start', {
    entry_point: params.entry_point || 'unknown',
    service_preselected: params.service_preselected,
    lpa_booking_step: 'start',
    lpa_intent_score: getIntentScore(),
    gclid: getStoredGCLID(),
    ...utmParams,
  });

  const dataLayerSuccess = pushToDataLayer(event);

  // Fire GA4 begin_checkout event directly (standard ecommerce event)
  const ga4Success = fireGtagEvent('begin_checkout', {
    currency: 'AUD',
    value: 250, // Estimated value
    items: [{
      item_id: 'psychology_session',
      item_name: 'Psychology Session',
      item_category: 'Healthcare',
      price: 250,
      quantity: 1,
    }],
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] Start tracked', { state, params, ga4Success });
  }

  return {
    success: dataLayerSuccess || ga4Success,
    event: 'start_booking',
    timestamp: Date.now(),
  };
}

/**
 * Track details completion (user info submitted)
 */
export function trackDetailsComplete(params: Partial<CompleteDetailsParams> & {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  appointmentType?: string;
} = {}): TrackingResult {
  updateBookingFlowState('details', {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: params.phone,
    appointmentType: params.appointmentType,
  });

  const event = createDataLayerEvent('complete_details', 'action', 'booking_funnel_details', {
    is_returning_user: params.is_returning_user || false,
    appointment_type: params.appointmentType || params.appointment_type || 'unknown',
    lpa_booking_step: 'details',
    lpa_intent_score: getIntentScore(),
    has_phone: !!params.phone,
    has_email: !!params.email,
  });

  const success = pushToDataLayer(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] Details complete tracked', params);
  }

  return {
    success,
    event: 'complete_details',
    timestamp: Date.now(),
  };
}

/**
 * Track datetime selection
 */
export function trackDatetimeSelected(params: Partial<SelectDatetimeParams> & {
  selectedDate?: string;
  selectedTime?: string;
} = {}): TrackingResult {
  updateBookingFlowState('datetime', {
    selectedDate: params.selectedDate || params.selected_date,
    selectedTime: params.selectedTime || params.selected_time,
  });

  // Calculate days in advance
  let daysInAdvance = 0;
  const selectedDate = params.selectedDate || params.selected_date;
  if (selectedDate) {
    const selected = new Date(selectedDate);
    const today = new Date();
    daysInAdvance = Math.ceil((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Determine time slot type
  let timeSlotType: 'morning' | 'afternoon' | 'evening' = 'morning';
  const selectedTime = params.selectedTime || params.selected_time;
  if (selectedTime) {
    const hour = parseInt(selectedTime.split(':')[0], 10);
    if (hour >= 17) timeSlotType = 'evening';
    else if (hour >= 12) timeSlotType = 'afternoon';
  }

  const event = createDataLayerEvent('select_datetime', 'action', 'booking_funnel_datetime', {
    days_in_advance: daysInAdvance,
    time_slot_type: timeSlotType,
    selected_date: selectedDate,
    selected_time: selectedTime,
    lpa_booking_step: 'datetime',
    lpa_intent_score: getIntentScore(),
  });

  const success = pushToDataLayer(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] Datetime selected tracked', { daysInAdvance, timeSlotType, params });
  }

  return {
    success,
    event: 'select_datetime',
    timestamp: Date.now(),
  };
}

/**
 * Track payment initiation
 */
export function trackPaymentInitiated(params: Partial<InitiatePaymentParams> = {}): TrackingResult {
  updateBookingFlowState('payment');

  const bookingValue = params.booking_value || DEFAULT_BOOKING_VALUE;

  // Clear any previous ecommerce data
  clearEcommerceData();

  const event = createDataLayerEvent('initiate_payment', 'action', 'booking_funnel_payment', {
    payment_method: params.payment_method || 'card',
    booking_value: bookingValue,
    lpa_booking_step: 'payment',
    lpa_intent_score: getIntentScore(),
    ecommerce: {
      currency: 'AUD',
      value: bookingValue,
      items: [{
        item_id: 'psychology_session',
        item_name: 'Psychology Session',
        item_category: 'Healthcare',
        price: bookingValue,
        quantity: 1,
      }],
    },
  });

  const success = pushToDataLayer(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] Payment initiated tracked', { bookingValue, params });
  }

  return {
    success,
    event: 'initiate_payment',
    timestamp: Date.now(),
  };
}

/**
 * Track booking confirmation (before final success)
 */
export function trackBookingConfirmed(params: Partial<ConfirmBookingParams> & {
  bookingId?: string;
  psychologistId?: string;
  psychologistName?: string;
} = {}): TrackingResult {
  updateBookingFlowState('confirm', {
    psychologistId: params.psychologistId || params.psychologist_id,
  });

  const bookingValue = params.booking_value || DEFAULT_BOOKING_VALUE;
  const bookingId = params.bookingId || params.booking_id || `booking_${Date.now()}`;

  const event = createDataLayerEvent('confirm_booking', 'action', 'booking_funnel_confirm', {
    booking_id: bookingId,
    booking_value: bookingValue,
    psychologist_id: params.psychologistId || params.psychologist_id,
    psychologist_name: params.psychologistName || params.psychologist_name,
    appointment_type: params.appointment_type || 'standard',
    lpa_booking_step: 'confirm',
    lpa_intent_score: getIntentScore(),
  });

  const success = pushToDataLayer(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] Confirmation tracked', { bookingId, bookingValue, params });
  }

  return {
    success,
    event: 'confirm_booking',
    timestamp: Date.now(),
  };
}

/**
 * Track booking completion (success page)
 * This is the primary conversion event
 */
export function trackBookingComplete(params: Partial<CompleteBookingParams> & {
  bookingId?: string;
} = {}): TrackingResult {
  // Prevent duplicate conversions
  if (hasConversionFired('complete_booking')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Booking] Complete already fired, skipping duplicate');
    }
    return {
      success: true,
      event: 'complete_booking',
      timestamp: Date.now(),
      error: 'Duplicate conversion prevented',
    };
  }

  updateBookingFlowState('success');

  const bookingValue = params.booking_value || DEFAULT_BOOKING_VALUE;
  const transactionId = params.transaction_id || `lpa_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const bookingId = params.bookingId || params.booking_id;

  // Clear any previous ecommerce data
  clearEcommerceData();

  // Push the conversion event to dataLayer (for GTM if present)
  const dataLayerSuccess = pushConversionEvent(
    'complete_booking',
    bookingValue,
    transactionId,
    {
      booking_id: bookingId,
      is_first_booking: params.is_first_booking || false,
      lpa_booking_step: 'success',
      lpa_intent_score: getIntentScore(),
      gclid: getStoredGCLID(),
    }
  );

  // Fire Google Ads conversion directly
  const gtagSuccess = fireGtagConversion(
    GOOGLE_ADS_CONVERSION_ID,
    BOOKING_CONVERSION_LABEL,
    bookingValue,
    transactionId
  );

  // Fire GA4 purchase event directly (required for GA4 without GTM)
  const ga4Success = fireGtagEvent('purchase', {
    transaction_id: transactionId,
    value: bookingValue,
    currency: 'AUD',
    items: [{
      item_id: bookingId || 'psychology_session',
      item_name: 'Psychology Session',
      item_category: 'Healthcare',
      price: bookingValue,
      quantity: 1,
    }],
  });

  // Mark conversion as fired
  markConversionFired('complete_booking');

  // Clear booking flow state
  clearBookingFlowState();

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] ✅ Complete tracked', {
      transactionId,
      bookingValue,
      dataLayerSuccess,
      gtagSuccess,
      ga4Success,
      params,
    });
  }

  return {
    success: dataLayerSuccess || gtagSuccess || ga4Success,
    event: 'complete_booking',
    timestamp: Date.now(),
  };
}

/**
 * Track booking abandonment
 */
export function trackBookingAbandonment(params: Partial<AbandonBookingParams> = {}): TrackingResult {
  const state = getBookingFlowState();
  
  if (!state) {
    return {
      success: false,
      event: 'abandon_booking',
      timestamp: Date.now(),
      error: 'No booking flow state',
    };
  }

  const timeInFlow = Math.floor((Date.now() - state.startTime) / 1000);

  const event = createDataLayerEvent('abandon_booking', 'action', 'booking_funnel_abandon', {
    abandon_step: params.abandon_step || state.currentStep,
    time_in_flow_seconds: timeInFlow,
    completed_steps: state.completedSteps.join(','),
    lpa_booking_step: state.currentStep,
    lpa_intent_score: getIntentScore(),
  });

  const success = pushToDataLayer(event);

  // Clear booking flow state on abandonment
  clearBookingFlowState();

  if (process.env.NODE_ENV === 'development') {
    console.log('[Booking] Abandonment tracked', { step: state.currentStep, timeInFlow, state });
  }

  return {
    success,
    event: 'abandon_booking',
    timestamp: Date.now(),
  };
}

// ============================================================================
// BOOKING ANALYTICS
// ============================================================================

/**
 * Get booking funnel metrics
 */
export function getBookingFunnelMetrics(): {
  currentStep: BookingStep | null;
  completedSteps: BookingStep[];
  timeInFunnelSeconds: number;
  intentScore: number;
} {
  const state = getBookingFlowState();
  
  if (!state) {
    return {
      currentStep: null,
      completedSteps: [],
      timeInFunnelSeconds: 0,
      intentScore: getIntentScore(),
    };
  }

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    timeInFunnelSeconds: Math.floor((Date.now() - state.startTime) / 1000),
    intentScore: getIntentScore(),
  };
}

/**
 * Calculate step completion rate (for internal analytics)
 */
export function getStepCompletionRate(): Record<BookingStep, boolean> {
  const state = getBookingFlowState();

  const completionRate: Record<BookingStep, boolean> = {
    start: false,
    details: false,
    verify: false,
    datetime: false,
    session: false,
    payment: false,
    confirm: false,
    success: false,
    error: false,
  };

  if (state) {
    state.completedSteps.forEach(step => {
      completionRate[step] = true;
    });
  }

  return completionRate;
}
