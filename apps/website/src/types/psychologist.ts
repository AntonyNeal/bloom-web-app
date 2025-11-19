// TypeScript interfaces for Psychologist Recruitment Application

export interface PsychologistApplication {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;

  // AHPRA Credentials
  ahpraNumber: string;
  ahpraExpiry: string;
  qualifications: string;
  institution: string;
  graduationYear: number;
  medicareProviderNumber?: string; // Optional
  isRegisteredClinicalPsychologist?: boolean; // For qualification gate
  yearsRegisteredWithAHPRA?: number; // For qualification gate
  hasPhD?: boolean; // For qualification gate

  // Professional Experience
  yearsExperience: number; // Total years of experience
  yearsOfExperienceAdults?: number; // Years specifically working with adults
  specialties: string[];
  clientTypes?: string[];
  otherSpecialties?: string;
  motivation: string;

  // Work Preferences
  currentWeeklyClientHours: number;
  lookingToReplaceOrSupplement:
    | 'replace-all'
    | 'replace-some'
    | 'supplement'
    | 'just-exploring';
  preferredClientTypes: string[];
  currentEmploymentStatus: string;
  availableStartDate: string;

  // Telehealth Setup
  state: string;
  timezone: string;
  hasTelehealthExperience?: boolean;
  telehealthExperienceYears?: number;
  telehealthCapable?: boolean;
  preferredPlatforms?: string[];
  sessionTypes?: string[];
  availability?: {
    days?: string[];
    earliestTime?: string;
    latestTime?: string;
  };
  hasReliableInternet: boolean;
  hasQuietPrivateSpace: boolean;
  hasWebcamAndHeadset: boolean;
  willingToAcceptMedicare?: boolean;
  willingToAcceptPrivateOnly?: boolean;

  // Insurance & Compliance
  hasInsurance: boolean;
  insuranceProvider?: string;
  hasWorkingWithChildrenCheck: boolean;
  workingWithChildrenNumber?: string;
  preferredHourlyRate?: number;

  // Professional References
  reference1Name: string;
  reference1Email: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Email: string;
  reference2Relationship: string;

  // File Uploads
  cvFile?: File;
  ahpraCertificateFile?: File;
  insuranceCertificateFile?: File;

  // Consent & Legal
  privacyConsent: boolean;
  backgroundCheckConsent: boolean;

  // Metadata
  applicationId?: string;
  submittedAt?: Date;
}

// Validation error types for form validation
export interface ValidationErrors {
  [key: string]: string | undefined;
  // Explicit optional fields for clarity
  preferredHoursPerWeek?: string;
  currentWeeklyClientHours?: string;
  lookingToReplaceOrSupplement?: string;
}

// Specialty options for psychologists
export const PSYCHOLOGIST_SPECIALTIES = [
  'Anxiety & Depression',
  'ADHD',
  'Trauma & PTSD',
  'Relationship Counselling',
  'Child & Adolescent',
  'Grief & Loss',
  'Workplace Issues',
  'Perinatal Psychology',
  'Eating Disorders',
  'Addiction',
  'Other',
] as const;

export type PsychologistSpecialty = (typeof PSYCHOLOGIST_SPECIALTIES)[number];

// Work preference options
export const WORK_PREFERENCE_OPTIONS = [
  'replace-all',
  'replace-some',
  'supplement',
  'just-exploring',
] as const;

export type WorkPreferenceOption = (typeof WORK_PREFERENCE_OPTIONS)[number];

// Client type options
export const CLIENT_TYPE_OPTIONS = [
  'Children (0-12)',
  'Adolescents (13-17)',
  'Adults (18-64)',
  'Older Adults (65+)',
  'Couples',
  'Families',
  'Groups',
] as const;

export type ClientTypeOption = (typeof CLIENT_TYPE_OPTIONS)[number];

// Employment status options
export const EMPLOYMENT_STATUS_OPTIONS = [
  'employed-full-time',
  'employed-part-time',
  'self-employed',
  'seeking-work',
  'retired',
] as const;

export type EmploymentStatusOption = (typeof EMPLOYMENT_STATUS_OPTIONS)[number];

// Australian states/territories
export const AUSTRALIAN_STATES = [
  'NSW',
  'VIC',
  'QLD',
  'WA',
  'SA',
  'TAS',
  'ACT',
  'NT',
] as const;

export type AustralianState = (typeof AUSTRALIAN_STATES)[number];

// Timezones
export const TIMEZONE_OPTIONS = [
  'AEST (QLD, NSW, VIC, TAS)',
  'ACST (SA, NT)',
  'AWST (WA)',
  'AEDT (Summer in QLD, NSW, VIC, TAS)',
  'ACDT (Summer in SA, NT)',
  'AWDT (Summer in WA)',
] as const;

export type TimezoneOption = (typeof TIMEZONE_OPTIONS)[number];

// Telehealth platform options
export const TELEHEALTH_PLATFORMS = [
  'Zoom',
  'Microsoft Teams',
  'Google Meet',
  'Cisco Webex',
  'Skype',
  'Other',
] as const;

export type TelehealthPlatform = (typeof TELEHEALTH_PLATFORMS)[number];

// Session type options
export const SESSION_TYPES = [
  'Individual Therapy',
  'Couples Therapy',
  'Family Therapy',
  'Group Therapy',
  'Assessment/Evaluation',
  'Supervision',
  'Consultation',
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

// API Response types
export interface SasTokenResponse {
  sasUrl: string;
  expiresAt?: string;
}

export interface ApplicationSubmissionResponse {
  id: string;
  status: 'received' | 'pending' | 'reviewing';
  submittedAt: string;
  message?: string;
}
