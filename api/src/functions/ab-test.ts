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

// Calculate z-score and p-value for statistical significance
function calculateStatisticalSignificance(
  control: { conversions: number; allocations: number },
  variant: { conversions: number; allocations: number }
) {
  // Handle edge cases
  if (control.allocations === 0 || variant.allocations === 0) {
    return { zScore: 0, pValue: 1, isSignificant: false, confidenceLevel: '0%' };
  }

  const p1 = control.conversions / control.allocations;
  const p2 = variant.conversions / variant.allocations;
  const totalConversions = control.conversions + variant.conversions;
  const totalAllocations = control.allocations + variant.allocations;

  if (totalConversions === 0) {
    return { zScore: 0, pValue: 1, isSignificant: false, confidenceLevel: '0%' };
  }

  const p = totalConversions / totalAllocations;
  const se = Math.sqrt(p * (1 - p) * (1 / control.allocations + 1 / variant.allocations));

  if (se === 0) {
    return { zScore: 0, pValue: 1, isSignificant: false, confidenceLevel: '0%' };
  }

  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  const isSignificant = pValue < 0.05;
  const confidenceLevel = `${Math.round((1 - pValue) * 100)}%`;

  return { zScore, pValue, isSignificant, confidenceLevel };
}

// Normal distribution CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y = 1.0 - (a5 * t5 + a4 * t4 + a3 * t3 + a2 * t2 + a1 * t) * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

async function abTestHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const method = req.method;
  const testName = req.params.testName;

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

    if (method === 'GET' && testName) {
      context.log(`Fetching A/B test results for ${testName} from SQL`);

      // Query SQL for aggregated test results
      const result = await pool.request()
        .input('testName', sql.NVarChar, testName)
        .query(`
          SELECT 
            variant,
            COUNT(*) as allocations,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
            MIN(created_at) as first_event,
            MAX(created_at) as last_event
          FROM ab_test_events 
          WHERE test_name = @testName
          GROUP BY variant
          ORDER BY variant
        `);

      if (!result.recordset || result.recordset.length === 0) {
        return {
          status: 404,
          headers,
          jsonBody: { error: `No test data found for '${testName}'` },
        };
      }

      // Build variants object
      const variants: {
        [key: string]: {
          allocations: number;
          conversions: number;
          conversionRate: number;
        };
      } = {};

      let firstEventDate: Date | null = null;

      for (const row of result.recordset) {
        variants[row.variant] = {
          allocations: row.allocations,
          conversions: row.conversions,
          conversionRate: row.allocations > 0 ? row.conversions / row.allocations : 0,
        };
        if (!firstEventDate || new Date(row.first_event) < firstEventDate) {
          firstEventDate = new Date(row.first_event);
        }
      }

      // Calculate improvement
      const variantNames = Object.keys(variants);
      const controlVariant = variants[variantNames[0]];
      let winner = variantNames[0];
      let maxConversionRate = controlVariant.conversionRate;

      for (const vName of variantNames.slice(1)) {
        if (variants[vName].conversionRate > maxConversionRate) {
          maxConversionRate = variants[vName].conversionRate;
          winner = vName;
        }
      }

      const improvementPercentage = controlVariant.conversionRate > 0
        ? ((maxConversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100
        : 0;

      const improvement = { percentage: improvementPercentage, winner };

      // Calculate statistical significance
      const statSig = calculateStatisticalSignificance(controlVariant, variants[winner]);

      // Calculate duration info
      const totalAllocations = Object.values(variants).reduce((sum, v) => sum + v.allocations, 0);
      const daysRunning = firstEventDate
        ? Math.floor((Date.now() - firstEventDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const sampleSizeNeeded = 385 * 2;
      const visitorsPerDay = daysRunning > 0 ? totalAllocations / daysRunning : 0;
      const remainingAllocations = Math.max(0, sampleSizeNeeded - totalAllocations);
      const daysRemaining = visitorsPerDay > 0 ? Math.ceil(remainingAllocations / visitorsPerDay) : 999;

      const testResult = {
        testName,
        variants,
        statisticalSignificance: statSig,
        improvement,
        duration: {
          startedAt: firstEventDate?.toISOString() || null,
          daysRunning,
          daysRemaining,
          expectedDurationDays: daysRunning + daysRemaining,
          progressPercentage: Math.min(100, (totalAllocations / sampleSizeNeeded) * 100),
          status: statSig.isSignificant ? 'significant' : (totalAllocations >= sampleSizeNeeded ? 'complete' : 'running'),
        },
      };

      return { status: 200, headers, jsonBody: testResult };
    }

    if (method === 'GET') {
      context.log('Fetching all A/B test summaries from SQL');

      const result = await pool.request().query(`
        SELECT 
          test_name,
          COUNT(*) as total_events,
          MAX(created_at) as last_updated
        FROM ab_test_events
        GROUP BY test_name
        ORDER BY last_updated DESC
      `);

      const summaries = result.recordset.map((row: { test_name: string; total_events: number; last_updated: Date }) => ({
        testName: row.test_name,
        totalEvents: row.total_events,
        lastUpdated: row.last_updated,
      }));

      return { status: 200, headers, jsonBody: summaries };
    }

    return {
      status: 405,
      headers,
      jsonBody: { error: 'Method not allowed' },
    };
  } catch (error) {
    context.error('Error in A/B test handler:', error);
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

app.http('ab-test', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'ab-test/results/{testName?}',
  handler: abTestHandler,
});
