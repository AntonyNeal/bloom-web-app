import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

// SQL connection configuration
const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) {
    return connectionString;
  }
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

async function trackABTestEventHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const method = req.method;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { status: 204, headers };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    const config = getConfig();
    pool = await sql.connect(config);

    if (method === 'POST') {
      context.log('Tracking A/B test event to SQL');
      const body = (await req.json()) as {
        testName: string;
        variant: string;
        sessionId: string;
        userId?: string;
        converted?: boolean;
      };

      const { testName, variant, sessionId, userId, converted } = body;

      if (!testName || !variant || !sessionId) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'Missing required fields: testName, variant, sessionId' },
        };
      }

      // Insert into SQL
      const result = await pool.request()
        .input('testName', sql.NVarChar, testName)
        .input('variant', sql.NVarChar, variant)
        .input('sessionId', sql.NVarChar, sessionId)
        .input('userId', sql.NVarChar, userId || null)
        .input('converted', sql.Bit, converted ? 1 : 0)
        .query(`
          INSERT INTO ab_test_events (test_name, variant, session_id, user_id, converted)
          OUTPUT INSERTED.id
          VALUES (@testName, @variant, @sessionId, @userId, @converted)
        `);

      const eventId = result.recordset[0]?.id;
      context.log(`Event tracked for test: ${testName}, variant: ${variant}, converted: ${converted}, id: ${eventId}`);

      return {
        status: 201,
        headers,
        jsonBody: { success: true, eventId },
      };
    }

    if (method === 'GET') {
      // Get test results from SQL
      const testName = req.query.get('testName');

      if (!testName) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'testName query parameter is required' },
        };
      }

      const result = await pool.request()
        .input('testName', sql.NVarChar, testName)
        .query(`
          SELECT 
            variant,
            COUNT(*) as allocations,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions
          FROM ab_test_events 
          WHERE test_name = @testName
          GROUP BY variant
        `);

      const variants = result.recordset.map((row: { variant: string; allocations: number; conversions: number }) => ({
        variant: row.variant,
        allocations: row.allocations,
        conversions: row.conversions,
        conversionRate: row.allocations > 0 ? row.conversions / row.allocations : 0,
      }));

      return {
        status: 200,
        headers,
        jsonBody: { testName, variants },
      };
    }

    return {
      status: 405,
      headers,
      jsonBody: { error: 'Method not allowed' },
    };
  } catch (error) {
    context.error('Error in track A/B test event handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return {
      status: 500,
      headers,
      jsonBody: { error: errorMessage },
    };
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

app.http('track-ab-test', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'ab-test/track',
  handler: trackABTestEventHandler,
});
