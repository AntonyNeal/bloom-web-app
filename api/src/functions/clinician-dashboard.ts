/**
 * Clinician Dashboard API - Direct Halaxy Integration
 * 
 * This endpoint fetches dashboard data directly from Halaxy's API,
 * eliminating the need for a sync service or local database.
 * 
 * Architecture:
 *   Frontend → This Function → Halaxy API → Response
 * 
 * Benefits:
 * - Always fresh data (no sync lag)
 * - No database to maintain
 * - Simpler architecture
 * 
 * Trade-offs:
 * - Slightly slower (500ms-1s per request)
 * - Subject to Halaxy rate limits
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy';
import { getPractitionerConfig } from '../config/practitioner-mapping';
import { getPractitionerByAzureId } from '../services/practitioner';
import type { FHIRAppointment } from '../services/halaxy/types';

// ============================================================================
// Response Types
// ============================================================================

interface SessionItem {
  id: string;
  time: string;
  clientInitials: string;
  clientName: string; // Full name for clinician view
  sessionType: string;
  duration: number;
  status: 'booked' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  isUpNext: boolean;
  locationType: 'telehealth' | 'in-person';
  notes?: string;
}

interface DaySummary {
  date: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
}

interface DashboardData {
  practitioner: {
    displayName: string;
    email: string;
    halaxyId: string;
  };
  today: {
    date: string;
    sessions: SessionItem[];
    summary: DaySummary;
  };
  dataSource: 'halaxy-live';
  fetchedAt: string;
}

interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

function mapAppointmentStatus(fhirStatus: string): SessionItem['status'] {
  const statusMap: Record<string, SessionItem['status']> = {
    'booked': 'booked',
    'pending': 'booked',
    'proposed': 'booked',
    'arrived': 'arrived',
    'fulfilled': 'completed',
    'cancelled': 'cancelled',
    'noshow': 'no-show',
    'entered-in-error': 'cancelled',
    'checked-in': 'arrived',
  };
  return statusMap[fhirStatus.toLowerCase()] || 'booked';
}

function _isUpcoming(startTime: Date, status: string): boolean {
  const now = new Date();
  return startTime > now && !['cancelled', 'noshow', 'fulfilled'].includes(status.toLowerCase());
}

// ============================================================================
// FHIR Data Extraction Helpers
// ============================================================================

function extractPatientName(appointment: FHIRAppointment): string {
  // Try to get from participant display
  const patientParticipant = appointment.participant?.find(
    p => p.actor?.reference?.startsWith('Patient/')
  );
  if (patientParticipant?.actor?.display) {
    return patientParticipant.actor.display;
  }
  return 'Unknown';
}

function _extractPatientId(appointment: FHIRAppointment): string | null {
  const patientParticipant = appointment.participant?.find(
    p => p.actor?.reference?.startsWith('Patient/')
  );
  if (patientParticipant?.actor?.reference) {
    return patientParticipant.actor.reference.replace('Patient/', '');
  }
  return null;
}

function extractLocationType(appointment: FHIRAppointment): 'telehealth' | 'in-person' {
  // Check appointment type or service type for telehealth indicators
  const serviceType = appointment.serviceType?.[0]?.coding?.[0]?.display?.toLowerCase() || '';
  const description = appointment.description?.toLowerCase() || '';
  
  if (serviceType.includes('telehealth') || serviceType.includes('video') ||
      description.includes('telehealth') || description.includes('video')) {
    return 'telehealth';
  }
  return 'in-person';
}

function extractSessionType(appointment: FHIRAppointment): string {
  return appointment.serviceType?.[0]?.coding?.[0]?.display || 
         appointment.appointmentType?.coding?.[0]?.display ||
         'Consultation';
}

// ============================================================================
// Main Handler
// ============================================================================

async function clinicianDashboardHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Azure-User-Id',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  try {
    // ========================================================================
    // Get Azure User ID from header (set by frontend from MSAL)
    // ========================================================================
    const azureUserId = req.headers.get('X-Azure-User-Id');
    
    if (!azureUserId) {
      return {
        status: 401,
        headers,
        jsonBody: { 
          success: false, 
          error: 'Authentication required. Please log in.' 
        },
      };
    }

    // ========================================================================
    // Look up practitioner from database first, then fall back to config file
    // ========================================================================
    let practitionerConfig: {
      halaxyPractitionerId: string;
      halaxyPractitionerRoleId: string;
      displayName: string;
      email: string;
    } | null = null;

    // First, try to find in the database (for practitioners who completed onboarding)
    try {
      const dbPractitioner = await getPractitionerByAzureId(azureUserId);
      if (dbPractitioner) {
        practitionerConfig = {
          halaxyPractitionerId: dbPractitioner.halaxy_practitioner_id,
          halaxyPractitionerRoleId: dbPractitioner.halaxy_practitioner_role_id || `PR-${dbPractitioner.halaxy_practitioner_id}`,
          displayName: dbPractitioner.display_name || `${dbPractitioner.first_name} ${dbPractitioner.last_name}`,
          email: dbPractitioner.company_email || dbPractitioner.email,
        };
        context.log(`Found practitioner in database: ${practitionerConfig.displayName}`);
      }
    } catch (dbError) {
      context.warn('Database lookup failed, falling back to config file:', dbError);
    }

    // Fall back to hardcoded config file (for existing/test practitioners)
    if (!practitionerConfig) {
      practitionerConfig = getPractitionerConfig(azureUserId);
    }
    
    if (!practitionerConfig) {
      context.warn(`Unknown Azure user attempted dashboard access: ${azureUserId}`);
      return {
        status: 403,
        headers,
        jsonBody: { 
          success: false, 
          error: 'Access denied. Your account is not registered as a practitioner.',
          debug: {
            azureUserId,
            message: 'Complete onboarding or contact admin to register your account'
          }
        },
      };
    }

    context.log(`Dashboard request for ${practitionerConfig.displayName} (${practitionerConfig.halaxyPractitionerId})`);

    // ========================================================================
    // Verify Halaxy credentials are configured
    // ========================================================================
    const halaxyClientId = process.env.HALAXY_CLIENT_ID;
    const halaxyClientSecret = process.env.HALAXY_CLIENT_SECRET;
    
    if (!halaxyClientId || !halaxyClientSecret) {
      context.error('Halaxy credentials not configured in environment variables');
      return {
        status: 500,
        headers,
        jsonBody: {
          success: false,
          error: 'Server configuration error. Please contact support.',
          debug: {
            issue: 'Halaxy API credentials not configured',
            hasClientId: !!halaxyClientId,
            hasClientSecret: !!halaxyClientSecret
          }
        },
      };
    }

    // ========================================================================
    // Get today's date range (Australia/Sydney timezone)
    // ========================================================================
    const now = new Date();
    const _sydneyOffset = getSydneyOffset(now);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // ========================================================================
    // Fetch appointments from Halaxy (with patient details)
    // ========================================================================
    const client = getHalaxyClient();
    
    let appointments: FHIRAppointment[];
    try {
      context.log(`Fetching appointments for practitioner role: ${practitionerConfig.halaxyPractitionerRoleId}`);
      context.log(`Date range: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);
      
      // Use the new method that enriches appointments with patient names
      appointments = await client.getAppointmentsWithPatientDetails(
        practitionerConfig.halaxyPractitionerRoleId,
        todayStart,
        todayEnd
      );
      
      context.log(`Successfully fetched ${appointments.length} appointments with patient details`);
    } catch (halaxyError) {
      context.error('Halaxy API error:', halaxyError);
      const errorMessage = halaxyError instanceof Error ? halaxyError.message : 'Unknown error';
      context.error('Error details:', errorMessage);
      
      return {
        status: 502,
        headers,
        jsonBody: {
          success: false,
          error: 'Unable to fetch appointments from Halaxy. Please try again.',
          debug: {
            errorMessage,
            practitionerRoleId: practitionerConfig.halaxyPractitionerRoleId,
            timestamp: new Date().toISOString()
          }
        },
      };
    }

    // ========================================================================
    // Transform FHIR appointments to dashboard format
    // ========================================================================
    const sessions: SessionItem[] = appointments
      .map((apt): SessionItem => {
        const startTime = new Date(apt.start || '');
        const endTime = new Date(apt.end || '');
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        const patientName = extractPatientName(apt);
        const status = mapAppointmentStatus(apt.status || 'booked');

        return {
          id: apt.id || '',
          time: formatTime(startTime),
          clientInitials: getInitials(patientName),
          clientName: patientName,
          sessionType: extractSessionType(apt),
          duration,
          status,
          isUpNext: false, // Set below
          locationType: extractLocationType(apt),
          notes: apt.comment,
        };
      })
      .sort((a, b) => {
        // Sort by time
        const timeA = parseTimeString(a.time);
        const timeB = parseTimeString(b.time);
        return timeA - timeB;
      });

    // Mark the next upcoming session
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let foundNext = false;
    for (const session of sessions) {
      const sessionMinutes = parseTimeString(session.time);
      if (!foundNext && sessionMinutes > nowMinutes && 
          !['completed', 'cancelled', 'no-show'].includes(session.status)) {
        session.isUpNext = true;
        foundNext = true;
      }
    }

    // ========================================================================
    // Calculate summary
    // ========================================================================
    const summary: DaySummary = {
      date: todayStart.toISOString().split('T')[0],
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      upcomingSessions: sessions.filter(s => ['booked', 'confirmed', 'arrived'].includes(s.status)).length,
      cancelledSessions: sessions.filter(s => ['cancelled', 'no-show'].includes(s.status)).length,
    };

    // ========================================================================
    // Build response
    // ========================================================================
    const response: DashboardResponse = {
      success: true,
      data: {
        practitioner: {
          displayName: practitionerConfig.displayName,
          email: practitionerConfig.email,
          halaxyId: practitionerConfig.halaxyPractitionerId,
        },
        today: {
          date: todayStart.toISOString().split('T')[0],
          sessions,
          summary,
        },
        dataSource: 'halaxy-live',
        fetchedAt: new Date().toISOString(),
      },
    };

    return {
      status: 200,
      headers,
      jsonBody: response,
    };

  } catch (error) {
    context.error('Dashboard error:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function parseTimeString(time: string): number {
  // Parse "9:00 AM" or "2:30 PM" to minutes since midnight
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

function getSydneyOffset(date: Date): number {
  // Sydney is UTC+10 or UTC+11 during daylight saving
  // This is a simplified check - for production, use a proper timezone library
  const month = date.getMonth();
  // DST in Sydney: First Sunday of October to First Sunday of April
  const isDST = month >= 9 || month <= 2;
  return isDST ? 11 : 10;
}

// ============================================================================
// Register Function
// ============================================================================

app.http('clinicianDashboard', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous', // Auth is handled via X-Azure-User-Id header
  route: 'clinician/dashboard',
  handler: clinicianDashboardHandler,
});

export default clinicianDashboardHandler;
