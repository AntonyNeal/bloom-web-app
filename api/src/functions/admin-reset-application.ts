/**
 * Admin Reset Application Endpoint
 * 
 * POST /api/admin/reset-application/:applicationId
 * 
 * Resets an application by:
 * 1. Deleting the linked practitioner record
 * 2. Clearing the practitioner_id from the application
 * 3. Resetting application status to 'reviewing'
 * 
 * WARNING: This is destructive and should only be used in staging/dev!
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;

  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
};

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function adminResetApplicationHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Admin reset application request: ${request.method} ${request.url}`);

  if (request.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  // Only allow in staging/dev
  const environment = process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.NODE_ENV || '';
  if (!['Development', 'Staging', 'staging', 'development'].includes(environment)) {
    return {
      status: 403,
      headers,
      jsonBody: { error: 'This endpoint is only available in staging/development environments' },
    };
  }

  const applicationId = request.params.applicationId;

  if (!applicationId) {
    return {
      status: 400,
      headers,
      jsonBody: { error: 'Application ID is required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getConfig());

    // Get the application and linked practitioner
    const appResult = await pool.request()
      .input('id', sql.Int, applicationId)
      .query(`
        SELECT a.id, a.first_name, a.last_name, a.email, a.practitioner_id, a.status
        FROM applications a
        WHERE a.id = @id
      `);

    if (appResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { error: 'Application not found' },
      };
    }

    const application = appResult.recordset[0];
    const actions: string[] = [];

    // Delete the practitioner if exists
    if (application.practitioner_id) {
      // Delete related records first
      // Note: sync_status may not exist, so we handle errors gracefully
      try {
        await pool.request()
          .input('practitionerId', sql.UniqueIdentifier, application.practitioner_id)
          .query(`DELETE FROM sync_status WHERE practitioner_id = @practitionerId`);
        actions.push('Deleted sync_status records');
      } catch (e) {
        // sync_status table may not exist, ignore
      }
      
      await pool.request()
        .input('practitionerId', sql.UniqueIdentifier, application.practitioner_id)
        .query(`DELETE FROM practitioners WHERE id = @practitionerId`);
      
      actions.push(`Deleted practitioner ${application.practitioner_id}`);
    }

    // Reset application
    await pool.request()
      .input('id', sql.Int, applicationId)
      .query(`
        UPDATE applications
        SET practitioner_id = NULL,
            status = 'reviewing',
            accepted_at = NULL,
            offer_sent_at = NULL,
            offer_accepted_at = NULL,
            offer_token = NULL,
            updated_at = GETDATE()
        WHERE id = @id
      `);
    
    actions.push(`Reset application ${applicationId} to 'reviewing' status`);

    context.log(`Admin reset completed for application ${applicationId}:`, actions);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: 'Application reset successfully',
        applicationId,
        previousPractitionerId: application.practitioner_id,
        previousStatus: application.status,
        actions,
      },
    };
  } catch (error) {
    context.error('Error resetting application:', error);
    return {
      status: 500,
      headers,
      jsonBody: { error: 'Failed to reset application', details: error instanceof Error ? error.message : String(error) },
    };
  } finally {
    if (pool) await pool.close();
  }
}

app.http('adminResetApplication', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'management/reset-application/{applicationId}',
  handler: adminResetApplicationHandler,
});

export default adminResetApplicationHandler;
