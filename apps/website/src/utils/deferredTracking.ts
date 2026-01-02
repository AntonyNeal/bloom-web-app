/**
 * Deferred Tracking System
 * 
 * Queues tracking calls until the tracking SDK is loaded.
 * This prevents blocking the main thread during initial render.
 * 
 * The tracking SDK (conversionManager) is loaded after first contentful paint
 * using requestIdleCallback, ensuring optimal TBT scores.
 */

type QueuedCall = {
  method: string;
  args: unknown[];
};

// Queue to hold tracking calls before SDK loads
const trackingQueue: QueuedCall[] = [];
let trackingReady = false;
let conversionManagerInstance: typeof import('../tracking').conversionManager | null = null;

/**
 * Queues a tracking call or executes immediately if SDK is loaded
 */
export function queueTrackingCall(method: string, ...args: unknown[]): void {
  if (trackingReady && conversionManagerInstance) {
    // SDK loaded - execute immediately
    const fn = (conversionManagerInstance as unknown as Record<string, (...args: unknown[]) => void>)[method];
    if (typeof fn === 'function') {
      fn.apply(conversionManagerInstance, args);
    }
  } else {
    // Queue for later
    trackingQueue.push({ method, args });
  }
}

/**
 * Lightweight scroll depth tracker - queues calls until SDK ready
 */
export function deferredTrackScrollDepth(percent: number): void {
  queueTrackingCall('_scrollDepth', percent);
}

/**
 * Lightweight book now click tracker - queues calls until SDK ready
 */
export function deferredTrackBookNowClick(params: { 
  buttonLocation: string;
  pageSection?: string;
  variant?: string;
}): void {
  queueTrackingCall('trackBookNowClick', params);
}

/**
 * Process all queued tracking calls after SDK loads
 */
function processQueue(): void {
  if (!conversionManagerInstance) return;
  
  while (trackingQueue.length > 0) {
    const call = trackingQueue.shift();
    if (call) {
      // Handle special internal methods
      if (call.method === '_scrollDepth') {
        import('./trackingEvents').then(({ trackScrollDepth }) => {
          trackScrollDepth(call.args[0] as number);
        });
      } else {
        const fn = (conversionManagerInstance as unknown as Record<string, (...args: unknown[]) => void>)[call.method];
        if (typeof fn === 'function') {
          fn.apply(conversionManagerInstance, call.args);
        }
      }
    }
  }
}

/**
 * Initializes deferred tracking system after first paint
 * Call this from App.tsx using requestIdleCallback
 */
export async function initializeDeferredTracking(): Promise<void> {
  try {
    // Dynamically import the tracking module
    const tracking = await import('../tracking');
    conversionManagerInstance = tracking.conversionManager;
    
    // Initialize conversion manager if not already initialized
    if (typeof conversionManagerInstance.initialize === 'function') {
      conversionManagerInstance.initialize();
    }
    
    trackingReady = true;
    
    // Process any queued calls
    processQueue();
    
    // Also load Google Ads tag
    const { injectGoogleAdsTag } = await import('./googleAds');
    injectGoogleAdsTag();
    
    if (import.meta.env.DEV) {
      console.log('[DeferredTracking] Initialized, processed queue:', trackingQueue.length, 'calls');
    }
  } catch (error) {
    console.error('[DeferredTracking] Failed to initialize:', error);
  }
}

/**
 * Check if tracking is ready (useful for conditional rendering)
 */
export function isTrackingReady(): boolean {
  return trackingReady;
}

/**
 * Get the conversion manager instance (may be null if not loaded)
 */
export function getConversionManager(): typeof conversionManagerInstance {
  return conversionManagerInstance;
}
