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

// Minimum booking notice - clients can only see slots 3+ hours away
const MIN_BOOKING_NOTICE_HOURS = 3;

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
  practitionerId: string | undefined,
  clinicId: string | undefined,
  feeId: string | undefined,
  context: InvocationContext
): Promise<FHIRSlot[]> {
  const dateFrom = startDate.toISOString().split('T')[0];
  const dateTo = endDate.toISOString().split('T')[0];

  // Use provided IDs or fall back to defaults
  const actualPractitionerId = practitionerId || DEFAULT_PRACTITIONER_ID;
  const actualClinicId = clinicId || DEFAULT_CLINIC_ID;
  const actualFeeId = feeId || DEFAULT_FEE_ID;

  const queryParams = new URLSearchParams({
    practitioner: actualPractitionerId,
    clinic: actualClinicId,
    dateFrom,
    dateTo,
    duration: duration.toString(),
    fee: actualFeeId,
  });

  const url = `https://www.halaxy.com/api/v2/open/booking/timeslot/availability?${queryParams.toString()}`;

  context.log('Fetching from Halaxy public API:', { url, practitionerId: actualPractitionerId });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    context.error(`Halaxy API error: ${response.status} - ${errorText}`, {
      url,
      practitionerId: actualPractitionerId,
      clinicId: DEFAULT_CLINIC_ID,
      feeId: DEFAULT_FEE_ID,
    });
    
    // Parse error for better client-side handling
    let errorDetails = `Halaxy API returned ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message === 'Practitioner Clinic not found') {
        errorDetails = 'This practitioner is not configured for online booking yet';
      } else if (parsed.message) {
        errorDetails = parsed.message;
      } else {
        errorDetails = `${errorDetails}: ${errorText.substring(0, 200)}`;
      }
    } catch {
      // Use raw error text (truncated)
      errorDetails = `${errorDetails}: ${errorText.substring(0, 200)}`;
    }
    
    throw new Error(errorDetails);
  }

  const data: HalaxyAvailabilityResponse = await response.json();

  context.log(`Halaxy returned ${data._metadata?.totalCount || 0} days of availability`);

  // Convert Halaxy timeslots to FHIR Slot format
  const slots: FHIRSlot[] = [];
  
  // Calculate minimum booking time (3 hours from now)
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000);

  if (data.data?.timeslots) {
    Object.entries(data.data.timeslots).forEach(([_date, daySlots]) => {
      daySlots.forEach((slot, index) => {
        // Skip slots that require notice (too soon to book)
        if (slot.status === 'notice-required') {
          return;
        }

        // Skip slots without dateTimeKey
        if (!slot.dateTimeKey || slot.dateTimeKey.length < 13) {
          context.warn(`Skipping slot without valid dateTimeKey:`, slot);
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
        
        // Skip slots less than 3 hours away - give practitioner time to prepare
        if (utcDate < minBookingTime) {
          return;
        }
        
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
    const practitionerId = req.query.get('practitioner') || undefined;
    const clinicId = req.query.get('clinic') || undefined;
    const feeId = req.query.get('fee') || undefined;

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
      practitionerId: practitionerId || 'default',
      clinicId: clinicId || 'default',
      feeId: feeId || 'default',
    });

    // Fetch from Halaxy's public API
    const slots = await fetchHalaxyAvailability(startDate, endDate, duration, practitionerId, clinicId, feeId, context);

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
