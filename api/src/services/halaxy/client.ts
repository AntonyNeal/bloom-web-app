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
   * Get available slots for a practitioner within a date range
   * 
   * @param practitionerId - Halaxy practitioner ID
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
    return this.getAllPages<FHIRSlot>('/Slot', {
      'schedule.actor': `PractitionerRole/${practitionerId}`,
      'start': `ge${startDate.toISOString()}`,
      'start:lt': endDate.toISOString(),
      status: status,
    });
  }

  /**
   * Get slots by schedule ID (more reliable than by practitioner)
   */
  async getSlotsBySchedule(
    scheduleId: string,
    startDate: Date,
    endDate: Date,
    status: string = 'free'
  ): Promise<FHIRSlot[]> {
    return this.getAllPages<FHIRSlot>('/Slot', {
      schedule: `Schedule/${scheduleId}`,
      'start': `ge${startDate.toISOString()}`,
      'start:lt': endDate.toISOString(),
      status: status,
    });
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
      if (existing.length > 0) {
        console.log(`[HalaxyClient] Found existing patient: ${existing[0].id}`);
        return existing[0];
      }
    } catch (error) {
      console.log('[HalaxyClient] No existing patient found, creating new');
    }

    // Create new patient
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

    return this.request<FHIRPatient>('/Patient', {
      method: 'POST',
      body: JSON.stringify(fhirPatient),
    });
  }

  /**
   * Create an appointment in Halaxy
   */
  async createAppointment(appointmentData: {
    patientId: string;
    practitionerId: string;
    start: string; // ISO 8601
    end: string;   // ISO 8601
    description?: string;
    serviceType?: string;
  }): Promise<FHIRAppointment> {
    const fhirAppointment = {
      resourceType: 'Appointment',
      status: 'booked',
      start: appointmentData.start,
      end: appointmentData.end,
      minutesDuration: Math.round(
        (new Date(appointmentData.end).getTime() - new Date(appointmentData.start).getTime()) / 60000
      ),
      description: appointmentData.description || 'Appointment booked via website',
      participant: [
        {
          actor: { reference: `Patient/${appointmentData.patientId}` },
          status: 'accepted',
        },
        {
          actor: { reference: `Practitioner/${appointmentData.practitionerId}` },
          status: 'accepted',
        },
      ],
    };

    return this.request<FHIRAppointment>('/Appointment', {
      method: 'POST',
      body: JSON.stringify(fhirAppointment),
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
        results.push(...bundle.entry.map(e => e.resource));
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
