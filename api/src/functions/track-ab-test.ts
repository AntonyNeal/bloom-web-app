import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';

// Get Cosmos DB client
function getCosmosClient() {
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('COSMOS_DB_CONNECTION_STRING not configured');
  }
  return new CosmosClient(connectionString);
}

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

      const cosmosClient = getCosmosClient();
      const database = cosmosClient.database('bloom-ab-testing');
      const container = database.container('test-events');

      // Create event document
      const event = {
        id: `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        testName,
        variant,
        sessionId,
        userId: userId || null,
        converted: converted || false,
        timestamp: new Date().toISOString(),
        _partitionKey: testName, // Partition by test name for efficient queries
      };

      await container.items.create(event);

      context.log(`Event tracked for test: ${testName}, variant: ${variant}, converted: ${converted}`);

      return {
        status: 201,
        headers,
        jsonBody: { success: true, eventId: event.id },
      };
    }

    if (method === 'GET') {
      // Get test results in real-time from Cosmos DB
      const testName = req.query.get('testName');

      if (!testName) {
        return {
          status: 400,
          headers,
          jsonBody: { error: 'testName query parameter is required' },
        };
      }

      const cosmosClient = getCosmosClient();
      const database = cosmosClient.database('bloom-ab-testing');
      const container = database.container('test-events');

      const query = {
        query: 'SELECT c.variant, c.converted FROM c WHERE c.testName = @testName',
        parameters: [{ name: '@testName', value: testName }],
      };

      const { resources } = await container.items.query(query).fetchAll();

      // Aggregate results by variant
      const variantStats: {
        [key: string]: { allocations: number; conversions: number };
      } = {};

      for (const event of resources) {
        const variant = event.variant;
        if (!variantStats[variant]) {
          variantStats[variant] = { allocations: 0, conversions: 0 };
        }
        variantStats[variant].allocations++;
        if (event.converted) {
          variantStats[variant].conversions++;
        }
      }

      const variants = Object.entries(variantStats).map(([variant, stats]) => ({
        variant,
        allocations: stats.allocations,
        conversions: stats.conversions,
        conversionRate: stats.conversions / stats.allocations,
      }));

      return {
        status: 200,
        headers,
        jsonBody: {
          testName,
          variants,
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
