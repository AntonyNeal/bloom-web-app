/**
 * Debug Slots Endpoint
 * 
 * Directly test Halaxy slot API to debug sync issues.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { FHIRSlot } from '../services/halaxy/types';

async function debugSlotsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const client = getHalaxyClient();
    
    context.log('Testing slot endpoints...');
    
    // Test 1: Get all slots without any filters
    let allSlots: FHIRSlot[] = [];
    let allSlotsError: string | null = null;
    try {
      allSlots = await client.getAllSlots();
      context.log(`getAllSlots returned ${allSlots.length} slots`);
    } catch (e) {
      allSlotsError = e instanceof Error ? e.message : 'Unknown error';
      context.error('getAllSlots failed:', e);
    }
    
    // Test 2: Get slots with date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);
    
    let dateRangeSlots: FHIRSlot[] = [];
    let dateRangeSlotsError: string | null = null;
    try {
      dateRangeSlots = await client.getAllAvailableSlots(startDate, endDate, 'free');
      context.log(`getAllAvailableSlots returned ${dateRangeSlots.length} slots`);
    } catch (e) {
      dateRangeSlotsError = e instanceof Error ? e.message : 'Unknown error';
      context.error('getAllAvailableSlots failed:', e);
    }
    
    // Sample some slots for inspection
    const sampleSlots = allSlots.slice(0, 5).map(slot => ({
      id: slot.id,
      start: slot.start,
      end: slot.end,
      status: slot.status,
      schedule: slot.schedule,
    }));
    
    return {
      status: 200,
      headers,
      jsonBody: {
        summary: {
          allSlotsCount: allSlots.length,
          allSlotsError,
          dateRangeSlotsCount: dateRangeSlots.length,
          dateRangeSlotsError,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        },
        sampleSlots,
        freeSlots: allSlots.filter(s => s.status === 'free').length,
        busySlots: allSlots.filter(s => s.status === 'busy').length,
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
