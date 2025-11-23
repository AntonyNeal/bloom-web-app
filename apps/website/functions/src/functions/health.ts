import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a health check request.');

  return {
    status: 200,
    jsonBody: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'lpa-website-api',
    },
  };
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: health,
  route: 'health',
});
