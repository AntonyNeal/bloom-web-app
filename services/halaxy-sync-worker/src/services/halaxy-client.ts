/**
 * Halaxy API Client for Container Apps Worker
 * 
 * FHIR-R4 compliant client for Halaxy's Practice Management API.
 * Uses OAuth 2.0 client_credentials flow for authentication.
 */

import { config } from '../config';
import { trackDependency } from '../telemetry';

// Token expiry buffer (2 minutes before actual expiry for safety)
const TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000;

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Halaxy FHIR API Client
 */
export class HalaxyClient {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    // No initialization needed - tokens are fetched on demand
  }

  // ============================================================================
  // Token Management (client_credentials flow)
  // ============================================================================

  private async ensureValidToken(): Promise<string> {
    // Check if token is still valid (with buffer)
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    console.log('[HalaxyClient] Fetching new access token via client_credentials');

    const response = await fetch(config.halaxyTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/fhir+json',
        'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: config.halaxyClientId,
        client_secret: config.halaxyClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token fetch failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as TokenResponse;
    this.accessToken = data.access_token;
    // Cache with buffer time (tokens valid for ~15 min per Halaxy docs)
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - TOKEN_EXPIRY_BUFFER_MS);

    console.log('[HalaxyClient] Access token obtained successfully');
    return this.accessToken;
  }

  // ============================================================================
  // HTTP Request Wrapper
  // ============================================================================

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.ensureValidToken();
    const url = `${config.halaxyApiUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
          'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Halaxy API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      trackDependency(
        'HTTP',
        'Halaxy FHIR',
        endpoint,
        Date.now() - startTime,
        true
      );

      return data as T;

    } catch (error) {
      trackDependency(
        'HTTP',
        'Halaxy FHIR',
        endpoint,
        Date.now() - startTime,
        false
      );
      throw error;
    }
  }

  /**
   * Fetch all pages from a paginated endpoint
   */
  private async getAllPages<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
    const results: T[] = [];
    let url = `${endpoint}?${new URLSearchParams({ ...params, _count: '100' })}`;

    while (url) {
      const bundle = await this.request<FHIRBundle<T>>(url);
      
      if (bundle.entry) {
        results.push(...bundle.entry.map(e => e.resource));
      }

      // Find next page link
      const nextLink = bundle.link?.find(l => l.relation === 'next');
      url = nextLink?.url?.replace(config.halaxyApiUrl, '') || '';
    }

    return results;
  }

  // ============================================================================
  // Practitioner Endpoints
  // ============================================================================

  async getPractitioner(practitionerId: string): Promise<FHIRPractitioner> {
    return this.request<FHIRPractitioner>(`/Practitioner/${practitionerId}`);
  }

  async getAllPractitioners(): Promise<FHIRPractitioner[]> {
    return this.getAllPages<FHIRPractitioner>('/Practitioner', { active: 'true' });
  }

  // ============================================================================
  // Patient Endpoints
  // ============================================================================

  async getPatient(patientId: string): Promise<FHIRPatient> {
    return this.request<FHIRPatient>(`/Patient/${patientId}`);
  }

  async getPatientsByPractitioner(practitionerId: string): Promise<FHIRPatient[]> {
    return this.getAllPages<FHIRPatient>('/Patient', {
      'general-practitioner': `Practitioner/${practitionerId}`,
      active: 'true',
    });
  }

  // ============================================================================
  // Appointment Endpoints
  // ============================================================================

  async getAppointment(appointmentId: string): Promise<FHIRAppointment> {
    return this.request<FHIRAppointment>(`/Appointment/${appointmentId}`);
  }

  async getAppointmentsByPractitioner(
    practitionerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FHIRAppointment[]> {
    // Use Halaxy-specific query parameters per their API docs:
    // - practitioner: An individual practitioner assigned to an appointment
    // - date: Appointment date/time (supports FHIR prefixes like ge, lt)
    return this.getAllPages<FHIRAppointment>('/Appointment', {
      practitioner: `Practitioner/${practitionerId}`,
      date: `ge${startDate.toISOString().split('T')[0]}`,
    });
  }

  // ============================================================================
  // Slot Endpoints (for availability)
  // ============================================================================

  /**
   * Get a specific slot by ID
   */
  async getSlot(slotId: string): Promise<FHIRSlot> {
    return this.request<FHIRSlot>(`/Slot/${slotId}`);
  }

  /**
   * Get available slots for a practitioner within a date range
   * 
   * @param practitionerId - Halaxy practitioner ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param status - Filter by slot status (default: 'free')
   */
  async getSlotsByPractitioner(
    practitionerId: string,
    startDate: Date,
    endDate: Date,
    status: FHIRSlotStatus = 'free'
  ): Promise<FHIRSlot[]> {
    return this.getAllPages<FHIRSlot>('/Slot', {
      practitioner: `Practitioner/${practitionerId}`,
      start: `ge${startDate.toISOString()}`,
      end: `le${endDate.toISOString()}`,
      status: status,
    });
  }

  /**
   * Search for available slots using the $find operation
   * This is the preferred method for finding bookable slots
   * 
   * @param practitionerId - Halaxy practitioner ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param duration - Desired appointment duration in minutes
   */
  async findAvailableSlots(
    practitionerId: string,
    startDate: Date,
    endDate: Date,
    duration: number = 60
  ): Promise<FHIRSlot[]> {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration: duration.toString(),
      practitioner: `Practitioner/${practitionerId}`,
      status: 'free',
    });

    if (config.halaxyHealthcareServiceId) {
      params.set('healthcareService', `HealthcareService/${config.halaxyHealthcareServiceId}`);
    }

    try {
      const bundle = await this.request<FHIRBundle<FHIRSlot>>(
        `/Slot/$find?${params.toString()}`
      );

      if (bundle.entry && bundle.entry.length > 0) {
        return bundle.entry.map(e => e.resource);
      }
      console.warn('[HalaxyClient] $find returned no slots, falling back to standard Slot search');
    } catch (error) {
      // Fallback to standard Slot search if $find is not supported
      console.warn('[HalaxyClient] $find operation failed, falling back to standard search');
      return this.getSlotsByPractitioner(practitionerId, startDate, endDate, 'free');
    }

    return this.getSlotsByPractitioner(practitionerId, startDate, endDate, 'free');
  }

  /**
   * Get all available slots across all practitioners
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   */
  async getAllAvailableSlots(
    startDate: Date,
    endDate: Date
  ): Promise<FHIRSlot[]> {
    return this.getAllPages<FHIRSlot>('/Slot', {
      start: `ge${startDate.toISOString()}`,
      end: `le${endDate.toISOString()}`,
      status: 'free',
    });
  }

  async getAllSlots(): Promise<FHIRSlot[]> {
    return this.getAllPages<FHIRSlot>('/Slot');
  }
}

// ============================================================================
// FHIR Types
// ============================================================================

// Slot status values per FHIR R4 specification
export type FHIRSlotStatus = 'busy' | 'free' | 'busy-unavailable' | 'busy-tentative' | 'entered-in-error';

export interface FHIRSlot {
  resourceType: 'Slot';
  id: string;
  status: FHIRSlotStatus;
  start: string; // ISO 8601 datetime
  end: string;   // ISO 8601 datetime
  schedule?: {
    reference?: string; // e.g., "Schedule/123"
    display?: string;
  };
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
  // Extension for practitioner reference (Halaxy-specific)
  extension?: Array<{
    url: string;
    valueReference?: {
      reference?: string;
      display?: string;
    };
  }>;
}

interface FHIRBundle<T> {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  link?: Array<{ relation: string; url: string }>;
  entry?: Array<{ resource: T }>;
}

interface FHIRPractitioner {
  resourceType: 'Practitioner';
  id: string;
  active?: boolean;
  name?: Array<{
    family?: string;
    given?: string[];
    prefix?: string[];
  }>;
  telecom?: Array<{
    system: 'phone' | 'email' | 'fax';
    value: string;
    use?: string;
  }>;
  gender?: string;
}

interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  active?: boolean;
  name?: Array<{
    family?: string;
    given?: string[];
  }>;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
  gender?: string;
  birthDate?: string;
}

export interface FHIRAppointment {
  resourceType: 'Appointment';
  id: string;
  status: string;
  start?: string;
  end?: string;
  description?: string;
  participant?: Array<{
    actor?: {
      reference?: string;
      display?: string;
    };
    status?: string;
  }>;
}

export default HalaxyClient;
