/**
 * Halaxy API Client for Container Apps Worker
 * 
 * FHIR-R4 compliant client for Halaxy's Practice Management API.
 */

import { config } from '../config';
import { trackDependency } from '../telemetry';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Halaxy FHIR API Client
 */
export class HalaxyClient {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshToken: string;

  constructor() {
    this.refreshToken = config.halaxyRefreshToken;
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  private async ensureValidToken(): Promise<string> {
    // Check if token is still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
      return this.accessToken;
    }

    console.log('[HalaxyClient] Refreshing access token');

    const response = await fetch(`${config.halaxyApiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.halaxyClientId,
        client_secret: config.halaxyClientSecret,
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    
    // Update refresh token if a new one was provided
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }

    console.log('[HalaxyClient] Token refreshed successfully');
    return this.accessToken;
  }

  // ============================================================================
  // HTTP Request Wrapper
  // ============================================================================

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.ensureValidToken();
    const url = `${config.halaxyFhirUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
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
      url = nextLink?.url?.replace(config.halaxyFhirUrl, '') || '';
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
    return this.getAllPages<FHIRAppointment>('/Appointment', {
      actor: `Practitioner/${practitionerId}`,
      date: `ge${startDate.toISOString().split('T')[0]}`,
      'date:lt': endDate.toISOString().split('T')[0],
    });
  }
}

// ============================================================================
// FHIR Types
// ============================================================================

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

interface FHIRAppointment {
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
