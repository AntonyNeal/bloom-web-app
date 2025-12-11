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
      log.debug('Received availability slots', 'HalaxyAvailability', {
        total: data.total || data.entry.length,
      });

      // Return slots exactly as provided by the API
      // Backend handles all filtering (buffer time, lead time, etc.)
      return data.entry.map((entry) => ({
        start: entry.resource.start,
        end: entry.resource.end,
        duration: params.duration,
      }));
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

