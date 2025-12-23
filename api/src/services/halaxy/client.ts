/**
 * Halaxy API Client
 * 
 * FHIR-R4 compliant client for Halaxy's Practice Management API.
 * Handles authentication, pagination, and rate limiting.
 * 
 * API Documentation: https://developer.halaxy.com/
 */

import {
  FHIRPractitioner,
  FHIRPractitionerRole,
  FHIRPatient,
  FHIRAppointment,
  FHIRSlot,
  FHIRSchedule,
  FHIRBundle,
  HalaxyConfig,
} from './types';
import { getAccessToken, invalidateToken, getHalaxyConfig } from './token-manager';

/**
 * Halaxy FHIR API Client
 * 
 * Provides methods to fetch practitioners, patients, and appointments
 * from Halaxy's FHIR-R4 compliant API.
 */
export class HalaxyClient {
  private config: HalaxyConfig;
  private requestCount = 0;
  private requestWindowStart = Date.now();

  constructor(config?: Partial<HalaxyConfig>) {
    const defaultConfig = getHalaxyConfig();
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Get the API base URL (for debugging)
   */
  getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  // ===========================================================================
  // Practitioner Endpoints
  // ===========================================================================

  /**
   * Get a single practitioner by ID
   */
  async getPractitioner(practitionerId: string): Promise<FHIRPractitioner> {
    return this.request<FHIRPractitioner>(`/Practitioner/${practitionerId}`);
  }

  /**
   * Get practitioner role (links practitioner to organization)
   */
  async getPractitionerRole(roleId: string): Promise<FHIRPractitionerRole> {
    return this.request<FHIRPractitionerRole>(`/PractitionerRole/${roleId}`);
  }

  /**
   * Get all practitioners for the organization
   */
  async getAllPractitioners(): Promise<FHIRPractitioner[]> {
    return this.getAllPages<FHIRPractitioner>('/Practitioner', {
      active: 'true',
    });
  }

  // ===========================================================================
  // Patient Endpoints
  // ===========================================================================

  /**
   * Get a single patient by ID
   */
  async getPatient(patientId: string): Promise<FHIRPatient> {
    return this.request<FHIRPatient>(`/Patient/${patientId}`);
  }

  /**
   * Get all patients for a specific practitioner
   * Note: Halaxy API expects format Practitioner/{numericId} for general-practitioner queries
   */
  async getPatientsByPractitioner(practitionerId: string): Promise<FHIRPatient[]> {
    // Extract numeric ID - remove PR- or EP- prefix if present
    const numericId = practitionerId.replace(/^(PR|EP)-/, '');
    // Format as Practitioner/{numericId} as per error message guidance
    return this.getAllPages<FHIRPatient>('/Patient', {
      'general-practitioner': `Practitioner/${numericId}`,
      active: 'true',
    });
  }

  /**
   * Get all active patients
   */
  async getAllPatients(): Promise<FHIRPatient[]> {
    return this.getAllPages<FHIRPatient>('/Patient', {
      active: 'true',
    });
  }

  /**
   * Export patient IDs - returns list of patient references the user can access
   */
  async exportPatientIds(): Promise<string[]> {
    const response = await this.request<{ parameter: Array<{ valueReference: { reference: string } }> }>('/Patient/$export-ids');
    return response.parameter?.map(p => p.valueReference?.reference).filter(Boolean) || [];
  }

  /**
   * Search patients by name
   */
  async searchPatients(query: string): Promise<FHIRPatient[]> {
    return this.getAllPages<FHIRPatient>('/Patient', {
      name: query,
      active: 'true',
    });
  }
  // ===========================================================================
  // Appointment Endpoints
  // ===========================================================================

  /**
   * Get a single appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<FHIRAppointment> {
    return this.request<FHIRAppointment>(`/Appointment/${appointmentId}`);
  }

  /**
   * Get appointments for a practitioner within a date range
   * 
   * @param practitionerId - Halaxy practitioner ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param statuses - Filter by appointment statuses (optional)
   */
  async getAppointmentsByPractitioner(
    practitionerId: string,
    startDate: Date,
    endDate: Date,
    statuses?: string[]
  ): Promise<FHIRAppointment[]> {
    // Try with full URL reference format as shown in Halaxy booking recipe
    const fullRef = `https://au-api.halaxy.com/main/PractitionerRole/${practitionerId}`;
    const params: Record<string, string> = {
      actor: fullRef,
      date: `ge${formatDate(startDate)}`,
      'date:lt': formatDate(endDate),
    };

    if (statuses && statuses.length > 0) {
      params.status = statuses.join(',');
    }

    return this.getAllPages<FHIRAppointment>('/Appointment', params);
  }

  /**
   * Get today's appointments for a practitioner
   */
  async getTodaysAppointments(practitionerId: string): Promise<FHIRAppointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.getAppointmentsByPractitioner(practitionerId, startOfDay, endOfDay);
  }

