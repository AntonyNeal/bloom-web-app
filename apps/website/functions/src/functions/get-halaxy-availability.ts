/**
 * Halaxy Availability Function
 *
 * Fetches available appointment slots from Halaxy's FHIR API.
 * Returns FHIR Bundle with Slot resources for the booking calendar.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';

// Token cache
let cachedToken: string | null = null;
let tokenExpiryTime: Date | null = null;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

interface HalaxyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FHIRSlot {
  resourceType: 'Slot';
  id?: string;
  start: string;
  end: string;
  status: 'free' | 'busy' | 'busy-unavailable' | 'busy-tentative';
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
 * Get Halaxy access token using OAuth 2.0 client credentials flow
 */
async function getAccessToken(context: InvocationContext): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && tokenExpiryTime && new Date() < tokenExpiryTime) {
    return cachedToken;
  }

  const clientId = process.env.HALAXY_CLIENT_ID;
  const clientSecret = process.env.HALAXY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing HALAXY_CLIENT_ID or HALAXY_CLIENT_SECRET');
  }

  context.log('Fetching new Halaxy access token...');

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );

  const response = await fetch('https://au-api.halaxy.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
      Accept: 'application/json',
      'User-Agent': 'Life-Psychology-AUS/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to obtain Halaxy token: ${response.status} ${errorText}`
    );
  }

  const tokenResponse: HalaxyTokenResponse = await response.json();

  // Cache the token
  cachedToken = tokenResponse.access_token;
  tokenExpiryTime = new Date(
    Date.now() + tokenResponse.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS
  );

  context.log(`Token obtained, expires at ${tokenExpiryTime.toISOString()}`);

  return cachedToken;
}

/**
 * Fetch available slots from Halaxy FHIR API
 */
async function fetchAvailability(
  params: {
    start: string;
    end: string;
    duration: string;
    practitioner?: string;
    organization?: string;
    show?: string;
  },
  context: InvocationContext
): Promise<FHIRBundle> {
  const token = await getAccessToken(context);

  const baseUrl =
    process.env.HALAXY_FHIR_URL || 'https://au-api.halaxy.com/fhir';
  const practitionerId =
    params.practitioner || process.env.HALAXY_PRACTITIONER_ID;
  const organizationId =
    params.organization || process.env.HALAXY_ORGANIZATION_ID;

  // Build query parameters for Slot search
  const queryParams = new URLSearchParams();
  queryParams.append('start', `ge${params.start}`);
  queryParams.append('end', `le${params.end}`);
  queryParams.append('status', 'free');

  if (practitionerId) {
    queryParams.append('schedule.actor', `Practitioner/${practitionerId}`);
  }
  if (organizationId) {
    queryParams.append('schedule.actor', `Organization/${organizationId}`);
  }

  const url = `${baseUrl}/Slot?${queryParams.toString()}`;
  context.log(`Fetching availability from: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/fhir+json',
      'User-Agent': 'Life-Psychology-AUS/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    context.error(`Halaxy API error: ${response.status} ${errorText}`);

    // If unauthorized, invalidate token and retry once
    if (response.status === 401) {
      cachedToken = null;
      tokenExpiryTime = null;
      context.log('Token expired, retrying with fresh token...');
      return fetchAvailability(params, context);
    }

    throw new Error(`Halaxy API error: ${response.status}`);
  }

  const data: FHIRBundle = await response.json();

  // Filter slots by duration if specified
  if (params.duration && data.entry) {
    const durationMs = parseInt(params.duration) * 60 * 1000;
    data.entry = data.entry.filter((entry) => {
      const slotStart = new Date(entry.resource.start).getTime();
      const slotEnd = new Date(entry.resource.end).getTime();
      return slotEnd - slotStart >= durationMs;
    });
    data.total = data.entry.length;
  }

  return data;
}

/**
 * Generate mock availability for development/fallback
 */
function generateMockAvailability(
  start: string,
  end: string,
  duration: number
): FHIRBundle {
  const slots: FHIRSlot[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Generate slots for each weekday
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Generate slots from 9am to 5pm
      for (let hour = 9; hour < 17; hour++) {
        // Random 70% availability
        if (Math.random() < 0.7) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + duration);

          slots.push({
            resourceType: 'Slot',
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            status: 'free',
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: slots.length,
    entry: slots.map((slot) => ({ resource: slot })),
  };
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
    const start = req.query.get('start');
    const end = req.query.get('end');
    const duration = req.query.get('duration') || '60';
    const practitioner = req.query.get('practitioner') || undefined;
    const organization = req.query.get('organization') || undefined;
    const show = req.query.get('show') || undefined;

    // Validate required parameters
    if (!start || !end) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          error: 'Missing required parameters: start and end',
        },
      };
    }

    context.log('Fetching Halaxy availability', {
      start,
      end,
      duration,
      practitioner,
      organization,
    });

    let availability: FHIRBundle;

    // Check if Halaxy credentials are configured
    const hasCredentials =
      process.env.HALAXY_CLIENT_ID && process.env.HALAXY_CLIENT_SECRET;

    if (hasCredentials) {
      // Fetch real availability from Halaxy
      availability = await fetchAvailability(
        { start, end, duration, practitioner, organization, show },
        context
      );
    } else {
      // Use mock data for development
      context.warn(
        'Halaxy credentials not configured, using mock availability'
      );
      availability = generateMockAvailability(start, end, parseInt(duration));
    }

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
