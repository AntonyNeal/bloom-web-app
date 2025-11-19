/**
 * Database Models and Interfaces
 * 
 * Centralized type definitions that match the database schema
 * These types are shared across all applications and the migration system
 */

// ============================================================================
// Applications Table (Azure SQL Database)
// ============================================================================

/**
 * Application entity - matches the Applications table schema
 * This is the base interface for psychologist applications
 */
export interface ApplicationEntity {
  ApplicationID: string; // UNIQUEIDENTIFIER (GUID)
  FirstName: string;
  LastName: string;
  PreferredName?: string | null;
  Email: string;
  Phone?: string | null;
  AHPRANumber: string;
  RegistrationType?: string | null;
  YearsRegistered?: number | null;
  IsPhDHolder: boolean;
  CurrentClientBase?: number | null;
  Specializations?: string | null; // JSON array stored as string
  TherapeuticApproaches?: string | null; // JSON array stored as string
  AgeGroupsServed?: string | null; // JSON array stored as string
  HasTelehealthExperience: boolean;
  PreferredHoursPerWeek?: number | null;
  AvailabilityFlexibility?: string | null;
  EarliestStartDate?: Date | string | null;
  InsuranceProvider?: string | null;
  InsurancePolicyNumber?: string | null;
  InsuranceCoverageAmount?: number | null;
  InsuranceExpiryDate?: Date | string | null;
  Reference1Name?: string | null;
  Reference1Relationship?: string | null;
  Reference1Contact?: string | null;
  Reference2Name?: string | null;
  Reference2Relationship?: string | null;
  Reference2Contact?: string | null;
  AdditionalNotes?: string | null;
  ApplicationStatus: ApplicationStatus;
  SubmittedAt: Date | string;
  ReviewedAt?: Date | string | null;
  ReviewedBy?: string | null;
  ReviewNotes?: string | null;
}

/**
 * Application status enum
 */
export type ApplicationStatus =
  | 'Submitted'
  | 'Received'
  | 'Under Review'
  | 'Reviewed'
  | 'Approved'
  | 'Rejected'
  | 'Pending';

/**
 * Application DTO for API responses (simplified view)
 */
export interface ApplicationDTO {
  ApplicationID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  AHPRANumber: string;
  RegistrationType?: string;
  YearsRegistered?: number;
  ApplicationStatus: ApplicationStatus;
  SubmittedAt: string;
  ReviewedAt?: string;
  ReviewedBy?: string;
}

/**
 * Application detail DTO for full application view
 */
export interface ApplicationDetailDTO extends ApplicationDTO {
  PreferredName?: string;
  IsPhDHolder: boolean;
  CurrentClientBase?: number;
  Specializations?: string[];
  TherapeuticApproaches?: string[];
  AgeGroupsServed?: string[];
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

/**
 * Application submission payload (for creating new applications)
 */
export interface ApplicationSubmission {
  FirstName: string;
  LastName: string;
  PreferredName?: string;
  Email: string;
  Phone?: string;
  AHPRANumber: string;
  RegistrationType?: string;
  YearsRegistered?: number;
  IsPhDHolder: boolean;
  CurrentClientBase?: number;
  Specializations?: string[];
  TherapeuticApproaches?: string[];
  AgeGroupsServed?: string[];
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
}

/**
 * Application status update payload
 */
export interface ApplicationStatusUpdate {
  status: ApplicationStatus;
  reviewedBy: string;
  reviewNotes?: string;
}

// ============================================================================
// Application Documents (Azure Blob Storage references)
// ============================================================================

/**
 * Document metadata entity
 */
export interface ApplicationDocumentEntity {
  DocumentID: string;
  ApplicationID: string;
  DocumentType: string;
  FileName: string;
  BlobName: string;
  FileSize: number;
  ContentType: string;
  UploadedAt: Date | string;
}

/**
 * Document DTO for API responses
 */
export interface ApplicationDocumentDTO {
  DocumentID: string;
  DocumentType: string;
  FileName: string;
  BlobName: string;
  FileSize: number;
  UploadedAt: string;
}

// ============================================================================
// A/B Testing (Cosmos DB)
// ============================================================================

/**
 * A/B Test Event entity (Cosmos DB)
 */
export interface ABTestEventEntity {
  id: string; // Cosmos DB document id
  sessionId: string; // Partition key
  variant: 'unified' | 'minimal';
  eventType: 'allocation' | 'page_view' | 'interaction' | 'conversion';
  eventData?: Record<string, any>;
  timestamp: Date | string;
  userAgent?: string;
  _ts?: number; // Cosmos DB system timestamp
}

/**
 * A/B Test Metadata entity (Cosmos DB)
 */
export interface ABTestMetadataEntity {
  id: string; // Cosmos DB document id
  testName: string;
  variant: 'unified' | 'minimal';
  allocationRatio: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _ts?: number; // Cosmos DB system timestamp
}

// ============================================================================
// Database Migration Types
// ============================================================================

/**
 * Database changelog record (for tracking migrations)
 */
export interface DatabaseChangeLogEntity {
  Id: string;
  Description: string;
  Timestamp: Date | string;
  Author: string;
  ExecutedAt: Date | string;
  ExecutionTime: number;
  Checksum: string;
  Status: 'success' | 'failed' | 'running';
  ErrorMessage?: string | null;
}

// ============================================================================
// Query Filter Types
// ============================================================================

/**
 * Application query filters
 */
export interface ApplicationFilters {
  status?: ApplicationStatus;
  submittedAfter?: string;
  submittedBefore?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ApplicationEntity
 */
export function isApplicationEntity(obj: any): obj is ApplicationEntity {
  return (
    obj &&
    typeof obj.ApplicationID === 'string' &&
    typeof obj.FirstName === 'string' &&
    typeof obj.LastName === 'string' &&
    typeof obj.Email === 'string' &&
    typeof obj.AHPRANumber === 'string' &&
    typeof obj.ApplicationStatus === 'string'
  );
}

/**
 * Type guard for ApplicationStatus
 */
export function isApplicationStatus(status: string): status is ApplicationStatus {
  return [
    'Submitted',
    'Received',
    'Under Review',
    'Reviewed',
    'Approved',
    'Rejected',
    'Pending',
  ].includes(status);
}
