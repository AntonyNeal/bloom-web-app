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

// Melbourne timezone offset (AEDT = UTC+11, AEST = UTC+10)
// Using AEDT for summer months
const MELBOURNE_OFFSET_HOURS = 11;

/**
 * Convert a UTC date to Melbourne local time
 */
function toMelbourneTime(utcDate: Date): Date {
  return new Date(utcDate.getTime() + MELBOURNE_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Get the hour in Melbourne time from a UTC date
 */
function getMelbourneHour(utcDate: Date): number {
  return toMelbourneTime(utcDate).getUTCHours();
}

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
 * Split a large availability block into individual bookable time slots
 * 
 * Halaxy returns availability as large blocks (e.g., 8am-7pm).
 * This function splits them into individual slots based on the requested duration.
 * Only includes slots within business hours (Melbourne time).
 * 
 * @param block - The availability block with start/end times
 * @param durationMinutes - The appointment duration (default 60 minutes)
 * @returns Array of individual bookable time slots
 */
function splitAvailabilityBlock(
  block: { start: string; end: string },
  durationMinutes: number = 60
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  
  const blockStart = new Date(block.start);
  const blockEnd = new Date(block.end);
  
  // Start from the beginning of the block
  let slotStart = new Date(blockStart);
  
  // Generate slots until we run out of availability
  while (slotStart.getTime() + durationMinutes * 60 * 1000 <= blockEnd.getTime()) {
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
    
    // Check if slot is within business hours (Melbourne time)
    const melbourneHour = getMelbourneHour(slotStart);
    
    // Check if the slot STARTS within business hours (8am to 6pm inclusive)
    // A slot starting at 6pm (18:00) is the last valid slot of the day
    const isWithinBusinessHours = 
      melbourneHour >= BUSINESS_START_HOUR && 
      melbourneHour <= BUSINESS_END_HOUR;
    
    if (isWithinBusinessHours) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        duration: durationMinutes,
      });
    }
    
    // Move to next slot (advance by duration)
    slotStart = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
  }
  
  return slots;
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

      // Split large availability blocks into individual bookable time slots
      // Halaxy returns availability as large blocks (e.g., 8am-7pm)
      // We need to split them into individual slots based on appointment duration
      const individualSlots: AvailableSlot[] = [];
      
      for (const entry of data.entry) {
        const block = {
          start: entry.resource.start,
          end: entry.resource.end,
        };
        
        // Calculate block duration to determine if splitting is needed
        const blockStart = new Date(block.start);
        const blockEnd = new Date(block.end);
        const blockDurationMinutes = (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60);
        
        if (blockDurationMinutes > params.duration) {
          // Large block - split into individual slots
          const splitSlots = splitAvailabilityBlock(block, params.duration);
          individualSlots.push(...splitSlots);
        } else {
          // Small block - use as-is
          individualSlots.push({
            start: block.start,
            end: block.end,
            duration: params.duration,
          });
        }
      }
      
      console.log(`[HalaxyAvailability] Split ${data.entry.length} blocks into ${individualSlots.length} individual slots`);

      // Filter out slots that are before the earliest bookable time
      const bookableSlots = individualSlots.filter((slot) => {
        const slotStart = new Date(slot.start);
        return slotStart >= earliestBookable;
      });

      console.log(`[HalaxyAvailability] Filtered ${individualSlots.length - bookableSlots.length} slots before buffer, ${bookableSlots.length} available`);
      log.debug('Received availability slots', 'HalaxyAvailability', {
        total: bookableSlots.length,
        filteredOut: individualSlots.length - bookableSlots.length,
        blocksFromAPI: data.entry.length,
        afterSplitting: individualSlots.length,
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
 * Uses Melbourne/Sydney timezone for date grouping
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

    // Convert UTC to Melbourne time for correct date grouping
    const utcDate = new Date(slot.start);
    const melbourneDate = toMelbourneTime(utcDate);
    
    // Format as YYYY-MM-DD in Melbourne time
    const year = melbourneDate.getUTCFullYear();
    const month = String(melbourneDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(melbourneDate.getUTCDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    if (!grouped.has(date)) {
      grouped.set(date, []);
    }

    grouped.get(date)!.push(slot);
  });

  return grouped;
}

/**
 * Format time for display (e.g., "9:00 am")
 * Uses Melbourne/Sydney timezone for correct time display
 */
export function formatTimeSlot(isoDateTime: string): string {
  const utcDate = new Date(isoDateTime);
  const melbourneDate = toMelbourneTime(utcDate);
  
  let hours = melbourneDate.getUTCHours();
  const minutes = melbourneDate.getUTCMinutes();
  const period = hours >= 12 ? 'pm' : 'am';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const minuteStr = minutes === 0 ? '00' : minutes.toString().padStart(2, '0');

  return `${hours}:${minuteStr} ${period}`;
}

/**
 * Calculate time until next available slot
 * Returns a human-readable string like "Available in 2 days" or "Available in 5 hours"
 * Minimum is 3 hours (booking buffer)
 * 
 * @param nextSlotStart - ISO datetime string of next available slot
 * @returns Human-readable availability string
 */
export function getTimeUntilAvailability(nextSlotStart: string | null): string {
  if (!nextSlotStart) {
    return 'Check availability';
  }

  const slotTime = new Date(nextSlotStart);
  
  // Format as "Day HH:mm" (e.g., "Tuesday 6:00 pm")
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const parts = formatter.formatToParts(slotTime);
  const dayName = parts.find(p => p.type === 'weekday')?.value || '';
  const time = parts
    .filter(p => ['hour', 'minute', 'dayPeriod'].includes(p.type))
    .map(p => p.value)
    .join('');
  
  return `Available ${dayName} ${time}`;
}

