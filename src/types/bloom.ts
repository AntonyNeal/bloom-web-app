/**
 * Bloom Practitioner Dashboard Types
 * 
 * These types define the schema for practitioner dashboard data.
 * Data is synced from Halaxy via the HalaxySyncService and stored in Bloom DB.
 * 
 * Source of truth: Halaxy (PMS - Practice Management System)
 * Local cache: Bloom SQL Database
 * Sync frequency: Real-time via webhooks + periodic full sync
 */

// ============================================================================
// CORE ENTITIES - Synced from Halaxy
// ============================================================================

/**
 * Practitioner - A psychologist using Bloom
 * Maps to Halaxy Practitioner/PractitionerRole resource (FHIR-R4)
 */
export interface Practitioner {
  id: string;                        // Bloom internal ID
  halaxyPractitionerId: string;      // Halaxy Practitioner ID
  halaxyPractitionerRoleId: string;  // Halaxy PractitionerRole ID
  firstName: string;
  lastName: string;
  displayName: string;               // e.g., "Dr. Sarah Chen"
  email: string;
  phone?: string;
  ahpraNumber?: string;
  specializations: string[];         // e.g., ["Anxiety", "Depression", "PTSD"]
  qualificationType: 'clinical' | 'counselling' | 'general';
  profilePhotoUrl?: string;
  timezone: string;                  // e.g., "Australia/Sydney"
  createdAt: string;                 // ISO 8601
  updatedAt: string;                 // ISO 8601
  lastSyncedAt: string;              // ISO 8601
}

/**
 * Client - A patient of the practitioner
 * Maps to Halaxy Patient resource (FHIR-R4)
 */
export interface Client {
  id: string;                        // Bloom internal ID
  halaxyPatientId: string;           // Halaxy Patient ID
  practitionerId: string;            // FK to Practitioner
  firstName: string;
  lastName: string;
  initials: string;                  // e.g., "JM" - used in UI for privacy
  email?: string;
  phone?: string;
  dateOfBirth?: string;              // ISO 8601 date
  gender?: 'male' | 'female' | 'other' | 'unknown';
  
  // Clinical context (synced from Halaxy notes/conditions)
  presentingIssues: string[];        // e.g., ["Anxiety", "Depression"]
  treatmentPlan?: string;
  
  // Medicare Health Care Plan (MHCP) tracking
  mhcp: MHCPStatus;
  
  // Relationship metrics
  firstSessionDate?: string;         // ISO 8601
  relationshipMonths: number;        // Calculated from first session
  totalSessions: number;             // Count of completed sessions
  
  status: 'active' | 'inactive' | 'discharged';
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
}

/**
 * Medicare Health Care Plan Status
 */
export interface MHCPStatus {
  isActive: boolean;
  totalSessions: number;             // Usually 10
  usedSessions: number;
  remainingSessions: number;
  planStartDate?: string;            // ISO 8601
  planExpiryDate?: string;           // ISO 8601
  referringGP?: string;
  referralDate?: string;             // ISO 8601
}

/**
 * Session/Appointment - A scheduled or completed session
 * Maps to Halaxy Appointment resource (FHIR-R4)
 */
export interface Session {
  id: string;                        // Bloom internal ID
  halaxyAppointmentId: string;       // Halaxy Appointment ID
  practitionerId: string;            // FK to Practitioner
  clientId: string;                  // FK to Client
  
  // Timing
  scheduledStartTime: string;        // ISO 8601
  scheduledEndTime: string;          // ISO 8601
  actualStartTime?: string;          // ISO 8601
  actualEndTime?: string;            // ISO 8601
  durationMinutes: number;           // e.g., 50
  
  // Session details
  sessionNumber: number;             // This client's nth session
  sessionType: SessionType;
  status: SessionStatus;
  
  // Location
  locationType: 'in-person' | 'telehealth' | 'phone';
  locationDetails?: string;          // Room number, video link, etc.
  
  // Clinical notes (may be empty until completed)
  notes?: string;
  presentingIssues: string[];        // For this specific session
  interventionsUsed?: string[];
  
  // Billing
  billingType: 'medicare' | 'private' | 'dva' | 'workcover' | 'ndis';
  invoiceAmount?: number;
  isPaid: boolean;
  
  // Attribution tracking
  gclid?: string;                    // Google Click ID
  utmSource?: string;
  stripePaymentIntentId?: string;
  
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
}

export type SessionType = 
  | 'initial_consultation'
  | 'standard_consultation'
  | 'extended_consultation'
  | 'family_session'
  | 'couples_session'
  | 'group_session'
  | 'assessment'
  | 'review';

export type SessionStatus = 
  | 'scheduled'      // Future appointment
  | 'confirmed'      // Client confirmed attendance
  | 'in_progress'    // Currently happening
  | 'completed'      // Finished successfully
  | 'no_show'        // Client didn't attend
  | 'cancelled'      // Cancelled by either party
  | 'rescheduled';   // Moved to different time

