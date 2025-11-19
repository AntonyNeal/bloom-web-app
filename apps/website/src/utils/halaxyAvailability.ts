import { apiService } from '../services/ApiService';
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
  entry?: Array<{
    resource: {
      start: string;
      end: string;
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
      log.error(
        'VITE_HALAXY_AVAILABILITY_FUNCTION_URL not configured',
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

    const endpoint = `${functionUrl}?${queryParams.toString()}`;
    const result = await apiService.get<HalaxyFHIRBundle>(endpoint, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      timeout: 10000, // 10 second timeout for availability check
    });

    if (!result.success || !result.data) {
      log.error('Failed to fetch availability', 'HalaxyAvailability', {
        error: result.error,
      });
      return [];
    }

    const data = result.data;

    // Parse Halaxy response (FHIR Bundle with Slot resources)
    if (data.resourceType === 'Bundle' && data.entry) {
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
