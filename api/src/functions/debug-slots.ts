/**
 * Debug Slots Endpoint
 * 
 * Directly test Halaxy slot API to debug sync issues.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { FHIRSlot } from '../services/halaxy/types';
import { getAccessToken, getHalaxyConfig } from '../services/halaxy/token-manager';

async function debugSlotsHandler(
  _req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const client = getHalaxyClient();
    const config = getHalaxyConfig();
    const token = await getAccessToken();
    
    context.log('Testing slot endpoints...');
    
    // First, make a direct fetch to see the raw FHIR response with pagination links
    const directUrl = `${config.apiBaseUrl}/Slot`;
    context.log(`Direct fetch to: ${directUrl}`);
    
    const directResponse = await fetch(directUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/fhir+json',
      },
    });
    
    const directJson = await directResponse.json();
    
    // Extract pagination info
    const paginationLinks = directJson.link || [];
    const nextLink = paginationLinks.find((l: { relation: string }) => l.relation === 'next');
    const selfLink = paginationLinks.find((l: { relation: string }) => l.relation === 'self');
    
    // Test 1: Get available appointments via $find operation
    let allSlots: FHIRSlot[] = [];
    let allSlotsError: string | null = null;
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      
      allSlots = await client.findAvailableAppointments(
        startDate,
        endDate,
        60, // 60 minute duration
        'PR-1439411' // Zoe's practitioner ID
      );
      context.log(`findAvailableAppointments returned ${allSlots.length} slots`);
    } catch (e) {
      allSlotsError = e instanceof Error ? e.message : 'Unknown error';
      context.error('findAvailableAppointments failed:', e);
    }
    
    // Sample some slots for inspection
    const sampleSlots = allSlots.slice(0, 3).map(slot => ({
      id: slot.id,
      start: slot.start,
      end: slot.end,
      status: slot.status,
    }));
    
    return {
      status: 200,
      headers,
      jsonBody: {
        config: {
          apiBaseUrl: config.apiBaseUrl,
          directUrl,
        },
        directFetchResult: {
          status: directResponse.status,
          resourceType: directJson.resourceType,
          total: directJson.total,
          entryCount: directJson.entry?.length || 0,
        },
        pagination: {
          allLinks: paginationLinks,
          selfLink: selfLink?.url,
          nextLink: nextLink?.url,
          hasNextPage: !!nextLink,
        },
        clientResult: {
          allSlotsCount: allSlots.length,
          allSlotsError,
          freeSlots: allSlots.filter(s => s.status === 'free').length,
          busySlots: allSlots.filter(s => s.status === 'busy').length,
        },
        sampleSlots,
      },
    };
  } catch (error) {
    context.error('Debug slots error:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

app.http('debugSlots', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'halaxy/debug-slots',
  handler: debugSlotsHandler,
});

export default debugSlotsHandler;
