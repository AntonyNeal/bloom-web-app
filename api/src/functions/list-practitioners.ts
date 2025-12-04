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

  let pool: sql.ConnectionPool | null = null;

  try {
    context.log('Connecting to database...');
    const config = getConfig();
    pool = await sql.connect(config);
    context.log('Connected to database');

    context.log('Querying practitioners...');
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
    context.log(`Found ${result.recordset.length} practitioners`);

    const practitioners = result.recordset.map(row => ({
      id: row.id,
      halaxyId: row.halaxy_practitioner_id,
      displayName: row.display_name,
      email: row.email,
      status: row.status,
      lastSynced: row.last_synced_at,
    }));

    // Get counts
    const countResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM practitioners) as practitionerCount,
        (SELECT COUNT(*) FROM clients) as clientCount,
        (SELECT COUNT(*) FROM sessions) as sessionCount
    `);

    const counts = {
      practitioners: countResult.recordset[0]?.practitionerCount || 0,
      clients: countResult.recordset[0]?.clientCount || 0,
      sessions: countResult.recordset[0]?.sessionCount || 0,
    };

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    context.error('List practitioners error:', errorMessage, errorStack);
    return {
      status: 500,
      headers,
      jsonBody: {
        success: false,
        error: errorMessage,
        stack: errorStack,
      },
    };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

app.http('listPractitioners', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'practitioners',
  handler: listPractitionersHandler,
});

export default listPractitionersHandler;
