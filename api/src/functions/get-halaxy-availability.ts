/**
 * Halaxy Availability Function
 *
 * Fetches available appointment slots from the Azure SQL database.
 * Queries the availability_slots table for free slots.
 * Returns FHIR Bundle with Slot resources for the booking calendar.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import * as sql from 'mssql';

// Connection pool singleton
let pool: sql.ConnectionPool | null = null;

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

interface AvailabilitySlot {
  id: string;
  halaxy_slot_id: string;
  slot_start_unix: number;
  slot_end_unix: number;
  practitioner_id?: string;
  duration_minutes: number;
  location_type?: string;
}

/**
 * Get database connection pool
 */
async function getDbConnection(
  context: InvocationContext
): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('SQL_CONNECTION_STRING environment variable is not configured');
  }

  context.log('Connecting to database...');
  pool = await sql.connect(connectionString);

  pool.on('error', (err) => {
    context.error('Database pool error:', err);
    pool = null;
  });

  return pool;
}

/**
 * Fetch available slots from the database
 */
async function fetchAvailableSlots(
  startDate: Date,
  endDate: Date,
  practitionerId: string | undefined,
  durationMinutes: number,
  context: InvocationContext
): Promise<FHIRSlot[]> {
  const dbPool = await getDbConnection(context);

  // Query for available slots from the availability_slots table
  let query = `
    SELECT 
      a.id,
      a.halaxy_slot_id,
      a.slot_start_unix,
      a.slot_end_unix,
      a.practitioner_id,
      a.duration_minutes,
      a.location_type
    FROM availability_slots a
    WHERE a.slot_start_unix < @endDateUnix
      AND a.slot_end_unix > @startDateUnix
  `;

  // Only filter by duration if explicitly requested and > 0
  if (durationMinutes > 0) {
    query += ` AND a.duration_minutes >= @duration`;
  }

  const startDateUnix = Math.floor(startDate.getTime() / 1000);
  const endDateUnix = Math.floor(endDate.getTime() / 1000);

  const request = dbPool
    .request()
    .input('startDateUnix', sql.BigInt, startDateUnix)
    .input('endDateUnix', sql.BigInt, endDateUnix)
    .input('duration', sql.Int, durationMinutes)
    .input('practitionerId', sql.UniqueIdentifier, practitionerId || null);

  if (practitionerId) {
    query += ` AND a.practitioner_id = @practitionerId`;
  }

  query += ` ORDER BY a.slot_start_unix`;

  context.log('Querying available slots', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateUnix,
    endDateUnix,
    practitionerId,
    durationMinutes,
  });

  // Diagnostic: Check total slots in database
  const totalCheck = await dbPool.request().query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN slot_start_unix IS NOT NULL THEN 1 END) as has_unix_timestamp
    FROM availability_slots`
  );
  context.log('Database diagnostic:', totalCheck.recordset[0]);

  const result = await request.query<AvailabilitySlot>(query);
  context.log(`Found ${result.recordset.length} available slots`);

  // Transform to FHIR Slot resources
  return result.recordset.map((slot) => ({
    resourceType: 'Slot' as const,
    id: slot.id,
    start: new Date(slot.slot_start_unix * 1000).toISOString(),
    end: new Date(slot.slot_end_unix * 1000).toISOString(),
    status: 'free' as const,
  }));
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
    // Duration filter is optional - if 0 or not provided, returns all slots
    const duration = parseInt(req.query.get('duration') || '0');
    const practitioner = req.query.get('practitioner') || undefined;

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

    const startDate = new Date(start);
    const endDate = new Date(end);

    context.log('Fetching availability from database', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration,
      practitioner,
    });

    // Fetch available slots from database
    const slots = await fetchAvailableSlots(
      startDate,
      endDate,
      practitioner,
      duration,
      context
    );

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
