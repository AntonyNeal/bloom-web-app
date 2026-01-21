/**
 * Bloom Dashboard Types
 * 
 * Types for the clinician dashboard data structures
 */

// =============================================================================
// Session Types
// =============================================================================

export type SessionStatus = 
  | 'booked' 
  | 'confirmed' 
  | 'arrived' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show'
  | 'scheduled';

export interface SessionFeedItem {
  id: string;
  time: string;
  clientInitials: string;
  clientId: string;
  clientName?: string;
  sessionType?: string;
  duration?: number;
  status: SessionStatus;
  isUpNext: boolean;
  locationType: 'in-person' | 'telehealth' | 'phone';
  // These fields are NOT available from Halaxy - may be undefined
  sessionNumber?: number;
  presentingIssues?: string[];
  mhcpRemaining?: number;
  mhcpTotal?: number;
  relationshipMonths?: number;
}

// =============================================================================
// Stats Types
// =============================================================================

export interface WeeklyStats {
  weekStartDate: string;
  weekEndDate: string;
  currentSessions: number;
  scheduledSessions: number;
  maxSessions: number;
  currentRevenue: number;
  targetRevenue?: number;
  completionRate: number;
  noShowCount: number;
  cancellationCount: number;
}

export interface MonthlyStats {
  currentRevenue: number;
  monthName: string;
  targetRevenue?: number;
  completedSessions?: number;
  projectedRevenue?: number;
  yearlyProjection?: number;
  sessionsCompleted?: number;
  averageSessionValue?: number;
}

export interface UpcomingStats {
  tomorrowSessions: number;
  remainingThisWeek: number;
  nextWeekSessions: number;
  mhcpEndingSoon: number;
  clientsNeedingFollowUp: number;
  unbookedRegulars: number;
}

// =============================================================================
// Practitioner Types
// =============================================================================

export interface Practitioner {
  id: string;
  externalPractitionerId: string;
  externalPractitionerRoleId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  specializations: string[];
  qualificationType: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
}

// =============================================================================
// Sync Status Types
// =============================================================================

export interface SyncStatus {
  isConnected: boolean;
  lastSuccessfulSync: string;
  lastSyncAttempt: string;
  syncErrors: string[];
  pendingChanges: number;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface PractitionerDashboard {
  practitioner: Practitioner;
  todaysSessions: SessionFeedItem[];
  weeklyStats: WeeklyStats;
  monthlyStats: MonthlyStats;
  upcomingStats: UpcomingStats;
  lastUpdated: string;
  syncStatus: SyncStatus;
}
