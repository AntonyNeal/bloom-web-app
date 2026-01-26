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
// In-Memory Cache (persists for entire browser session)
// ============================================================================

interface DashboardCache {
  data: PractitionerDashboard;
  timestamp: number;
  date: string; // The date the dashboard was fetched for
}

let dashboardCache: DashboardCache | null = null;

// Export cache clear function for debugging
export function clearDashboardCache(): void {
  console.log('[useDashboard] Clearing dashboard cache');
  dashboardCache = null;
}

// Expose to window for easy debugging
if (typeof window !== 'undefined') {
  (window as Window & { clearDashboardCache?: () => void }).clearDashboardCache = clearDashboardCache;
}

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
      
      // DEV MODE: Check URL for dev override parameters
      // Usage: Add ?devMode=zoe to the Bloom URL to view Zoe's dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const devMode = urlParams.get('devMode');
      if (devMode === 'zoe') {
        console.log('[useDashboard] DEV MODE: Viewing as Zoe');
        url.searchParams.set('devHalaxyId', '1304541');
        url.searchParams.set('devHalaxyRoleId', 'PR-2442591');
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
        todaysSessions: clinicianData.today.sessions.map((s: { id: string; time: string; clientInitials: string; clientName?: string; sessionType?: string; duration?: number; status: string; isUpNext: boolean; locationType: string }) => ({
          id: s.id,
          time: s.time,
          clientInitials: s.clientInitials,
          clientId: s.id,
          clientName: s.clientName,
          sessionType: s.sessionType,
          duration: s.duration,
          // Don't set fake values - leave undefined if not available from Halaxy
          sessionNumber: undefined,
          presentingIssues: undefined,
          mhcpRemaining: undefined,
          mhcpTotal: undefined,
          relationshipMonths: undefined,
          status: s.status,
          isUpNext: s.isUpNext,
          locationType: s.locationType,
        })),
        // Use real week stats from API
        weeklyStats: {
          weekStartDate: clinicianData.weekStats?.weekStartDate || clinicianData.today.date,
          weekEndDate: clinicianData.weekStats?.weekEndDate || clinicianData.today.date,
          currentSessions: clinicianData.weekStats?.completedSessions || clinicianData.today.summary.completedSessions,
          scheduledSessions: clinicianData.weekStats?.scheduledSessions || clinicianData.today.summary.upcomingSessions,
          maxSessions: 25,
          currentRevenue: (clinicianData.weekStats?.completedSessions || clinicianData.today.summary.completedSessions) * 220,
          targetRevenue: 5500,
          completionRate: clinicianData.weekStats?.totalSessions > 0 
            ? Math.round((clinicianData.weekStats.completedSessions / clinicianData.weekStats.totalSessions) * 100)
            : 0,
          noShowCount: clinicianData.weekStats?.cancelledSessions || 0,
          cancellationCount: clinicianData.weekStats?.cancelledSessions || 0,
        },
        // Use real upcoming stats from API
        upcomingStats: {
          tomorrowSessions: clinicianData.weekStats?.tomorrowSessions || 0,
          remainingThisWeek: clinicianData.weekStats?.remainingThisWeek || 0,
          nextWeekSessions: 0, // Would need additional API call
          mhcpEndingSoon: 0, // Not available from Halaxy
          clientsNeedingFollowUp: 0, // Not available
          unbookedRegulars: 0, // Not available
        },
        // Use real month stats from API
        monthlyStats: {
          currentRevenue: clinicianData.monthStats?.totalRevenue || 0,
          monthName: clinicianData.monthStats?.monthName || new Date().toLocaleDateString('en-AU', { month: 'long' }),
          targetRevenue: clinicianData.monthStats?.targetRevenue || 22000,
          completedSessions: clinicianData.monthStats?.completedSessions || 0,
        },
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
  }, [date, skip]); // Removed 'dashboard' - it caused infinite re-fetch loop

  // Initial fetch - only run once on mount or when date changes
  useEffect(() => {
    const cachedData = getCachedDashboard(date);
    if (cachedData) {
      // We have cached data - do a background refresh
      fetchDashboard(true);
    } else {
      // No cache - do a full fetch with loading state
      fetchDashboard(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]); // Only depend on date, not fetchDashboard (avoid re-fetch loop)

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

export default useDashboard;
