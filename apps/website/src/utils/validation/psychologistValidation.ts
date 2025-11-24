import {
  PsychologistApplication,
  ValidationErrors,
} from '../../types/psychologist';

// Validation regex patterns
const AHPRA_REGEX = /^[A-Z]{3}\d{10}$/;
const PHONE_REGEX = /^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePsychologistApplication(
  application: Partial<PsychologistApplication>
): ValidationErrors {
  const errors: ValidationErrors = {};

  // === QUALIFICATION GATE (Step 1) ===
  const hasClinicalPsych =
    application.isRegisteredClinicalPsychologist === true;
  const hasEightYears = (application.yearsRegisteredWithAHPRA ?? 0) >= 8;
  const hasPhD = application.hasPhD === true;

  if (!hasClinicalPsych && !hasEightYears && !hasPhD) {
    errors.qualification =
      'You must meet at least one requirement: Clinical Psychologist, 8+ years AHPRA registration, or PhD in Psychology';
  }

  if (application.yearsRegisteredWithAHPRA !== undefined) {
    if (application.yearsRegisteredWithAHPRA < 0) {
      errors.yearsRegisteredWithAHPRA = 'Years registered cannot be negative';
    } else if (application.yearsRegisteredWithAHPRA > 60) {
      errors.yearsRegisteredWithAHPRA =
        'Please verify - that would be an exceptionally long career';
    }
  }

  // === PERSONAL INFORMATION (Step 2) ===
  if (!application.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  } else if (application.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name';
  }

  if (!application.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(application.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!application.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    const cleanPhone = application.phone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'Please enter a valid Australian phone number';
    }
  }

  // === AHPRA CREDENTIALS (Step 2) ===
  if (!application.ahpraNumber?.trim()) {
    errors.ahpraNumber = 'AHPRA registration number is required';
  } else {
    const upperAhpra = application.ahpraNumber.toUpperCase();
    if (!AHPRA_REGEX.test(upperAhpra)) {
      errors.ahpraNumber =
        'AHPRA number format: PSY0001234567 (3 letters + 10 digits)';
    }
  }

  if (!application.ahpraExpiry) {
    errors.ahpraExpiry = 'AHPRA expiry date is required';
  } else {
    const expiryDate = new Date(application.ahpraExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (isNaN(expiryDate.getTime())) {
      errors.ahpraExpiry = 'Please enter a valid date';
    } else if (expiryDate < today) {
      errors.ahpraExpiry =
        'AHPRA registration has expired. Please renew before applying.';
    }
  }

  if (!application.qualifications?.trim()) {
    errors.qualifications = 'Qualifications are required';
  } else if (application.qualifications.trim().length < 5) {
    errors.qualifications = 'Please provide your qualification details';
  }

  if (!application.institution?.trim()) {
    errors.institution = 'Institution name is required';
  }

  if (
    application.graduationYear === undefined ||
    application.graduationYear === null
  ) {
    errors.graduationYear = 'Graduation year is required';
  } else {
    const currentYear = new Date().getFullYear();
    if (application.graduationYear < 1950) {
      errors.graduationYear = 'Please verify graduation year';
    } else if (application.graduationYear > currentYear) {
      errors.graduationYear = 'Graduation year cannot be in the future';
    }
  }

  // Medicare provider number (optional)
  if (application.medicareProviderNumber?.trim()) {
    // Basic format check - should be 8 digits
    const medicareRegex = /^\d{8}$/;
    if (
      !medicareRegex.test(application.medicareProviderNumber.replace(/\s/g, ''))
    ) {
      errors.medicareProviderNumber = 'Invalid Medicare provider number format';
    }
  }

  // === EXPERIENCE & SPECIALTIES (Step 3) ===
  if (
    application.yearsExperience === undefined ||
    application.yearsExperience === null
  ) {
    errors.yearsExperience = 'Years of experience is required';
  } else if (application.yearsExperience < 0) {
    errors.yearsExperience = 'Years of experience cannot be negative';
  } else if (application.yearsExperience > 60) {
    errors.yearsExperience = 'Please verify - that seems unusually high';
  }

  if (
    application.preferredHoursPerWeek === undefined ||
    application.preferredHoursPerWeek === null
  ) {
    errors.preferredHoursPerWeek = 'Please specify preferred hours per week';
  } else if (application.preferredHoursPerWeek < 5) {
    errors.preferredHoursPerWeek = 'Minimum 5 hours per week';
  } else if (application.preferredHoursPerWeek > 40) {
    errors.preferredHoursPerWeek = 'Maximum 40 hours per week';
  }

  if (
    application.currentWeeklyClientHours === undefined ||
    application.currentWeeklyClientHours === null
  ) {
    errors.currentWeeklyClientHours =
      'Please indicate current weekly client hours (0 if none)';
  } else if (application.currentWeeklyClientHours < 0) {
    errors.currentWeeklyClientHours = 'Hours cannot be negative';
  } else if (application.currentWeeklyClientHours > 60) {
    errors.currentWeeklyClientHours =
      'Please verify - that seems like an unusually high caseload';
  }

  if (!application.lookingToReplaceOrSupplement) {
    errors.lookingToReplaceOrSupplement =
      "Please indicate if you're looking to replace or supplement current work";
  }

  if (!application.specialties || application.specialties.length === 0) {
    errors.specialties = 'Please select at least one specialty';
  }

  if (
    !application.preferredClientTypes ||
    application.preferredClientTypes.length === 0
  ) {
    errors.preferredClientTypes = 'Please select at least one client type';
  }

  if (!application.currentEmploymentStatus) {
    errors.currentEmploymentStatus =
      'Please indicate your current employment status';
  }

  if (!application.availableStartDate) {
    errors.availableStartDate = 'Please provide your available start date';
  } else {
    const startDate = new Date(application.availableStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) {
      errors.availableStartDate = 'Please enter a valid date';
    } else if (startDate < today) {
      errors.availableStartDate = 'Available start date cannot be in the past';
    }
  }

  // === TELEHEALTH SETUP (Step 4) ===
  if (!application.state) {
    errors.state = 'Please select your state/territory';
  }

  if (!application.timezone) {
    errors.timezone = 'Please select your timezone';
  }

  if (application.hasTelehealthExperience === true) {
    if (
      application.telehealthExperienceYears === undefined ||
      application.telehealthExperienceYears === null
    ) {
      errors.telehealthExperienceYears =
        'Please specify years of telehealth experience';
    }
  }

  if (application.hasReliableInternet !== true) {
    errors.hasReliableInternet =
      'Reliable internet is required for telehealth practice';
  }

  if (application.hasQuietPrivateSpace !== true) {
    errors.hasQuietPrivateSpace =
      'A quiet, private space is required for client sessions';
  }

  if (application.hasWebcamAndHeadset !== true) {
    errors.hasWebcamAndHeadset = 'Professional webcam and headset are required';
  }

  // Billing preferences check
  if (
    application.willingToAcceptMedicare !== true &&
    application.willingToAcceptPrivateOnly !== true
  ) {
    errors.billing =
      'Please indicate your billing preferences (Medicare and/or private)';
  }

  // === INSURANCE & LEGAL (Step 5) ===
  if (application.hasInsurance !== true) {
    errors.hasInsurance =
      'Professional indemnity insurance confirmation required';
  }

  if (
    application.hasInsurance === true &&
    !application.insuranceProvider?.trim()
  ) {
    errors.insuranceProvider = 'Please provide insurance provider name';
  }

  if (
    application.hasWorkingWithChildrenCheck === true &&
    !application.workingWithChildrenNumber?.trim()
  ) {
    errors.workingWithChildrenNumber =
      'Please provide your Working with Children Check number';
  }

  // === REFERENCES (Step 6) ===
  if (!application.reference1Name?.trim()) {
    errors.reference1Name = 'First reference name is required';
  }

  if (!application.reference1Email?.trim()) {
    errors.reference1Email = 'First reference email is required';
  } else if (!EMAIL_REGEX.test(application.reference1Email)) {
    errors.reference1Email = 'Please enter a valid email for first reference';
  }

  if (!application.reference1Relationship?.trim()) {
    errors.reference1Relationship =
      'Please specify your relationship with first reference';
  }

  if (!application.reference2Name?.trim()) {
    errors.reference2Name = 'Second reference name is required';
  }

  if (!application.reference2Email?.trim()) {
    errors.reference2Email = 'Second reference email is required';
  } else if (!EMAIL_REGEX.test(application.reference2Email)) {
    errors.reference2Email = 'Please enter a valid email for second reference';
  }

  if (!application.reference2Relationship?.trim()) {
    errors.reference2Relationship =
      'Please specify your relationship with second reference';
  }

  // === MOTIVATION & DOCUMENTS (Step 7) ===
  if (!application.motivation?.trim()) {
    errors.motivation = 'Please tell us why you want to join Life Psychology';
  } else if (application.motivation.trim().length < 100) {
    errors.motivation = 'Please provide at least 100 characters';
  }

  if (!application.cvFile) {
    errors.cvFile = 'CV/Resume is required';
  }

  if (application.privacyConsent !== true) {
    errors.privacyConsent = 'You must consent to our privacy policy';
  }

  if (application.backgroundCheckConsent !== true) {
    errors.backgroundCheckConsent =
      'Background check consent is required for employment';
  }

  return errors;
}

export function isApplicationComplete(
  application: Partial<PsychologistApplication>
): boolean {
  const errors = validatePsychologistApplication(application);
  return Object.keys(errors).length === 0;
}

export function validateQualificationGate(
  application: Partial<PsychologistApplication>
): boolean {
  return (
    application.isRegisteredClinicalPsychologist === true ||
    (application.yearsRegisteredWithAHPRA ?? 0) >= 8 ||
    application.hasPhD === true
  );
}
