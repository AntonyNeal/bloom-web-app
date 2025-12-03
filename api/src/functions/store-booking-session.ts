/**
 * Store Booking Session Function
 * 
 * Stores GA4 session data when a user clicks a booking button.
 * This allows matching Halaxy bookings back to the original website session
 * for offline conversion tracking in Google Ads.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';

interface BookingSessionRequest {
  client_id: string;
  session_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
}

interface BookingSessionData extends BookingSessionRequest {
  booking_session_id: string;
  created_at: string;
  expires_at: string;
}

// In-memory storage for sessions (in production, use Azure Table Storage or Cosmos DB)
const sessionStore = new Map<string, BookingSessionData>();

// Clean up expired sessions periodically
function cleanupExpiredSessions() {
  const now = new Date();
  for (const [key, session] of sessionStore.entries()) {
    if (new Date(session.expires_at) < now) {
      sessionStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

async function storeBookingSessionHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as BookingSessionRequest;
    
    context.log('[StoreBookingSession] Received request:', JSON.stringify(body));

    // Validate required fields
    if (!body.client_id || !body.session_id) {
      context.warn('[StoreBookingSession] Missing required fields');
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: {
          success: false,
          error: 'Missing required fields: client_id and session_id are required',
        },
      };
    }

    // Generate a unique booking session ID
    const booking_session_id = uuidv4();
    
    // Create session data with 24-hour expiry
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const sessionData: BookingSessionData = {
      booking_session_id,
      client_id: body.client_id,
      session_id: body.session_id,
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      gclid: body.gclid,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    // Store the session
    sessionStore.set(booking_session_id, sessionData);

    context.log('[StoreBookingSession] Session created:', booking_session_id);

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: {
        success: true,
        booking_session_id,
        message: 'Booking session stored successfully',
      },
    };

  } catch (error) {
    context.error('[StoreBookingSession] Error:', error);
    
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
    };
  }
}

// Also create a GET endpoint to retrieve session data (for webhook matching)
async function getBookingSessionHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  const bookingSessionId = req.query.get('booking_session_id');
  
  if (!bookingSessionId) {
    return {
      status: 400,
      headers: corsHeaders,
      jsonBody: {
        success: false,
        error: 'Missing booking_session_id query parameter',
      },
    };
  }

  const session = sessionStore.get(bookingSessionId);
  
  if (!session) {
    return {
      status: 404,
      headers: corsHeaders,
      jsonBody: {
        success: false,
        error: 'Booking session not found or expired',
      },
    };
  }

  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    sessionStore.delete(bookingSessionId);
    return {
      status: 404,
      headers: corsHeaders,
      jsonBody: {
        success: false,
        error: 'Booking session expired',
      },
    };
  }

  return {
    status: 200,
    headers: corsHeaders,
    jsonBody: {
      success: true,
      session,
    },
  };
}

// Register the POST endpoint for storing sessions
app.http('storeBookingSession', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'store-booking-session',
  handler: storeBookingSessionHandler,
});

// Register the GET endpoint for retrieving sessions
app.http('getBookingSession', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'get-booking-session',
  handler: getBookingSessionHandler,
});
