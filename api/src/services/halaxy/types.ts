/**
 * Halaxy Sync Service - Type Definitions
 * 
 * Types for FHIR-R4 resources from Halaxy API and Bloom database entities.
 * Based on Halaxy's FHIR-compliant API structure.
 */

// =============================================================================
// FHIR Resource Types (from Halaxy API)
// =============================================================================

/**
 * FHIR Practitioner resource
 * https://www.hl7.org/fhir/practitioner.html
 */
export interface FHIRPractitioner {
  resourceType: 'Practitioner';
  id: string;
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  active?: boolean;
  name: Array<{
    use?: 'official' | 'usual' | 'nickname';
    family: string;
    given: string[];
    prefix?: string[];
    suffix?: string[];
  }>;
  telecom?: Array<{
    system: 'phone' | 'email' | 'fax';
    value: string;
    use?: 'home' | 'work' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  qualification?: Array<{
    identifier?: { value: string };
    code: {
      coding: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    period?: {
      start?: string;
      end?: string;
    };
    issuer?: {
      display?: string;
    };
  }>;
}

/**
 * FHIR PractitionerRole resource
 * Links practitioner to organization and specialty
 */
export interface FHIRPractitionerRole {
  resourceType: 'PractitionerRole';
  id: string;
  active?: boolean;
  practitioner: {
    reference: string; // 'Practitioner/{id}'
    display?: string;
  };
  organization?: {
    reference: string;
    display?: string;
  };
  location?: Array<{
    reference: string; // 'Location/{id}'
    display?: string;
  }>;
  telecom?: Array<{
    system: 'phone' | 'email' | 'fax' | 'sms' | 'other';
    value: string;
    use?: 'work' | 'home' | 'mobile';
  }>;
  specialty?: Array<{
    coding: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
}

/**
 * FHIR Location resource
 * Physical location where services are provided
 */
export interface FHIRLocation {
  resourceType: 'Location';
  id: string;
  status?: 'active' | 'suspended' | 'inactive';
  name?: string;
  description?: string;
  telecom?: Array<{
    system: 'phone' | 'email' | 'fax' | 'sms' | 'other';
    value: string;
    use?: 'work' | 'home' | 'mobile';
  }>;
  address?: {
    use?: 'home' | 'work' | 'temp' | 'old';
    type?: 'postal' | 'physical' | 'both';
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * FHIR Patient resource
 * https://www.hl7.org/fhir/patient.html
 */
export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier?: Array<{
    system?: string;
    value: string;
  }>;
  active?: boolean;
  name: Array<{
    use?: 'official' | 'usual' | 'nickname';
    family: string;
    given: string[];
    prefix?: string[];
  }>;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
    use?: 'home' | 'work' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    use?: 'home' | 'work';
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  generalPractitioner?: Array<{
    reference: string; // 'Practitioner/{id}'
    display?: string;
  }>;
  managingOrganization?: {
    reference: string;
    display?: string;
  };
  // Halaxy-specific extensions
  extension?: Array<{
    url: string;
    valueString?: string;
    valueBoolean?: boolean;
    valueDate?: string;
    valueInteger?: number;
  }>;
}

/**
 * FHIR Appointment resource
 * https://www.hl7.org/fhir/appointment.html
 */
export interface FHIRAppointment {
  resourceType: 'Appointment';
  id: string;
  status: 
    | 'proposed'
    | 'pending'
    | 'booked'
    | 'arrived'
    | 'fulfilled'
    | 'cancelled'
    | 'noshow'
    | 'entered-in-error'
    | 'checked-in'
    | 'waitlist';
  serviceType?: Array<{
    coding: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  specialty?: Array<{
    coding: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  appointmentType?: {
    coding: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  reasonCode?: Array<{
    coding: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  description?: string;
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  minutesDuration?: number;
  created?: string;
  comment?: string;
  participant: Array<{
    type?: Array<{
      coding: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    }>;
    actor: {
      reference: string; // 'Patient/{id}' or 'Practitioner/{id}'
      display?: string;
    };
    required?: 'required' | 'optional' | 'information-only';
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  // Halaxy-specific extensions
  extension?: Array<{
    url: string;
    valueString?: string;
    valueBoolean?: boolean;
    valueMoney?: {
      value: number;
      currency: string;
    };
  }>;
}

/**
 * FHIR Schedule resource (practitioner practice hours)
 * https://www.hl7.org/fhir/schedule.html
 * In Halaxy, each schedule represents practice hours of a practitioner for a specific clinic
 */
export interface FHIRSchedule {
  resourceType: 'Schedule';
  id: string;
  active?: boolean;
  planningHorizon?: {
    start?: string; // YYYY-MM-DD
    end?: string;   // YYYY-MM-DD
  };
  actor?: Array<{
    reference: string; // e.g., "/main/Practitioner/PR-1234567" or "/main/Organization/CL-123456"
    type: 'Practitioner' | 'Organization' | 'PractitionerRole';
    display?: string;
  }>;
  comment?: string;
}

/**
 * FHIR Slot resource (for availability)
 * https://www.hl7.org/fhir/slot.html
 */
export interface FHIRSlot {
  resourceType: 'Slot';
  id: string;
  status: 'busy' | 'free' | 'busy-unavailable' | 'busy-tentative' | 'entered-in-error';
  start: string; // ISO 8601 datetime
  end: string;   // ISO 8601 datetime
  overbooked?: boolean;
  schedule?: {
    reference?: string; // e.g., "Schedule/123"
    display?: string;
  };
  // Actor references - practitioner, organization, practitioner-role
  actor?: Array<{
    reference?: string; // e.g., "/main/Practitioner/PR-1234567"
    type?: string;      // e.g., "Practitioner", "Organization", "PractitionerRole"
    display?: string;
  }>;
  serviceCategory?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  serviceType?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  specialty?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  appointmentType?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  comment?: string;
  // Halaxy-specific extensions
  extension?: Array<{
    url: string;
    valueReference?: {
      reference?: string;
      display?: string;
    };
  }>;
}

/**
 * FHIR Bundle for paginated responses
 */
export interface FHIRBundle<T> {
  resourceType: 'Bundle';
  type: 'searchset' | 'collection';
  total?: number;
  link?: Array<{
    relation: 'self' | 'next' | 'previous' | 'first' | 'last';
    url: string;
  }>;
  entry?: Array<{
    fullUrl?: string;
    resource: T;
  }>;
}

// =============================================================================
// Bloom Database Entity Types
// =============================================================================

/**
 * Practitioner entity in Bloom database
 */
export interface Practitioner {
  id: string; // UUID
  halaxyPractitionerId: string;
  halaxyPractitionerRoleId?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  qualifications?: string;
  specialty?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

/**
 * Client entity in Bloom database
 * Note: "Client" in Bloom = "Patient" in FHIR
 */
export interface Client {
  id: string; // UUID
  halaxyPatientId: string;
  practitionerId: string; // FK to practitioners
  firstName: string;
  lastName: string;
  initials: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  // MHCP (Medicare Mental Health Care Plan) tracking
  mhcpTotalSessions: number;
  mhcpUsedSessions: number;
  mhcpPlanStartDate?: Date;
  mhcpPlanExpiryDate?: Date;
  // Relationship tracking
  firstSessionDate?: Date;
  presentingIssues?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

/**
 * Session entity in Bloom database
 * Note: "Session" in Bloom = "Appointment" in FHIR
 */
export interface Session {
  id: string; // UUID
  halaxyAppointmentId: string;
  practitionerId: string; // FK to practitioners
  clientId: string; // FK to clients
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  sessionNumber: number;
  status: SessionStatus;
  sessionType?: string;
  notes?: string;
  fee?: number;
  feeCurrency: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

export type SessionStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/**
 * Sync log entry for audit trail
 */
export interface SyncLogEntry {
  id: string;
  syncType: 'full' | 'incremental' | 'webhook' | 'manual';
  entityType: 'practitioner' | 'client' | 'session' | 'all';
  entityId?: string;
  operation: 'create' | 'update' | 'delete' | 'sync';
  status: 'pending' | 'in_progress' | 'success' | 'error';
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  practitionerId?: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Halaxy OAuth token response
 */
export interface HalaxyTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  scope?: string;
}

/**
 * Halaxy webhook payload
 */
export interface HalaxyWebhookPayload {
  event: HalaxyWebhookEvent;
  timestamp: string;
  data: FHIRAppointment | FHIRPatient | FHIRPractitioner;
  signature?: string;
}

export type HalaxyWebhookEvent =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.deleted'
  | 'patient.created'
  | 'patient.updated'
  | 'patient.deleted'
  | 'practitioner.updated';

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  syncLogId?: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: SyncError[];
  duration: number; // milliseconds
}

export interface SyncError {
  entityType: string;
  entityId: string;
  operation: string;
  message: string;
  timestamp: Date;
}

// =============================================================================
// Dashboard Types (for API responses)
// =============================================================================

/**
 * Dashboard data structure returned to frontend
 */
export interface PractitionerDashboard {
  practitioner: {
    id: string;
    displayName: string;
    email: string;
  };
  todaysSessions: DashboardSession[];
  weeklyStats: WeeklyStats;
  monthlyStats: MonthlyStats;
  upcomingStats: UpcomingStats;
  lastUpdated: string;
  syncStatus: SyncStatus;
}

export interface DashboardSession {
  id: string;
  time: string;
  sessionNumber: number;
  clientInitials: string;
  presentingIssues?: string;
  mhcpRemaining?: number;
  relationshipMonths: number;
  status: SessionStatus;
}

export interface WeeklyStats {
  totalRevenue: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  averagePerSession: number;
  weekStartDate: string;
}

export interface MonthlyStats {
  totalRevenue: number;
  sessionsCompleted: number;
  sessionsScheduled: number;
  averageWeeklyRevenue: number;
  monthName: string;
}

export interface UpcomingStats {
  scheduledRevenue: number;
  sessionsBooked: number;
  nextWeekSessions: number;
  cancellationRate: number;
}

export interface SyncStatus {
  lastFullSync: string;
  lastIncrementalSync?: string;
  status: 'healthy' | 'stale' | 'error';
  errorMessage?: string;
  nextScheduledSync: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface HalaxyConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  tokenUrl: string;
  webhookSecret?: string;
  organizationId?: string;
  practitionerId?: string;
  // Rate limiting
  maxRequestsPerMinute: number;
  requestTimeoutMs: number;
}
