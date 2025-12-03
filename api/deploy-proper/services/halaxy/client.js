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
     */
    async getPatientsByPractitioner(practitionerId) {
        return this.getAllPages('/Patient', {
            'general-practitioner': `Practitioner/${practitionerId}`,
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
        const params = {
            actor: `Practitioner/${practitionerId}`,
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
    // Request Helpers
    // ===========================================================================
    /**
     * Make an authenticated request to the Halaxy API
     */
    async request(endpoint, options = {}) {
        await this.checkRateLimit();
        const token = await (0, token_manager_1.getAccessToken)();
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
        return response.json();
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
                results.push(...bundle.entry.map(e => e.resource));
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