// ============================================================================
// DASHBOARD VIEW MODELS - Computed/aggregated for UI
// ============================================================================

/**
 * Today's session card for the feed
 */
export interface SessionFeedItem {
  id: string;
  time: string;                      // Formatted time e.g., "9:00 AM"
  clientInitials: string;
  clientId: string;
  sessionNumber: number;
  presentingIssues: string[];
  mhcpRemaining: number;
  mhcpTotal: number;
  relationshipMonths: number;
  status: SessionStatus;
  isUpNext: boolean;
  locationType: 'in-person' | 'telehealth' | 'phone';
}

/**
 * Weekly statistics aggregation
 */
export interface WeeklyStats {
  weekStartDate: string;             // ISO 8601 (Monday)
  weekEndDate: string;               // ISO 8601 (Sunday)
  currentSessions: number;           // Completed this week
  scheduledSessions: number;         // Total scheduled
  maxSessions: number;               // Practitioner's preferred weekly max
  currentRevenue: number;            // Earned this week
  /** @deprecated No targets - we inform and encourage, not measure against KPIs */
  targetRevenue?: number;
  completionRate: number;            // % of scheduled that completed
  noShowCount: number;
  cancellationCount: number;
}

/**
 * Upcoming/lookahead stats
 */
export interface UpcomingStats {
  tomorrowSessions: number;
  remainingThisWeek: number;
  nextWeekSessions: number;
  mhcpEndingSoon: number;            // Clients with ≤2 sessions remaining
  clientsNeedingFollowUp: number;
  unbookedRegulars: number;          // Regular clients not booked in 2+ weeks
}

/**
 * Monthly financial stats
 */
export interface MonthlyStats {
  monthName: string;                 // e.g., "November"
  monthYear?: string;                // e.g., "2025-11"
  currentRevenue: number;
  /** @deprecated No targets - we inform and encourage, not measure against KPIs */
  targetRevenue?: number;
  projectedRevenue?: number;         // Based on scheduled sessions
  yearlyProjection?: number;         // Extrapolated annual earnings
  sessionsCompleted?: number;
  sessionsScheduled?: number;
  averageSessionValue?: number;
  revenueByBillingType?: {
    medicare: number;
    private: number;
    dva: number;
    workcover: number;
    ndis: number;
  };
}

/**
 * Complete dashboard state for a practitioner
 */
export interface PractitionerDashboard {
  practitioner: Practitioner;
  todaysSessions: SessionFeedItem[];
  weeklyStats: WeeklyStats;
  upcomingStats: UpcomingStats;
  monthlyStats: MonthlyStats;
  lastUpdated: string;               // ISO 8601
  syncStatus: SyncStatus;
}

// ============================================================================
// SYNC STATUS - Track Halaxy integration health
// ============================================================================

export interface SyncStatus {
  isConnected: boolean;
  lastSuccessfulSync: string;        // ISO 8601
  lastSyncAttempt: string;           // ISO 8601
  syncErrors: SyncError[];
  pendingChanges: number;            // Changes waiting to push to Halaxy
}

export interface SyncError {
  timestamp: string;
  operation: 'pull' | 'push' | 'webhook';
  entity: 'session' | 'client' | 'practitioner';
  entityId?: string;
  error: string;
  isResolved: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetDashboardRequest {
  practitionerId: string;
  date?: string;                     // ISO 8601 date, defaults to today
  includeStats?: boolean;
}

export interface GetDashboardResponse {
  success: boolean;
  data?: PractitionerDashboard;
  error?: string;
}

export interface GetSessionsRequest {
  practitionerId: string;
  startDate: string;                 // ISO 8601
  endDate: string;                   // ISO 8601
  status?: SessionStatus[];
  includeClients?: boolean;
}

export interface GetSessionsResponse {
  success: boolean;
  data?: {
    sessions: Session[];
    clients?: Record<string, Client>;
  };
  error?: string;
}

export interface GetClientRequest {
  clientId: string;
  includeHistory?: boolean;
}

export interface GetClientResponse {
  success: boolean;
  data?: {
    client: Client;
    sessionHistory?: Session[];
  };
  error?: string;
}

// ============================================================================
// HALAXY WEBHOOK PAYLOADS
// ============================================================================

export interface HalaxyWebhookPayload {
  event: HalaxyWebhookEvent;
  resource: string;                  // FHIR resource type
  id: string;                        // Halaxy resource ID
  timestamp: string;                 // ISO 8601
  data: unknown;                     // Raw FHIR resource
}

export type HalaxyWebhookEvent = 
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'patient.created'
  | 'patient.updated'
  | 'invoice.created'
  | 'invoice.paid';
