/**
 * Clinician Week Schedule API
 * 
 * Fetches appointments for a week (or custom date range) from Halaxy.
 * 
 * Endpoint:
 *   GET /api/clinician/schedule?startDate=2026-01-20&endDate=2026-01-26
 * 
 * Query params:
 *   startDate - ISO date string (defaults to today)
 *   endDate - ISO date string (defaults to startDate + 6 days)
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
  date: string; // ISO date
  time: string;
  endTime: string;
  clientInitials: string;
  clientName: string;
  sessionType: string;
  duration: number;
  status: 'booked' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  locationType: 'telehealth' | 'in-person';
  notes?: string;
}

interface DaySessions {
  date: string;
  dayName: string;
  sessions: SessionItem[];
  totalMinutes: number;
}

interface WeekScheduleData {
  practitioner: {
    displayName: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  days: DaySessions[];
  totalSessions: number;
  totalMinutes: number;
  dataSource: 'halaxy-live';
  fetchedAt: string;
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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
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

function extractPatientName(appointment: FHIRAppointment): string {
  const patientParticipant = appointment.participant?.find(
    p => p.actor?.reference?.startsWith('Patient/')
  );
  if (patientParticipant?.actor?.display) {
    return patientParticipant.actor.display;
  }
  return 'Unknown';
}

function extractLocationType(appointment: FHIRAppointment): 'telehealth' | 'in-person' {
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

async function clinicianScheduleHandler(
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
    // Get Azure User ID from header
    // ========================================================================
    const azureUserId = req.headers.get('X-Azure-User-Id');
    
    if (!azureUserId) {
      return {
        status: 401,
        headers,
        jsonBody: { success: false, error: 'Missing X-Azure-User-Id header' },
      };
    }

    // ========================================================================
    // Look up practitioner config
    // ========================================================================
    let practitionerConfig: {
      halaxyPractitionerId: string;
      halaxyPractitionerRoleId: string;
      displayName: string;
      email: string;
    } | null = null;

    try {
      const dbPractitioner = await getPractitionerByAzureId(azureUserId);
      if (dbPractitioner) {
        practitionerConfig = {
          halaxyPractitionerId: dbPractitioner.halaxy_practitioner_id,
          halaxyPractitionerRoleId: dbPractitioner.halaxy_practitioner_role_id || `PR-${dbPractitioner.halaxy_practitioner_id}`,
          displayName: dbPractitioner.display_name || `${dbPractitioner.first_name} ${dbPractitioner.last_name}`,
          email: dbPractitioner.company_email || dbPractitioner.email,
        };
      }
    } catch {
      // Fall back to config
    }

    if (!practitionerConfig) {
      practitionerConfig = getPractitionerConfig(azureUserId);
    }
    
    if (!practitionerConfig) {
      return {
        status: 403,
        headers,
        jsonBody: { success: false, error: 'Access denied. Not registered as a practitioner.' },
      };
    }

    // ========================================================================
    // Parse date range from query params
    // ========================================================================
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to start of current week (Monday)
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to 6 days after start (full week)
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    context.log(`Fetching schedule for ${practitionerConfig.displayName}: ${formatDate(startDate)} to ${formatDate(endDate)}`);

    // ========================================================================
    // Fetch appointments from Halaxy (with patient details)
    // ========================================================================
    const client = getHalaxyClient();
    
    let appointments: FHIRAppointment[];
    try {
      // Use the method that enriches appointments with patient names
      appointments = await client.getAppointmentsWithPatientDetails(
        practitionerConfig.halaxyPractitionerRoleId,
        startDate,
        endDate
      );
      context.log(`Fetched ${appointments.length} appointments with patient details`);
    } catch (halaxyError) {
      context.error('Halaxy API error:', halaxyError);
      return {
        status: 502,
        headers,
        jsonBody: { success: false, error: 'Unable to fetch schedule from Halaxy' },
      };
    }

    // ========================================================================
    // Transform to SessionItems
    // ========================================================================
    const sessions: SessionItem[] = appointments.map((apt): SessionItem => {
      const startTime = new Date(apt.start || '');
      const endTime = new Date(apt.end || '');
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      const patientName = extractPatientName(apt);

      return {
        id: apt.id || '',
        date: formatDate(startTime),
        time: formatTime(startTime),
        endTime: formatTime(endTime),
        clientInitials: getInitials(patientName),
        clientName: patientName,
        sessionType: extractSessionType(apt),
        duration,
        status: mapAppointmentStatus(apt.status || 'booked'),
        locationType: extractLocationType(apt),
        notes: apt.comment,
      };
    });

    // ========================================================================
    // Group by day
    // ========================================================================
    const dayMap = new Map<string, SessionItem[]>();
    
    // Initialize all days in range
    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      dayMap.set(formatDate(currentDay), []);
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Add sessions to their respective days
    for (const session of sessions) {
      const existing = dayMap.get(session.date);
      if (existing) {
        existing.push(session);
      }
    }

    // Sort sessions within each day and build response
    const days: DaySessions[] = [];
    for (const [date, daySessions] of dayMap) {
      const sortedSessions = daySessions.sort((a, b) => {
        const timeA = new Date(`${a.date}T${convertTo24Hour(a.time)}`).getTime();
        const timeB = new Date(`${b.date}T${convertTo24Hour(b.time)}`).getTime();
        return timeA - timeB;
      });

      const totalMinutes = sortedSessions
        .filter(s => !['cancelled', 'no-show'].includes(s.status))
        .reduce((sum, s) => sum + s.duration, 0);

      days.push({
        date,
        dayName: getDayName(new Date(date)),
        sessions: sortedSessions,
        totalMinutes,
      });
    }

    // Sort days chronologically
    days.sort((a, b) => a.date.localeCompare(b.date));

    // ========================================================================
    // Build response
    // ========================================================================
    const totalSessions = sessions.filter(s => !['cancelled', 'no-show'].includes(s.status)).length;
    const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);

    const response: { success: boolean; data: WeekScheduleData } = {
      success: true,
      data: {
        practitioner: {
          displayName: practitionerConfig.displayName,
          email: practitionerConfig.email,
        },
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        days,
        totalSessions,
        totalMinutes,
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
    context.error('Schedule error:', error);
    return {
      status: 500,
      headers,
      jsonBody: { success: false, error: 'An unexpected error occurred' },
    };
  }
}

/**
 * Convert "9:00 AM" to "09:00" for sorting
 */
function convertTo24Hour(time: string): string {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '00:00';
  
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// ============================================================================
// Register Function
// ============================================================================

app.http('clinicianSchedule', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clinician/schedule',
  handler: clinicianScheduleHandler,
});

export default clinicianScheduleHandler;
