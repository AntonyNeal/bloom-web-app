/**
 * Azure Function for Conversion Tracking
 * Tracks conversion events for A/B testing analysis
 * Supports healthcare-specific metrics and statistical significance calculations
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';

// Initialize Cosmos DB client
let cosmosClient: CosmosClient | undefined;
if (process.env.COSMOS_DB_CONNECTION_STRING) {
  cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
}

// Interface for conversion event data
interface ConversionEventData {
  userId: string;
  testName: string;
  variant: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  deviceType?: string;
}

// Interface for query results
interface QueryResult {
  variant: string;
  type: string;
  count: number;
}

// Interface for statistical significance results
interface StatisticalSignificanceResult {
  testName: string;
  variants: Record<
    string,
    {
      allocations: number;
      conversions: number;
      conversionRate: number;
    }
  >;
  statisticalSignificance: {
    zScore: number;
    pValue: number;
    isSignificant: boolean;
    confidenceLevel: string;
  };
  improvement: {
    percentage: number;
    winner: string;
  };
}

/**
 * Track conversion event in Cosmos DB
 */
async function trackConversionEvent(
  userId: string,
  testName: string,
  variant: string,
  eventType: string,
  eventData: Record<string, unknown>,
  deviceType: string,
  context: InvocationContext
): Promise<void> {
  if (!cosmosClient) {
    context.log('Cosmos DB client not initialized - skipping tracking');
    return;
  }

  try {
    const database = cosmosClient.database('conversion-analytics');
    const container = database.container('user-sessions');

    const conversionRecord = {
      id: `${userId}-${eventType}-${Date.now()}`,
      userId: userId,
      testName: testName,
      variant: variant,
      eventType: eventType,
      eventData: eventData,
      deviceType: deviceType,
      timestamp: new Date().toISOString(),
      type: 'conversion-event',
      ttl: 2592000, // 30 days
    };

    await container.items.create(conversionRecord);

    context.log(
      `Tracked ${eventType} conversion for user ${userId} in test ${testName}, variant ${variant}`
    );
  } catch (error) {
    context.error('Error tracking conversion event:', error);
    throw error;
  }
}

/**
 * Calculate statistical significance for A/B test results
 */
async function calculateStatisticalSignificance(
  testName: string,
  context: InvocationContext
): Promise<StatisticalSignificanceResult | { error: string }> {
  if (!cosmosClient) {
    context.log('Cosmos DB client not initialized');
    return { error: 'Database not available' };
  }

  try {
    const database = cosmosClient.database('conversion-analytics');
    const container = database.container('user-sessions');

    // Query for allocations and conversions
    const query = `
            SELECT 
                c.variant,
                c.type,
                COUNT(1) as count
            FROM c 
            WHERE c.testName = @testName 
            AND c.type IN ('variant-allocation', 'conversion-event')
            GROUP BY c.variant, c.type
        `;

    const { resources } = await container.items
      .query({
        query: query,
        parameters: [{ name: '@testName', value: testName }],
      })
      .fetchAll();

    // Organize results by variant
    const variantStats: Record<
      string,
      { allocations: number; conversions: number }
    > = {};
    resources.forEach((result: QueryResult) => {
      if (!variantStats[result.variant]) {
        variantStats[result.variant] = { allocations: 0, conversions: 0 };
      }

      if (result.type === 'variant-allocation') {
        variantStats[result.variant].allocations = result.count;
      } else if (result.type === 'conversion-event') {
        variantStats[result.variant].conversions = result.count;
      }
    });

    // Calculate conversion rates and statistical significance
    const variants = Object.keys(variantStats);
    if (variants.length !== 2) {
      return {
        error:
          'Need exactly 2 variants for statistical significance calculation',
      };
    }

    const [variantA, variantB] = variants;
    const statsA = variantStats[variantA];
    const statsB = variantStats[variantB];

    const conversionRateA = statsA.conversions / statsA.allocations;
    const conversionRateB = statsB.conversions / statsB.allocations;

    // Simple z-test for proportions (simplified implementation)
    const pooledRate =
      (statsA.conversions + statsB.conversions) /
      (statsA.allocations + statsB.allocations);
    const standardError = Math.sqrt(
      pooledRate *
        (1 - pooledRate) *
        (1 / statsA.allocations + 1 / statsB.allocations)
    );
    const zScore = Math.abs(conversionRateA - conversionRateB) / standardError;

    // P-value approximation (simplified)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    const isSignificant = pValue < 0.05;

    const improvement =
      ((conversionRateB - conversionRateA) / conversionRateA) * 100;

    return {
      testName: testName,
      variants: {
        [variantA]: {
          allocations: statsA.allocations,
          conversions: statsA.conversions,
          conversionRate: conversionRateA,
        },
        [variantB]: {
          allocations: statsB.allocations,
          conversions: statsB.conversions,
          conversionRate: conversionRateB,
        },
      },
      statisticalSignificance: {
        zScore: zScore,
        pValue: pValue,
        isSignificant: isSignificant,
        confidenceLevel: isSignificant ? '95%' : 'Not significant',
      },
      improvement: {
        percentage: improvement,
        winner: conversionRateB > conversionRateA ? variantB : variantA,
      },
    };
  } catch (error) {
    context.error('Error calculating statistical significance:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Normal CDF approximation for p-value calculation
 */
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Main Azure Function for conversion tracking
 */
async function trackConversionHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Conversion tracking request received');

  try {
    const body = (await request.json()) as ConversionEventData;
    const {
      userId,
      testName,
      variant,
      eventType,
      eventData = {},
      deviceType = 'unknown',
    } = body;

    // Validate required fields
    if (!userId || !testName || !variant || !eventType) {
      return {
        status: 400,
        jsonBody: {
          error:
            'Missing required fields: userId, testName, variant, eventType',
        },
      };
    }

    // Track the conversion event
    await trackConversionEvent(
      userId,
      testName,
      variant,
      eventType,
      eventData,
      deviceType,
      context
    );

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      jsonBody: {
        success: true,
        message: 'Conversion event tracked successfully',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    context.error('Error tracking conversion:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Azure Function for getting A/B test results and statistical significance
 */
async function getTestResultsHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Test results request received');

  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const testName = pathSegments[pathSegments.length - 1];

    if (!testName) {
      return {
        status: 400,
        jsonBody: {
          error: 'Test name is required',
        },
      };
    }

    // Calculate statistical significance
    const results = await calculateStatisticalSignificance(testName, context);

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      jsonBody: results,
    };
  } catch (error) {
    context.error('Error getting test results:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Register the functions
app.http('trackConversion', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ab-test/track',
  handler: trackConversionHandler,
});

app.http('getTestResults', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'ab-test/results/{testName}',
  handler: getTestResultsHandler,
});
