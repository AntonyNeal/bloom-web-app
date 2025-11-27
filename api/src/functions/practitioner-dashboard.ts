/**
 * Practitioner Dashboard API
 * 
 * Serves dashboard data from synced Halaxy data stored in Bloom DB.
 * Data is kept in sync via HalaxySyncService (webhooks + scheduled sync).
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

// ============================================================================
// Types (matching src/types/bloom.ts)
// ============================================================================

interface SessionFeedItem {
  id: string;
  time: string;
  clientInitials: string;
  clientId: string;
  sessionNumber: number;
  presentingIssues: string[];
  mhcpRemaining: number;
  mhcpTotal: number;
  relationshipMonths: number;
  status: string;
  isUpNext: boolean;
  locationType: string;
}

interface WeeklyStats {
  weekStartDate: string;
  weekEndDate: string;
  currentSessions: number;
  scheduledSessions: number;
  maxSessions: number;
  currentRevenue: number;
  targetRevenue: number;
  completionRate: number;
  noShowCount: number;
  cancellationCount: number;
}

interface UpcomingStats {
  tomorrowSessions: number;
  remainingThisWeek: number;
  nextWeekSessions: number;
  mhcpEndingSoon: number;
  clientsNeedingFollowUp: number;
  unbookedRegulars: number;
}

interface MonthlyStats {
  monthName: string;
  monthYear: string;
  currentRevenue: number;
  targetRevenue: number;
  projectedRevenue: number;
  yearlyProjection: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  averageSessionValue: number;
  revenueByBillingType: {
    medicare: number;
    private: number;
    dva: number;
    workcover: number;
    ndis: number;
  };
}

interface SyncStatus {
  isConnected: boolean;
  lastSuccessfulSync: string | null;
  lastSyncAttempt: string | null;
  syncErrors: Array<{
    timestamp: string;
    operation: string;
    entity: string;
    error: string;
    isResolved: boolean;
  }>;
  pendingChanges: number;
}

interface Practitioner {
  id: string;
  displayName: string;
  email: string;
  specializations: string[];
  timezone: string;
}

interface DashboardResponse {
  success: boolean;
  data?: {
    practitioner: Practitioner;
    todaysSessions: SessionFeedItem[];
    weeklyStats: WeeklyStats;
    upcomingStats: UpcomingStats;
    monthlyStats: MonthlyStats;
    lastUpdated: string;
    syncStatus: SyncStatus;
  };
  error?: string;
}

// ============================================================================
// Database Connection
// ============================================================================

const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;

  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();
}

function parseJsonSafe<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function findNextSession(sessions: SessionFeedItem[]): string | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Sort by time and find next upcoming session
  const upcoming = sessions
    .filter(s => s.status === 'scheduled' || s.status === 'confirmed')
    .sort((a, b) => {
      // Parse time string "9:00 AM" to minutes since midnight
      const parseTime = (t: string) => {
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a.time) - parseTime(b.time);
    });
  
  const currentMinutes = currentHour * 60 + currentMinute;
  
  for (const session of upcoming) {
    const match = session.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      const sessionMinutes = hours * 60 + minutes;
      
      if (sessionMinutes > currentMinutes) {
        return session.id;
      }
    }
  }
  
  return upcoming[0]?.id || null;
}

// ============================================================================
// Dashboard Handler
// ============================================================================

async function practitionerDashboardHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const practitionerId = req.params.practitionerId;
  const dateParam = req.query.get('date');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  if (!practitionerId) {
    return {
      status: 400,
      headers,
      jsonBody: { success: false, error: 'practitionerId is required' },
    };
  }

  try {
    const config = getConfig();
    const pool = await sql.connect(config);

    // Parse target date (default to today)
    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    
    context.log(`Fetching dashboard for practitioner ${practitionerId}, date ${targetDate}`);

    // ========================================================================
    // Fetch Practitioner
    // ========================================================================
    const practitionerResult = await pool
      .request()
      .input('id', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT id, display_name, email, specializations, timezone
        FROM practitioners
        WHERE id = @id
      `);

    if (practitionerResult.recordset.length === 0) {
      return {
        status: 404,
        headers,
        jsonBody: { success: false, error: 'Practitioner not found' },
      };
    }

    const practitionerRow = practitionerResult.recordset[0];
    const practitioner: Practitioner = {
      id: practitionerRow.id,
      displayName: practitionerRow.display_name,
      email: practitionerRow.email,
      specializations: parseJsonSafe(practitionerRow.specializations, []),
      timezone: practitionerRow.timezone || 'Australia/Sydney',
    };

    // ========================================================================
    // Fetch Today's Sessions
    // ========================================================================
    const sessionsResult = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('targetDate', sql.Date, targetDate)
      .query(`
        SELECT 
          s.id,
          s.scheduled_start_time,
          s.session_number,
          s.status,
          s.location_type,
          c.id as client_id,
          c.initials as client_initials,
          c.presenting_issues,
          c.mhcp_remaining_sessions,
          c.mhcp_total_sessions,
          c.relationship_months
        FROM sessions s
        JOIN clients c ON s.client_id = c.id
        WHERE s.practitioner_id = @practitionerId
          AND CAST(s.scheduled_start_time AS DATE) = @targetDate
        ORDER BY s.scheduled_start_time
      `);

    const todaysSessions: SessionFeedItem[] = sessionsResult.recordset.map(row => ({
      id: row.id,
      time: formatTime(new Date(row.scheduled_start_time)),
      clientInitials: row.client_initials,
      clientId: row.client_id,
      sessionNumber: row.session_number,
      presentingIssues: parseJsonSafe(row.presenting_issues, []),
      mhcpRemaining: row.mhcp_remaining_sessions || 0,
      mhcpTotal: row.mhcp_total_sessions || 10,
      relationshipMonths: row.relationship_months || 0,
      status: row.status,
      isUpNext: false, // Will be set below
      locationType: row.location_type || 'in-person',
    }));

    // Mark the next upcoming session
    const nextSessionId = findNextSession(todaysSessions);
    todaysSessions.forEach(s => {
      s.isUpNext = s.id === nextSessionId;
    });

    // ========================================================================
    // Fetch Weekly Stats
    // ========================================================================
    const weeklyResult = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT * FROM vw_weekly_stats
        WHERE practitioner_id = @practitionerId
      `);

    const weeklyRow = weeklyResult.recordset[0] || {};
    const weeklyStats: WeeklyStats = {
      weekStartDate: weeklyRow.week_start?.toISOString().split('T')[0] || '',
      weekEndDate: weeklyRow.week_end?.toISOString().split('T')[0] || '',
      currentSessions: weeklyRow.completed_sessions || 0,
      scheduledSessions: weeklyRow.scheduled_sessions || 0,
      maxSessions: weeklyRow.weekly_session_target || 25,
      currentRevenue: parseFloat(weeklyRow.earned_revenue) || 0,
      targetRevenue: parseFloat(weeklyRow.weekly_revenue_target) || 5500,
      completionRate: weeklyRow.total_sessions > 0 
        ? Math.round((weeklyRow.completed_sessions / weeklyRow.total_sessions) * 100) 
        : 0,
      noShowCount: weeklyRow.no_shows || 0,
      cancellationCount: weeklyRow.cancellations || 0,
    };

    // ========================================================================
    // Fetch Monthly Stats
    // ========================================================================
    const monthlyResult = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT * FROM vw_monthly_stats
        WHERE practitioner_id = @practitionerId
      `);

    const monthlyRow = monthlyResult.recordset[0] || {};
    const currentRevenue = parseFloat(monthlyRow.earned_revenue) || 0;
    const projectedRevenue = parseFloat(monthlyRow.projected_revenue) || 0;
    const targetRevenue = parseFloat(monthlyRow.monthly_revenue_target) || 22000;
    
    // Calculate yearly projection based on current month's pace
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const monthlyPace = dayOfMonth > 0 ? (currentRevenue / dayOfMonth) * daysInMonth : currentRevenue;
    
    const monthlyStats: MonthlyStats = {
      monthName: monthlyRow.month_name || new Date().toLocaleString('en-AU', { month: 'long' }),
      monthYear: monthlyRow.month_year || new Date().toISOString().slice(0, 7),
      currentRevenue,
      targetRevenue,
      projectedRevenue: projectedRevenue + currentRevenue,
      yearlyProjection: Math.round(monthlyPace * 12),
      sessionsCompleted: monthlyRow.completed_sessions || 0,
      sessionsScheduled: monthlyRow.scheduled_sessions || 0,
      averageSessionValue: parseFloat(monthlyRow.avg_session_value) || 220,
      revenueByBillingType: {
        medicare: parseFloat(monthlyRow.medicare_revenue) || 0,
        private: parseFloat(monthlyRow.private_revenue) || 0,
        dva: parseFloat(monthlyRow.dva_revenue) || 0,
        workcover: parseFloat(monthlyRow.workcover_revenue) || 0,
        ndis: parseFloat(monthlyRow.ndis_revenue) || 0,
      },
    };

    // ========================================================================
    // Fetch Upcoming Stats
    // ========================================================================
    const upcomingResult = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT * FROM vw_upcoming_stats
        WHERE practitioner_id = @practitionerId
      `);

    const mhcpResult = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT clients_mhcp_ending FROM vw_mhcp_ending_soon
        WHERE practitioner_id = @practitionerId
      `);

    const upcomingRow = upcomingResult.recordset[0] || {};
    const mhcpRow = mhcpResult.recordset[0] || {};
    
    const upcomingStats: UpcomingStats = {
      tomorrowSessions: upcomingRow.tomorrow_sessions || 0,
      remainingThisWeek: upcomingRow.remaining_this_week || 0,
      nextWeekSessions: upcomingRow.next_week_sessions || 0,
      mhcpEndingSoon: mhcpRow.clients_mhcp_ending || 0,
      clientsNeedingFollowUp: 0, // TODO: Implement
      unbookedRegulars: 0, // TODO: Implement
    };

    // ========================================================================
    // Fetch Sync Status
    // ========================================================================
    const syncResult = await pool
      .request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT * FROM sync_status
        WHERE practitioner_id = @practitionerId
      `);

    const syncRow = syncResult.recordset[0];
    const syncStatus: SyncStatus = syncRow ? {
      isConnected: syncRow.is_connected,
      lastSuccessfulSync: syncRow.last_successful_sync?.toISOString() || null,
      lastSyncAttempt: syncRow.last_sync_attempt?.toISOString() || null,
      syncErrors: syncRow.last_error_message ? [{
        timestamp: syncRow.updated_at?.toISOString() || new Date().toISOString(),
        operation: 'sync',
        entity: 'all',
        error: syncRow.last_error_message,
        isResolved: false,
      }] : [],
      pendingChanges: syncRow.pending_changes || 0,
    } : {
      isConnected: true,
      lastSuccessfulSync: null,
      lastSyncAttempt: null,
      syncErrors: [],
      pendingChanges: 0,
    };

    // ========================================================================
    // Return Response
    // ========================================================================
    const response: DashboardResponse = {
      success: true,
      data: {
        practitioner,
        todaysSessions,
        weeklyStats,
        upcomingStats,
        monthlyStats,
        lastUpdated: new Date().toISOString(),
        syncStatus,
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
        error: error instanceof Error ? error.message : 'Internal server error',
      },
    };
  }
}

// ============================================================================
// Register Function
// ============================================================================

app.http('practitionerDashboard', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous', // TODO: Change to 'function' with proper auth
  route: 'practitioners/{practitionerId}/dashboard',
  handler: practitionerDashboardHandler,
});

export default practitionerDashboardHandler;
