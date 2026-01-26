/**
 * Session Token API
 * 
 * Generates secure tokens for patient session links.
 * Tokens are tied to specific appointments and have expiry.
 * 
 * Endpoints:
 *   POST /api/session/token/generate - Generate token for appointment (clinician/system)
 *   GET  /api/session/token/validate/:token - Validate token and get session info (patient)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const getDbConfig = (): string | sql.config => {
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

// Generate a secure random token
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// ============================================================================
// POST /api/session/token/generate - Generate session token
// ============================================================================

async function generateSessionToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Session Token: Generate');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      appointmentId: string;       // Halaxy appointment ID
      patientId: string;           // Halaxy patient ID
      patientFirstName: string;
      patientEmail: string;
      practitionerId: string;      // Our practitioner ID
      practitionerName: string;
      appointmentTime: string;     // ISO datetime
      appointmentDuration: number; // minutes
    };

    if (!body.appointmentId || !body.patientId || !body.practitionerId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'appointmentId, patientId, and practitionerId required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Check if token already exists for this appointment
    const existing = await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .query(`
        SELECT token, expires_at FROM session_tokens
        WHERE appointment_halaxy_id = @appointmentId
          AND expires_at > GETUTCDATE()
          AND used_at IS NULL
      `);

    if (existing.recordset.length > 0) {
      // Return existing valid token
      const existingToken = existing.recordset[0];
      const sessionUrl = `${process.env.BLOOM_APP_URL || 'https://bloom.life-psychology.com.au'}/session?token=${existingToken.token}`;
      
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            token: existingToken.token,
            sessionUrl,
            expiresAt: existingToken.expires_at,
            isExisting: true,
          },
        },
      };
    }

    // Generate new token
    const token = generateSecureToken();
    const tokenId = uuidv4();
    
    // Token expires 24 hours after appointment time, or 48 hours from now (whichever is later)
    const appointmentTime = new Date(body.appointmentTime);
    const expiresAt = new Date(Math.max(
      appointmentTime.getTime() + 24 * 60 * 60 * 1000,
      Date.now() + 48 * 60 * 60 * 1000
    ));

    await pool.request()
      .input('id', sql.UniqueIdentifier, tokenId)
      .input('token', sql.NVarChar, token)
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .input('patientId', sql.NVarChar, body.patientId)
      .input('patientFirstName', sql.NVarChar, body.patientFirstName)
      .input('patientEmail', sql.NVarChar, body.patientEmail)
      .input('practitionerId', sql.UniqueIdentifier, body.practitionerId)
      .input('practitionerName', sql.NVarChar, body.practitionerName)
      .input('appointmentTime', sql.DateTime2, appointmentTime)
      .input('appointmentDuration', sql.Int, body.appointmentDuration || 50)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO session_tokens (
          id, token, appointment_halaxy_id, patient_halaxy_id,
          patient_first_name, patient_email, practitioner_id, practitioner_name,
          appointment_time, appointment_duration_mins, expires_at, created_at
        ) VALUES (
          @id, @token, @appointmentId, @patientId,
          @patientFirstName, @patientEmail, @practitionerId, @practitionerName,
          @appointmentTime, @appointmentDuration, @expiresAt, GETUTCDATE()
        )
      `);

    const sessionUrl = `${process.env.BLOOM_APP_URL || 'https://bloom.life-psychology.com.au'}/session?token=${token}`;

    context.log(`Generated session token for appointment ${body.appointmentId}`);

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: {
          token,
          sessionUrl,
          expiresAt: expiresAt.toISOString(),
          isExisting: false,
        },
      },
    };
  } catch (error) {
    context.error('Error generating session token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// GET /api/session/token/validate/:token - Validate token (patient access)
// ============================================================================

async function validateSessionToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;
  context.log(`Session Token: Validate ${token?.substring(0, 8)}...`);

  if (!token) {
    return {
      status: 400,
      jsonBody: { success: false, error: 'Token required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          id, appointment_halaxy_id, patient_halaxy_id,
          patient_first_name, practitioner_id, practitioner_name,
          appointment_time, appointment_duration_mins,
          expires_at, used_at, room_id
        FROM session_tokens
        WHERE token = @token
      `);

    if (result.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Invalid session link', code: 'INVALID_TOKEN' },
      };
    }

    const session = result.recordset[0];

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return {
        status: 410,
        jsonBody: { success: false, error: 'Session link has expired', code: 'TOKEN_EXPIRED' },
      };
    }

    // Check if appointment time is reasonable (not more than 30 mins early)
    const appointmentTime = new Date(session.appointment_time);
    const earliestJoin = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
    const now = new Date();

    let status: 'early' | 'ready' | 'active' | 'ended' = 'early';
    
    if (now < earliestJoin) {
      status = 'early';
    } else if (now < appointmentTime) {
      status = 'ready'; // In waiting room window
    } else {
      const endTime = new Date(appointmentTime.getTime() + session.appointment_duration_mins * 60 * 1000);
      status = now < endTime ? 'active' : 'ended';
    }

    // Check consent status
    const consentResult = await pool.request()
      .input('appointmentId', sql.NVarChar, session.appointment_halaxy_id)
      .query(`
        SELECT consent_given, withdrawn_at 
        FROM session_recording_consent
        WHERE appointment_halaxy_id = @appointmentId
      `);

    let consentStatus: 'pending' | 'consented' | 'declined' = 'pending';
    if (consentResult.recordset.length > 0) {
      const consent = consentResult.recordset[0];
      consentStatus = consent.consent_given && !consent.withdrawn_at ? 'consented' : 'declined';
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          appointmentId: session.appointment_halaxy_id,
          patientId: session.patient_halaxy_id,
          patientFirstName: session.patient_first_name,
          practitionerName: session.practitioner_name,
          appointmentTime: session.appointment_time,
          durationMinutes: session.appointment_duration_mins,
          status,
          consentStatus,
          roomId: session.room_id,
          canJoin: status === 'ready' || status === 'active',
          message: status === 'early' 
            ? `Your session starts at ${appointmentTime.toLocaleTimeString()}. Please come back closer to your appointment time.`
            : status === 'ended'
            ? 'This session has ended.'
            : null,
        },
      },
    };
  } catch (error) {
    context.error('Error validating session token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// Register Functions
// ============================================================================

app.http('session-token-generate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'session/token/generate',
  handler: generateSessionToken,
});

app.http('session-token-validate', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'session/token/validate/{token}',
  handler: validateSessionToken,
});