  /**
   * Get appointments for a specific patient
   */
  async getAppointmentsByPatient(patientId: string): Promise<FHIRAppointment[]> {
    return this.getAllPages<FHIRAppointment>('/Appointment', {
      actor: `Patient/${patientId}`,
    });
  }

  // ===========================================================================
  // Schedule Endpoints (Practitioner Practice Hours)
  // ===========================================================================

  /**
   * Get all schedules (practitioner practice hours)
   * Each schedule represents a practitioner's hours at a specific clinic
   */
  async getAllSchedules(): Promise<FHIRSchedule[]> {
    return this.getAllPages<FHIRSchedule>('/Schedule', {});
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<FHIRSchedule> {
    return this.request<FHIRSchedule>(`/Schedule/${scheduleId}`);
  }

  /**
   * Get schedules for a specific practitioner
   */
  async getSchedulesByPractitioner(practitionerId: string): Promise<FHIRSchedule[]> {
    return this.getAllPages<FHIRSchedule>('/Schedule', {
      actor: `Practitioner/${practitionerId}`,
    });
  }

  // ===========================================================================
  // Slot Endpoints (Availability)
  // ===========================================================================

  /**
   * Get available slots within a date range (all practitioners)
   * Uses FHIR date prefixes: ge (>=), le (<=), gt (>), lt (<)
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param status - Filter by slot status (default: 'free')
   */
  async getAllAvailableSlots(
    startDate: Date,
    endDate: Date,
    status: string = 'free'
  ): Promise<FHIRSlot[]> {
    // Use FHIR date prefix format: ge2024-01-01T00:00:00Z
    return this.getAllPages<FHIRSlot>('/Slot', {
      start: `ge${startDate.toISOString()}`,
      end: `le${endDate.toISOString()}`,
      status: status,
    });
  }

  /**
   * Get available slots for a specific practitioner
   * Uses reference format: Practitioner/PR-12345
   * 
   * @param practitionerId - Halaxy practitioner ID (e.g., PR-1439411)
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param status - Filter by slot status (default: 'free')
   */
  async getAvailableSlots(
    practitionerId: string,
    startDate: Date,
    endDate: Date,
    status: string = 'free'
  ): Promise<FHIRSlot[]> {
    // Use reference format from Halaxy docs: Practitioner/PR-12345
    return this.getAllPages<FHIRSlot>('/Slot', {
      practitioner: `Practitioner/${practitionerId}`,
      start: `ge${startDate.toISOString()}`,
      end: `le${endDate.toISOString()}`,
      status: status,
    });
  }

  /**
   * Get slots by practitioner-role (for a specific clinic location)
   */
  async getSlotsByPractitionerRole(
    practitionerRoleId: string,
    startDate: Date,
    endDate: Date,
    status: string = 'free'
  ): Promise<FHIRSlot[]> {
    return this.getAllPages<FHIRSlot>('/Slot', {
      'practitioner-role': `PractitionerRole/${practitionerRoleId}`,
      start: `ge${startDate.toISOString()}`,
      end: `le${endDate.toISOString()}`,
      status: status,
    });
  }

  /**
   * Find available appointments using the $find operation
   * This endpoint respects Halaxy's online booking preferences (buffer time, lead time, advance booking limit)
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param durationMinutes - Appointment duration in minutes
   * @param practitionerId - Optional practitioner ID (e.g., "PR-1439411")
   * @param practitionerRoleId - Optional practitioner role ID
   * @param organizationId - Optional organization ID
   * @param applyBufferTime - Apply buffer time settings (default: false)
   * @param emergency - Ignore lead time for emergency appointments (default: false)
   */
  async findAvailableAppointments(
    startDate: Date,
    endDate: Date,
    durationMinutes: number,
    practitionerId?: string,
    practitionerRoleId?: string,
    organizationId?: string,
    applyBufferTime: boolean = false,
    emergency: boolean = false
  ): Promise<FHIRSlot[]> {
    const params: Record<string, string> = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration: durationMinutes.toString(),
    };

    if (practitionerId) {
      params.practitioner = practitionerId;
    }
    if (practitionerRoleId) {
      params['practitioner-role'] = practitionerRoleId;
    }
    if (organizationId) {
      params.organization = organizationId;
    }
    if (applyBufferTime) {
      params['apply-buffer-time'] = 'true';
    }
    if (emergency) {
      params.emergency = 'true';
    }

    console.log(`[HalaxyClient] Finding available appointments with params:`, params);
    
    // Use the /Appointment/$find endpoint (main API, not FHIR)
    // Build URL with query parameters
    const url = this.buildUrl('/Appointment/$find', params);
    const response = await this.request<FHIRBundle<FHIRSlot>>(
      url.replace(this.config.apiBaseUrl, '')
    );
    
    const slots = response.entry?.map(e => e.resource) || [];
    console.log(`[HalaxyClient] findAvailableAppointments returned ${slots.length} slots`);
    return slots;
  }

