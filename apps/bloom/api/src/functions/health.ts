import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

async function healthHandler(
  req: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  return {
    status: 200,
    headers,
    jsonBody: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Bloom API is running',
    },
  };
}

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'health',
  handler: healthHandler,
});
