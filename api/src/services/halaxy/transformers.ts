/**
 * Halaxy Entity Transformers
 * 
 * Transform FHIR-R4 resources from Halaxy API to Bloom database entities.
 * Handles data mapping, normalization, and validation.
 */

import {
  FHIRPractitioner,
  FHIRPatient,
  FHIRAppointment,
  Practitioner,
  Client,
  Session,
  SessionStatus,
} from './types';

// =============================================================================
// Practitioner Transformer
// =============================================================================

/**
 * Transform FHIR Practitioner to Bloom Practitioner entity
 */
export function transformPractitioner(
  fhir: FHIRPractitioner,
  existingId?: string
): Omit<Practitioner, 'createdAt' | 'updatedAt'> {
  const primaryName = fhir.name?.[0];
  const firstName = primaryName?.given?.[0] || '';
  const lastName = primaryName?.family || '';

  return {
    id: existingId || generateUUID(),
    halaxyPractitionerId: fhir.id,
    halaxyPractitionerRoleId: undefined, // Set separately from PractitionerRole
    firstName,
    lastName,
    displayName: buildDisplayName(primaryName),
    email: getTelecom(fhir.telecom, 'email') || '',
    phone: getTelecom(fhir.telecom, 'phone'),
    qualifications: extractQualifications(fhir),
    specialty: extractSpecialty(fhir),
    isActive: fhir.active !== false,
    lastSyncedAt: new Date(),
  };
}

// =============================================================================
// Client (Patient) Transformer
// =============================================================================

/**
 * Transform FHIR Patient to Bloom Client entity
 */
export function transformPatient(
  fhir: FHIRPatient,
  practitionerId: string,
  existingId?: string,
  sessionCount?: number
): Omit<Client, 'createdAt' | 'updatedAt'> {
  const primaryName = fhir.name?.[0];
  const firstName = primaryName?.given?.[0] || '';
  const lastName = primaryName?.family || '';

  return {
    id: existingId || generateUUID(),
    halaxyPatientId: fhir.id,
    practitionerId,
    firstName,
    lastName,
    initials: buildInitials(firstName, lastName),
    email: getTelecom(fhir.telecom, 'email'),
    phone: getTelecom(fhir.telecom, 'phone'),
    dateOfBirth: fhir.birthDate ? new Date(fhir.birthDate) : undefined,
    // MHCP defaults - these may be updated from Halaxy extensions or invoices
    mhcpTotalSessions: getMhcpTotalFromExtensions(fhir) || 10,
    mhcpUsedSessions: sessionCount || 0,
    mhcpPlanStartDate: getMhcpDateFromExtensions(fhir, 'plan-start'),
    mhcpPlanExpiryDate: getMhcpDateFromExtensions(fhir, 'plan-expiry'),
    // Relationship tracking
    firstSessionDate: undefined, // Set from appointments
    presentingIssues: getExtensionValue(fhir.extension, 'presenting-issues'),
    isActive: fhir.active !== false,
    lastSyncedAt: new Date(),
  };
}

// =============================================================================
// Session (Appointment) Transformer
// =============================================================================

/**
 * Transform FHIR Appointment to Bloom Session entity
 */
export function transformAppointment(
  fhir: FHIRAppointment,
  practitionerId: string,
  clientId: string,
  sessionNumber: number,
  existingId?: string
): Omit<Session, 'createdAt' | 'updatedAt'> {
  return {
    id: existingId || generateUUID(),
    halaxyAppointmentId: fhir.id,
    practitionerId,
    clientId,
    scheduledStartTime: new Date(fhir.start),
    scheduledEndTime: new Date(fhir.end),
    actualStartTime: getActualTime(fhir, 'start'),
    actualEndTime: getActualTime(fhir, 'end'),
    sessionNumber,
    status: mapAppointmentStatus(fhir.status),
    sessionType: extractSessionType(fhir),
    notes: fhir.comment || fhir.description,
    fee: extractFee(fhir),
    feeCurrency: 'AUD',
    isPaid: extractPaymentStatus(fhir),
    lastSyncedAt: new Date(),
  };
}

// =============================================================================
// Status Mapping
// =============================================================================

/**
 * Map FHIR appointment status to Bloom session status
 */
export function mapAppointmentStatus(fhirStatus: FHIRAppointment['status']): SessionStatus {
  const statusMap: Record<string, SessionStatus> = {
    'proposed': 'scheduled',
    'pending': 'scheduled',
    'booked': 'scheduled',
    'arrived': 'confirmed',
    'checked-in': 'confirmed',
    'waitlist': 'scheduled',
    'fulfilled': 'completed',
    'cancelled': 'cancelled',
    'noshow': 'no_show',
    'entered-in-error': 'cancelled',
  };

  return statusMap[fhirStatus] || 'scheduled';
}

/**
 * Check if status indicates a completed session (for counting)
 */
export function isCompletedStatus(status: SessionStatus): boolean {
  return status === 'completed';
}

/**
 * Check if status indicates an active/upcoming session
 */
