/**
 * Appointments API - CRUD Operations
 * 
 * Endpoints:
 *   GET  /api/appointments - List all appointments for practitioner
 *   GET  /api/appointments/:id - Get appointment details
 *   POST /api/appointments - Create new appointment
 *   PUT  /api/appointments/:id - Update appointment
 *   DELETE /api/appointments/:id - Cancel appointment
 *   GET  /api/appointments/:id/available-slots - Get available time slots
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

const getDbConfig = () => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: { encrypt: true, trustServerCertificate: false },
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Appointment {
  id: string;
  practitioner_id: string;
  client_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: string;
  status: string;
  is_telehealth: boolean;
  notes?: string;
  created_at: string;
}

interface CreateAppointmentRequest {
  client_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type?: string;
  is_telehealth?: boolean;
  notes?: string;
}

// ============================================================================
// GET /api/appointments - List all appointments
// ============================================================================

async function listAppointments(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const practitionerId = req.query.get('practitioner_id');
    const dateFrom = req.query.get('date_from');
    const dateTo = req.query.get('date_to');
    const status = req.query.get('status');

    if (!practitionerId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'practitioner_id required' },
      };
    }

    const pool = new sql.ConnectionPool(getDbConfig());
    await pool.connect();

    let query = `
      SELECT 
        id,
        practitioner_id,
        client_id,
        appointment_date,
        start_time,
        end_time,
        duration_minutes,
        appointment_type,
        status,
        is_telehealth,
        notes,
        created_at
      FROM appointments
      WHERE practitioner_id = @practitionerId
        AND is_deleted = 0
    `;

    const request = pool.request();
    request.input('practitionerId', sql.UniqueIdentifier, practitionerId);

    if (dateFrom) {
      query += ' AND appointment_date >= @dateFrom';
      request.input('dateFrom', sql.Date, new Date(dateFrom));
    }

    if (dateTo) {
      query += ' AND appointment_date <= @dateTo';
      request.input('dateTo', sql.Date, new Date(dateTo));
    }

    if (status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, status);
    }

    query += ' ORDER BY appointment_date DESC, start_time DESC';

    const result = await request.query(query);
    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, appointments: result.recordset },
    };
  } catch (error) {
    context.error('[Appointments] Error listing:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to list appointments' },
    };
  }
}

// ============================================================================
// GET /api/appointments/:id - Get single appointment
// ============================================================================

async function getAppointment(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = req.params.id;

    if (!id) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'Appointment ID required' },
      };
    }

    const pool = new sql.ConnectionPool(getDbConfig());
    await pool.connect();

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(
        `SELECT * FROM appointments WHERE id = @id AND is_deleted = 0`
      );

    await pool.close();

    if (result.recordset.length === 0) {
      return {
        status: 404,
        headers: corsHeaders,
        jsonBody: { error: 'Appointment not found' },
      };
    }

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true, appointment: result.recordset[0] },
    };
  } catch (error) {
    context.error('[Appointments] Error getting:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to get appointment' },
    };
  }
}

// ============================================================================
// POST /api/appointments - Create new appointment
// ============================================================================

async function createAppointment(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body: CreateAppointmentRequest = await req.json();
    const {
      client_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      appointment_type = 'session',
      is_telehealth = true,
      notes,
    } = body;

    // Validation
    if (!client_id || !appointment_date || !start_time || !end_time || !duration_minutes) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    const practitionerId = req.query.get('practitioner_id');
    if (!practitionerId) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'practitioner_id required' },
      };
    }

    const pool = new sql.ConnectionPool(getDbConfig());
    await pool.connect();

    // Verify client exists and belongs to practitioner
    const clientCheck = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('clientId', sql.UniqueIdentifier, client_id)
      .query(
        `SELECT id FROM clients WHERE id = @clientId AND practitioner_id = @practitionerId AND is_deleted = 0`
      );

    if (clientCheck.recordset.length === 0) {
      await pool.close();
      return {
        status: 404,
        headers: corsHeaders,
        jsonBody: { error: 'Client not found' },
      };
    }

    // Create appointment
    const appointmentId = uuidv4();
    const sessionToken = require('crypto').randomBytes(32).toString('hex');

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, appointmentId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('clientId', sql.UniqueIdentifier, client_id)
      .input('appointmentDate', sql.Date, new Date(appointment_date))
      .input('startTime', sql.Time, start_time)
      .input('endTime', sql.Time, end_time)
      .input('durationMinutes', sql.Int, duration_minutes)
      .input('appointmentType', sql.NVarChar, appointment_type)
      .input('isTelehealth', sql.Bit, is_telehealth)
      .input('sessionToken', sql.NVarChar, sessionToken)
      .input('notes', sql.NVarChar, notes)
      .query(
        `
        INSERT INTO appointments (
          id,
          practitioner_id,
          client_id,
          appointment_date,
          start_time,
          end_time,
          duration_minutes,
          appointment_type,
          is_telehealth,
          session_token,
          notes,
          status,
          scheduled_at
        ) VALUES (
          @id,
          @practitionerId,
          @clientId,
          @appointmentDate,
          @startTime,
          @endTime,
          @durationMinutes,
          @appointmentType,
          @isTelehealth,
          @sessionToken,
          @notes,
          'scheduled',
          GETUTCDATE()
        )
        `
      );

    await pool.close();

    return {
      status: 201,
      headers: corsHeaders,
      jsonBody: {
        success: true,
        appointment_id: appointmentId,
        session_token: sessionToken,
      },
    };
  } catch (error) {
    context.error('[Appointments] Error creating:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to create appointment' },
    };
  }
}

// ============================================================================
// PUT /api/appointments/:id - Update appointment
// ============================================================================

async function updateAppointment(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = req.params.id;
    const body = await req.json();

    if (!id) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'Appointment ID required' },
      };
    }

    const pool = new sql.ConnectionPool(getDbConfig());
    await pool.connect();

    // Check appointment exists
    const check = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`SELECT id FROM appointments WHERE id = @id AND is_deleted = 0`);

    if (check.recordset.length === 0) {
      await pool.close();
      return {
        status: 404,
        headers: corsHeaders,
        jsonBody: { error: 'Appointment not found' },
      };
    }

    // Build update query
    const updateFields: string[] = [];
    const request = pool.request();

    if (body.status) {
      updateFields.push('status = @status');
      request.input('status', sql.NVarChar, body.status);
    }

    if (body.notes !== undefined) {
      updateFields.push('notes = @notes');
      request.input('notes', sql.NVarChar, body.notes);
    }

    if (body.start_time) {
      updateFields.push('start_time = @startTime');
      request.input('startTime', sql.Time, body.start_time);
    }

    if (body.end_time) {
      updateFields.push('end_time = @endTime');
      request.input('endTime', sql.Time, body.end_time);
    }

    if (!updateFields.length) {
      await pool.close();
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'No fields to update' },
      };
    }

    updateFields.push('updated_at = GETUTCDATE()');

    const query = `
      UPDATE appointments
      SET ${updateFields.join(', ')}
      WHERE id = @id
    `;

    request.input('id', sql.UniqueIdentifier, id);
    await request.query(query);
    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true },
    };
  } catch (error) {
    context.error('[Appointments] Error updating:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to update appointment' },
    };
  }
}

// ============================================================================
// DELETE /api/appointments/:id - Cancel appointment (soft delete)
// ============================================================================

async function deleteAppointment(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = req.params.id;

    if (!id) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { error: 'Appointment ID required' },
      };
    }

    const pool = new sql.ConnectionPool(getDbConfig());
    await pool.connect();

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(
        `
        UPDATE appointments
        SET 
          status = 'cancelled',
          is_deleted = 1,
          deleted_at = GETUTCDATE(),
          updated_at = GETUTCDATE()
        WHERE id = @id
        `
      );

    await pool.close();

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { success: true },
    };
  } catch (error) {
    context.error('[Appointments] Error deleting:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { error: 'Failed to cancel appointment' },
    };
  }
}

// ============================================================================
// Register HTTP endpoints
// ============================================================================

app.http('appointments', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'appointments',
  handler: async (req, context) => {
    if (req.method === 'GET') {
      return listAppointments(req, context);
    } else if (req.method === 'POST') {
      return createAppointment(req, context);
    }
    return { status: 405, headers: corsHeaders };
  },
});

app.http('appointmentDetail', {
  methods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'appointments/{id}',
  handler: async (req, context) => {
    if (req.method === 'GET') {
      return getAppointment(req, context);
    } else if (req.method === 'PUT') {
      return updateAppointment(req, context);
    } else if (req.method === 'DELETE') {
      return deleteAppointment(req, context);
    }
    return { status: 405, headers: corsHeaders };
  },
});
