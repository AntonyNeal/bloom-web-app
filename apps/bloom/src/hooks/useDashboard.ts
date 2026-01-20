/**
 * Dashboard API Hook
 * 
 * Fetches practitioner dashboard data from the API.
 * Handles loading, error states, and automatic refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  PractitionerDashboard,
  SessionFeedItem,
  WeeklyStats,
  UpcomingStats,
  MonthlyStats,
  SyncStatus,
  Practitioner,
} from '@/types/bloom';
import { API_BASE_URL } from '../config/api';

// ============================================================================
// Azure AD Integration
// ============================================================================

async function getAzureUserId(): Promise<string | null> {
  // Check if MSAL is available in the window object
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to get the account from MSAL
    const msalInstance = (window as typeof window & { msalInstance?: { getAllAccounts: () => unknown[] } }).msalInstance;
    if (!msalInstance) {
      console.warn('[getAzureUserId] MSAL instance not found on window');
      return null;
    }
    
    const accounts = msalInstance.getAllAccounts();
    console.log('[getAzureUserId] MSAL accounts:', accounts);
    
    if (accounts.length === 0) {
      console.warn('[getAzureUserId] No MSAL accounts found');
      return null;
    }
    
    // Get the homeAccountId (this is the Azure AD user object ID)
    const account = accounts[0] as { homeAccountId?: string; localAccountId?: string };
    const userId = account.homeAccountId?.split('.')[0] || account.localAccountId || null;
    console.log('[getAzureUserId] Extracted user ID:', userId);
    return userId;
  } catch (error) {
    console.error('[getAzureUserId] Error getting Azure user ID:', error);
    return null;
  }
}

// ============================================================================
// Configuration
// ============================================================================

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Types
// ============================================================================

interface UseDashboardOptions {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Date to fetch dashboard for (ISO 8601 date, defaults to today) */
  date?: string;
  /** Skip initial fetch (for SSR or manual control) */
  skip?: boolean;
}

interface UseDashboardResult {
  /** Dashboard data (null if not loaded) */
  dashboard: PractitionerDashboard | null;
  /** Loading state */
  loading: boolean;
  /** Error message (null if no error) */
  error: string | null;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
  /** Last successful fetch timestamp */
  lastFetched: Date | null;
  /** Sync status with external systems */
  syncStatus: SyncStatus | null;
  /** Whether we're showing sample/demo data instead of live data */
  isUsingDemoData: boolean;
  /** Authentication status */
  authStatus: 'authenticated' | 'unauthenticated' | 'loading';
}

// ============================================================================
// Sample Data (fallback when API unavailable)
// ============================================================================

const samplePractitioner: Practitioner = {
  id: 'sample-practitioner',
  externalPractitionerId: 'EXT-001',
  externalPractitionerRoleId: 'EXT-PR-001',
  firstName: 'Sarah',
  lastName: 'Chen',
  displayName: 'Dr. Sarah Chen',
  email: 'sarah.chen@bloom.health',
  specializations: ['Anxiety', 'Depression', 'PTSD'],
  qualificationType: 'clinical',
  timezone: 'Australia/Sydney',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSyncedAt: new Date().toISOString(),
};

const sampleSessions: SessionFeedItem[] = [
  {
    id: '1',
    time: '9:00 AM',
    clientInitials: 'JM',
    clientId: 'client-1',
    sessionNumber: 8,
    presentingIssues: ['Anxiety', 'Depression'],
    mhcpRemaining: 2,
    mhcpTotal: 10,
    relationshipMonths: 14,
    status: 'scheduled',
    isUpNext: true,
    locationType: 'in-person',
  },
  {
    id: '2',
    time: '10:30 AM',
    clientInitials: 'AK',
    clientId: 'client-2',
    sessionNumber: 3,
    presentingIssues: ['Work Stress', 'Relationship Issues'],
    mhcpRemaining: 7,
    mhcpTotal: 10,
    relationshipMonths: 2,
    status: 'scheduled',
    isUpNext: false,
    locationType: 'telehealth',
  },
  {
    id: '3',
    time: '1:00 PM',
    clientInitials: 'RL',
    clientId: 'client-3',
    sessionNumber: 12,
    presentingIssues: ['PTSD'],
    mhcpRemaining: 4,
    mhcpTotal: 10,
    relationshipMonths: 18,
    status: 'scheduled',
    isUpNext: false,
    locationType: 'in-person',
  },
  {
    id: '4',
    time: '2:30 PM',
    clientInitials: 'BT',
    clientId: 'client-4',
    sessionNumber: 1,
    presentingIssues: ['Grief', 'Adjustment'],
    mhcpRemaining: 10,
    mhcpTotal: 10,
    relationshipMonths: 0,
    status: 'confirmed',
    isUpNext: false,
    locationType: 'in-person',
  },
  {
    id: '5',
    time: '4:00 PM',
    clientInitials: 'MW',
    clientId: 'client-5',
    sessionNumber: 6,
    presentingIssues: ['Social Anxiety', 'Self-esteem'],
    mhcpRemaining: 1,
    mhcpTotal: 10,
    relationshipMonths: 8,
    status: 'scheduled',
    isUpNext: false,
    locationType: 'phone',
  },
];