export function isActiveStatus(status: SessionStatus): boolean {
  return ['scheduled', 'confirmed', 'in_progress'].includes(status);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build display name from FHIR name structure
 */
function buildDisplayName(
  name?: FHIRPractitioner['name'][0]
): string {
  if (!name) return 'Unknown';

  const parts: string[] = [];
  
  if (name.prefix?.length) {
    parts.push(name.prefix[0]);
  }
  
  if (name.given?.length) {
    parts.push(name.given[0]);
  }
  
  if (name.family) {
    parts.push(name.family);
  }
  
  if (name.suffix?.length) {
    parts.push(name.suffix.join(' '));
  }

  return parts.join(' ') || 'Unknown';
}

/**
 * Build initials from first and last name
 */
function buildInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase() || '?';
  const lastInitial = lastName.charAt(0).toUpperCase() || '?';
  return `${firstInitial}${lastInitial}`;
}

/**
 * Extract telecom value by system type
 */
function getTelecom(
  telecom: FHIRPractitioner['telecom'],
  system: 'phone' | 'email'
): string | undefined {
  const item = telecom?.find(t => t.system === system);
  return item?.value;
}

/**
 * Extract qualifications as comma-separated string
 */
function extractQualifications(fhir: FHIRPractitioner): string | undefined {
  if (!fhir.qualification?.length) return undefined;

  return fhir.qualification
    .map(q => q.code?.coding?.[0]?.display || q.identifier?.value)
    .filter(Boolean)
    .join(', ');
}

/**
 * Extract specialty from practitioner
 */
function extractSpecialty(fhir: FHIRPractitioner): string | undefined {
  // Specialty might be in qualifications or as extension
  const psychologyQual = fhir.qualification?.find(q =>
    q.code?.coding?.some(c =>
      c.display?.toLowerCase().includes('psycholog')
    )
  );

  return psychologyQual?.code?.coding?.[0]?.display;
}

/**
 * Extract session type from appointment
 */
function extractSessionType(fhir: FHIRAppointment): string | undefined {
  // Try serviceType first
  const serviceType = fhir.serviceType?.[0]?.coding?.[0]?.display;
  if (serviceType) return serviceType;

  // Fall back to appointmentType
  return fhir.appointmentType?.coding?.[0]?.display;
}

/**
 * Extract fee from appointment extensions
 */
function extractFee(fhir: FHIRAppointment): number | undefined {
  const feeExtension = fhir.extension?.find(e =>
    e.url.includes('fee') || e.url.includes('amount')
  );

  return feeExtension?.valueMoney?.value;
}

/**
 * Extract payment status from appointment
 */
function extractPaymentStatus(fhir: FHIRAppointment): boolean {
  const paidExtension = fhir.extension?.find(e =>
    e.url.includes('paid') || e.url.includes('payment-status')
  );

  return paidExtension?.valueBoolean === true;
}

/**
 * Get actual start/end time from extensions
 */
function getActualTime(
  fhir: FHIRAppointment,
  type: 'start' | 'end'
): Date | undefined {
  const extension = fhir.extension?.find(e =>
    e.url.includes(`actual-${type}`)
  );

  return extension?.valueString ? new Date(extension.valueString) : undefined;
}

/**
 * Get MHCP total sessions from patient extensions
 */
function getMhcpTotalFromExtensions(fhir: FHIRPatient): number | undefined {
  const extension = fhir.extension?.find(e =>
    e.url.includes('mhcp-total') || e.url.includes('mental-health-plan-sessions')
  );

  return extension?.valueInteger;
}

/**
 * Get MHCP date from patient extensions
 */
function getMhcpDateFromExtensions(
  fhir: FHIRPatient,
  type: 'plan-start' | 'plan-expiry'
): Date | undefined {
  const extension = fhir.extension?.find(e =>
    e.url.includes(`mhcp-${type}`) || e.url.includes(`mental-health-plan-${type}`)
  );

  return extension?.valueDate ? new Date(extension.valueDate) : undefined;
}

/**
 * Get extension value by URL pattern
 */
function getExtensionValue(
  extensions: FHIRPatient['extension'],
  urlPattern: string
): string | undefined {
  const extension = extensions?.find(e =>
    e.url.toLowerCase().includes(urlPattern.toLowerCase())
  );

  return extension?.valueString;
}

/**
 * Extract patient ID from FHIR reference
 * e.g., "Patient/12345" -> "12345"
 */
export function extractIdFromReference(reference: string): string {
  const parts = reference.split('/');
  return parts[parts.length - 1];
}

/**
 * Get patient reference from appointment participants
 */
export function getPatientIdFromAppointment(fhir: FHIRAppointment): string | null {
  const patientParticipant = fhir.participant?.find(p =>
    p.actor?.reference?.startsWith('Patient/')
  );

  if (!patientParticipant?.actor?.reference) return null;

  return extractIdFromReference(patientParticipant.actor.reference);
}

/**
 * Get practitioner reference from appointment participants
 */
export function getPractitionerIdFromAppointment(fhir: FHIRAppointment): string | null {
  const practitionerParticipant = fhir.participant?.find(p =>
    p.actor?.reference?.startsWith('Practitioner/')
  );

  if (!practitionerParticipant?.actor?.reference) return null;

  return extractIdFromReference(practitionerParticipant.actor.reference);
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
