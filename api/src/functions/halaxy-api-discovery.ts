/**
 * Halaxy API Discovery Function
 * 
 * Diagnostic endpoint to probe available Halaxy API endpoints.
 * Used to understand what the Halaxy FHIR API actually supports.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';

interface EndpointTest {
  endpoint: string;
  method: string;
  params?: Record<string, string>;
  status: number;
  success: boolean;
  responsePreview?: string;
  error?: string;
}

async function testEndpoint(
  baseUrl: string,
  endpoint: string,
  token: string,
  params?: Record<string, string>
): Promise<EndpointTest> {
  try {
    const url = new URL(endpoint, baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/fhir+json, application/json',
      },
    });

    const text = await response.text();
    let preview = text.slice(0, 500);
    
    // Try to parse as JSON for better preview
    try {
      const json = JSON.parse(text);
      if (json.resourceType) {
        preview = `resourceType: ${json.resourceType}, total: ${json.total || 'N/A'}`;
        if (json.entry) {
          preview += `, entries: ${json.entry.length}`;
        }
      }
    } catch {
      // Keep text preview
    }

    return {
      endpoint,
      method: 'GET',
      params,
      status: response.status,
      success: response.ok,
      responsePreview: preview,
    };
  } catch (error) {
    return {
      endpoint,
      method: 'GET',
      params,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function halaxyApiDiscoveryHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    // Get OAuth token using the Halaxy client
    const client = getHalaxyClient();
    
    // Access the internal token manager
    const { getAccessToken } = await import('../services/halaxy/token-manager');
    const token = await getAccessToken();
    
    const baseUrl = process.env.HALAXY_API_BASE_URL || 'https://au-api.halaxy.com/main/fhir/r4';
    
    context.log('Testing Halaxy API endpoints...');
    
    // Test various FHIR endpoints
    const endpointsToTest = [
      // Standard FHIR endpoints
      { endpoint: '/metadata', params: undefined },
      { endpoint: '/Practitioner', params: { _count: '1' } },
      { endpoint: '/Patient', params: { _count: '1' } },
      { endpoint: '/Appointment', params: { _count: '1' } },
      { endpoint: '/Schedule', params: { _count: '1' } },
      { endpoint: '/Slot', params: { _count: '1' } },
      { endpoint: '/Location', params: { _count: '1' } },
      { endpoint: '/Organization', params: { _count: '1' } },
      { endpoint: '/HealthcareService', params: { _count: '1' } },
      { endpoint: '/PractitionerRole', params: { _count: '1' } },
      
      // Try alternative base paths
      { endpoint: '/../Schedule', params: { _count: '1' } },
      { endpoint: '/../availability', params: undefined },
      { endpoint: '/../slots', params: undefined },
      
      // Try date-based appointment query (without practitioner filter)
      { 
        endpoint: '/Appointment', 
        params: { 
          date: `ge${new Date().toISOString().split('T')[0]}`,
          _count: '5' 
        } 
      },
    ];

    const results: EndpointTest[] = [];
    
    for (const test of endpointsToTest) {
      const result = await testEndpoint(baseUrl, test.endpoint, token, test.params);
      results.push(result);
      context.log(`${test.endpoint}: ${result.status} ${result.success ? '✓' : '✗'}`);
    }

    // Separate successful and failed endpoints
    const available = results.filter(r => r.success);
    const unavailable = results.filter(r => !r.success);

    return {
      status: 200,
      headers,
      jsonBody: {
        baseUrl,
        summary: {
          total: results.length,
          available: available.length,
          unavailable: unavailable.length,
        },
        availableEndpoints: available,
        unavailableEndpoints: unavailable,
        recommendations: generateRecommendations(available, unavailable),
      },
    };
  } catch (error) {
    context.error('API discovery error:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

function generateRecommendations(
  available: EndpointTest[],
  unavailable: EndpointTest[]
): string[] {
  const recommendations: string[] = [];
  
  const hasSlot = available.some(e => e.endpoint === '/Slot');
  const hasSchedule = available.some(e => e.endpoint === '/Schedule');
  const hasAppointment = available.some(e => e.endpoint === '/Appointment');
  const hasPatient = available.some(e => e.endpoint === '/Patient');
  
  if (!hasSlot && !hasSchedule) {
    recommendations.push(
      'No Slot or Schedule endpoint available. Consider generating availability from practitioner working hours or gaps in appointments.'
    );
  }
  
  if (hasAppointment && !hasSlot) {
    recommendations.push(
      'Appointment endpoint available but not Slot. Could calculate free slots by finding gaps in booked appointments.'
    );
  }
  
  if (hasPatient) {
    recommendations.push(
      'Patient endpoint available. Try fetching all patients without practitioner filter, then filter client-side.'
    );
  }
  
  if (hasAppointment) {
    recommendations.push(
      'Appointment endpoint available. Try fetching appointments by date range only, without practitioner filter.'
    );
  }
  
  return recommendations;
}

app.http('halaxyApiDiscovery', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'halaxy/discover',
  handler: halaxyApiDiscoveryHandler,
});

export default halaxyApiDiscoveryHandler;
