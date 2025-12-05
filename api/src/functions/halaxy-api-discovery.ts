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
    // Construct URL correctly - baseUrl + endpoint (same as HalaxyClient does)
    const fullUrl = `${baseUrl}${endpoint}`;
    const url = new URL(fullUrl);
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
    const { getAccessToken, getHalaxyConfig } = await import('../services/halaxy/token-manager');
    const token = await getAccessToken();
    const config = getHalaxyConfig();
    
    const baseUrl = config.apiBaseUrl; // Use the same URL as the working client
    
    context.log('Testing Halaxy API endpoints at:', baseUrl);
    
    // Test various FHIR endpoints - use the same query params as the actual client
    const endpointsToTest = [
      // Standard FHIR endpoints - same as client getAllPractitioners/Patients
      { endpoint: '/Practitioner', params: { active: 'true' } },
      { endpoint: '/Patient', params: { active: 'true' } },
      { endpoint: '/Appointment', params: undefined },
      { endpoint: '/Schedule', params: undefined },
      { endpoint: '/Slot', params: undefined },
      { endpoint: '/Slot', params: { status: 'free' } },
      
      // Test with specific practitioner
      { endpoint: '/Schedule', params: { actor: 'Practitioner/1439411' } },
      { endpoint: '/Slot', params: { practitioner: 'Practitioner/PR-1439411' } },
      { endpoint: '/Slot', params: { 'schedule.actor': 'Practitioner/PR-1439411' } },
      
      // Other resources
      { endpoint: '/Location', params: undefined },
      { endpoint: '/Organization', params: undefined },
      { endpoint: '/HealthcareService', params: undefined },
      { endpoint: '/PractitionerRole', params: undefined },
      { endpoint: '/metadata', params: undefined },
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
