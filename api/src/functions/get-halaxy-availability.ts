/**
 * Halaxy Availability Function
 *
 * Fetches available appointment slots directly from Halaxy's public booking API (v2).
 * This bypasses FHIR complexity and returns real-time availability.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';

// Default Halaxy IDs for Life Psychology Australia
const DEFAULT_PRACTITIONER_ID = '1304541'; // Zoe Semmler
const DEFAULT_CLINIC_ID = '1023041'; // Life Psychology Australia
const DEFAULT_FEE_ID = '9381231'; // Standard session fee

interface HalaxyTimeslot {
  dateTimeKey: string;
  day: string;
  startDateUserTime: string;
  timeLabel: string;
  timeSection: string;
  userTimezone: string;
  status?: string;
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

interface FHIRSlot {
  resourceType: 'Slot';
  id: string;
  start: string;
  end: string;
  status: 'free';
}

interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry?: Array<{
    resource: FHIRSlot;
  }>;
}

/**
 * Fetch availability from Halaxy's public booking API
 */
async function fetchHalaxyAvailability(
  startDate: Date,
  endDate: Date,
  duration: number,
  context: InvocationContext
): Promise<FHIRSlot[]> {
  const dateFrom = startDate.toISOString().split('T')[0];
  const dateTo = endDate.toISOString().split('T')[0];

  const queryParams = new URLSearchParams({
    practitioner: DEFAULT_PRACTITIONER_ID,
    clinic: DEFAULT_CLINIC_ID,
    dateFrom,
    dateTo,
    duration: duration.toString(),
    fee: DEFAULT_FEE_ID,
  });

  const url = `https://www.halaxy.com/api/v2/open/booking/timeslot/availability?${queryParams.toString()}`;

  context.log('Fetching from Halaxy public API:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    context.error(`Halaxy API error: ${response.status} - ${errorText}`);
    throw new Error(`Halaxy API returned ${response.status}`);
  }

  const data: HalaxyAvailabilityResponse = await response.json();

  context.log(`Halaxy returned ${data._metadata?.totalCount || 0} days of availability`);

  // Convert Halaxy timeslots to FHIR Slot format
  const slots: FHIRSlot[] = [];

  if (data.data?.timeslots) {
    Object.entries(data.data.timeslots).forEach(([_date, daySlots]) => {
      daySlots.forEach((slot, index) => {
        // Skip slots that require notice (too soon to book)
        if (slot.status === 'notice-required') {
          return;
        }

        // Parse dateTimeKey (e.g., "20251215-080000") which is in clinic's local time (Sydney)
        // Format: YYYYMMDD-HHMMSS
        const dateTimeKey = slot.dateTimeKey;
        const year = parseInt(dateTimeKey.substring(0, 4), 10);
        const month = parseInt(dateTimeKey.substring(4, 6), 10) - 1; // JS months are 0-indexed
        const day = parseInt(dateTimeKey.substring(6, 8), 10);
        const hour = parseInt(dateTimeKey.substring(9, 11), 10);
        const minute = parseInt(dateTimeKey.substring(11, 13), 10);

        // Create date in Sydney timezone and convert to UTC
        // Sydney is UTC+11 in December (AEDT)
        const sydneyOffsetMinutes = -11 * 60; // UTC+11 means subtract 11 hours to get UTC
        const localDate = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
        const utcDate = new Date(localDate.getTime() + sydneyOffsetMinutes * 60 * 1000);
        
        const endTime = new Date(utcDate.getTime() + duration * 60 * 1000);

        slots.push({
          resourceType: 'Slot',
          id: `halaxy-${slot.dateTimeKey}-${index}`,
          start: utcDate.toISOString(),
          end: endTime.toISOString(),
          status: 'free',
        });
      });
    });
  }

  context.log(`Converted to ${slots.length} FHIR slots`);
  return slots;
}

async function getHalaxyAvailability(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    // Get query parameters
    const from = req.query.get('from');
    const to = req.query.get('to');
    const duration = parseInt(req.query.get('duration') || '60', 10);

    // Validate required parameters
    if (!from || !to) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          error: 'Missing required parameters: from and to',
        },
      };
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    context.log('Fetching availability', {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      duration,
    });

    // Fetch from Halaxy's public API
    const slots = await fetchHalaxyAvailability(startDate, endDate, duration, context);

    const availability: FHIRBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: slots.length,
      entry: slots.map((slot) => ({ resource: slot })),
    };

    context.log(`Returning ${availability.total} available slots`);

    return {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/fhir+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      jsonBody: availability,
    };
  } catch (error) {
    context.error('Error fetching availability:', error);

    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        error: 'Failed to fetch availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Register the function
app.http('getHalaxyAvailability', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'halaxy/availability',
  handler: getHalaxyAvailability,
});