const sampleWeeklyStats: WeeklyStats = {
  weekStartDate: new Date(Date.now() - new Date().getDay() * 86400000).toISOString().split('T')[0],
  weekEndDate: new Date(Date.now() + (6 - new Date().getDay()) * 86400000).toISOString().split('T')[0],
  currentSessions: 18,
  scheduledSessions: 7,
  maxSessions: 25,
  currentRevenue: 3960,
  targetRevenue: 5500,
  completionRate: 72,
  noShowCount: 1,
  cancellationCount: 2,
};

const sampleUpcomingStats: UpcomingStats = {
  tomorrowSessions: 4,
  remainingThisWeek: 7,
  nextWeekSessions: 22,
  mhcpEndingSoon: 3,
  clientsNeedingFollowUp: 2,
  unbookedRegulars: 1,
};

const sampleMonthlyStats: MonthlyStats = {
  monthName: new Date().toLocaleString('en-AU', { month: 'long' }),
  monthYear: new Date().toISOString().slice(0, 7),
  currentRevenue: 12450,
  targetRevenue: 22000,
  projectedRevenue: 18500,
  yearlyProjection: 149400,
  sessionsCompleted: 57,
  sessionsScheduled: 28,
  averageSessionValue: 218,
  revenueByBillingType: {
    medicare: 9800,
    private: 2100,
    dva: 350,
    workcover: 200,
    ndis: 0,
  },
};

const sampleSyncStatus: SyncStatus = {
  isConnected: true,
  lastSuccessfulSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  lastSyncAttempt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  syncErrors: [],
  pendingChanges: 0,
};

const sampleDashboard: PractitionerDashboard = {
  practitioner: samplePractitioner,
  todaysSessions: sampleSessions,
  weeklyStats: sampleWeeklyStats,
  upcomingStats: sampleUpcomingStats,
  monthlyStats: sampleMonthlyStats,
  lastUpdated: new Date().toISOString(),
  syncStatus: sampleSyncStatus,
};

// ============================================================================
// In-Memory Cache (persists for entire browser session)
// ============================================================================

interface DashboardCache {
  data: PractitionerDashboard;
  timestamp: number;
  date: string; // The date the dashboard was fetched for
}

let dashboardCache: DashboardCache | null = null;

function getCachedDashboard(date?: string): PractitionerDashboard | null {
  if (!dashboardCache) return null;
  
  const cacheDate = date || new Date().toISOString().split('T')[0];
  
  // Return cached data if it's for the same date - never expires during session
  if (dashboardCache.date === cacheDate) {
    console.log('[useDashboard] Using cached dashboard data');
    return dashboardCache.data;
  }
  
  return null;
}

