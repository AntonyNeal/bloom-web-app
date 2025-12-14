import { log } from './logger';

/**
 * Halaxy Availability Service
 * Fetches real available appointment slots directly from Halaxy's public booking API (v2)
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

// Halaxy public booking API v2 response types
interface HalaxyTimeslot {
  dateTimeKey: string; // e.g., "20251215-080000"
  day: string; // e.g., "2025-12-15"
  startDateUserTime: string; // ISO 8601 with timezone
  timeLabel: string; // e.g., "8:00 am"
  timeSection: string; // "morning" | "afternoon" | "evening"
  userTimezone: string;
  status?: string; // e.g., "notice-required"
}

interface HalaxyAvailabilityResponse {
  _metadata: {
    totalCount: number;
  };
  data: {
    clinics: Record<string, string>;
    practitioners: Record<string, string>;
    preferences: {
      timeslotStrategy: string;
      unavailableText: string;
      noticeDuration: number;
    };
    timeslots: Record<string, HalaxyTimeslot[]>;
  };
}

// Default Halaxy IDs for Life Psychology Australia
const DEFAULT_PRACTITIONER_ID = '1304541'; // Zoe Semmler
const DEFAULT_CLINIC_ID = '1023041'; // Life Psychology Australia
const DEFAULT_FEE_ID = '9381231'; // Standard session fee

/**
 * Fetch available appointment slots directly from Halaxy's public booking API
 */
export async function fetchAvailableSlots(
  params: AvailabilityParams
): Promise<AvailableSlot[]> {
  try {
    const practitionerId = params.practitionerId || DEFAULT_PRACTITIONER_ID;
    const clinicId = params.organizationId || DEFAULT_CLINIC_ID;
    
    // Format dates as YYYY-MM-DD for Halaxy API
    const dateFrom = params.startDate.toISOString().split('T')[0];
    const dateTo = params.endDate.toISOString().split('T')[0];

    const queryParams = new URLSearchParams({
      practitioner: practitionerId,
      clinic: clinicId,
      dateFrom,
      dateTo,
      duration: params.duration.toString(),
      fee: DEFAULT_FEE_ID,
    });

    const endpoint = `https://www.halaxy.com/api/v2/open/booking/timeslot/availability?${queryParams.toString()}`;

    log.debug('Fetching availability from Halaxy v2 API', 'HalaxyAvailability', { endpoint });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      log.error('Failed to fetch availability from Halaxy', 'HalaxyAvailability', {
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data: HalaxyAvailabilityResponse = await response.json();

    // Convert Halaxy timeslots to our AvailableSlot format
    const slots: AvailableSlot[] = [];

    if (data.data?.timeslots) {
      Object.entries(data.data.timeslots).forEach(([_date, daySlots]) => {
        daySlots.forEach((slot) => {
          // Skip slots that require notice (too soon to book)
          if (slot.status === 'notice-required') {
            return;
          }

          // Parse the startDateUserTime and calculate end time
          const startTime = new Date(slot.startDateUserTime);
          const endTime = new Date(startTime.getTime() + params.duration * 60 * 1000);

          slots.push({
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            duration: params.duration,
          });
        });
      });
    }

    log.debug('Received availability slots from Halaxy', 'HalaxyAvailability', {
      total: slots.length,
    });

    return slots;
  } catch (error) {
    log.error('Error fetching slots from Halaxy', 'HalaxyAvailability', error);
    return [];
  }
}

/**
 * Group slots by date for calendar display
 * Uses user's local timezone for date grouping
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

    // Use local timezone for correct date grouping
    const localDate = new Date(slot.start);
    
    // Format as YYYY-MM-DD in local timezone
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
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
 * Uses user's local timezone for correct time display
 */
export function formatTimeSlot(isoDateTime: string): string {
  const localDate = new Date(isoDateTime);
  
  let hours = localDate.getHours();
  const minutes = localDate.getMinutes();
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

