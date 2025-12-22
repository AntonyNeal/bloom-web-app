// Application status type - includes new workflow statuses
export type ApplicationStatus = 
  | 'Received'           // Initial submission
  | 'Reviewed'           // Under review (legacy)
  | 'Denied'             // Application denied
  | 'Waitlisted'         // On waitlist for future positions
  | 'Interview Scheduled' // Interview has been scheduled
  | 'Accepted'           // Application accepted, pending onboarding
  | 'Approved'           // Legacy status
  | 'Rejected';          // Legacy status

export interface Application {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  AHPRANumber: string;
  RegistrationType: string;
  YearsRegistered: number;
  ApplicationStatus: ApplicationStatus;
  SubmittedAt: string;
  ReviewedAt?: string;
  ReviewedBy?: string;
}

export interface ApplicationDetail extends Application {
  PreferredName?: string;
  IsPhDHolder: boolean;
  CurrentClientBase?: number;
  Specializations?: string;
  TherapeuticApproaches?: string;
  AgeGroupsServed?: string;
  HasTelehealthExperience: boolean;
  PreferredHoursPerWeek?: number;
  AvailabilityFlexibility?: string;
  EarliestStartDate?: string;
  InsuranceProvider?: string;
  InsurancePolicyNumber?: string;
  InsuranceCoverageAmount?: number;
  InsuranceExpiryDate?: string;
  Reference1Name?: string;
  Reference1Relationship?: string;
  Reference1Contact?: string;
  Reference2Name?: string;
  Reference2Relationship?: string;
  Reference2Contact?: string;
  AdditionalNotes?: string;
  ReviewNotes?: string;
  // New review workflow fields
  AdminNotes?: string;              // Admin notes/comments for review decisions
  InterviewScheduledAt?: string;    // Date/time of scheduled interview
  InterviewNotes?: string;          // Notes from interview
  DecisionReason?: string;          // Reason for decision (deny/waitlist/accept)
  WaitlistedAt?: string;            // When application was waitlisted
  AcceptedAt?: string;              // When application was accepted
  ContractUrl?: string;             // URL to uploaded practitioner agreement PDF
}

export interface ApplicationDocument {
  DocumentID: string;
  DocumentType: string;
  FileName: string;
  BlobName: string;
  FileSize: number;
  UploadedAt: string;
}

// Use VITE_AZURE_FUNCTIONS_URL for root URL (e.g., https://bloom-functions-dev.azurewebsites.net)
// Endpoints already include /api prefix, so no need for VITE_API_URL here
const BASE_URL = import.meta.env.VITE_AZURE_FUNCTIONS_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || '';

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  console.log('API Request URL:', url);
  console.log('Base URL from env:', BASE_URL);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const adminService = {
  async listApplications(status?: string): Promise<{ applications: Application[] }> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest<{ applications: Application[] }>(`/api/applications${query}`);
  },

  async getApplicationDetail(id: string): Promise<{ application: ApplicationDetail; documents: ApplicationDocument[] }> {
    return apiRequest<{ application: ApplicationDetail; documents: ApplicationDocument[] }>(`/api/applications/${id}`);
  },

  async updateStatus(
    id: string,
    status: string,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/api/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewedBy, reviewNotes }),
    });
  },

  /**
   * Update application with full workflow support
   * Supports all new status fields: admin_notes, interview scheduling, decision reasons
   */
  async updateApplication(
    id: string,
    updates: {
      status: string;
      reviewed_by?: string;
      admin_notes?: string;
      interview_scheduled_at?: string;
      interview_notes?: string;
      decision_reason?: string;
    }
  ): Promise<ApplicationDetail> {
    return apiRequest<ApplicationDetail>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getDocumentUrl(blobName: string): Promise<{ downloadUrl: string; expiresAt: string }> {
    return apiRequest<{ downloadUrl: string; expiresAt: string }>(
      `/api/applications/documents/url?blobName=${encodeURIComponent(blobName)}`
    );
  },
};