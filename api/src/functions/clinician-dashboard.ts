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
  // Extended stats from real Halaxy data
  weekStats: {
    weekStartDate: string;
    weekEndDate: string;
    totalSessions: number;
    completedSessions: number;
    scheduledSessions: number;
    cancelledSessions: number;
    tomorrowSessions: number;
    remainingThisWeek: number;
  };
  monthStats: {
    monthName: string;
    completedSessions: number;
    totalRevenue: number; // Estimated at $220/session
    targetRevenue: number;
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
  // Handle Invalid Date
  if (isNaN(date.getTime())) {
    return '';
  }
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
  // Note: Halaxy returns full URLs like https://au-api.halaxy.com/main/Patient/123
  const patientParticipant = appointment.participant?.find(
    p => p.actor?.reference?.includes('Patient/')
  );
  if (patientParticipant?.actor?.display) {
    return patientParticipant.actor.display;
  }
  return 'Unknown';
}

function _extractPatientId(appointment: FHIRAppointment): string | null {
  const patientParticipant = appointment.participant?.find(
    p => p.actor?.reference?.includes('Patient/')
  );
  if (patientParticipant?.actor?.reference) {
    // Extract ID from full URL or relative reference
    const match = patientParticipant.actor.reference.match(/Patient\/([^/]+)$/);
    return match ? match[1] : null;
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
    // Look up practitioner from database - NO FALLBACKS
    // ========================================================================
    const dbPractitioner = await getPractitionerByAzureId(azureUserId);
    
    if (!dbPractitioner) {
      context.error(`Practitioner not found in database for Azure ID: ${azureUserId}`);
      return {
        status: 403,
        headers,
        jsonBody: { 
          success: false, 
          error: 'Access denied. Your account is not registered as a practitioner.',
          debug: {
            azureUserId,
            message: 'Complete onboarding to register your account'
          }
        },
      };
    }

    // Require valid Halaxy IDs - no placeholders
    if (!dbPractitioner.halaxy_practitioner_id || dbPractitioner.halaxy_practitioner_id.startsWith('app-')) {
      context.error(`Invalid Halaxy practitioner ID for ${dbPractitioner.email}: ${dbPractitioner.halaxy_practitioner_id}`);
      return {
        status: 500,
        headers,
        jsonBody: { 
          success: false, 
          error: 'Halaxy integration not configured. Please contact admin.',
          debug: {
            practitionerId: dbPractitioner.id,
            halaxyPractitionerId: dbPractitioner.halaxy_practitioner_id,
            message: 'Practitioner needs valid Halaxy credentials'
          }
        },
      };
    }

    if (!dbPractitioner.halaxy_practitioner_role_id) {
      context.error(`Missing Halaxy practitioner role ID for ${dbPractitioner.email}`);
      return {
        status: 500,
        headers,
        jsonBody: { 
          success: false, 
          error: 'Halaxy role not configured. Please contact admin.',
          debug: {
            practitionerId: dbPractitioner.id,
            halaxyPractitionerId: dbPractitioner.halaxy_practitioner_id,
            halaxyPractitionerRoleId: dbPractitioner.halaxy_practitioner_role_id,
            message: 'Practitioner needs valid Halaxy PractitionerRole ID'
          }
        },
      };
    }

    const practitionerConfig = {
      halaxyPractitionerId: dbPractitioner.halaxy_practitioner_id,
      halaxyPractitionerRoleId: dbPractitioner.halaxy_practitioner_role_id,
      displayName: dbPractitioner.display_name || `${dbPractitioner.first_name} ${dbPractitioner.last_name}`,
      email: dbPractitioner.company_email || dbPractitioner.email,
    };

    context.log(`Found practitioner: ${practitionerConfig.displayName} (Halaxy Role: ${practitionerConfig.halaxyPractitionerRoleId})`);

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

    // Calculate week boundaries (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Calculate tomorrow
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Calculate month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // ========================================================================
    // Fetch appointments from Halaxy (with patient details)
    // ========================================================================
    const client = getHalaxyClient();
    
    let todayAppointments: FHIRAppointment[];
    let weekAppointments: FHIRAppointment[];
    let monthAppointments: FHIRAppointment[];
    
    try {
      context.log(`Fetching appointments for practitioner role: ${practitionerConfig.halaxyPractitionerRoleId}`);
      
      // Fetch all three ranges in parallel for better performance
      const [todayResult, weekResult, monthResult] = await Promise.all([
        client.getAppointmentsWithPatientDetails(
          practitionerConfig.halaxyPractitionerRoleId,
          todayStart,
          todayEnd
        ),
        client.getAppointmentsByPractitioner(
          practitionerConfig.halaxyPractitionerRoleId,
          weekStart,
          weekEnd
        ),
        client.getAppointmentsByPractitioner(
          practitionerConfig.halaxyPractitionerRoleId,
          monthStart,
          monthEnd
        ),
      ]);
      
      todayAppointments = todayResult;
      weekAppointments = weekResult;
      monthAppointments = monthResult;
      
      context.log(`Fetched: ${todayAppointments.length} today, ${weekAppointments.length} this week, ${monthAppointments.length} this month`);
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
    const sessions: SessionItem[] = todayAppointments
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
    // Calculate week stats from weekAppointments
    // ========================================================================
    const isCompleted = (apt: FHIRAppointment) => apt.status?.toLowerCase() === 'fulfilled';
    const isCancelled = (apt: FHIRAppointment) => ['cancelled', 'noshow'].includes(apt.status?.toLowerCase() || '');
    const isScheduled = (apt: FHIRAppointment) => ['booked', 'pending', 'proposed', 'arrived'].includes(apt.status?.toLowerCase() || '');
    
    // Count tomorrow's appointments
    const tomorrowCount = weekAppointments.filter(apt => {
      const aptDate = new Date(apt.start || '');
      return aptDate >= tomorrowStart && aptDate <= tomorrowEnd && !isCancelled(apt);
    }).length;

    // Count remaining this week (after today, excluding cancelled)
    const remainingThisWeek = weekAppointments.filter(apt => {
      const aptDate = new Date(apt.start || '');
      return aptDate > todayEnd && !isCancelled(apt);
    }).length;

    const weekStats = {
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0],
      totalSessions: weekAppointments.filter(apt => !isCancelled(apt)).length,
      completedSessions: weekAppointments.filter(isCompleted).length,
      scheduledSessions: weekAppointments.filter(isScheduled).length,
      cancelledSessions: weekAppointments.filter(isCancelled).length,
      tomorrowSessions: tomorrowCount,
      remainingThisWeek,
    };

    // ========================================================================
    // Calculate month stats from monthAppointments
    // ========================================================================
    const monthCompleted = monthAppointments.filter(isCompleted).length;
    const AVERAGE_SESSION_RATE = 220; // Average rebate/fee per session
    const TARGET_SESSIONS_PER_MONTH = 100; // ~25/week target
    
    const monthStats = {
      monthName: now.toLocaleDateString('en-AU', { month: 'long' }),
      completedSessions: monthCompleted,
      totalRevenue: monthCompleted * AVERAGE_SESSION_RATE,
      targetRevenue: TARGET_SESSIONS_PER_MONTH * AVERAGE_SESSION_RATE,
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
        weekStats,
        monthStats,
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
