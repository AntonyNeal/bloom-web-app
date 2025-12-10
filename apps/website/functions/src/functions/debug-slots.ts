/**
 * Debug endpoint to test database connectivity and slot count
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import * as sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

async function getDbConnection(
  context: InvocationContext
): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('SQL_CONNECTION_STRING environment variable is not configured');
  }

  context.log('Connecting to database...');
  pool = await sql.connect(connectionString);

  pool.on('error', (err) => {
    context.error('Database pool error:', err);
    pool = null;
  });

  return pool;
}

async function debugSlots(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const dbPool = await getDbConnection(context);

    // Test 1: Simple count
    let result = await dbPool.request().query(`
      SELECT COUNT(*) as total FROM availability_slots
    `);
    const totalCount = result.recordset[0].total;

    // Test 2: Count of free slots
    result = await dbPool.request().query(`
      SELECT COUNT(*) as total FROM availability_slots 
      WHERE status = 'free' AND is_bookable = 1
    `);
    const freeCount = result.recordset[0].total;

    // Test 3: Show first slot
    result = await dbPool.request().query(`
      SELECT TOP 1 
        slot_start_unix,
        slot_end_unix,
        status,
        is_bookable
      FROM availability_slots
      WHERE slot_start_unix > 0
      ORDER BY slot_start_unix
    `);
    const firstSlot = result.recordset.length > 0 ? result.recordset[0] : null;

    // Test 4: Check with date range like the function does
    const startDate = Math.floor(new Date('2025-12-01T00:00:00Z').getTime() / 1000);
    const endDate = Math.floor(new Date('2026-01-31T23:59:59Z').getTime() / 1000);
    
    result = await dbPool.request()
      .input('startDate', sql.BigInt, startDate)
      .input('endDate', sql.BigInt, endDate)
      .query(`
        SELECT COUNT(*) as total FROM availability_slots 
        WHERE slot_start_unix >= @startDate
          AND slot_end_unix <= @endDate
          AND status = 'free'
          AND is_bookable = 1
      `);
    const rangeCount = result.recordset[0].total;

    return {
      status: 200,
      jsonBody: {
        database: {
          connected: true,
          connectionString: process.env.SQL_CONNECTION_STRING ? 'configured' : 'missing',
        },
        slots: {
          total: totalCount,
          free: freeCount,
          inDateRange: rangeCount,
          firstSlot: firstSlot ? {
            start_unix: firstSlot.slot_start_unix,
            end_unix: firstSlot.slot_end_unix,
            status: firstSlot.status,
            is_bookable: firstSlot.is_bookable,
          } : null,
        },
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    };
  } catch (error) {
    return {
      status: 500,
      jsonBody: {
        error: 'Debug failed',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

app.http('debugSlots', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'debug/slots',
  handler: debugSlots,
});
