/**
 * List Practitioners API
 * 
 * Returns all synced practitioners with their Halaxy IDs and GUIDs.
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

async function listPractitionersHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  try {
    const config = getConfig();
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT 
        id,
        halaxy_practitioner_id,
        display_name,
        email,
        status,
        last_synced_at
      FROM practitioners
      ORDER BY display_name
    `);

    const practitioners = result.recordset.map(row => ({
      id: row.id,
      halaxyId: row.halaxy_practitioner_id,
      displayName: row.display_name,
      email: row.email,
      status: row.status,
      lastSynced: row.last_synced_at,
    }));

    // Also get counts - with defensive queries
    let counts = { practitioners: 0, clients: 0, appointments: 0 };
    try {
      const practitionerCount = await pool.request().query(`SELECT COUNT(*) as total FROM practitioners`);
      counts.practitioners = practitionerCount.recordset[0]?.total || 0;
    } catch (e) { /* table may not exist */ }
    try {
      const clientCount = await pool.request().query(`SELECT COUNT(*) as total FROM clients`);
      counts.clients = clientCount.recordset[0]?.total || 0;
    } catch (e) { /* table may not exist */ }
    try {
      const appointmentCount = await pool.request().query(`SELECT COUNT(*) as total FROM appointments`);
      counts.appointments = appointmentCount.recordset[0]?.total || 0;
    } catch (e) { /* table may not exist */ }

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        counts,
        practitioners,
      },
    };

  } catch (error) {
    context.error('List practitioners error:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
    };
  }
}

app.http('listPractitioners', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'practitioners',
  handler: listPractitionersHandler,
});

export default listPractitionersHandler;
