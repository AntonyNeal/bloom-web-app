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
        // Filter out OperationOutcome resources (warnings/errors from the API)
        const validResources = bundle.entry
          .map(e => e.resource)
          .filter(r => r && (r as { resourceType?: string }).resourceType !== 'OperationOutcome');
        results.push(...validResources);
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
    // - status: Filter by appointment status (booked, arrived, fulfilled are active)
    // Try fetching booked appointments first - these are confirmed bookings
    console.log(`[HalaxyClient] Fetching appointments for practitioner ${practitionerId}, date >= ${startDate.toISOString().split('T')[0]}`);
    
    try {
      const appointments = await this.getAllPages<FHIRAppointment>('/Appointment', {
        practitioner: `Practitioner/${practitionerId}`,
        date: `ge${startDate.toISOString().split('T')[0]}`,
        status: 'booked',
      });
      
      console.log(`[HalaxyClient] Found ${appointments.length} booked appointments`);
      return appointments;
    } catch (error) {
      // If appointment endpoint returns 404, the practitioner may not have appointments
      // Log a warning but don't fail the entire sync
      if (error instanceof Error && error.message.includes('404')) {
        console.warn(`[HalaxyClient] Appointment endpoint returned 404 for practitioner ${practitionerId} - treating as no appointments`);
        return [];
      }
      // Re-throw other errors
      throw error;
    }
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
    // Halaxy uses the Slot resource to represent individual appointment slots
    // Use _include to expand related Practitioner resources for complete slot data
    const queryParams = {
      practitioner: `Practitioner/${practitionerId}`,
      start: `ge${startDate.toISOString()}`,
      end: `le${endDate.toISOString()}`,
      status: status,
      _include: 'Slot:practitioner',
    };
    
    console.log('[HalaxyClient] getSlotsByPractitioner - Query parameters:', JSON.stringify(queryParams, null, 2));
    console.log(`[HalaxyClient] getSlotsByPractitioner - Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const slots = await this.getAllPages<FHIRSlot>('/Slot', queryParams);
    
    console.log(`[HalaxyClient] getSlotsByPractitioner - Returned ${slots.length} total slots from API`);
    if (slots.length > 0) {
      console.log(`[HalaxyClient] Sample slots returned:`);
      slots.slice(0, 3).forEach((slot, i) => {
        console.log(`[HalaxyClient]   Slot ${i+1}: ID=${slot.id}, start=${slot.start}, end=${slot.end}, status=${slot.status}, duration=${(new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000}min`);
      });
      if (slots.length > 3) {
        console.log(`[HalaxyClient]   ... and ${slots.length - 3} more slots`);
      }
    }
    
    return slots;
  }

  /**
   * Search for available slots
   * Queries the Slot resource using standard FHIR search parameters.
   * Note: Halaxy returns both schedule templates and individual appointment slots.
   * 
   * @param practitionerId - Halaxy practitioner ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param duration - Desired appointment duration in minutes (currently unused as Halaxy returns pre-defined slots)
   */
  async findAvailableSlots(
    practitionerId: string,
    startDate: Date,
    endDate: Date,
    _duration: number = 60
  ): Promise<FHIRSlot[]> {
    // Use standard FHIR Slot search with proper date range parameters
    // Halaxy returns individual appointment slots when queried with the right parameters
    console.log(`[HalaxyClient] ============= STARTING SLOT QUERY =============`);
    console.log(`[HalaxyClient] findAvailableSlots - Querying available slots for practitioner: ${practitionerId}`);
    console.log(`[HalaxyClient] findAvailableSlots - Duration parameter: ${_duration} minutes`);
    
    const slots = await this.getSlotsByPractitioner(
      practitionerId, 
      startDate, 
      endDate, 
      'free'
    );
    
    console.log(`[HalaxyClient] findAvailableSlots - Found ${slots.length} available slots`);
    
    // Debug: Log all slot details
    if (slots.length > 0) {
      console.log(`[HalaxyClient] ===== DETAILED SLOT BREAKDOWN =====`);
      const slotsByDate: { [key: string]: FHIRSlot[] } = {};
      slots.forEach(slot => {
        const date = slot.start.split('T')[0];
        if (!slotsByDate[date]) slotsByDate[date] = [];
        slotsByDate[date].push(slot);
      });
      
      Object.keys(slotsByDate).sort().forEach(date => {
        const daySlots = slotsByDate[date];
        console.log(`[HalaxyClient] ${date}: ${daySlots.length} slots`);
        daySlots.forEach(slot => {
          const startTime = new Date(slot.start).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
          const endTime = new Date(slot.end).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
          const durationMin = (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000;
          console.log(`[HalaxyClient]   - ${startTime} to ${endTime} (${Math.round(durationMin)}min, ID: ${slot.id})`);
        });
      });
      console.log(`[HalaxyClient] ===================================`);
    }
    
    return slots;
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
