import { log } from './logger';

/**
 * Halaxy Availability Service
 * Fetches real available appointment slots from Halaxy API
 */

export interface AvailableSlot {
  start: string; // ISO 8601 datetime
  end: string;
  duration: number; // minutes
}

export interface AvailabilityParams {
  startDate: Date;
  endDate: Date;
  duration: number; // minutes (60 for standard session)
  practitionerId?: string;
  organizationId?: string;
}

interface HalaxyFHIRBundle {
  resourceType: string;
  total?: number;
  entry?: Array<{
    resource: {
      start: string;
      end: string;
      status?: string;
    };
  }>;
}

// Business hours configuration (Melbourne time)
const BUSINESS_START_HOUR = 8; // 8am
const BUSINESS_END_HOUR = 18; // 6pm
const BOOKING_BUFFER_HOURS = 3; // Minimum 3 business hours in advance

/**
 * Check if a given date is a business day (Monday-Friday)
 */
function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

/**
 * Calculate the earliest bookable time (3 business hours from now)
 * Business hours: 8am - 6pm, Monday - Friday
 * 
 * Examples:
 * - 10am Monday → 1pm Monday (same day, +3 hours)
 * - 4pm Monday → 11am Tuesday (next day, since 4pm + 3 = 7pm is after hours)
 * - 5pm Friday → 11am Monday (skips weekend)
 * - 9am Saturday → 11am Monday (starts Monday 8am + 3 hours)
 */
export function getEarliestBookableTime(): Date {
  const now = new Date();
  let remainingHours = BOOKING_BUFFER_HOURS;
  const result = new Date(now);

  // If we're before business hours on a business day, start at business start
  if (isBusinessDay(result) && result.getHours() < BUSINESS_START_HOUR) {
    result.setHours(BUSINESS_START_HOUR, 0, 0, 0);
  }

  // If we're after business hours or on a weekend, move to next business day start
  if (!isBusinessDay(result) || result.getHours() >= BUSINESS_END_HOUR) {
    // Move to next day
    result.setDate(result.getDate() + 1);
    result.setHours(BUSINESS_START_HOUR, 0, 0, 0);
    
    // Skip weekends
    while (!isBusinessDay(result)) {
      result.setDate(result.getDate() + 1);
    }
  }

  // Now add the buffer hours, respecting business hours
  while (remainingHours > 0) {
    const hoursLeftToday = BUSINESS_END_HOUR - result.getHours();
    
    if (remainingHours <= hoursLeftToday) {
      // Can fit remaining hours in today
      result.setHours(result.getHours() + remainingHours);
      remainingHours = 0;
    } else {
      // Use up today's hours and move to next business day
      remainingHours -= hoursLeftToday;
      result.setDate(result.getDate() + 1);
      result.setHours(BUSINESS_START_HOUR, 0, 0, 0);
      
      // Skip weekends
      while (!isBusinessDay(result)) {
        result.setDate(result.getDate() + 1);
      }
    }
  }

  // Round to the next hour for cleaner slot times
  if (result.getMinutes() > 0) {
    result.setHours(result.getHours() + 1, 0, 0, 0);
  }

  return result;
}

/**
 * Fetch available appointment slots from Halaxy
 */
export async function fetchAvailableSlots(
  params: AvailabilityParams
): Promise<AvailableSlot[]> {
  try {
    const configuredUrl =
      import.meta.env['VITE_AVAILABILITY_FUNCTION_URL'] ||
      import.meta.env['VITE_HALAXY_AVAILABILITY_FUNCTION_URL'];

    const azureFunctionsBase =
      import.meta.env['VITE_AZURE_FUNCTION_URL'] ||
      import.meta.env['VITE_AZURE_FUNCTIONS_URL'];

    const defaultUrl = azureFunctionsBase
      ? `${azureFunctionsBase.replace(/\/$/, '')}/api/halaxy/availability`
      : undefined;

    const functionUrl = configuredUrl || defaultUrl;

    if (!functionUrl) {
      log.warn(
        'Availability function URL not configured; set VITE_AVAILABILITY_FUNCTION_URL or VITE_AZURE_FUNCTION_URL',
        'HalaxyAvailability'
      );
      return [];
    }

    const queryParams = new URLSearchParams({
      start: params.startDate.toISOString(),
      end: params.endDate.toISOString(),
      duration: params.duration.toString(),
      show: 'first-available',
    });

    if (params.practitionerId) {
      queryParams.append('practitioner', params.practitionerId);
    }

    if (params.organizationId) {
      queryParams.append('organization', params.organizationId);
    }

    // Build the URL - functionUrl may be relative (/api/...) or absolute
    const endpoint = `${functionUrl}?${queryParams.toString()}`;

    log.debug('Fetching availability', 'HalaxyAvailability', { endpoint });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/fhir+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      log.error('Failed to fetch availability', 'HalaxyAvailability', {
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data: HalaxyFHIRBundle = await response.json();

    // Parse Halaxy response (FHIR Bundle with Slot resources)
    if (data.resourceType === 'Bundle' && data.entry) {
      // Get earliest bookable time (3 business hours from now)
      const earliestBookable = getEarliestBookableTime();
      
      console.log('[HalaxyAvailability] Earliest bookable time:', earliestBookable.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }));
      log.debug('Filtering slots by earliest bookable time', 'HalaxyAvailability', {
        earliestBookable: earliestBookable.toISOString(),
        totalSlotsFromAPI: data.entry.length,
      });

      const allSlots = data.entry.map((entry) => ({
        start: entry.resource.start,
        end: entry.resource.end,
        duration: params.duration,
      }));

      // Filter out slots that are before the earliest bookable time
      const bookableSlots = allSlots.filter((slot) => {
        const slotStart = new Date(slot.start);
        return slotStart >= earliestBookable;
      });

      console.log(`[HalaxyAvailability] Filtered ${allSlots.length - bookableSlots.length} slots before buffer, ${bookableSlots.length} available`);
      log.debug('Received availability slots', 'HalaxyAvailability', {
        total: bookableSlots.length,
        filteredOut: allSlots.length - bookableSlots.length,
      });

      return bookableSlots;
    }

    return [];
  } catch (error) {
    log.error('Error fetching slots', 'HalaxyAvailability', error);
    return [];
  }
}

/**
 * Group slots by date for calendar display
 */
export function groupSlotsByDate(
  slots: AvailableSlot[]
): Map<string, AvailableSlot[]> {
  const grouped = new Map<string, AvailableSlot[]>();

  slots.forEach((slot) => {
    // Skip slots with invalid data
    if (!slot || !slot.start) {
      log.warn('Skipping invalid slot', 'HalaxyAvailability', { slot });
      return;
    }

    const date = slot.start.split('T')[0]; // YYYY-MM-DD

    if (!grouped.has(date)) {
      grouped.set(date, []);
    }

    grouped.get(date)!.push(slot);
  });

  return grouped;
}

/**
 * Format time for display (e.g., "9:00 am")
 */
export function formatTimeSlot(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'pm' : 'am';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const minuteStr = minutes === 0 ? '00' : minutes.toString().padStart(2, '0');

  return `${hours}:${minuteStr} ${period}`;
}
