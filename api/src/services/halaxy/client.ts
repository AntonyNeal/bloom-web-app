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
  FHIRLocation,
  FHIROrganization,
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
   * Get a location by ID
   */
  async getLocation(locationId: string): Promise<FHIRLocation> {
    return this.request<FHIRLocation>(`/Location/${locationId}`);
  }

  /**
   * Get an organization by ID
   */
  async getOrganization(organizationId: string): Promise<FHIROrganization> {
    return this.request<FHIROrganization>(`/Organization/${organizationId}`);
  }

  /**
   * Get all practitioner roles for the organization
   * This returns all practitioner-to-clinic associations
   */
  async getAllPractitionerRoles(): Promise<FHIRPractitionerRole[]> {
    return this.getAllPages<FHIRPractitionerRole>('/PractitionerRole', {});
  }

  /**
   * Get practitioner roles for a specific practitioner
   */
  async getPractitionerRolesByPractitioner(practitionerId: string): Promise<FHIRPractitionerRole[]> {
    return this.getAllPages<FHIRPractitionerRole>('/PractitionerRole', {
      practitioner: `Practitioner/${practitionerId}`,
    });
  }

  /**
   * Search practitioners by Halaxy Profile ID (identifier)
   * Use this when you have a numeric profile ID (e.g. "1304541") instead of
   * the resource ID (e.g. "PR-1439411")
   */
  async searchPractitionersByIdentifier(identifier: string): Promise<FHIRPractitioner[]> {
    return this.getAllPages<FHIRPractitioner>('/Practitioner', {
      identifier: identifier,
    });
  }

  /**
   * Find a practitioner by their email address
   * @returns The practitioner if found, null otherwise
   */
  async findPractitionerByEmail(email: string): Promise<FHIRPractitioner | null> {
    const results = await this.getFirstPage<FHIRPractitioner>('/Practitioner', {
      email: email,
      _count: '1',
    });
    
    // Filter out any invalid IDs (like 'warning' from FHIR OperationOutcome)
    const validPractitioners = results.filter(p => 
      p.id && 
      typeof p.id === 'string' && 
      p.id !== 'warning' && 
      p.id !== 'error' &&
      !p.id.startsWith('outcome') &&
      p.id.length > 3
    );
    
    return validPractitioners.length > 0 ? validPractitioners[0] : null;
  }

  /**
   * Find a practitioner by name (first name and last name)
   * @returns The practitioner if found, null otherwise
   */
  async findPractitionerByName(firstName: string, lastName: string): Promise<FHIRPractitioner | null> {
    // FHIR uses 'given' for first name and 'family' for last name
    const results = await this.getFirstPage<FHIRPractitioner>('/Practitioner', {
      given: firstName,
      family: lastName,
      _count: '10', // Get a few in case of duplicates
    });
    
    // Filter out any invalid IDs
    const validPractitioners = results.filter(p => 
      p.id && 
      typeof p.id === 'string' && 
      p.id !== 'warning' && 
      p.id !== 'error' &&
      !p.id.startsWith('outcome') &&
      p.id.length > 3
    );
    
    return validPractitioners.length > 0 ? validPractitioners[0] : null;
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
    const startTime = Date.now();
    
    // First try to find existing patient by email (limit to first page for speed)
    try {
      const existing = await this.getFirstPage<FHIRPatient>('/Patient', {
        email: patientData.email,
        _count: '1', // Only need to find one match
      });
      console.log(`[HalaxyClient] Patient lookup took ${Date.now() - startTime}ms`);
      
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
    
    // Format phone number to international format (+61...)
    let formattedPhone: string | undefined;
    if (patientData.phone) {
      // Remove all spaces
      let phone = patientData.phone.replace(/\s/g, '');
      // Convert Australian numbers starting with 0 to +61 format
      if (phone.startsWith('0')) {
        phone = '+61' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        phone = '+61' + phone;
      }
      formattedPhone = phone;
    }
    
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
        ...(formattedPhone ? [{ system: 'sms', value: formattedPhone, use: 'mobile' }] : []),
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

    console.log(`[HalaxyClient] Creating appointment - PractitionerRole: ${practitionerRoleId}, HealthcareService: ${healthcareServiceId}`);

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

    return this.request<FHIRAppointment>('/Appointment/$book', {
      method: 'POST',
      body: JSON.stringify(bookParams),
    });
  }

  /**
   * Cancel an appointment in Halaxy
   * Updates the appointment status to 'cancelled'
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    console.log(`[HalaxyClient] Cancelling appointment ${appointmentId}`);
    
    // FHIR merge-patch to update status to cancelled
    const patchBody: Record<string, unknown> = {
      status: 'cancelled'
    };

    // If reason provided, add cancellation reason
    if (reason) {
      patchBody.cancelationReason = { text: reason };
    }

    await this.request<FHIRAppointment>(`/Appointment/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(patchBody),
    });

    console.log(`[HalaxyClient] Appointment ${appointmentId} cancelled successfully`);
  }

  // ===========================================================================
  // Practitioner Management
  // ===========================================================================

  /**
   * Create or find an existing practitioner in Halaxy
   * 
   * This is used during onboarding to create the practitioner record in Halaxy.
   * First searches by email to avoid duplicates, then creates if not found.
   * 
   * @param practitionerData - Practitioner details from the onboarding form
   * @returns The created or existing FHIR Practitioner resource
   */
  async createOrFindPractitioner(practitionerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    ahpraNumber?: string;
    specializations?: string[];
  }): Promise<FHIRPractitioner> {
    const startTime = Date.now();
    
    // First try to find existing practitioner by email
    try {
      const existing = await this.getFirstPage<FHIRPractitioner>('/Practitioner', {
        email: practitionerData.email,
        _count: '1',
      });
      console.log(`[HalaxyClient] Practitioner lookup took ${Date.now() - startTime}ms`);
      
      // Filter out any invalid IDs (like 'warning' from FHIR OperationOutcome)
      const validPractitioners = existing.filter(p => 
        p.id && 
        typeof p.id === 'string' && 
        p.id !== 'warning' && 
        p.id !== 'error' &&
        !p.id.startsWith('outcome') &&
        p.id.length > 3
      );
      
      if (validPractitioners.length > 0) {
        console.log(`[HalaxyClient] Found existing practitioner: ${validPractitioners[0].id}`);
        return validPractitioners[0];
      }
    } catch (error) {
      console.log('[HalaxyClient] No existing practitioner found, creating new');
    }

    // Create new practitioner
    console.log('[HalaxyClient] Creating new practitioner...');
    
    // Format phone number to international format (+61...)
    let formattedPhone: string | undefined;
    if (practitionerData.phone) {
      let phone = practitionerData.phone.replace(/\s/g, '');
      if (phone.startsWith('0')) {
        phone = '+61' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        phone = '+61' + phone;
      }
      formattedPhone = phone;
    }

    // Build telecom array
    const telecom: Array<{ system: string; value: string; use?: string }> = [
      { system: 'email', value: practitionerData.email, use: 'work' },
    ];
    if (formattedPhone) {
      telecom.push({ system: 'phone', value: formattedPhone, use: 'mobile' });
    }

    // Build identifier array (AHPRA number)
    const identifier: Array<{ system: string; value: string }> = [];
    if (practitionerData.ahpraNumber) {
      identifier.push({
        system: 'http://ns.electronichealth.net.au/id/hi/hpii/1.0',
        value: practitionerData.ahpraNumber,
      });
    }

    // Build qualification array from specializations
    const qualification = practitionerData.specializations?.map(spec => ({
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          display: spec,
        }],
      },
    })) || [];

    const fhirPractitioner = {
      resourceType: 'Practitioner',
      active: true,
      name: [{
        use: 'official',
        family: practitionerData.lastName,
        given: [practitionerData.firstName],
      }],
      telecom,
      ...(identifier.length > 0 && { identifier }),
      ...(qualification.length > 0 && { qualification }),
    };

    const newPractitioner = await this.request<FHIRPractitioner>('/Practitioner', {
      method: 'POST',
      body: JSON.stringify(fhirPractitioner),
    });

    // Validate the returned practitioner has a proper ID
    if (!newPractitioner.id || newPractitioner.id === 'warning' || newPractitioner.id === 'error' || newPractitioner.id.length <= 3) {
      console.error('[HalaxyClient] Invalid practitioner ID returned from Halaxy:', newPractitioner);
      throw new Error(`Halaxy returned invalid practitioner ID: ${newPractitioner.id}`);
    }

    console.log(`[HalaxyClient] Created new practitioner: ${newPractitioner.id}`);
    return newPractitioner;
  }

  /**
   * Create a PractitionerRole to link a practitioner to the organization
   * 
   * This is required for the practitioner to appear in scheduling and be bookable.
   * The PractitionerRole links:
   * - Practitioner (the person)
   * - Organization (Life Psychology Australia)
   * - Location (optional - clinic location)
   * - Specialty (their practice areas)
   * 
   * @param practitionerId - The Halaxy Practitioner ID (e.g., "PR-1234567")
   * @param options - Optional specialty and location settings
   * @returns The created PractitionerRole resource
   */
  async createPractitionerRole(
    practitionerId: string,
    options: {
      specialties?: string[];
      locationId?: string;
    } = {}
  ): Promise<FHIRPractitionerRole> {
    const organizationId = this.config.organizationId;
    
    if (!organizationId) {
      throw new Error('HALAXY_ORGANIZATION_ID not configured');
    }

    // Build specialty array
    const specialty = options.specialties?.map(spec => ({
      coding: [{
        system: 'http://snomed.info/sct',
        display: spec,
      }],
    })) || [];

    // Build location array if provided
    const location = options.locationId ? [{
      reference: `Location/${options.locationId}`,
    }] : undefined;

    const fhirPractitionerRole = {
      resourceType: 'PractitionerRole',
      active: true,
      practitioner: {
        reference: `Practitioner/${practitionerId}`,
      },
      organization: {
        reference: `Organization/${organizationId}`,
      },
      ...(location && { location }),
      ...(specialty.length > 0 && { specialty }),
    };

    console.log(`[HalaxyClient] Creating PractitionerRole for ${practitionerId} in org ${organizationId}`);

    const newRole = await this.request<FHIRPractitionerRole>('/PractitionerRole', {
      method: 'POST',
      body: JSON.stringify(fhirPractitionerRole),
    });

    // Validate the returned role has a proper ID
    if (!newRole.id || newRole.id === 'warning' || newRole.id === 'error' || newRole.id.length <= 3) {
      console.error('[HalaxyClient] Invalid PractitionerRole ID returned from Halaxy:', newRole);
      throw new Error(`Halaxy returned invalid PractitionerRole ID: ${newRole.id}`);
    }

    console.log(`[HalaxyClient] Created PractitionerRole: ${newRole.id}`);
    return newRole;
  }

  /**
   * Find or create a PractitionerRole for a practitioner
   * First checks if a role already exists in our organization, creates one if not
   * 
   * If we can't create a role (422) and can't find one, we return a synthetic role
   * with just the practitioner reference - the practitioner exists in Halaxy and
   * that's enough for basic functionality.
   */
  async findOrCreatePractitionerRole(
    practitionerId: string,
    options: {
      specialties?: string[];
      locationId?: string;
    } = {}
  ): Promise<FHIRPractitionerRole> {
    const organizationId = this.config.organizationId;
    
    // First check if practitioner already has a role in our organization
    try {
      const existingRoles = await this.getPractitionerRolesByPractitioner(practitionerId);
      console.log(`[HalaxyClient] Found ${existingRoles.length} existing PractitionerRole(s) for ${practitionerId}`);
      
      if (existingRoles.length > 0) {
        // Check if any role is for our organization
        const roleInOurOrg = existingRoles.find(role => {
          const orgRef = role.organization?.reference;
          return orgRef && (orgRef === `Organization/${organizationId}` || orgRef.endsWith(`/${organizationId}`));
        });
        
        if (roleInOurOrg) {
          console.log(`[HalaxyClient] Found existing PractitionerRole in our org: ${roleInOurOrg.id}`);
          return roleInOurOrg;
        }
        
        // Return any existing role - better than failing
        console.log(`[HalaxyClient] Using existing PractitionerRole (different org): ${existingRoles[0].id}`);
        return existingRoles[0];
      }
    } catch (error) {
      console.log('[HalaxyClient] Error checking existing PractitionerRole:', error instanceof Error ? error.message : error);
    }

    // Try to create a new role, handle 422 gracefully (might already exist)
    try {
      return await this.createPractitionerRole(practitionerId, options);
    } catch (createError) {
      // If we get a 422, the role might already exist - try fetching again
      if (createError instanceof HalaxyApiError && createError.statusCode === 422) {
        console.log(`[HalaxyClient] Got 422 creating role, re-fetching existing roles...`);
        
        try {
          const existingRoles = await this.getPractitionerRolesByPractitioner(practitionerId);
          if (existingRoles.length > 0) {
            console.log(`[HalaxyClient] Using existing PractitionerRole: ${existingRoles[0].id}`);
            return existingRoles[0];
          }
        } catch (fetchError) {
          console.log('[HalaxyClient] Error re-fetching roles:', fetchError instanceof Error ? fetchError.message : fetchError);
        }
        
        // If we still can't find a role, create a synthetic one
        // The practitioner exists in Halaxy, which is the important part
        console.log(`[HalaxyClient] Creating synthetic PractitionerRole for ${practitionerId} (role creation blocked but practitioner exists)`);
        return {
          resourceType: 'PractitionerRole',
          id: `synthetic-${practitionerId}`,
          active: true,
          practitioner: {
            reference: `Practitioner/${practitionerId}`,
          },
          organization: {
            reference: `Organization/${organizationId}`,
          },
        } as FHIRPractitionerRole;
      }
      throw createError;
    }
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

    const data = await response.json() as T;
    // Log response ID only (avoid logging full response in production)
    const responseId = (data as { id?: string })?.id;
    console.log(`[HalaxyClient] Response from ${endpoint}${responseId ? ` - ID: ${responseId}` : ''}`);
    return data;
  }

  /**
   * Fetch only the first page of results (optimized for lookups)
   */
  private async getFirstPage<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const url = this.buildUrl(endpoint, params);
    const bundle = await this.request<FHIRBundle<T>>(
      url.replace(this.config.apiBaseUrl, '')
    );

    if (!bundle.entry) return [];
    
    return bundle.entry
      .filter(e => {
        const resource = e.resource as { id?: string };
        return resource && resource.id && typeof resource.id === 'string' && resource.id !== 'warning';
      })
      .map(e => e.resource);
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
