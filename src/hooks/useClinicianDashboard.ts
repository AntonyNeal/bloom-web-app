/**
 * Clinician Dashboard Hook
 * 
 * Fetches dashboard data directly from Halaxy via our Function App.
 * Requires the user to be authenticated with Azure AD B2C.
 * 
 * Usage:
 * ```tsx
 * const { dashboard, loading, error, refetch } = useClinicianDashboard();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '../config/api';

// ============================================================================
// Types (matching API response)
// ============================================================================

export interface SessionItem {
  id: string;
  time: string;
  clientInitials: string;
  clientName: string;
  sessionType: string;
  duration: number;
  status: 'booked' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  isUpNext: boolean;
  locationType: 'telehealth' | 'in-person';
  notes?: string;
}

export interface DaySummary {
  date: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
}

export interface ClinicianDashboard {
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

interface UseClinicianDashboardResult {
  /** Dashboard data (null if not loaded) */
  dashboard: ClinicianDashboard | null;
  /** Loading state */
  loading: boolean;
  /** Error message (null if no error) */
  error: string | null;
  /** Whether the user is authorized as a practitioner */
  isAuthorized: boolean;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
  /** Last successful fetch timestamp */
  lastFetched: Date | null;
}

// ============================================================================
// Configuration
// ============================================================================

const REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes - faster since it's live data

// ============================================================================
// Hook Implementation
// ============================================================================

export function useClinicianDashboard(): UseClinicianDashboardResult {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  const [dashboard, setDashboard] = useState<ClinicianDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Must be authenticated
    if (!isAuthenticated || !user) {
      setLoading(false);
      setError('Please log in to view your dashboard');
      setIsAuthorized(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the Azure AD user ID (localAccountId from MSAL)
      const azureUserId = user.localAccountId;
      
      if (!azureUserId) {
        throw new Error('Unable to get user ID from authentication');
      }

      console.log('Fetching clinician dashboard with Azure User ID:', azureUserId);

      const response = await fetch(`${API_BASE_URL}/clinician/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Azure-User-Id': azureUserId,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        setError('Please log in to view your dashboard');
        setIsAuthorized(false);
        return;
      }

      if (response.status === 403) {
        console.error('Access denied - User not registered as practitioner:', data);
        if (data.debug) {
          console.error('Debug info:', data.debug);
          console.error('Add your Azure User ID to the backend practitioner mapping');
        }
        setError('Your account is not registered as a practitioner. Please contact support.');
        setIsAuthorized(false);
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard');
      }

      setDashboard(data.data);
      setIsAuthorized(true);
      setLastFetched(new Date());
      setError(null);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !isAuthorized) return;

    const interval = setInterval(fetchDashboard, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard, isAuthenticated, isAuthorized]);

  return {
    dashboard,
    loading: loading || authLoading,
    error,
    isAuthorized,
    refetch: fetchDashboard,
    lastFetched,
  };
}

export default useClinicianDashboard;
