/**
 * Admin Run Migration Endpoint
 * 
 * POST /api/management/run-migration
 * 
 * Runs a specific migration SQL directly (staging/dev only)
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

// Pre-defined safe migrations
const MIGRATIONS: Record<string, string> = {
  'V015': `
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'halaxy_practitioner_role_id')
    BEGIN
      ALTER TABLE practitioners ADD halaxy_practitioner_role_id NVARCHAR(50) NULL;
    END
  `,
};

async function adminRunMigrationHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Admin run migration request: ${request.method} ${request.url}`);

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

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as { migration?: string };
    const migrationId = body?.migration || 'V015';
    
    const migrationSql = MIGRATIONS[migrationId];
    if (!migrationSql) {
      return {
        status: 400,
        headers,
        jsonBody: { error: `Unknown migration: ${migrationId}`, available: Object.keys(MIGRATIONS) },
      };
    }

    pool = await sql.connect(getConfig());
    
    context.log(`Running migration ${migrationId}...`);
    await pool.request().query(migrationSql);
    
    context.log(`Migration ${migrationId} completed successfully`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        message: `Migration ${migrationId} completed successfully`,
        migrationId,
      },
    };
  } catch (error) {
    context.error(`Migration failed: ${error}`);
    return {
      status: 500,
      headers,
      jsonBody: { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
    };
  } finally {
    if (pool) await pool.close();
  }
}

app.http('adminRunMigration', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'management/run-migration',
  handler: adminRunMigrationHandler,
});

export default adminRunMigrationHandler;
