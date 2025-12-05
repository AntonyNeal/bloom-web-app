import { fetchAvailableSlots, type AvailableSlot } from './halaxyAvailability';
import { log } from './logger';

/**
 * Availability Preloader Service
 * Preloads appointment availability data in the background when the home page loads.
 * This ensures faster calendar display when users open the booking modal.
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

// Cache TTL: 2 minutes (slots can change frequently)
const CACHE_TTL_MS = 2 * 60 * 1000;

// How many weeks to preload
const WEEKS_TO_PRELOAD = 4;

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
 * Fetches one week at a time to avoid overwhelming the API.
 * Called automatically when the home page loads.
 */
export async function preloadAvailability(): Promise<void> {
  // If already preloading, return the existing promise
  if (preloadPromise) {
    return preloadPromise;
  }

  if (isPreloading) {
    return;
  }

  isPreloading = true;
  log.debug('Starting availability preload', 'AvailabilityPreloader');

  preloadPromise = (async () => {
    try {
      const startWeek = getWeekStart(new Date());

      for (let i = 0; i < WEEKS_TO_PRELOAD; i++) {
        const weekStart = new Date(startWeek);
        weekStart.setDate(startWeek.getDate() + i * 7);
        const weekKey = weekStart.toISOString().split('T')[0];

        // Check if we already have valid cached data
        const cached = availabilityCache.get(weekKey);
        if (cached && isCacheValid(cached)) {
          log.debug(`Week ${weekKey} already cached`, 'AvailabilityPreloader');
          continue;
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

        log.debug(`Cached ${slots.length} slots for week ${weekKey}`, 'AvailabilityPreloader');

        // Small delay between requests to be nice to the API
        if (i < WEEKS_TO_PRELOAD - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      log.debug('Availability preload complete', 'AvailabilityPreloader');
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
