import { fetchAvailableSlots, type AvailableSlot } from './halaxyAvailability';
import { log } from './logger';

/**
 * Availability Preloader Service
 * Preloads appointment availability data in the background when the home page loads.
 * This ensures faster calendar display when users open the booking modal.
 * 
 * Strategy:
 * 1. Initial load: Fetch first 4 weeks quickly to show availability fast
 * 2. Background load: Continue fetching remaining weeks (up to 6 months) in background
 */

interface CachedWeek {
  weekStart: string; // ISO date string for the Monday
  slots: AvailableSlot[];
  fetchedAt: number; // timestamp
}

// In-memory cache for preloaded availability
const availabilityCache: Map<string, CachedWeek> = new Map();

// Track preloading state
let isPreloading = false;
let preloadPromise: Promise<void> | null = null;
let isBackgroundLoading = false;

// Cache TTL: 2 minutes (slots can change frequently)
const CACHE_TTL_MS = 2 * 60 * 1000;

// Initial preload: fetch first 4 weeks quickly for fast first display
const INITIAL_WEEKS_TO_PRELOAD = 4;

// Total weeks to preload: 6 months ≈ 26 weeks
const TOTAL_WEEKS_TO_PRELOAD = 26;

// Delay between background fetches (longer to avoid overwhelming API)
const BACKGROUND_FETCH_DELAY_MS = 500;

// Track if we've scheduled initial load
let isScheduled = false;

/**
 * Get the Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cached: CachedWeek): boolean {
  return Date.now() - cached.fetchedAt < CACHE_TTL_MS;
}

/**
 * Fetch availability for a single week
 */
async function fetchWeekAvailability(weekStart: Date): Promise<AvailableSlot[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const slots = await fetchAvailableSlots({
    startDate: weekStart,
    endDate: weekEnd,
    duration: 60, // Standard 60-minute sessions
  });

  return slots;
}

/**
 * Preload availability for the next N weeks starting from the current week.
 * Phase 1: Fetch first 4 weeks quickly for fast initial display
 * Phase 2: Continue fetching remaining weeks (up to 6 months) in background
 * 
 * PERFORMANCE: Deferred until after LCP to avoid blocking initial render.
 * Uses PerformanceObserver to detect LCP, then waits for idle time.
 */
export async function preloadAvailability(): Promise<void> {
  // Prevent multiple schedules
  if (isScheduled) {
    return preloadPromise || Promise.resolve();
  }
  isScheduled = true;

  // Defer preloading until after LCP to improve page performance
  const schedulePreload = () => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => startPreload(), { timeout: 5000 });
    } else {
      // Fallback: wait 3 seconds after load
      setTimeout(() => startPreload(), 3000);
    }
  };

  // Use PerformanceObserver to detect LCP, then schedule preload
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          lcpObserver.disconnect();
          // Small delay after LCP to ensure paint is complete
          setTimeout(schedulePreload, 200);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // Fallback if LCP doesn't fire within 6s (it should have by then)
      setTimeout(() => {
        lcpObserver.disconnect();
        schedulePreload();
      }, 6000);
    } catch {
      // LCP observer not supported, use load event
      if (document.readyState === 'complete') {
        schedulePreload();
      } else {
        window.addEventListener('load', schedulePreload);
      }
    }
  } else {
    // No PerformanceObserver, wait for load + delay
    if (document.readyState === 'complete') {
      schedulePreload();
    } else {
      window.addEventListener('load', schedulePreload);
    }
  }

  return Promise.resolve();
}

/**
 * Actually start the preload process (called after LCP)
 */
