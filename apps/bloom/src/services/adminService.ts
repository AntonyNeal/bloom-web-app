// Application types (defined inline since @shared/types package doesn't exist)
// Note: Property names match Cosmos DB document structure (PascalCase)
export interface ApplicationDTO {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  RegistrationType?: string;
  YearsRegistered?: number;
  ApplicationStatus: string;
  SubmittedAt: string;
  ReviewedAt?: string;
  ReviewedBy?: string;
}

export interface ApplicationDetailDTO extends ApplicationDTO {
  AHPRANumber?: string;
  IsPhDHolder?: boolean;
  HasTelehealthExperience?: boolean;
  PreferredHoursPerWeek?: number;
  InsuranceProvider?: string;
  InsurancePolicyNumber?: string;
  Specializations?: string;
  TherapeuticApproaches?: string;
  AgeGroupsServed?: string;
  Reference1Name?: string;
  Reference1Relationship?: string;
  Reference1Contact?: string;
  Reference2Name?: string;
  Reference2Relationship?: string;
  Reference2Contact?: string;
  ReviewNotes?: string;
}

export interface ApplicationDocumentDTO {
  DocumentID: string;
  ApplicationID: string;
  DocumentType: string;
  BlobName: string;
  FileName: string;
  UploadedAt: string;
}

const BASE_URL = import.meta.env.VITE_AZURE_FUNCTIONS_URL;

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
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
  async listApplications(status?: string): Promise<{ applications: ApplicationDTO[] }> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest<{ applications: ApplicationDTO[] }>(`/api/applications${query}`);
  },

  async getApplicationDetail(id: string): Promise<{ application: ApplicationDetailDTO; documents: ApplicationDocumentDTO[] }> {
    return apiRequest<{ application: ApplicationDetailDTO; documents: ApplicationDocumentDTO[] }>(`/api/applications/${id}`);
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

// Re-export types for backward compatibility
export type { ApplicationDTO as Application, ApplicationDetailDTO as ApplicationDetail, ApplicationDocumentDTO as ApplicationDocument };