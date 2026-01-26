/**
 * DataLayer Core Utilities
 * 
 * Pure functions for interacting with the GTM dataLayer.
 * All tracking flows through these utilities.
 */

import type { DataLayerEvent, FunnelStage, TrackingEvent } from '../types';

// ============================================================================
// DATALAYER INITIALIZATION
// ============================================================================

/**
 * Ensure dataLayer exists on window
 */
export function ensureDataLayer(): void {
  if (typeof window === 'undefined') return;
  
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}

/**
 * Check if dataLayer is available
 */
export function isDataLayerAvailable(): boolean {
  return typeof window !== 'undefined' && Array.isArray(window.dataLayer);
}

// ============================================================================
// BASE EVENT CREATION
// ============================================================================

/**
 * Get base event parameters that should be included with every event
 */
export function getBaseParams(): Record<string, unknown> {
  if (typeof window === 'undefined') {
    return {
      event_timestamp: Date.now(),
      page_path: '',
      page_title: '',
    };
  }

  return {
    event_timestamp: Date.now(),
    page_path: window.location.pathname,
    page_title: document.title,
    page_location: window.location.href,
    page_referrer: document.referrer || undefined,
  };
}

/**
 * Create a standardized dataLayer event
 */
export function createDataLayerEvent(
  event: TrackingEvent,
  category: FunnelStage,
  action: string,
  params: Record<string, unknown> = {}
): DataLayerEvent {
  const baseParams = getBaseParams();
  
  return {
    event,
    event_category: category,
    event_action: action,
    ...baseParams,
    ...params,
  };
}

// ============================================================================
// DATALAYER PUSH
// ============================================================================

/**
 * Push an event to the dataLayer
 */
export function pushToDataLayer(event: DataLayerEvent): boolean {
  ensureDataLayer();
  
  if (!isDataLayerAvailable() || !window.dataLayer) {
    console.warn('[DataLayer] dataLayer not available', event);
    return false;
  }

  try {
    window.dataLayer.push(event);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataLayer] Pushed event:', event.event, event);
    }
    
    return true;
  } catch (error) {
    console.error('[DataLayer] Push failed:', error);
    return false;
  }
}

/**
 * Push a simple event with minimal params
 */
export function pushSimpleEvent(
  event: TrackingEvent,
  category: FunnelStage,
  params?: Record<string, unknown>
): boolean {
  const dataLayerEvent = createDataLayerEvent(
    event,
    category,
    event, // action same as event name
    params
  );
  
  return pushToDataLayer(dataLayerEvent);
}

// ============================================================================
// ECOMMERCE EVENTS
// ============================================================================

/**
 * Push an ecommerce event (for booking conversions)
 */
export function pushEcommerceEvent(
  event: TrackingEvent,
  category: FunnelStage,
  value: number,
  transactionId?: string,
  additionalParams?: Record<string, unknown>
): boolean {
  const ecommerceEvent = createDataLayerEvent(event, category, event, {
    ecommerce: {
      currency: 'AUD',
      value,
      transaction_id: transactionId,
      items: [
        {
          item_id: 'psychology_session',
          item_name: 'Psychology Session',
          item_category: 'Healthcare',
          item_category2: 'Mental Health',
          price: value,
          quantity: 1,
        },
      ],
    },
    ...additionalParams,
  });

  return pushToDataLayer(ecommerceEvent);
}

// ============================================================================
// CONVERSION EVENTS
// ============================================================================

/**
 * Fire a Google Ads conversion via dataLayer
 * GTM will pick this up and fire the actual conversion tag
 */
export function pushConversionEvent(
  event: TrackingEvent,
  value: number,
  transactionId: string,
  additionalParams?: Record<string, unknown>
): boolean {
  const conversionEvent: DataLayerEvent = {
    event,
    event_category: 'action',
    event_action: 'conversion',
    event_value: Math.round(value * 100), // Store as cents
    transaction_id: transactionId,
    conversion_value: value,
    conversion_currency: 'AUD',
    ecommerce: {
      currency: 'AUD',
      value,
      transaction_id: transactionId,
      items: [
        {
          item_id: 'psychology_session',
          item_name: 'Psychology Session',
          item_category: 'Healthcare',
          price: value,
          quantity: 1,
        },
      ],
    },
    ...getBaseParams(),
    ...additionalParams,
  };

  return pushToDataLayer(conversionEvent);
}

// ============================================================================
// GTAG UTILITIES
// ============================================================================

/**
 * Check if gtag is available
 */
export function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Fire a gtag event directly (fallback if GTM not processing)
 */
export function fireGtagEvent(
  eventName: string,
  params?: Record<string, unknown>
): boolean {
  if (!isGtagAvailable() || !window.gtag) {
    console.warn('[Gtag] gtag not available');
    return false;
  }

  try {
    window.gtag('event', eventName, params);
    return true;
  } catch (error) {
    console.error('[Gtag] Event failed:', error);
    return false;
  }
}

/**
 * Fire a Google Ads conversion directly via gtag
 */
export function fireGtagConversion(
  conversionId: string,
  conversionLabel: string,
  value: number,
  transactionId: string
): boolean {
  // Enhanced debugging for conversion troubleshooting
  console.log('[Gtag] 🔍 Conversion attempt:', {
    conversionId,
    conversionLabel,
    value,
    transactionId,
    windowExists: typeof window !== 'undefined',
    gtagExists: typeof window !== 'undefined' && typeof window.gtag === 'function',
    gtagType: typeof window !== 'undefined' ? typeof window.gtag : 'N/A',
  });

  if (!isGtagAvailable() || !window.gtag) {
    console.error('[Gtag] ❌ gtag NOT AVAILABLE for conversion - this is why conversions are not tracking!');
    return false;
  }

  try {
    const sendTo = `${conversionId}/${conversionLabel}`;
    
    // Always log conversion attempts for debugging (remove after troubleshooting)
    console.log('[Gtag] 🎯 Firing Google Ads conversion:', {
      send_to: sendTo,
      value,
      currency: 'AUD',
      transaction_id: transactionId,
      gtag_type: typeof window.gtag,
    });
    
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value,
      currency: 'AUD',
      transaction_id: transactionId,
    });
    
    console.log('[Gtag] ✅ Conversion call completed');
    
    return true;
  } catch (error) {
    console.error('[Gtag] ❌ Conversion failed:', error);
    return false;
  }
}

// ============================================================================
// DATALAYER RESET
// ============================================================================

/**
 * Clear ecommerce data between events (GA4 requirement)
 */
export function clearEcommerceData(): void {
  ensureDataLayer();
  
  if (isDataLayerAvailable() && window.dataLayer) {
    window.dataLayer.push({ ecommerce: null });
  }
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Get all events currently in dataLayer
 */
export function getDataLayerEvents(): DataLayerEvent[] {
  if (!isDataLayerAvailable() || !window.dataLayer) return [];
  
  return window.dataLayer.filter(
    (item): item is DataLayerEvent => 
      typeof item === 'object' && 
      item !== null && 
      'event' in item
  );
}

/**
 * Log current dataLayer state (development only)
 */
export function debugDataLayer(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const events = getDataLayerEvents();
  console.group('[DataLayer Debug]');
  console.log('Total items:', window.dataLayer?.length || 0);
  console.log('Events:', events.length);
  console.table(events.map(e => ({
    event: e.event,
    category: e.event_category,
    action: e.event_action,
    value: e.event_value,
  })));
  console.groupEnd();
}