  /**
   * Get a single slot by ID
   */
  async getSlot(slotId: string): Promise<FHIRSlot> {
    return this.request<FHIRSlot>(`/Slot/${slotId}`);
  }

  // ===========================================================================
  // Patient/Appointment Creation (Booking)
  // ===========================================================================

  /**
   * Create or find a patient in Halaxy
   */
  async createOrFindPatient(patientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'unknown';
  }): Promise<FHIRPatient> {
    // First try to find existing patient by email
    try {
      const existing = await this.getAllPages<FHIRPatient>('/Patient', {
        email: patientData.email,
      });
      
      // Filter out any invalid patient IDs (like 'warning' from FHIR OperationOutcome)
      const validPatients = existing.filter(p => 
        p.id && 
        typeof p.id === 'string' && 
        p.id !== 'warning' && 
        p.id !== 'error' &&
        !p.id.startsWith('outcome') &&
        p.id.length > 3 // Valid Halaxy IDs are longer
      );
      
      if (validPatients.length > 0) {
        console.log(`[HalaxyClient] Found existing patient: ${validPatients[0].id}`);
        return validPatients[0];
      }
    } catch (error) {
      console.log('[HalaxyClient] No existing patient found, creating new');
    }

    // Create new patient
    console.log('[HalaxyClient] Creating new patient...');
    const fhirPatient = {
      resourceType: 'Patient',
      active: true,
      name: [{
        use: 'official',
        family: patientData.lastName,
        given: [patientData.firstName],
      }],
      telecom: [
        { system: 'email', value: patientData.email, use: 'home' },
        ...(patientData.phone ? [{ system: 'phone', value: patientData.phone, use: 'mobile' }] : []),
      ],
      ...(patientData.dateOfBirth && { birthDate: patientData.dateOfBirth }),
      ...(patientData.gender && { gender: patientData.gender }),
    };

    const newPatient = await this.request<FHIRPatient>('/Patient', {
      method: 'POST',
      body: JSON.stringify(fhirPatient),
    });

    // Validate the returned patient has a proper ID
    if (!newPatient.id || newPatient.id === 'warning' || newPatient.id === 'error' || newPatient.id.length <= 3) {
      console.error('[HalaxyClient] Invalid patient ID returned from Halaxy:', newPatient);
      throw new Error(`Halaxy returned invalid patient ID: ${newPatient.id}`);
    }

    console.log(`[HalaxyClient] Created new patient: ${newPatient.id}`);
    return newPatient;
  }

  /**
   * Create an appointment in Halaxy using the $book operation
   * 
   * Halaxy uses the FHIR $book operation for creating appointments.
   * Required parameters: patient-id, healthcare-service-id, location-type, status
   */
  async createAppointment(appointmentData: {
    patientId: string;
    practitionerId: string;
    start: string; // ISO 8601
    end: string;   // ISO 8601
    description?: string;
    serviceType?: string;
    healthcareServiceId?: string;
    locationType?: 'clinic' | 'telehealth' | 'home';
  }): Promise<FHIRAppointment> {
    // Validate patient ID before attempting to create appointment
    if (!appointmentData.patientId || 
        appointmentData.patientId === 'warning' || 
        appointmentData.patientId === 'error' ||
        appointmentData.patientId.length <= 3) {
      throw new Error(`Invalid patient ID: ${appointmentData.patientId}. Cannot create appointment.`);
    }

    // Use environment variables for defaults
    const practitionerRoleId = process.env.HALAXY_PRACTITIONER_ROLE_ID || 'PR-2442591';
    const healthcareServiceId = appointmentData.healthcareServiceId || 
      process.env.HALAXY_HEALTHCARE_SERVICE_ID || '567387';
    const locationType = appointmentData.locationType || 'clinic';

    // Build the $book Parameters resource
    const bookParams = {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'appt-resource',
          resource: {
            resourceType: 'Appointment',
            start: appointmentData.start,
            end: appointmentData.end,
            minutesDuration: Math.round(
              (new Date(appointmentData.end).getTime() - new Date(appointmentData.start).getTime()) / 60000
            ),
            description: appointmentData.description || 'Appointment booked via website',
            participant: [{
              actor: {
                reference: `https://au-api.halaxy.com/main/PractitionerRole/${practitionerRoleId}`,
                type: 'PractitionerRole'
              }
            }]
          }
        },
        {
          name: 'patient-id',
          valueReference: {
            reference: `https://au-api.halaxy.com/main/Patient/${appointmentData.patientId}`,
            type: 'Patient'
          }
        },
        {
          name: 'healthcare-service-id',
          valueReference: {
            reference: `https://au-api.halaxy.com/main/HealthcareService/${healthcareServiceId}`,
            type: 'HealthcareService'
          }
        },
        {
          name: 'location-type',
          valueCode: locationType
        },
        {
          name: 'status',
          valueCode: 'booked'
        }
      ]
    };

    console.log('[HalaxyClient] Booking appointment with $book operation');
    console.log('[HalaxyClient] $book params:', JSON.stringify(bookParams, null, 2));

    return this.request<FHIRAppointment>('/Appointment/$book', {
      method: 'POST',
      body: JSON.stringify(bookParams),
    });
  }

  // ===========================================================================
  // Request Helpers
  // ===========================================================================

  /**
   * Make an authenticated request to the Halaxy API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.checkRateLimit();

    const token = await getAccessToken();
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    console.log(`[HalaxyClient] Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    });

    if (response.status === 401) {
      // Token expired, invalidate and retry once
      invalidateToken();
      const newToken = await getAccessToken();
      
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Accept': 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });

      if (!retryResponse.ok) {
        throw new HalaxyApiError(
          `Halaxy API error: ${retryResponse.status} ${retryResponse.statusText}`,
          retryResponse.status,
          await retryResponse.text()
        );
      }

      return retryResponse.json() as Promise<T>;
    }

    if (!response.ok) {
      throw new HalaxyApiError(
        `Halaxy API error: ${response.status} ${response.statusText}`,
        response.status,
        await response.text()
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch all pages of a paginated endpoint
   */
  private async getAllPages<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = this.buildUrl(endpoint, params);

    while (nextUrl) {
      const bundle = await this.request<FHIRBundle<T>>(
        nextUrl.replace(this.config.apiBaseUrl, '')
      );

      if (bundle.entry) {
        // Filter out entries without valid resources (Halaxy sometimes returns warning entries)
        const validResources = bundle.entry
          .filter(e => {
            const resource = e.resource as { id?: string };
            return resource && resource.id && typeof resource.id === 'string' && resource.id !== 'warning';
          })
          .map(e => e.resource);
        results.push(...validResources);
      }

      // Find next page link
      const nextLink = bundle.link?.find(l => l.relation === 'next');
      nextUrl = nextLink?.url || null;
    }

    return results;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${this.config.apiBaseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  /**
   * Simple rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    // Reset counter if window has passed
    if (now - this.requestWindowStart > windowMs) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    this.requestCount++;

    if (this.requestCount > this.config.maxRequestsPerMinute) {
      const waitTime = windowMs - (now - this.requestWindowStart);
      console.log(`[HalaxyClient] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 1;
      this.requestWindowStart = Date.now();
    }
  }
}

/**
 * Custom error class for Halaxy API errors
 */
export class HalaxyApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = 'HalaxyApiError';
  }
}

/**
 * Format date for FHIR API queries (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Export singleton instance for convenience
let clientInstance: HalaxyClient | null = null;

export function getHalaxyClient(): HalaxyClient {
  if (!clientInstance) {
    clientInstance = new HalaxyClient();
  }
  return clientInstance;
}
