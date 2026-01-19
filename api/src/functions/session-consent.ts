/**
 * Session Recording Consent API
 * 
 * Manages patient consent for audio recording during therapy sessions.
 * Consent is tied to a specific appointment and must be given before recording starts.
 * 
 * Endpoints:
 *   POST /api/session/consent          - Patient gives/withdraws consent
 *   GET  /api/session/consent/:appointmentId - Check consent status
 *   GET  /api/session/consent/check    - Patient checks their own consent (by token)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

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

// ============================================================================
// Types
// ============================================================================

interface _ConsentRecord {
  id: string;
  appointmentHalaxyId: string;
  patientHalaxyId: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// POST /api/session/consent - Patient gives or withdraws consent
// ============================================================================

async function submitConsent(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Session Consent: Submit consent');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      appointmentId: string;      // Halaxy appointment ID
      patientId: string;          // Halaxy patient ID
      consentGiven: boolean;      // true = consent, false = decline/withdraw
      sessionToken?: string;      // Optional token for patient verification
    };

    if (!body.appointmentId || !body.patientId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'appointmentId and patientId required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Check if consent record already exists
    const existing = await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .query(`
        SELECT id, consent_given FROM session_recording_consent
        WHERE appointment_halaxy_id = @appointmentId
      `);

    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (existing.recordset.length > 0) {
      // Update existing consent
      if (body.consentGiven) {
        // Re-consent
        await pool.request()
          .input('appointmentId', sql.NVarChar, body.appointmentId)
          .input('ipAddress', sql.NVarChar, ipAddress)
          .input('userAgent', sql.NVarChar, userAgent.substring(0, 500))
          .query(`
            UPDATE session_recording_consent
            SET consent_given = 1, 
                consent_timestamp = GETUTCDATE(),
                withdrawn_at = NULL,
                ip_address = @ipAddress,
                user_agent = @userAgent
            WHERE appointment_halaxy_id = @appointmentId
          `);
      } else {
        // Withdraw consent
        await pool.request()
          .input('appointmentId', sql.NVarChar, body.appointmentId)
          .query(`
            UPDATE session_recording_consent
            SET consent_given = 0, 
                withdrawn_at = GETUTCDATE()
            WHERE appointment_halaxy_id = @appointmentId
          `);
      }

      context.log(`Consent updated for appointment ${body.appointmentId}: ${body.consentGiven}`);
    } else {
      // Create new consent record
      const consentId = uuidv4();
      
      await pool.request()
        .input('id', sql.UniqueIdentifier, consentId)
        .input('appointmentId', sql.NVarChar, body.appointmentId)
        .input('patientId', sql.NVarChar, body.patientId)
        .input('consentGiven', sql.Bit, body.consentGiven ? 1 : 0)
        .input('ipAddress', sql.NVarChar, ipAddress)
        .input('userAgent', sql.NVarChar, userAgent.substring(0, 500))
        .query(`
          INSERT INTO session_recording_consent (
            id, appointment_halaxy_id, patient_halaxy_id, 
            consent_given, consent_timestamp, ip_address, user_agent
          ) VALUES (
            @id, @appointmentId, @patientId,
            @consentGiven, GETUTCDATE(), @ipAddress, @userAgent
          )
        `);

      context.log(`Consent created for appointment ${body.appointmentId}: ${body.consentGiven}`);
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          appointmentId: body.appointmentId,
          consentGiven: body.consentGiven,
          timestamp: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    context.error('Error submitting consent:', error);
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
// GET /api/session/consent/:appointmentId - Check consent status (for clinician)
// ============================================================================

async function checkConsent(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const appointmentId = request.params.appointmentId;
  context.log(`Session Consent: Check consent for ${appointmentId}`);

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    const result = await pool.request()
      .input('appointmentId', sql.NVarChar, appointmentId)
      .query(`
        SELECT 
          id, appointment_halaxy_id, patient_halaxy_id,
          consent_given, consent_timestamp, withdrawn_at
        FROM session_recording_consent
        WHERE appointment_halaxy_id = @appointmentId
      `);

    if (result.recordset.length === 0) {
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            appointmentId,
            status: 'pending',  // No response yet
            consentGiven: null,
            canRecord: false,
          },
        },
      };
    }

    const consent = result.recordset[0];
    const status = consent.consent_given 
      ? (consent.withdrawn_at ? 'withdrawn' : 'consented')
      : 'declined';

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          appointmentId,
          status,
          consentGiven: consent.consent_given && !consent.withdrawn_at,
          canRecord: consent.consent_given && !consent.withdrawn_at,
          consentTimestamp: consent.consent_timestamp,
          withdrawnAt: consent.withdrawn_at,
        },
      },
    };
  } catch (error) {
    context.error('Error checking consent:', error);
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

app.http('session-consent-submit', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'session/consent',
  handler: submitConsent,
});

app.http('session-consent-check', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'session/consent/{appointmentId}',
  handler: checkConsent,
});
