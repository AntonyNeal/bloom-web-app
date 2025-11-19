/**
 * Database Entity Mappers
 * 
 * Utilities for converting between database entities and DTOs
 * Handles JSON serialization/deserialization and date conversions
 */

import type {
  ApplicationEntity,
  ApplicationDTO,
  ApplicationDetailDTO,
  ApplicationSubmission,
  ApplicationDocumentEntity,
  ApplicationDocumentDTO,
} from './database';

// ============================================================================
// Application Mappers
// ============================================================================

/**
 * Convert ApplicationEntity to ApplicationDTO (summary view)
 */
export function applicationEntityToDTO(entity: ApplicationEntity): ApplicationDTO {
  return {
    ApplicationID: entity.ApplicationID,
    FirstName: entity.FirstName,
    LastName: entity.LastName,
    Email: entity.Email,
    Phone: entity.Phone || undefined,
    AHPRANumber: entity.AHPRANumber,
    RegistrationType: entity.RegistrationType || undefined,
    YearsRegistered: entity.YearsRegistered || undefined,
    ApplicationStatus: entity.ApplicationStatus,
    SubmittedAt: ensureString(entity.SubmittedAt),
    ReviewedAt: entity.ReviewedAt ? ensureString(entity.ReviewedAt) : undefined,
    ReviewedBy: entity.ReviewedBy || undefined,
  };
}

/**
 * Convert ApplicationEntity to ApplicationDetailDTO (full view)
 */
export function applicationEntityToDetailDTO(
  entity: ApplicationEntity
): ApplicationDetailDTO {
  return {
    ...applicationEntityToDTO(entity),
    PreferredName: entity.PreferredName || undefined,
    IsPhDHolder: entity.IsPhDHolder,
    CurrentClientBase: entity.CurrentClientBase || undefined,
    Specializations: parseJsonArray(entity.Specializations),
    TherapeuticApproaches: parseJsonArray(entity.TherapeuticApproaches),
    AgeGroupsServed: parseJsonArray(entity.AgeGroupsServed),
    HasTelehealthExperience: entity.HasTelehealthExperience,
    PreferredHoursPerWeek: entity.PreferredHoursPerWeek || undefined,
    AvailabilityFlexibility: entity.AvailabilityFlexibility || undefined,
    EarliestStartDate: entity.EarliestStartDate
      ? ensureString(entity.EarliestStartDate)
      : undefined,
    InsuranceProvider: entity.InsuranceProvider || undefined,
    InsurancePolicyNumber: entity.InsurancePolicyNumber || undefined,
    InsuranceCoverageAmount: entity.InsuranceCoverageAmount || undefined,
    InsuranceExpiryDate: entity.InsuranceExpiryDate
      ? ensureString(entity.InsuranceExpiryDate)
      : undefined,
    Reference1Name: entity.Reference1Name || undefined,
    Reference1Relationship: entity.Reference1Relationship || undefined,
    Reference1Contact: entity.Reference1Contact || undefined,
    Reference2Name: entity.Reference2Name || undefined,
    Reference2Relationship: entity.Reference2Relationship || undefined,
    Reference2Contact: entity.Reference2Contact || undefined,
    AdditionalNotes: entity.AdditionalNotes || undefined,
    ReviewNotes: entity.ReviewNotes || undefined,
  };
}

/**
 * Convert ApplicationSubmission to partial ApplicationEntity (for INSERT)
 */
