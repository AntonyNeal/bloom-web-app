export interface Application {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  AHPRANumber: string;
  RegistrationType: string;
  YearsRegistered: number;
  ApplicationStatus: 'Received' | 'Reviewed' | 'Approved' | 'Rejected';
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
}

export interface ApplicationDocument {
  DocumentID: string;
  DocumentType: string;
  FileName: string;
  BlobName: string;
  FileSize: number;
  UploadedAt: string;
}

const BASE_URL = import.meta.env.VITE_AZURE_FUNCTIONS_URL;

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

  async getDocumentUrl(blobName: string): Promise<{ downloadUrl: string; expiresAt: string }> {
    return apiRequest<{ downloadUrl: string; expiresAt: string }>(
      `/api/applications/documents/url?blobName=${encodeURIComponent(blobName)}`
    );
  },
};