function setCachedDashboard(data: PractitionerDashboard, date?: string): void {
  dashboardCache = {
    data,
    timestamp: Date.now(),
    date: date || new Date().toISOString().split('T')[0],
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDashboard(
  _practitionerId?: string,
  options: UseDashboardOptions = {}
): UseDashboardResult {
  const {
    refreshInterval = REFRESH_INTERVAL_MS,
    date,
    skip = false,
  } = options;

  // Initialize with cached data if available (prevents loading flash on navigation)
  const cachedData = getCachedDashboard(date);
  const [dashboard, setDashboard] = useState<PractitionerDashboard | null>(cachedData);
  const [loading, setLoading] = useState(!skip && !cachedData);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(cachedData ? new Date() : null);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'loading'>(cachedData ? 'authenticated' : 'loading');

  const fetchDashboard = useCallback(async (isBackgroundRefresh = false) => {
    if (skip) {
      // When skipped, return null - no fake data
      setDashboard(null);
      setIsUsingDemoData(false);
      setAuthStatus('authenticated');
      setLoading(false);
      return;
    }

    try {
      // Only show loading if no cached data and not background refresh
      if (!isBackgroundRefresh && !dashboard) {
        setLoading(true);
      }
      setError(null);

      // Get Azure AD user from MSAL (if available)
      const azureUserId = await getAzureUserId();
      
      console.log('[useDashboard] Azure User ID:', azureUserId);
      
      if (!azureUserId) {
        console.warn('[useDashboard] No Azure authentication - cannot fetch real data');
        setDashboard(null);
        setIsUsingDemoData(false);
        setAuthStatus('unauthenticated');
        setError('Please sign in to view your appointments');
        setLoading(false);
        return;
      }
      
      setAuthStatus('authenticated');

      // Use the clinician-dashboard endpoint (fetches live Halaxy data)
      const url = new URL(`${API_BASE_URL}/clinician/dashboard`);
      if (date) {
        url.searchParams.set('date', date);
      }

      console.log('[useDashboard] Fetching from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Azure-User-Id': azureUserId,
        },
      });

      console.log('[useDashboard] Response status:', response.status);

      if (!response.ok) {
        // API failed - show error, no fallback
        console.error('[useDashboard] Dashboard API failed:', response.status);
        setDashboard(null);
        setIsUsingDemoData(false);
        setError(`Failed to load appointments (${response.status})`);
        setLastFetched(new Date());
        return;
      }

      const apiResponse = await response.json();
      console.log('[useDashboard] API Response:', apiResponse);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error || 'Failed to fetch dashboard');
      }

      // Transform clinician-dashboard response to PractitionerDashboard format
      const clinicianData = apiResponse.data;
      
      const transformedDashboard: PractitionerDashboard = {
        practitioner: {
          id: 'current-user',
          externalPractitionerId: clinicianData.practitioner.halaxyId,
          externalPractitionerRoleId: clinicianData.practitioner.halaxyId,
          firstName: clinicianData.practitioner.displayName.split(' ')[0] || '',
          lastName: clinicianData.practitioner.displayName.split(' ').slice(1).join(' ') || '',
          displayName: clinicianData.practitioner.displayName,
          email: clinicianData.practitioner.email,
          specializations: [],
          qualificationType: 'clinical',
          timezone: 'Australia/Sydney',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSyncedAt: clinicianData.fetchedAt,
        },
        todaysSessions: clinicianData.today.sessions.map((s: { id: string; time: string; clientInitials: string; status: string; isUpNext: boolean; locationType: string }) => ({
          id: s.id,
          time: s.time,
          clientInitials: s.clientInitials,
          clientId: s.id, // Use appointment ID as client ID for now
          sessionNumber: 1, // Not available from Halaxy
          presentingIssues: [], // Not available from Halaxy appointment data
          mhcpRemaining: 10, // Not available
          mhcpTotal: 10,
          relationshipMonths: 0, // Not available
          status: s.status,
          isUpNext: s.isUpNext,
          locationType: s.locationType,
        })),
        weeklyStats: {
          weekStartDate: clinicianData.today.date,
          weekEndDate: clinicianData.today.date,
          currentSessions: clinicianData.today.summary.completedSessions,
          scheduledSessions: clinicianData.today.summary.upcomingSessions,
          maxSessions: 25,
          currentRevenue: clinicianData.today.summary.completedSessions * 220, // Estimate
          targetRevenue: 5500,
          completionRate: clinicianData.today.summary.totalSessions > 0 
            ? Math.round((clinicianData.today.summary.completedSessions / clinicianData.today.summary.totalSessions) * 100)
            : 0,
          noShowCount: clinicianData.today.summary.cancelledSessions,
          cancellationCount: clinicianData.today.summary.cancelledSessions,
        },
        upcomingStats: sampleUpcomingStats, // Not available from current API
        monthlyStats: sampleMonthlyStats, // Not available from current API
        lastUpdated: clinicianData.fetchedAt,
        syncStatus: {
          isConnected: true,
          lastSuccessfulSync: clinicianData.fetchedAt,
          lastSyncAttempt: clinicianData.fetchedAt,
          syncErrors: [],
          pendingChanges: 0,
        },
      };

      setDashboard(transformedDashboard);
      setCachedDashboard(transformedDashboard, date); // Cache for navigation
      setIsUsingDemoData(false);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Show error - no fallback to sample data
      setDashboard(null);
      setIsUsingDemoData(false);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [date, skip, dashboard]);

  // Initial fetch (or background refresh if using cached data)
  useEffect(() => {
    const cachedData = getCachedDashboard(date);
    if (cachedData) {
      // We have cached data - do a background refresh
      fetchDashboard(true);
    } else {
      // No cache - do a full fetch with loading state
      fetchDashboard(false);
    }
  }, [fetchDashboard, date]);

  // Auto-refresh (always background)
  useEffect(() => {
    if (refreshInterval <= 0 || skip) return;

    const interval = setInterval(() => fetchDashboard(true), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboard, refreshInterval, skip]);

  return {
    dashboard,
    loading,
    error,
    refetch: () => fetchDashboard(false),
    lastFetched,
    syncStatus: dashboard?.syncStatus || null,
    isUsingDemoData,
    authStatus,
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { sampleDashboard, sampleSessions, sampleWeeklyStats, sampleMonthlyStats, sampleUpcomingStats };

export default useDashboard;
