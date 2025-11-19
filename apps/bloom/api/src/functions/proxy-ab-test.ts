import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

async function proxyABTestHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const method = req.method;
  const testName = req.params.testName;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { status: 204, headers };
  }

  try {
    if (method === 'GET' && testName) {
      context.log(`Proxying A/B test results for ${testName}`);

      // Forward request to the actual Azure Function App
      const remoteUrl = `https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/${encodeURIComponent(testName)}`;

      try {
        context.log(`Fetching from: ${remoteUrl}`);
        const response = await fetch(remoteUrl, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          context.warn(`Remote returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          status: 200,
          headers,
          jsonBody: data,
        };
      } catch (fetchErr) {
        context.error(`Failed to fetch from remote: ${fetchErr}`);

        // Return mock data for development
        const mockData = {
          testName,
          variants: {
            control: { allocations: 50, conversions: 5, conversionRate: 0.1 },
            variant: { allocations: 50, conversions: 8, conversionRate: 0.16 },
          },
          statisticalSignificance: {
            zScore: 1.2,
            pValue: 0.23,
            isSignificant: false,
            confidenceLevel: '95%',
          },
          improvement: {
            percentage: 60,
            winner: 'variant',
          },
        };

        context.log(`Returning mock data for ${testName}`);
        return {
          status: 200,
          headers,
          jsonBody: mockData,
        };
      }
    }

    if (method === 'GET') {
      // Return list of available tests
      const tests = [
        'homepage-header-test',
        'hero-cta-test',
        'mobile-touch-test',
        'form-fields-test',
        'trust-badges-test',
      ];

      return {
        status: 200,
        headers,
        jsonBody: { tests },
      };
    }

    return {
      status: 405,
      headers,
      jsonBody: { error: 'Method not allowed' },
    };
  } catch (error) {
    context.error('Error in proxy handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return {
      status: 500,
      headers,
      jsonBody: { error: errorMessage },
    };
  }
}

app.http('proxy-ab-test', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'ab-test-proxy/results/{testName?}',
  handler: proxyABTestHandler,
});
