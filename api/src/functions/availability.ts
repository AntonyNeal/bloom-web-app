/**
 * Availability API - Weekly Schedule Management
 * Manages practitioner availability slots
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const sqlConfig: sql.config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

/**
 * GET /api/availability - List availability slots for practitioner
 * Query params: practitioner_id (required)
 */
async function listAvailability(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const practitionerId = req.query.get('practitioner_id');

    if (!practitionerId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'practitioner_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('practitionerId', sql.UniqueIdentifier, practitionerId);

    const result = await request.query(`
      SELECT 
        id, practitioner_id, day_of_week, start_time, end_time,
        duration_minutes, is_active, created_at, updated_at
      FROM availability_slots
      WHERE practitioner_id = @practitionerId
      ORDER BY day_of_week, start_time
    `);

    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, slots: result.recordset },
    };
  } catch (error) {
    context.error('[Availability API] List error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to retrieve availability' },
    };
  }
}

/**
 * POST /api/availability - Create availability slot
 */
async function createAvailability(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const body = await req.json() as any;
    const {
      practitioner_id,
      day_of_week,
      start_time,
      end_time,
      duration_minutes,
    } = body;

    if (!practitioner_id || day_of_week === undefined || !start_time || !end_time) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'practitioner_id, day_of_week, start_time, and end_time are required' },
      };
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    
    request.input('practitionerId', sql.UniqueIdentifier, practitioner_id);
    request.input('dayOfWeek', sql.Int, day_of_week);
    request.input('startTime', sql.Time, start_time);
    request.input('endTime', sql.Time, end_time);
    request.input('durationMinutes', sql.Int, duration_minutes || 60);

    const result = await request.query(`
      INSERT INTO availability_slots (
        practitioner_id, day_of_week, start_time, end_time, duration_minutes
      )
      OUTPUT INSERTED.id
      VALUES (
        @practitionerId, @dayOfWeek, @startTime, @endTime, @durationMinutes
      )
    `);

    await pool.close();

    return {
      status: 201,
      headers: corsHeaders,
      jsonBody: { 
        success: true, 
        slot_id: result.recordset[0].id,
        message: 'Availability slot created successfully'
      },
    };
  } catch (error) {
    context.error('[Availability API] Create error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to create availability slot' },
    };
  }
}

/**
 * PUT /api/availability/:id - Update availability slot
 */
async function updateAvailability(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const slotId = req.params.id;
    const body = await req.json() as any;

    if (!slotId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'slot_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('slotId', sql.UniqueIdentifier, slotId);

    const updates: string[] = [];
    if (body.day_of_week !== undefined) {
      if (body.day_of_week < 0 || body.day_of_week > 6) {
        return {
          status: 400,
          headers: corsHeaders,
          jsonBody: { error: 'day_of_week must be between 0 and 6' },
        };
      }
      request.input('dayOfWeek', sql.Int, body.day_of_week);
      updates.push('day_of_week = @dayOfWeek');
    }
    if (body.start_time !== undefined) {
      request.input('startTime', sql.Time, body.start_time);
      updates.push('start_time = @startTime');
    }
    if (body.end_time !== undefined) {
      request.input('endTime', sql.Time, body.end_time);
      updates.push('end_time = @endTime');
    }
    if (body.duration_minutes !== undefined) {
      request.input('durationMinutes', sql.Int, body.duration_minutes);
      updates.push('duration_minutes = @durationMinutes');
    }
    if (body.is_active !== undefined) {
      request.input('isActive', sql.Bit, body.is_active ? 1 : 0);
      updates.push('is_active = @isActive');
    }

    updates.push('updated_at = GETUTCDATE()');

    if (updates.length === 1) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'No fields to update' },
      };
    }

    await request.query(`
      UPDATE availability_slots
      SET ${updates.join(', ')}
      WHERE id = @slotId
    `);

    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, message: 'Availability slot updated successfully' },
    };
  } catch (error) {
    context.error('[Availability API] Update error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to update availability slot' },
    };
  }
}

/**
 * DELETE /api/availability/:id - Delete availability slot
 */
async function deleteAvailability(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') return { status: 204, headers: corsHeaders };

  try {
    const slotId = req.params.id;

    if (!slotId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'slot_id is required' },
      };
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('slotId', sql.UniqueIdentifier, slotId);

    await request.query(`
      DELETE FROM availability_slots
      WHERE id = @slotId
    `);

    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, message: 'Availability slot deleted successfully' },
    };
  } catch (error) {
    context.error('[Availability API] Delete error:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to delete availability slot' },
    };
  }
}

// Register endpoints
app.http('availability-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'availability',
  handler: listAvailability,
});

app.http('availability-create', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'availability',
  handler: createAvailability,
});

app.http('availability-update', {
  methods: ['PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'availability/{id}',
  handler: updateAvailability,
});

app.http('availability-delete', {
  methods: ['DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'availability/{id}',
  handler: deleteAvailability,
});
