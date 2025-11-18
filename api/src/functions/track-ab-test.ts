import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

// Support both connection string and individual credentials
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

  try {
    if (method === 'POST') {
      context.log('Tracking A/B test event');
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

      const config = getConfig();
      const pool = await sql.connect(config);

      const result = await pool
        .request()
        .input('test_name', sql.NVarChar, testName)
        .input('user_id', sql.NVarChar, userId || null)
        .input('session_id', sql.NVarChar, sessionId)
        .input('variant', sql.NVarChar, variant)
        .input('converted', sql.Bit, converted ? 1 : 0).query(`
          INSERT INTO ab_test_events (test_name, user_id, session_id, variant, converted)
          OUTPUT INSERTED.*
          VALUES (@test_name, @user_id, @session_id, @variant, @converted)
        `);

      context.log(`Event tracked for test: ${testName}, variant: ${variant}`);

      return {
        status: 201,
        headers,
        jsonBody: { success: true, eventId: result.recordset[0]?.id },
      };
    }

    if (method === 'GET') {
      // Get test results in real-time
      const testName = req.query.get('testName');

      if (!testName) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'testName query parameter is required' },
        };
      }

      const config = getConfig();
      const pool = await sql.connect(config);

      const result = await pool.request().input('testName', sql.NVarChar, testName).query(`
          SELECT
            variant,
            COUNT(*) as total_events,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
            CAST(SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) AS FLOAT) / CAST(COUNT(*) AS FLOAT) as conversion_rate
          FROM ab_test_events
          WHERE test_name = @testName
          GROUP BY variant
          ORDER BY variant
        `);

      return {
        status: 200,
        headers,
        jsonBody: {
          testName,
          variants: result.recordset.map(
            (row: {
              variant: string;
              total_events: number;
              conversions: number;
              conversion_rate: number;
            }) => ({
              variant: row.variant,
              allocations: row.total_events,
              conversions: row.conversions,
              conversionRate: row.conversion_rate,
            })
          ),
        },
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
  }
}

app.http('track-ab-test', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'ab-test/track',
  handler: trackABTestEventHandler,
});