export function submissionToEntity(
  submission: ApplicationSubmission
): Omit<ApplicationEntity, 'ApplicationID' | 'SubmittedAt'> {
  return {
    FirstName: submission.FirstName,
    LastName: submission.LastName,
    PreferredName: submission.PreferredName || null,
    Email: submission.Email,
    Phone: submission.Phone || null,
    AHPRANumber: submission.AHPRANumber,
    RegistrationType: submission.RegistrationType || null,
    YearsRegistered: submission.YearsRegistered || null,
    IsPhDHolder: submission.IsPhDHolder,
    CurrentClientBase: submission.CurrentClientBase || null,
    Specializations: stringifyJsonArray(submission.Specializations),
    TherapeuticApproaches: stringifyJsonArray(submission.TherapeuticApproaches),
    AgeGroupsServed: stringifyJsonArray(submission.AgeGroupsServed),
    HasTelehealthExperience: submission.HasTelehealthExperience,
    PreferredHoursPerWeek: submission.PreferredHoursPerWeek || null,
    AvailabilityFlexibility: submission.AvailabilityFlexibility || null,
    EarliestStartDate: submission.EarliestStartDate || null,
    InsuranceProvider: submission.InsuranceProvider || null,
    InsurancePolicyNumber: submission.InsurancePolicyNumber || null,
    InsuranceCoverageAmount: submission.InsuranceCoverageAmount || null,
    InsuranceExpiryDate: submission.InsuranceExpiryDate || null,
    Reference1Name: submission.Reference1Name || null,
    Reference1Relationship: submission.Reference1Relationship || null,
    Reference1Contact: submission.Reference1Contact || null,
    Reference2Name: submission.Reference2Name || null,
    Reference2Relationship: submission.Reference2Relationship || null,
    Reference2Contact: submission.Reference2Contact || null,
    AdditionalNotes: submission.AdditionalNotes || null,
    ApplicationStatus: 'Submitted',
    ReviewedAt: null,
    ReviewedBy: null,
    ReviewNotes: null,
  };
}

// ============================================================================
// Document Mappers
// ============================================================================

/**
 * Convert ApplicationDocumentEntity to ApplicationDocumentDTO
 */
export function documentEntityToDTO(
  entity: ApplicationDocumentEntity
): ApplicationDocumentDTO {
  return {
    DocumentID: entity.DocumentID,
    DocumentType: entity.DocumentType,
    FileName: entity.FileName,
    BlobName: entity.BlobName,
    FileSize: entity.FileSize,
    UploadedAt: ensureString(entity.UploadedAt),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse JSON array string to array, or return undefined
 */
function parseJsonArray(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Stringify array to JSON, or return null
 */
function stringifyJsonArray(value: string[] | undefined): string | null {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return JSON.stringify(value);
}

/**
 * Ensure value is a string (convert Date to ISO string)
 */
function ensureString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

/**
 * Ensure value is a Date (parse string to Date)
 */
export function ensureDate(value: Date | string): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

// ============================================================================
// SQL Query Builders
// ============================================================================

/**
 * Build SQL WHERE clause for application filters
 */
export function buildApplicationWhereClause(filters: {
  status?: string;
  submittedAfter?: string;
  submittedBefore?: string;
  searchTerm?: string;
}): { whereClause: string; parameters: Record<string, any> } {
  const conditions: string[] = [];
  const parameters: Record<string, any> = {};

  if (filters.status) {
    conditions.push('ApplicationStatus = @status');
    parameters.status = filters.status;
  }

  if (filters.submittedAfter) {
    conditions.push('SubmittedAt >= @submittedAfter');
    parameters.submittedAfter = filters.submittedAfter;
  }

  if (filters.submittedBefore) {
    conditions.push('SubmittedAt <= @submittedBefore');
    parameters.submittedBefore = filters.submittedBefore;
  }

  if (filters.searchTerm) {
    conditions.push(
      '(FirstName LIKE @searchTerm OR LastName LIKE @searchTerm OR Email LIKE @searchTerm OR AHPRANumber LIKE @searchTerm)'
    );
    parameters.searchTerm = `%${filters.searchTerm}%`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { whereClause, parameters };
}

/**
 * Build SQL column list for INSERT statement
 */
export function buildInsertColumns(
  data: Record<string, any>
): { columns: string; values: string; parameters: Record<string, any> } {
  const columns: string[] = [];
  const values: string[] = [];
  const parameters: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      columns.push(key);
      values.push(`@${key}`);
      parameters[key] = value;
    }
  });

  return {
    columns: columns.join(', '),
    values: values.join(', '),
    parameters,
  };
}

/**
 * Build SQL SET clause for UPDATE statement
 */
export function buildUpdateSetClause(
  data: Record<string, any>
): { setClause: string; parameters: Record<string, any> } {
  const setClauses: string[] = [];
  const parameters: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      setClauses.push(`${key} = @${key}`);
      parameters[key] = value;
    }
  });

  return {
    setClause: setClauses.join(', '),
    parameters,
  };
}
