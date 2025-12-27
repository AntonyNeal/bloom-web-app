"use strict";
/**
 * Halaxy API Client
 *
 * FHIR-R4 compliant client for Halaxy's Practice Management API.
 * Handles authentication, pagination, and rate limiting.
 *
 * API Documentation: https://developer.halaxy.com/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HalaxyApiError = exports.HalaxyClient = void 0;
exports.getHalaxyClient = getHalaxyClient;
const token_manager_1 = require("./token-manager");
/**
 * Halaxy FHIR API Client
 *
 * Provides methods to fetch practitioners, patients, and appointments
 * from Halaxy's FHIR-R4 compliant API.
 */
class HalaxyClient {
    constructor(config) {
        this.requestCount = 0;
        this.requestWindowStart = Date.now();
        const defaultConfig = (0, token_manager_1.getHalaxyConfig)();
        this.config = { ...defaultConfig, ...config };
    }
    /**
     * Get the API base URL (for debugging)
     */
    getApiBaseUrl() {
        return this.config.apiBaseUrl;
    }
    // ===========================================================================
    // Practitioner Endpoints
    // ===========================================================================
    /**
     * Get a single practitioner by ID
     */
    async getPractitioner(practitionerId) {
        return this.request(`/Practitioner/${practitionerId}`);
    }
    /**
     * Get practitioner role (links practitioner to organization)
     */
    async getPractitionerRole(roleId) {
        return this.request(`/PractitionerRole/${roleId}`);
    }
    /**
     * Get all practitioner roles for the organization
     * This returns all practitioner-to-clinic associations
     */
    async getAllPractitionerRoles() {
        return this.getAllPages('/PractitionerRole', {});
    }
    /**
     * Get practitioner roles for a specific practitioner
     */
    async getPractitionerRolesByPractitioner(practitionerId) {
        return this.getAllPages('/PractitionerRole', {
            practitioner: `Practitioner/${practitionerId}`,
        });
    }
    /**
     * Get all practitioners for the organization
     */
    async getAllPractitioners() {
        return this.getAllPages('/Practitioner', {
            active: 'true',
        });
    }
    // ===========================================================================
    // Patient Endpoints
    // ===========================================================================
    /**
     * Get a single patient by ID
     */
    async getPatient(patientId) {
        return this.request(`/Patient/${patientId}`);
    }
    /**
     * Get all patients for a specific practitioner
     * Note: Halaxy API expects format Practitioner/{numericId} for general-practitioner queries
     */
    async getPatientsByPractitioner(practitionerId) {
        // Extract numeric ID - remove PR- or EP- prefix if present
        const numericId = practitionerId.replace(/^(PR|EP)-/, '');
        // Format as Practitioner/{numericId} as per error message guidance
        return this.getAllPages('/Patient', {
            'general-practitioner': `Practitioner/${numericId}`,
            active: 'true',
        });
    }
    /**
     * Get all active patients
     */
    async getAllPatients() {
        return this.getAllPages('/Patient', {
            active: 'true',
        });
    }
    /**
     * Export patient IDs - returns list of patient references the user can access
     */
    async exportPatientIds() {
        var _a;
        const response = await this.request('/Patient/$export-ids');
        return ((_a = response.parameter) === null || _a === void 0 ? void 0 : _a.map(p => { var _a; return (_a = p.valueReference) === null || _a === void 0 ? void 0 : _a.reference; }).filter(Boolean)) || [];
    }
    /**
     * Search patients by name
     */
    async searchPatients(query) {
        return this.getAllPages('/Patient', {
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
    async getAppointment(appointmentId) {
        return this.request(`/Appointment/${appointmentId}`);
    }
    /**
     * Get appointments for a practitioner within a date range
     *
     * @param practitionerId - Halaxy practitioner ID
     * @param startDate - Start of date range
     * @param endDate - End of date range
     * @param statuses - Filter by appointment statuses (optional)
     */
    async getAppointmentsByPractitioner(practitionerId, startDate, endDate, statuses) {
        // Try with full URL reference format as shown in Halaxy booking recipe
        const fullRef = `https://au-api.halaxy.com/main/PractitionerRole/${practitionerId}`;
        const params = {
            actor: fullRef,
            date: `ge${formatDate(startDate)}`,
            'date:lt': formatDate(endDate),
        };
        if (statuses && statuses.length > 0) {
            params.status = statuses.join(',');
        }
        return this.getAllPages('/Appointment', params);
    }
    /**
     * Get today's appointments for a practitioner
     */
    async getTodaysAppointments(practitionerId) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        return this.getAppointmentsByPractitioner(practitionerId, startOfDay, endOfDay);
    }
    /**
     * Get appointments for a specific patient
     */
    async getAppointmentsByPatient(patientId) {
        return this.getAllPages('/Appointment', {
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
    async getAllSchedules() {
        return this.getAllPages('/Schedule', {});
    }
    /**
     * Get a single schedule by ID
     */
    async getSchedule(scheduleId) {
        return this.request(`/Schedule/${scheduleId}`);
    }
    /**
     * Get schedules for a specific practitioner
     */
    async getSchedulesByPractitioner(practitionerId) {
        return this.getAllPages('/Schedule', {
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
    async getAllAvailableSlots(startDate, endDate, status = 'free') {
        // Use FHIR date prefix format: ge2024-01-01T00:00:00Z
        return this.getAllPages('/Slot', {
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
    async getAvailableSlots(practitionerId, startDate, endDate, status = 'free') {
        // Use reference format from Halaxy docs: Practitioner/PR-12345
        return this.getAllPages('/Slot', {
            practitioner: `Practitioner/${practitionerId}`,
            start: `ge${startDate.toISOString()}`,
            end: `le${endDate.toISOString()}`,
            status: status,
        });
    }
    /**
     * Get slots by practitioner-role (for a specific clinic location)
     */
    async getSlotsByPractitionerRole(practitionerRoleId, startDate, endDate, status = 'free') {
        return this.getAllPages('/Slot', {
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
    async findAvailableAppointments(startDate, endDate, durationMinutes, practitionerId, practitionerRoleId, organizationId, applyBufferTime = false, emergency = false) {
        var _a;
        const params = {
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
        const response = await this.request(url.replace(this.config.apiBaseUrl, ''));
        const slots = ((_a = response.entry) === null || _a === void 0 ? void 0 : _a.map(e => e.resource)) || [];
        console.log(`[HalaxyClient] findAvailableAppointments returned ${slots.length} slots`);
        return slots;
    }
    /**
     * Get a single slot by ID
     */
    async getSlot(slotId) {
        return this.request(`/Slot/${slotId}`);
    }
    // ===========================================================================
    // Patient/Appointment Creation (Booking)
    // ===========================================================================
    /**
     * Create or find a patient in Halaxy
     */
    async createOrFindPatient(patientData) {
        const startTime = Date.now();
        // First try to find existing patient by email (limit to first page for speed)
        try {
            const existing = await this.getFirstPage('/Patient', {
                email: patientData.email,
                _count: '1', // Only need to find one match
            });
            console.log(`[HalaxyClient] Patient lookup took ${Date.now() - startTime}ms`);
            // Filter out any invalid patient IDs (like 'warning' from FHIR OperationOutcome)
            const validPatients = existing.filter(p => p.id &&
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
        }
        catch (error) {
            console.log('[HalaxyClient] No existing patient found, creating new');
        }
        // Create new patient
        console.log('[HalaxyClient] Creating new patient...');
        // Format phone number to international format (+61...)
        let formattedPhone;
        if (patientData.phone) {
            // Remove all spaces
            let phone = patientData.phone.replace(/\s/g, '');
            // Convert Australian numbers starting with 0 to +61 format
            if (phone.startsWith('0')) {
                phone = '+61' + phone.substring(1);
            }
            else if (!phone.startsWith('+')) {
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
        const newPatient = await this.request('/Patient', {
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
    async createAppointment(appointmentData) {
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
                        minutesDuration: Math.round((new Date(appointmentData.end).getTime() - new Date(appointmentData.start).getTime()) / 60000),
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
        return this.request('/Appointment/$book', {
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
    async request(endpoint, options = {}) {
        await this.checkRateLimit();
        const token = await (0, token_manager_1.getAccessToken)();
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
            (0, token_manager_1.invalidateToken)();
            const newToken = await (0, token_manager_1.getAccessToken)();
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
                throw new HalaxyApiError(`Halaxy API error: ${retryResponse.status} ${retryResponse.statusText}`, retryResponse.status, await retryResponse.text());
            }
            return retryResponse.json();
        }
        if (!response.ok) {
            throw new HalaxyApiError(`Halaxy API error: ${response.status} ${response.statusText}`, response.status, await response.text());
        }
        const data = await response.json();
        // Log response ID only (avoid logging full response in production)
        const responseId = data === null || data === void 0 ? void 0 : data.id;
        console.log(`[HalaxyClient] Response from ${endpoint}${responseId ? ` - ID: ${responseId}` : ''}`);
        return data;
    }
    /**
     * Fetch only the first page of results (optimized for lookups)
     */
    async getFirstPage(endpoint, params = {}) {
        const url = this.buildUrl(endpoint, params);
        const bundle = await this.request(url.replace(this.config.apiBaseUrl, ''));
        if (!bundle.entry)
            return [];
        return bundle.entry
            .filter(e => {
            const resource = e.resource;
            return resource && resource.id && typeof resource.id === 'string' && resource.id !== 'warning';
        })
            .map(e => e.resource);
    }
    /**
     * Fetch all pages of a paginated endpoint
     */
    async getAllPages(endpoint, params = {}) {
        var _a;
        const results = [];
        let nextUrl = this.buildUrl(endpoint, params);
        while (nextUrl) {
            const bundle = await this.request(nextUrl.replace(this.config.apiBaseUrl, ''));
            if (bundle.entry) {
                // Filter out entries without valid resources (Halaxy sometimes returns warning entries)
                const validResources = bundle.entry
                    .filter(e => {
                    const resource = e.resource;
                    return resource && resource.id && typeof resource.id === 'string' && resource.id !== 'warning';
                })
                    .map(e => e.resource);
                results.push(...validResources);
            }
            // Find next page link
            const nextLink = (_a = bundle.link) === null || _a === void 0 ? void 0 : _a.find(l => l.relation === 'next');
            nextUrl = (nextLink === null || nextLink === void 0 ? void 0 : nextLink.url) || null;
        }
        return results;
    }
    /**
     * Build URL with query parameters
     */
    buildUrl(endpoint, params) {
        const url = new URL(`${this.config.apiBaseUrl}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        return url.toString();
    }
    /**
     * Simple rate limiting check
     */
    async checkRateLimit() {
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
exports.HalaxyClient = HalaxyClient;
/**
 * Custom error class for Halaxy API errors
 */
class HalaxyApiError extends Error {
    constructor(message, statusCode, responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.name = 'HalaxyApiError';
    }
}
exports.HalaxyApiError = HalaxyApiError;
/**
 * Format date for FHIR API queries (YYYY-MM-DD)
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
// Export singleton instance for convenience
let clientInstance = null;
function getHalaxyClient() {
    if (!clientInstance) {
        clientInstance = new HalaxyClient();
    }
    return clientInstance;
}
//# sourceMappingURL=client.js.map