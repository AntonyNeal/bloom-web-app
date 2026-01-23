/**
 * Admin: Update Practitioner Halaxy ID
 * 
 * Updates the halaxy_practitioner_id for a specific practitioner.
 * This is needed when a practitioner's Halaxy ID is incorrect or missing.
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

export async function adminUpdatePractitionerHalaxyId(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as {
      practitionerId: string;
      halaxyPractitionerId: string;
    };

    if (!body.practitionerId || !body.halaxyPractitionerId) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Missing practitionerId or halaxyPractitionerId',
        },
      };
    }

    const pool = await sql.connect(getConfig());

    // Update the halaxy_practitioner_id
    const result = await pool
      .request()
      .input('practitionerId', sql.NVarChar, body.practitionerId)
      .input('halaxyPractitionerId', sql.NVarChar, body.halaxyPractitionerId)
      .query(`
        UPDATE practitioners
        SET halaxy_practitioner_id = @halaxyPractitionerId
        WHERE id = @practitionerId
      `);

    if (result.rowsAffected[0] === 0) {
      return {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Practitioner not found',
        },
      };
    }

    context.log(`Updated halaxy_practitioner_id for ${body.practitionerId} to ${body.halaxyPractitionerId}`);

    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        message: 'Halaxy practitioner ID updated successfully',
      },
    };
  } catch (error) {
    context.error('Error updating halaxy practitioner ID:', error);

    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: false,
        error: 'Failed to update halaxy practitioner ID',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

app.http('adminUpdatePractitionerHalaxyId', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/update-practitioner-halaxy-id',
  handler: adminUpdatePractitionerHalaxyId,
});
