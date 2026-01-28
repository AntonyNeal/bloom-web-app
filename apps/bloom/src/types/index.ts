/**
 * Bloom Types - Barrel Export
 * 
 * Centralized type definitions for the Bloom application.
 * Import types from this file for consistency across the codebase.
 * 
 * @example
 * import type { 
 *   Application, 
 *   SessionFeedItem, 
 *   Practitioner,
 *   PractitionerDashboard 
 * } from '@/types';
 */

// =============================================================================
// Re-export all bloom types
// =============================================================================
export * from './bloom';

// =============================================================================
// Application Types
// =============================================================================

/**
 * Practitioner application data
 * Represents an application to join the Bloom network
 */
export interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ahpra_registration: string;
  experience_years: number;
  favorite_flower?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  cv_url: string;
  certificate_url: string;
  photo_url?: string;
  cover_letter: string;
  contract_url?: string | null;
  signed_contract_url?: string | null;
  offer_sent_at?: string | null;
  offer_accepted_at?: string | null;
  halaxy_practitioner_verified?: boolean;
  practitioner_id?: string | null;
  practitioner_role_id?: string | null;
  halaxy_verified_at?: string | null;
  qualification_type?: 'clinical' | 'experienced' | 'phd';
  qualification_check?: QualificationCheck;
  
  // Interview fields
  interview_analysis?: InterviewAnalysis | null;
  interview_notes?: string | null;
  interview_recommendation?: string | null;
  interview_analyzed_at?: string | null;
  scheduled_interview_time?: string | null;
  halaxy_appointment_id?: number | null;
  interview_token?: string | null;
}

/**
 * Qualification check responses from onboarding form
 */
export interface QualificationCheck {
  is_clinical_psychologist: boolean;
  has_phd: boolean;
  years_registered_ahpra: number;
}

/**
 * AI-generated interview analysis
 */
export interface InterviewAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
  clinicalKnowledge: { rating: number; notes: string };
  communicationSkills: { rating: number; notes: string };
  telehealthReadiness: { rating: number; notes: string };
  culturalFit: { rating: number; notes: string };
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  additionalNotes: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Application form data (before submission)
 */
export interface ApplicationFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ahpra_registration: string;
  specializations: string[];
  experience_years: number;
  cover_letter: string;
  favorite_flower: string;
  qualification_type?: 'clinical' | 'experienced' | 'phd';
  qualification_check?: QualificationCheck;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error type classification for UI handling
 */
export type ErrorType = 'network' | 'server' | 'auth' | 'validation' | null;

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
