"use strict";
/**
 * Halaxy Entity Transformers
 *
 * Transform FHIR-R4 resources from Halaxy API to Bloom database entities.
 * Handles data mapping, normalization, and validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPractitioner = transformPractitioner;
exports.transformPatient = transformPatient;
exports.transformAppointment = transformAppointment;
exports.mapAppointmentStatus = mapAppointmentStatus;
exports.isCompletedStatus = isCompletedStatus;
exports.isActiveStatus = isActiveStatus;
exports.extractIdFromReference = extractIdFromReference;
exports.getPatientIdFromAppointment = getPatientIdFromAppointment;
exports.getPractitionerIdFromAppointment = getPractitionerIdFromAppointment;
// =============================================================================
// Practitioner Transformer
// =============================================================================
/**
 * Transform FHIR Practitioner to Bloom Practitioner entity
 */
function transformPractitioner(fhir, existingId) {
    var _a, _b;
    const primaryName = (_a = fhir.name) === null || _a === void 0 ? void 0 : _a[0];
    const firstName = ((_b = primaryName === null || primaryName === void 0 ? void 0 : primaryName.given) === null || _b === void 0 ? void 0 : _b[0]) || '';
    const lastName = (primaryName === null || primaryName === void 0 ? void 0 : primaryName.family) || '';
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
function transformPatient(fhir, practitionerId, existingId, sessionCount) {
    var _a, _b;
    const primaryName = (_a = fhir.name) === null || _a === void 0 ? void 0 : _a[0];
    const firstName = ((_b = primaryName === null || primaryName === void 0 ? void 0 : primaryName.given) === null || _b === void 0 ? void 0 : _b[0]) || '';
    const lastName = (primaryName === null || primaryName === void 0 ? void 0 : primaryName.family) || '';
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
function transformAppointment(fhir, practitionerId, clientId, sessionNumber, existingId) {
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
function mapAppointmentStatus(fhirStatus) {
    const statusMap = {
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
function isCompletedStatus(status) {
    return status === 'completed';
}
/**
 * Check if status indicates an active/upcoming session
 */
function isActiveStatus(status) {
    return ['scheduled', 'confirmed', 'in_progress'].includes(status);
}
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Build display name from FHIR name structure
 */
function buildDisplayName(name) {
    var _a, _b, _c;
    if (!name)
        return 'Unknown';
    const parts = [];
    if ((_a = name.prefix) === null || _a === void 0 ? void 0 : _a.length) {
        parts.push(name.prefix[0]);
    }
    if ((_b = name.given) === null || _b === void 0 ? void 0 : _b.length) {
        parts.push(name.given[0]);
    }
    if (name.family) {
        parts.push(name.family);
    }
    if ((_c = name.suffix) === null || _c === void 0 ? void 0 : _c.length) {
        parts.push(name.suffix.join(' '));
    }
    return parts.join(' ') || 'Unknown';
}
/**
 * Build initials from first and last name
 */
function buildInitials(firstName, lastName) {
    const firstInitial = firstName.charAt(0).toUpperCase() || '?';
    const lastInitial = lastName.charAt(0).toUpperCase() || '?';
    return `${firstInitial}${lastInitial}`;
}
/**
 * Extract telecom value by system type
 */
function getTelecom(telecom, system) {
    const item = telecom === null || telecom === void 0 ? void 0 : telecom.find(t => t.system === system);
    return item === null || item === void 0 ? void 0 : item.value;
}
/**
 * Extract qualifications as comma-separated string
 */
function extractQualifications(fhir) {
    var _a;
    if (!((_a = fhir.qualification) === null || _a === void 0 ? void 0 : _a.length))
        return undefined;
    return fhir.qualification
        .map(q => { var _a, _b, _c, _d; return ((_c = (_b = (_a = q.code) === null || _a === void 0 ? void 0 : _a.coding) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.display) || ((_d = q.identifier) === null || _d === void 0 ? void 0 : _d.value); })
        .filter(Boolean)
        .join(', ');
}
/**
 * Extract specialty from practitioner
 */
function extractSpecialty(fhir) {
    var _a, _b, _c, _d;
    // Specialty might be in qualifications or as extension
    const psychologyQual = (_a = fhir.qualification) === null || _a === void 0 ? void 0 : _a.find(q => {
        var _a, _b;
        return (_b = (_a = q.code) === null || _a === void 0 ? void 0 : _a.coding) === null || _b === void 0 ? void 0 : _b.some(c => { var _a; return (_a = c.display) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('psycholog'); });
    });
    return (_d = (_c = (_b = psychologyQual === null || psychologyQual === void 0 ? void 0 : psychologyQual.code) === null || _b === void 0 ? void 0 : _b.coding) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.display;
}
/**
 * Extract session type from appointment
 */
function extractSessionType(fhir) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Try serviceType first
    const serviceType = (_d = (_c = (_b = (_a = fhir.serviceType) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.coding) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.display;
    if (serviceType)
        return serviceType;
    // Fall back to appointmentType
    return (_g = (_f = (_e = fhir.appointmentType) === null || _e === void 0 ? void 0 : _e.coding) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.display;
}
/**
 * Extract fee from appointment extensions
 */
function extractFee(fhir) {
    var _a, _b;
    const feeExtension = (_a = fhir.extension) === null || _a === void 0 ? void 0 : _a.find(e => e.url.includes('fee') || e.url.includes('amount'));
    return (_b = feeExtension === null || feeExtension === void 0 ? void 0 : feeExtension.valueMoney) === null || _b === void 0 ? void 0 : _b.value;
}
/**
 * Extract payment status from appointment
 */
function extractPaymentStatus(fhir) {
    var _a;
    const paidExtension = (_a = fhir.extension) === null || _a === void 0 ? void 0 : _a.find(e => e.url.includes('paid') || e.url.includes('payment-status'));
    return (paidExtension === null || paidExtension === void 0 ? void 0 : paidExtension.valueBoolean) === true;
}
/**
 * Get actual start/end time from extensions
 */
function getActualTime(fhir, type) {
    var _a;
    const extension = (_a = fhir.extension) === null || _a === void 0 ? void 0 : _a.find(e => e.url.includes(`actual-${type}`));
    return (extension === null || extension === void 0 ? void 0 : extension.valueString) ? new Date(extension.valueString) : undefined;
}
/**
 * Get MHCP total sessions from patient extensions
 */
function getMhcpTotalFromExtensions(fhir) {
    var _a;
    const extension = (_a = fhir.extension) === null || _a === void 0 ? void 0 : _a.find(e => e.url.includes('mhcp-total') || e.url.includes('mental-health-plan-sessions'));
    return extension === null || extension === void 0 ? void 0 : extension.valueInteger;
}
/**
 * Get MHCP date from patient extensions
 */
function getMhcpDateFromExtensions(fhir, type) {
    var _a;
    const extension = (_a = fhir.extension) === null || _a === void 0 ? void 0 : _a.find(e => e.url.includes(`mhcp-${type}`) || e.url.includes(`mental-health-plan-${type}`));
    return (extension === null || extension === void 0 ? void 0 : extension.valueDate) ? new Date(extension.valueDate) : undefined;
}
/**
 * Get extension value by URL pattern
 */
function getExtensionValue(extensions, urlPattern) {
    const extension = extensions === null || extensions === void 0 ? void 0 : extensions.find(e => e.url.toLowerCase().includes(urlPattern.toLowerCase()));
    return extension === null || extension === void 0 ? void 0 : extension.valueString;
}
/**
 * Extract patient ID from FHIR reference
 * e.g., "Patient/12345" -> "12345"
 */
function extractIdFromReference(reference) {
    const parts = reference.split('/');
    return parts[parts.length - 1];
}
/**
 * Get patient reference from appointment participants
 */
function getPatientIdFromAppointment(fhir) {
    var _a, _b;
    const patientParticipant = (_a = fhir.participant) === null || _a === void 0 ? void 0 : _a.find(p => { var _a, _b; return (_b = (_a = p.actor) === null || _a === void 0 ? void 0 : _a.reference) === null || _b === void 0 ? void 0 : _b.startsWith('Patient/'); });
    if (!((_b = patientParticipant === null || patientParticipant === void 0 ? void 0 : patientParticipant.actor) === null || _b === void 0 ? void 0 : _b.reference))
        return null;
    return extractIdFromReference(patientParticipant.actor.reference);
}
/**
 * Get practitioner reference from appointment participants
 */
function getPractitionerIdFromAppointment(fhir) {
    var _a, _b;
    const practitionerParticipant = (_a = fhir.participant) === null || _a === void 0 ? void 0 : _a.find(p => { var _a, _b; return (_b = (_a = p.actor) === null || _a === void 0 ? void 0 : _a.reference) === null || _b === void 0 ? void 0 : _b.startsWith('Practitioner/'); });
    if (!((_b = practitionerParticipant === null || practitionerParticipant === void 0 ? void 0 : practitionerParticipant.actor) === null || _b === void 0 ? void 0 : _b.reference))
        return null;
    return extractIdFromReference(practitionerParticipant.actor.reference);
}
/**
 * Generate a UUID v4
 */
function generateUUID() {
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
//# sourceMappingURL=transformers.js.map