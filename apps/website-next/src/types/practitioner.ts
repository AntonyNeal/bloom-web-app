/**
 * Public Practitioner Types
 * 
 * Types for practitioner data displayed on the public website.
 * These match the API response from /api/public/practitioners
 */

export interface PublicPractitioner {
  id: string;
  slug: string;
  displayName: string;
  firstName: string;
  headline: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  qualifications: string | null;
  specializations: string[];
  areasOfFocus: string[];
  therapyApproaches: string[];
  languages: string[];
  sessionTypes: string[];
  experienceYears: number | null;
  acceptingNewClients: boolean;
  medicareProvider: boolean;
  ndisRegistered: boolean;
}

export interface PractitionersResponse {
  success: boolean;
  practitioners?: PublicPractitioner[];
  practitioner?: PublicPractitioner;
  count?: number;
  error?: string;
}
