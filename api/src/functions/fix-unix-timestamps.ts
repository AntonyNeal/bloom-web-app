/**
 * Fix Unix Timestamps
 * 
 * Maintenance endpoint to populate Unix timestamps for all existing slots.
 * This ensures backward compatibility after adding Unix timestamp columns.
 * 
 * POST /api/maintenance/fix-unix-timestamps
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

async function fixUnixTimestampsHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('[FixUnixTimestamps] Starting Unix timestamp fix');

  try {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (!connectionString) {
      return {
        status: 500,
        jsonBody: { error: 'SQL_CONNECTION_STRING not configured' }
      };
    }

    const pool = await sql.connect(connectionString);

    // Update Unix timestamps for all slots that don't have them
    const result = await pool.request().query(`
      UPDATE availability_slots
      SET 
        slot_start_unix = DATEDIFF(SECOND, '1970-01-01', slot_start),
        slot_end_unix = DATEDIFF(SECOND, '1970-01-01', slot_end)
      WHERE slot_start_unix IS NULL OR slot_end_unix IS NULL
    `);

    const updatedCount = result.rowsAffected[0] || 0;
    context.log(`[FixUnixTimestamps] Updated ${updatedCount} slots`);

    // Verify the fix
    const verification = await pool.request().query(`
      SELECT 
        COUNT(*) as total_slots,
        COUNT(CASE WHEN slot_start_unix IS NOT NULL AND slot_end_unix IS NOT NULL THEN 1 END) as slots_with_unix,
        COUNT(CASE WHEN status='free' AND is_bookable=1 AND slot_start_unix IS NOT NULL THEN 1 END) as free_bookable_with_unix
      FROM availability_slots
    `);

    const stats = verification.recordset[0];

    context.log('[FixUnixTimestamps] Verification:', stats);

    return {
      status: 200,
      jsonBody: {
        success: true,
        updated: updatedCount,
        verification: stats
      }
    };

  } catch (error) {
    context.error('[FixUnixTimestamps] Error:', error);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to fix Unix timestamps',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

app.http('fixUnixTimestamps', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'maintenance/fix-unix-timestamps',
  handler: fixUnixTimestampsHandler,
});

export default fixUnixTimestampsHandler;
