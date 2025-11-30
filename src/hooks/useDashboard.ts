/**
 * Dashboard API Hook
 * 
 * Fetches practitioner dashboard data from the API.
 * Handles loading, error states, and automatic refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  PractitionerDashboard,
  GetDashboardResponse,
  SessionFeedItem,
  WeeklyStats,
  UpcomingStats,
  MonthlyStats,
  SyncStatus,
  Practitioner,
} from '@/types/bloom';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
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
// Hook Implementation
// ============================================================================

export function useDashboard(
  practitionerId: string | undefined,
  options: UseDashboardOptions = {}
): UseDashboardResult {
  const {
    refreshInterval = REFRESH_INTERVAL_MS,
    date,
    skip = false,
  } = options;

  const [dashboard, setDashboard] = useState<PractitionerDashboard | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!practitionerId || skip) {
      // Use sample data when no practitioner ID
      setDashboard(sampleDashboard);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${API_BASE_URL}/practitioners/${practitionerId}/dashboard`);
      if (date) {
        url.searchParams.set('date', date);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If API fails, fall back to sample data
        console.warn('Dashboard API unavailable, using sample data');
        setDashboard(sampleDashboard);
        setLastFetched(new Date());
        return;
      }

      const data: GetDashboardResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch dashboard');
      }

      setDashboard(data.data);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Fall back to sample data on error
      setDashboard(sampleDashboard);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [practitionerId, date, skip]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || skip) return;

    const interval = setInterval(fetchDashboard, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboard, refreshInterval, skip]);

  return {
    dashboard,
    loading,
    error,
    refetch: fetchDashboard,
    lastFetched,
    syncStatus: dashboard?.syncStatus || null,
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { sampleDashboard, sampleSessions, sampleWeeklyStats, sampleMonthlyStats, sampleUpcomingStats };

export default useDashboard;