async function startPreload(): Promise<void> {
  // If already preloading, return the existing promise
  if (preloadPromise) {
    return preloadPromise;
  }

  if (isPreloading) {
    return;
  }

  isPreloading = true;
  console.log('[AvailabilityPreloader] 🚀 Starting availability preload on page load');
  log.debug('Starting availability preload', 'AvailabilityPreloader');

  preloadPromise = (async () => {
    try {
      const startWeek = getWeekStart(new Date());
      
      // Phase 1: Load first 4 weeks quickly
      console.log(`[AvailabilityPreloader] Phase 1: Loading first ${INITIAL_WEEKS_TO_PRELOAD} weeks...`);
      
      for (let i = 0; i < INITIAL_WEEKS_TO_PRELOAD; i++) {
        await fetchAndCacheWeek(startWeek, i, 200);
      }

      console.log('[AvailabilityPreloader] ✅ Phase 1 complete - initial availability ready');
      
      // Dispatch event so UI components can update
      window.dispatchEvent(new CustomEvent('availabilityLoaded'));
      
      // Phase 2: Continue loading remaining weeks in background
      if (!isBackgroundLoading) {
        isBackgroundLoading = true;
        console.log(`[AvailabilityPreloader] Phase 2: Loading remaining weeks (up to 6 months)...`);
        
        // Use setTimeout to not block - this runs in background
        setTimeout(async () => {
          try {
            for (let i = INITIAL_WEEKS_TO_PRELOAD; i < TOTAL_WEEKS_TO_PRELOAD; i++) {
              await fetchAndCacheWeek(startWeek, i, BACKGROUND_FETCH_DELAY_MS);
            }
            console.log(`[AvailabilityPreloader] ✅ Phase 2 complete - ${TOTAL_WEEKS_TO_PRELOAD} weeks cached (6 months)`);
          } catch (error) {
            console.warn('[AvailabilityPreloader] Background loading error:', error);
          } finally {
            isBackgroundLoading = false;
          }
        }, 100);
      }

    } catch (error) {
      log.error('Error during availability preload', 'AvailabilityPreloader', error);
    } finally {
      isPreloading = false;
      preloadPromise = null;
    }
  })();

  return preloadPromise;
}

/**
 * Fetch and cache a single week's availability
 */
async function fetchAndCacheWeek(startWeek: Date, weekOffset: number, delayMs: number): Promise<void> {
  const weekStart = new Date(startWeek);
  weekStart.setDate(startWeek.getDate() + weekOffset * 7);
  const weekKey = weekStart.toISOString().split('T')[0];

  // Check if we already have valid cached data
  const cached = availabilityCache.get(weekKey);
  if (cached && isCacheValid(cached)) {
    log.debug(`Week ${weekKey} already cached`, 'AvailabilityPreloader');
    return;
  }

  // Fetch availability for this week
  log.debug(`Preloading week ${weekKey}`, 'AvailabilityPreloader');
  const slots = await fetchWeekAvailability(weekStart);

  // Cache the results
  availabilityCache.set(weekKey, {
    weekStart: weekKey,
    slots,
    fetchedAt: Date.now(),
  });

  console.log(`[AvailabilityPreloader] ✅ Week ${weekOffset + 1}/${TOTAL_WEEKS_TO_PRELOAD}: ${slots.length} slots for ${weekKey}`);
  log.debug(`Cached ${slots.length} slots for week ${weekKey}`, 'AvailabilityPreloader');

  // Delay between requests to be nice to the API
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

/**
 * Get cached availability for a specific week.
 * Returns null if not cached or cache is expired.
 */
export function getCachedAvailability(weekStart: Date): AvailableSlot[] | null {
  const weekKey = getWeekStart(weekStart).toISOString().split('T')[0];
  const cached = availabilityCache.get(weekKey);

  if (cached && isCacheValid(cached)) {
    log.debug(`Cache hit for week ${weekKey}`, 'AvailabilityPreloader');
    return cached.slots;
  }

  return null;
}

/**
 * Clear the availability cache (useful for testing or forced refresh)
 */
export function clearAvailabilityCache(): void {
  availabilityCache.clear();
  log.debug('Availability cache cleared', 'AvailabilityPreloader');
}

/**
 * Check if preloading is currently in progress
 */
export function isPreloadingAvailability(): boolean {
  return isPreloading;
}

/**
 * Get the next available slot from the cache.
 * Returns the earliest slot that is still in the future.
 */
export function getNextAvailableSlot(): AvailableSlot | null {
  const now = new Date();
  let earliestSlot: AvailableSlot | null = null;
  
  // Iterate through all cached weeks
  for (const [, cached] of availabilityCache) {
    if (!isCacheValid(cached)) continue;
    
    for (const slot of cached.slots) {
      const slotTime = new Date(slot.start);
      
      // Skip past slots
      if (slotTime <= now) continue;
      
      // Check if this is earlier than current earliest
      if (!earliestSlot || slotTime < new Date(earliestSlot.start)) {
        earliestSlot = slot;
      }
    }
  }
  
  return earliestSlot;
}
