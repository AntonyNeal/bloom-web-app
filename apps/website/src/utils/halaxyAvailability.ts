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
    const functionUrl = import.meta.env[
      'VITE_HALAXY_AVAILABILITY_FUNCTION_URL'
    ];

    if (!functionUrl) {
      log.warn(
        'VITE_HALAXY_AVAILABILITY_FUNCTION_URL not configured - using fallback',
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
