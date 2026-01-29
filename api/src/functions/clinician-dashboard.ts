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
import { getUserByAzureId, canAccessAdminDashboard, canAccessPractitionerDashboard } from '../services/user';
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

function extractPatientId(appointment: FHIRAppointment): string | null {
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

/**
 * Check if a specific PractitionerRole is actually a participant in the appointment
 * This filters out appointments that belong to other practitioners in the same organization
 */
function isPractitionerParticipant(appointment: FHIRAppointment, practitionerRoleId: string): boolean {
  if (!appointment.participant) return false;
  
  // Look for this practitioner's role in the participants
  return appointment.participant.some(p => {
    const ref = p.actor?.reference || '';
    // Check for both full URL and relative reference formats
    // e.g., "https://au-api.halaxy.com/main/PractitionerRole/PR-3356645" or "PractitionerRole/PR-3356645"
    return ref.includes(`PractitionerRole/${practitionerRoleId}`) ||
           ref.endsWith(`/${practitionerRoleId}`);
  });
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
    // DEV OVERRIDE: Allow specifying a Halaxy ID directly for testing
    // Only works when ALLOW_DEV_OVERRIDE=true (set in dev environment)
    // Usage: ?devHalaxyId=1304541&devHalaxyRoleId=PR-3356645
    // ========================================================================
    const allowDevOverride = process.env.ALLOW_DEV_OVERRIDE === 'true';
    
    const devHalaxyId = req.query.get('devHalaxyId');
    const devHalaxyRoleId = req.query.get('devHalaxyRoleId');
    
    let practitionerConfig: {
      halaxyPractitionerId: string;
      halaxyPractitionerRoleId: string;
      displayName: string;
      email: string;
    };
    
    if (allowDevOverride && devHalaxyId && devHalaxyRoleId) {
      context.log(`[DEV MODE] Using override Halaxy IDs: ${devHalaxyId} / ${devHalaxyRoleId}`);
      
      practitionerConfig = {
        halaxyPractitionerId: devHalaxyId,
        halaxyPractitionerRoleId: devHalaxyRoleId,
        displayName: 'Dev Test User (Viewing as Zoe)',
        email: 'dev@test.local',
      };
    } else {
      // ========================================================================
      // Normal auth flow: Get Azure User ID from header (set by frontend from MSAL)
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
      // Check users table first for role-based access
      // ========================================================================
      let user = null;
      try {
        user = await getUserByAzureId(azureUserId);
        context.log(`[Dashboard] User lookup result: ${JSON.stringify(user)}`);
      } catch (err) {
        // Users table might not exist yet - continue with practitioner lookup
        context.log(`[Dashboard] Users table lookup failed (table may not exist): ${err.message}`);
      }
      
      // If user is admin/staff without practitioner record, return admin dashboard
      if (user && canAccessAdminDashboard(user) && !canAccessPractitionerDashboard(user)) {
        context.log(`[Dashboard] Admin user detected: ${user.display_name} (${user.role})`);
        return {
          status: 200,
          headers,
          jsonBody: {
            success: true,
            data: {
              user: {
                displayName: user.display_name || `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
                permissions: user.permissions || [],
              },
              dashboardType: 'admin',
              message: 'Admin dashboard - no practitioner schedule',
              today: {
                date: new Date().toISOString().split('T')[0],
                sessions: [],
                summary: {
                  date: new Date().toISOString().split('T')[0],
                  totalSessions: 0,
                  completedSessions: 0,
                  upcomingSessions: 0,
                  cancelledSessions: 0,
                },
              },
              weekStats: {
                weekStartDate: new Date().toISOString().split('T')[0],
                weekEndDate: new Date().toISOString().split('T')[0],
                totalSessions: 0,
                completedSessions: 0,
                scheduledSessions: 0,
                cancelledSessions: 0,
                tomorrowSessions: 0,
                remainingThisWeek: 0,
              },
              monthStats: {
                monthName: new Date().toLocaleString('default', { month: 'long' }),
                completedSessions: 0,
                totalRevenue: 0,
                targetRevenue: 0,
              },
              dataSource: 'bloom-admin',
              fetchedAt: new Date().toISOString(),
            },
          },
        };
      }

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

      practitionerConfig = {
        halaxyPractitionerId: dbPractitioner.halaxy_practitioner_id,
        halaxyPractitionerRoleId: dbPractitioner.halaxy_practitioner_role_id,
        displayName: dbPractitioner.display_name || `${dbPractitioner.first_name} ${dbPractitioner.last_name}`,
        email: dbPractitioner.company_email || dbPractitioner.email,
      };

      context.log(`Found practitioner: ${practitionerConfig.displayName} (Halaxy Role: ${practitionerConfig.halaxyPractitionerRoleId})`);
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
    // Get selected date range (supports date query param for day navigation)
    // ========================================================================
    const dateParam = req.query.get('date');
    const selectedDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
    
    // Validate date
    if (isNaN(selectedDate.getTime())) {
      return {
        status: 400,
        headers,
        jsonBody: {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD.',
        },
      };
    }
    
    const now = new Date();
    const _sydneyOffset = getSydneyOffset(now);
    const todayStart = new Date(selectedDate);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(selectedDate);
    todayEnd.setHours(23, 59, 59, 999);

    // Calculate week boundaries (Monday to Sunday) based on selected date
    const dayOfWeek = selectedDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday
    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Calculate tomorrow (relative to selected date)
    const tomorrowStart = new Date(selectedDate);
    tomorrowStart.setDate(selectedDate.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Calculate month boundaries (relative to selected date)
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

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
      
      // Debug: Log today's appointment details
      if (todayAppointments.length > 0) {
        context.log('=== TODAY\'S APPOINTMENTS DEBUG ===');
        for (const appt of todayAppointments) {
          const patientName = extractPatientName(appt);
          context.log(`  ID: ${appt.id}`);
          context.log(`    Patient: ${patientName}`);
          context.log(`    Status: ${appt.status}`);
          context.log(`    Start: ${appt.start}`);
          context.log(`    ServiceType: ${appt.serviceType?.[0]?.coding?.[0]?.display}`);
          context.log(`    Participants: ${JSON.stringify(appt.participant?.map(p => ({
            ref: p.actor?.reference,
            display: p.actor?.display
          })))}`);
        }
        context.log('=================================');
      }
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
    // Filter to only include appointments where this practitioner is a participant
    // ========================================================================
    const filteredTodayAppointments = todayAppointments.filter(apt => 
      isPractitionerParticipant(apt, practitionerConfig.halaxyPractitionerRoleId)
    );
    
    context.log(`Filtered ${todayAppointments.length} appointments down to ${filteredTodayAppointments.length} for practitioner ${practitionerConfig.halaxyPractitionerRoleId}`);
    
    // Fetch patient names for appointments where display name is not available
    // We need to look up patients individually when Halaxy doesn't include the name
    const patientNameCache: Record<string, string> = {};
    
    for (const apt of filteredTodayAppointments) {
      const displayName = extractPatientName(apt);
      if (displayName === 'Unknown') {
        const patientId = extractPatientId(apt);
        if (patientId && !patientNameCache[patientId]) {
          try {
            const patient = await client.getPatient(patientId);
            if (patient.name && patient.name.length > 0) {
              const name = patient.name[0];
              const fullName = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
              patientNameCache[patientId] = fullName || 'Unknown';
              context.log(`Fetched patient ${patientId}: ${fullName}`);
            }
          } catch (err) {
            context.warn(`Failed to fetch patient ${patientId}:`, err);
            patientNameCache[patientId] = 'Unknown';
          }
        }
      }
    }
    
    const sessions: SessionItem[] = filteredTodayAppointments
      .map((apt): SessionItem => {
        const startTime = new Date(apt.start || '');
        const endTime = new Date(apt.end || '');
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        // Get patient name - first try display, then cache
        let patientName = extractPatientName(apt);
        if (patientName === 'Unknown') {
          const patientId = extractPatientId(apt);
          if (patientId && patientNameCache[patientId]) {
            patientName = patientNameCache[patientId];
          }
        }
        
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
    // Filter to only this practitioner's appointments
    // ========================================================================
    const filteredWeekAppointments = weekAppointments.filter(apt => 
      isPractitionerParticipant(apt, practitionerConfig.halaxyPractitionerRoleId)
    );
    const filteredMonthAppointments = monthAppointments.filter(apt => 
      isPractitionerParticipant(apt, practitionerConfig.halaxyPractitionerRoleId)
    );
    
    const isCompleted = (apt: FHIRAppointment) => apt.status?.toLowerCase() === 'fulfilled';
    const isCancelled = (apt: FHIRAppointment) => ['cancelled', 'noshow'].includes(apt.status?.toLowerCase() || '');
    const isScheduled = (apt: FHIRAppointment) => ['booked', 'pending', 'proposed', 'arrived'].includes(apt.status?.toLowerCase() || '');
    
    // Count tomorrow's appointments
    const tomorrowCount = filteredWeekAppointments.filter(apt => {
      const aptDate = new Date(apt.start || '');
      return aptDate >= tomorrowStart && aptDate <= tomorrowEnd && !isCancelled(apt);
    }).length;

    // Count remaining this week (after today, excluding cancelled)
    const remainingThisWeek = filteredWeekAppointments.filter(apt => {
      const aptDate = new Date(apt.start || '');
      return aptDate > todayEnd && !isCancelled(apt);
    }).length;

    const weekStats = {
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0],
      totalSessions: filteredWeekAppointments.filter(apt => !isCancelled(apt)).length,
      completedSessions: filteredWeekAppointments.filter(isCompleted).length,
      scheduledSessions: filteredWeekAppointments.filter(isScheduled).length,
      cancelledSessions: filteredWeekAppointments.filter(isCancelled).length,
      tomorrowSessions: tomorrowCount,
      remainingThisWeek,
    };

    // ========================================================================
    // Calculate month stats from monthAppointments
    // ========================================================================
    const monthCompleted = filteredMonthAppointments.filter(isCompleted).length;
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
