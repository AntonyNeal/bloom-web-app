import { useState, useEffect, useCallback, useRef } from 'react';
import { FormField } from './FormField';
import { FileUpload } from './FileUpload';
import { FormProgress } from './FormProgress';
import {
  PsychologistApplication,
  ValidationErrors,
  PSYCHOLOGIST_SPECIALTIES,
  CLIENT_TYPE_OPTIONS,
  TELEHEALTH_PLATFORMS,
  SESSION_TYPES,
} from '../../types/psychologist';
import {
  validatePsychologistApplication,
  validateQualificationGate,
} from '../../utils/validation/psychologistValidation';
import {
  submitApplication,
  getErrorMessage,
} from '../../services/applicationApi';

// Local storage key for auto-save
const AUTO_SAVE_KEY = 'lpa-psychologist-application-draft';
const AUTO_SAVE_STEP_KEY = 'lpa-psychologist-application-step';

// Auto-save debounce delay (ms)
const AUTO_SAVE_DELAY = 1000;

// Fields that should not be saved (sensitive or file data)
const EXCLUDED_FIELDS = ['cvFile', 'cvUploadStatus', 'applicationId', 'submittedAt'];

export const PsychologistApplicationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qualificationPassed, setQualificationPassed] = useState<
    boolean | null
  >(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDraftRestored, setShowDraftRestored] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<Partial<PsychologistApplication>>({
    // Initialize with sensible defaults for booleans and arrays
    specialties: [],
    preferredClientTypes: [],
    isRegisteredClinicalPsychologist: false,
    hasPhD: false,
    yearsRegisteredWithAHPRA: 0,
    hasTelehealthExperience: false,
    hasReliableInternet: false,
    hasQuietPrivateSpace: false,
    hasWebcamAndHeadset: false,
    hasInsurance: false,
    hasWorkingWithChildrenCheck: false,
    willingToAcceptMedicare: false,
    willingToAcceptPrivateOnly: false,
    privacyConsent: false,
    backgroundCheckConsent: false,
  });

  // Load saved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(AUTO_SAVE_KEY);
      const savedStep = localStorage.getItem(AUTO_SAVE_STEP_KEY);
      
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        // Merge saved data with defaults (in case new fields were added)
        setFormData(prev => ({ ...prev, ...parsedDraft }));
        
        // Check if they passed qualification gate
        if (validateQualificationGate(parsedDraft)) {
          setQualificationPassed(true);
        }
        
        // Restore step if valid
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          if (step >= 1 && step <= 7) {
            setCurrentStep(step);
          }
        }
        
        setShowDraftRestored(true);
        // Auto-hide the notification after 5 seconds
        setTimeout(() => setShowDraftRestored(false), 5000);
        
        console.log('[ApplicationForm] Draft restored from local storage');
      }
    } catch (error) {
      console.error('[ApplicationForm] Failed to load draft:', error);
    }
  }, []);

  // Auto-save form data with debounce
  const saveToLocalStorage = useCallback((data: Partial<PsychologistApplication>, step: number) => {
    try {
      // Filter out excluded fields
      const dataToSave = Object.entries(data).reduce((acc, [key, value]) => {
        if (!EXCLUDED_FIELDS.includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(AUTO_SAVE_STEP_KEY, String(step));
      setLastSaved(new Date());
    } catch (error) {
      console.error('[ApplicationForm] Failed to save draft:', error);
    }
  }, []);

  // Trigger auto-save when form data or step changes
  useEffect(() => {
    // Don't save if form is submitted
    if (submitted) return;
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new debounced save
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveToLocalStorage(formData, currentStep);
    }, AUTO_SAVE_DELAY);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, currentStep, submitted, saveToLocalStorage]);

  // Clear draft on successful submission
  const clearSavedDraft = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
      localStorage.removeItem(AUTO_SAVE_STEP_KEY);
      console.log('[ApplicationForm] Draft cleared after submission');
    } catch (error) {
      console.error('[ApplicationForm] Failed to clear draft:', error);
    }
  }, []);

  const steps = [
    { number: 1, title: 'Qualification', completed: currentStep > 1 },
    { number: 2, title: 'Personal Info', completed: currentStep > 2 },
    { number: 3, title: 'Experience', completed: currentStep > 3 },
    { number: 4, title: 'Telehealth', completed: currentStep > 4 },
    { number: 5, title: 'Insurance', completed: currentStep > 5 },
    { number: 6, title: 'References', completed: currentStep > 6 },
    { number: 7, title: 'Documents', completed: submitted },
  ];

  const updateField = (
    field: keyof PsychologistApplication,
    value: string | number | boolean | string[] | File | null | object
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const allErrors = validatePsychologistApplication(formData);

    // Define which fields belong to each step
    const stepFields: { [key: number]: (keyof ValidationErrors)[] } = {
      1: [
        'qualification',
        'isRegisteredClinicalPsychologist',
        'yearsRegisteredWithAHPRA',
        'hasPhD',
      ],
      2: [
        'fullName',
        'email',
        'phone',
        'ahpraNumber',
        'ahpraExpiry',
        'qualifications',
        'institution',
        'graduationYear',
        'medicareProviderNumber',
      ],
      3: [
        'yearsExperience',
        'preferredHoursPerWeek',
        'currentWeeklyClientHours',
        'lookingToReplaceOrSupplement',
        'specialties',
        'preferredClientTypes',
        'currentEmploymentStatus',
        'availableStartDate',
      ],
      4: [
        'state',
        'timezone',
        'hasTelehealthExperience',
        'telehealthExperienceYears',
        'hasReliableInternet',
        'hasQuietPrivateSpace',
        'hasWebcamAndHeadset',
        'willingToAcceptMedicare',
        'willingToAcceptPrivateOnly',
        'billing',
      ],
      5: [
        'hasInsurance',
        'insuranceProvider',
        'hasWorkingWithChildrenCheck',
        'workingWithChildrenNumber',
      ],
      6: [
        'reference1Name',
        'reference1Email',
        'reference1Relationship',
        'reference2Name',
        'reference2Email',
        'reference2Relationship',
      ],
      7: ['motivation', 'cvFile', 'privacyConsent', 'backgroundCheckConsent'],
    };

    // Only show errors for current step fields
    const currentStepErrors: ValidationErrors = {};
    stepFields[currentStep]?.forEach((field) => {
      if (allErrors[field]) {
        currentStepErrors[field] = allErrors[field];
      }
    });

    setErrors(currentStepErrors);
    return Object.keys(currentStepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
      window.scrollTo(0, 0); // Scroll to top on step change
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    setSubmitting(true);

    try {
      // Submit application with real API call
      const result = await submitApplication(
        formData as PsychologistApplication
      );

      setFormData((prev) => ({
        ...prev,
        applicationId: result.id,
        submittedAt: new Date(),
      }));
      setSubmitted(true);
      // Clear the saved draft on successful submission
      clearSavedDraft();
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = getErrorMessage(error);
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-16 w-16 text-green-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Application Submitted!
        </h2>
        <p className="text-gray-700 mb-4">
          Thank you for your interest in joining Life Psychology Australia.
          We'll review your application and be in touch within 5 business days.
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Application ID:{' '}
          <span className="font-mono font-semibold">
            {formData.applicationId}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          A confirmation email has been sent to {formData.email}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Draft restored notification */}
      {showDraftRestored && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-blue-700 text-sm">
              <strong>Draft restored!</strong> Your previous progress has been loaded.
            </span>
          </div>
          <button 
            onClick={() => setShowDraftRestored(false)}
            className="text-blue-400 hover:text-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Progress indicator - sits on background at natural width */}
      {qualificationPassed !== false && (
        <FormProgress steps={steps} currentStep={currentStep} />
      )}

      {/* Form container with gradient background */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl p-8 lg:p-12 border border-blue-100 relative">
        {/* Auto-save indicator */}
        {lastSaved && !submitted && (
          <div className="absolute top-4 right-4 text-xs text-gray-400 flex items-center">
            <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Auto-saved</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Qualification Gate */}
          {currentStep === 1 && qualificationPassed === null && (
            <div className="space-y-6">
              {/* Step Header with Icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl mb-4 shadow-lg">
                  🎓
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  Qualification Check
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  To ensure quality of care, we require applicants to meet at
                  least one of the following criteria:
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="clinicalPsych"
                      checked={formData.isRegisteredClinicalPsychologist}
                      onChange={(e) =>
                        updateField(
                          'isRegisteredClinicalPsychologist',
                          e.target.checked
                        )
                      }
                      className="mt-1 h-6 w-6 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <label
                      htmlFor="clinicalPsych"
                      className="ml-4 cursor-pointer flex-1"
                    >
                      <div className="text-gray-900 font-bold text-lg">
                        I am a Registered Clinical Psychologist
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Current AHPRA Clinical Psychology registration
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
                  <FormField
                    label="Years Registered with AHPRA"
                    name="yearsRegisteredWithAHPRA"
                    type="number"
                    value={formData.yearsRegisteredWithAHPRA || 0}
                    onChange={(value) =>
                      updateField('yearsRegisteredWithAHPRA', value)
                    }
                    error={errors.yearsRegisteredWithAHPRA}
                    required
                    min={0}
                    max={60}
                    helpText="Must be 8+ years if not a Clinical Psychologist or PhD holder"
                    placeholder="10"
                  />
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="hasPhD"
                      checked={formData.hasPhD}
                      onChange={(e) => updateField('hasPhD', e.target.checked)}
                      className="mt-1 h-6 w-6 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <label
                      htmlFor="hasPhD"
                      className="ml-4 cursor-pointer flex-1"
                    >
                      <div className="text-gray-900 font-bold text-lg">
                        I hold a PhD in Psychology
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Doctoral degree in psychology with current AHPRA
                        registration
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {errors.qualification && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-md">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errors.qualification}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const meetsRequirements = validateQualificationGate(formData);
                  if (meetsRequirements) {
                    // Only proceed if they meet the requirements
                    setQualificationPassed(true);
                    nextStep();
                  } else {
                    // Show rejection screen - no celebration
                    setQualificationPassed(false);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-[transform,box-shadow] duration-200 text-lg"
              >
                ✨ Check Eligibility
              </button>
            </div>
          )}

          {/* Qualification Failed Screen - NO celebratory visuals */}
          {currentStep === 1 && qualificationPassed === false && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-10 shadow-xl">
              <div className="text-center mb-6">
                {/* Professional icon only - no flowers or celebration */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-4xl mb-4 shadow-lg">
                  💼
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
                  Thank You for Your Interest
                </h2>
              </div>
              <p className="text-gray-700 mb-4 text-center max-w-2xl mx-auto">
                Based on the information provided, you don't currently meet our
                minimum qualification requirements. We require applicants to be
                either:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>A Registered Clinical Psychologist, OR</li>
                <li>Have 8+ years of AHPRA registration, OR</li>
                <li>Hold a PhD in Psychology</li>
              </ul>
              <p className="text-gray-700 mb-6">
                These requirements ensure we can provide the highest quality of
                care to our clients. We encourage you to apply again once you
                meet one of these criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQualificationPassed(null);
                  setFormData((prev) => ({
                    ...prev,
                    isRegisteredClinicalPsychologist: false,
                    yearsRegisteredWithAHPRA: 0,
                    hasPhD: false,
                  }));
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Step 2: Personal & Professional Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Header with Icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white text-3xl mb-4 shadow-lg">
                  👤
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  Personal & Professional Information
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Tell us about yourself and your professional background
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 space-y-6">
                <FormField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={(value) => updateField('fullName', value)}
                  error={errors.fullName}
                  required
                  placeholder="Dr. Jane Smith"
                />

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(value) => updateField('email', value)}
                  error={errors.email}
                  required
                  placeholder="jane.smith@example.com"
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(value) => updateField('phone', value)}
                  error={errors.phone}
                  required
                  helpText="Australian mobile or landline number"
                  placeholder="0412 345 678"
                />

                <div className="border-t border-gray-200 my-8 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    AHPRA Registration
                  </h3>

                  <FormField
                    label="AHPRA Registration Number"
                    name="ahpraNumber"
                    value={formData.ahpraNumber || ''}
                    onChange={(value) => updateField('ahpraNumber', value)}
                    error={errors.ahpraNumber}
                    required
                    helpText="Format: PSY0001234567 (3 letters + 10 digits)"
                    placeholder="PSY0001234567"
                  />

                  <FormField
                    label="AHPRA Expiry Date"
                    name="ahpraExpiry"
                    type="date"
                    value={formData.ahpraExpiry || ''}
                    onChange={(value) => updateField('ahpraExpiry', value)}
                    error={errors.ahpraExpiry}
                    required
                    helpText="Your registration must be current"
                  />

                  <FormField
                    label="Highest Psychology Qualification"
                    name="qualifications"
                    value={formData.qualifications || ''}
                    onChange={(value) => updateField('qualifications', value)}
                    error={errors.qualifications}
                    required
                    placeholder="Master of Clinical Psychology"
                  />

                  <FormField
                    label="Institution"
                    name="institution"
                    value={formData.institution || ''}
                    onChange={(value) => updateField('institution', value)}
                    error={errors.institution}
                    required
                    placeholder="University of Sydney"
                  />

                  <FormField
                    label="Graduation Year"
                    name="graduationYear"
                    type="number"
                    value={formData.graduationYear || ''}
                    onChange={(value) => updateField('graduationYear', value)}
                    error={errors.graduationYear}
                    required
                    min={1950}
                    max={new Date().getFullYear()}
                    placeholder="2015"
                  />

                  <FormField
                    label="Medicare Provider Number (Optional)"
                    name="medicareProviderNumber"
                    value={formData.medicareProviderNumber || ''}
                    onChange={(value) =>
                      updateField('medicareProviderNumber', value)
                    }
                    error={errors.medicareProviderNumber}
                    helpText="Required for Medicare rebates"
                    placeholder="1234567AB"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Experience & Specialties */}
          {currentStep === 3 && qualificationPassed !== false && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Experience & Specialties
                </h2>
                <p className="text-gray-600">
                  Tell us about your experience and areas of specialization
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Years of Clinical Experience"
                  name="yearsOfExperience"
                  type="number"
                  value={formData.yearsOfExperience || ''}
                  onChange={(value) => updateField('yearsOfExperience', value)}
                  error={errors.yearsOfExperience}
                  required
                  min={0}
                  max={50}
                  placeholder="5"
                />

                <FormField
                  label="Years of Experience with Adults"
                  name="yearsOfExperienceAdults"
                  type="number"
                  value={formData.yearsOfExperienceAdults || ''}
                  onChange={(value) =>
                    updateField('yearsOfExperienceAdults', value)
                  }
                  error={errors.yearsOfExperienceAdults}
                  min={0}
                  max={50}
                  placeholder="3"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Areas of Specialization{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PSYCHOLOGIST_SPECIALTIES.map((specialty) => (
                      <label
                        key={specialty}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.specialties?.includes(specialty) || false
                          }
                          onChange={(e) => {
                            const currentSpecialties =
                              formData.specialties || [];
                            if (e.target.checked) {
                              updateField('specialties', [
                                ...currentSpecialties,
                                specialty,
                              ]);
                            } else {
                              updateField(
                                'specialties',
                                currentSpecialties.filter(
                                  (s) => s !== specialty
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {specialty}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.specialties && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.specialties}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Client Types You Work With{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CLIENT_TYPE_OPTIONS.map((clientType) => (
                      <label
                        key={clientType}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.clientTypes?.includes(clientType) || false
                          }
                          onChange={(e) => {
                            const currentClientTypes =
                              formData.clientTypes || [];
                            if (e.target.checked) {
                              updateField('clientTypes', [
                                ...currentClientTypes,
                                clientType,
                              ]);
                            } else {
                              updateField(
                                'clientTypes',
                                currentClientTypes.filter(
                                  (ct) => ct !== clientType
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {clientType}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.clientTypes && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.clientTypes}
                    </p>
                  )}
                </div>

                <FormField
                  label="Other Specialties or Experience (Optional)"
                  name="otherSpecialties"
                  type="textarea"
                  value={formData.otherSpecialties || ''}
                  onChange={(value) => updateField('otherSpecialties', value)}
                  error={errors.otherSpecialties}
                  placeholder="Any additional specialties or unique experience..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Telehealth & Availability */}
          {currentStep === 4 && qualificationPassed !== false && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Telehealth & Availability
                </h2>
                <p className="text-gray-600">
                  Let us know about your telehealth capabilities and
                  availability preferences
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Telehealth Capability{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="telehealthCapable"
                        value="yes"
                        checked={formData.telehealthCapable === true}
                        onChange={() => updateField('telehealthCapable', true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        Yes, I am fully equipped and experienced with telehealth
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="telehealthCapable"
                        value="no"
                        checked={formData.telehealthCapable === false}
                        onChange={() => updateField('telehealthCapable', false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        No, I prefer in-person sessions only
                      </span>
                    </label>
                  </div>
                  {errors.telehealthCapable && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.telehealthCapable}
                    </p>
                  )}
                </div>

                {formData.telehealthCapable && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Preferred Telehealth Platforms
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {TELEHEALTH_PLATFORMS.map((platform) => (
                        <label
                          key={platform}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={
                              formData.preferredPlatforms?.includes(platform) ||
                              false
                            }
                            onChange={(e) => {
                              const currentPlatforms =
                                formData.preferredPlatforms || [];
                              if (e.target.checked) {
                                updateField('preferredPlatforms', [
                                  ...currentPlatforms,
                                  platform,
                                ]);
                              } else {
                                updateField(
                                  'preferredPlatforms',
                                  currentPlatforms.filter((p) => p !== platform)
                                );
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {platform}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Session Types Offered{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SESSION_TYPES.map((sessionType) => (
                      <label
                        key={sessionType}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.sessionTypes?.includes(sessionType) ||
                            false
                          }
                          onChange={(e) => {
                            const currentSessionTypes =
                              formData.sessionTypes || [];
                            if (e.target.checked) {
                              updateField('sessionTypes', [
                                ...currentSessionTypes,
                                sessionType,
                              ]);
                            } else {
                              updateField(
                                'sessionTypes',
                                currentSessionTypes.filter(
                                  (st) => st !== sessionType
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {sessionType}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.sessionTypes && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.sessionTypes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Availability Preferences
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Days Available
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                          'Sunday',
                        ].map((day) => (
                          <label
                            key={day}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                formData.availability?.days?.includes(day) ||
                                false
                              }
                              onChange={(e) => {
                                const currentDays =
                                  formData.availability?.days || [];
                                if (e.target.checked) {
                                  updateField('availability', {
                                    ...formData.availability,
                                    days: [...currentDays, day],
                                  });
                                } else {
                                  updateField('availability', {
                                    ...formData.availability,
                                    days: currentDays.filter((d) => d !== day),
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {day.slice(0, 3)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Earliest Available Time"
                        name="earliestTime"
                        type="time"
                        value={formData.availability?.earliestTime || ''}
                        onChange={(value) =>
                          updateField('availability', {
                            ...formData.availability,
                            earliestTime: value,
                          })
                        }
                        error={errors.availability?.earliestTime}
                      />

                      <FormField
                        label="Latest Available Time"
                        name="latestTime"
                        type="time"
                        value={formData.availability?.latestTime || ''}
                        onChange={(value) =>
                          updateField('availability', {
                            ...formData.availability,
                            latestTime: value,
                          })
                        }
                        error={errors.availability?.latestTime}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Insurance & Billing */}
          {currentStep === 5 && qualificationPassed !== false && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Insurance & Billing
                </h2>
                <p className="text-gray-600">
                  Tell us about your insurance coverage and billing preferences
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Professional Indemnity Insurance{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="hasInsurance"
                        value="yes"
                        checked={formData.hasInsurance === true}
                        onChange={() => updateField('hasInsurance', true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        Yes, I have current professional indemnity insurance
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="hasInsurance"
                        value="no"
                        checked={formData.hasInsurance === false}
                        onChange={() => updateField('hasInsurance', false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        No, I do not have professional indemnity insurance
                      </span>
                    </label>
                  </div>
                  {errors.hasInsurance && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.hasInsurance}
                    </p>
                  )}
                </div>

                {formData.hasInsurance && (
                  <FormField
                    label="Insurance Provider"
                    name="insuranceProvider"
                    value={formData.insuranceProvider || ''}
                    onChange={(value) =>
                      updateField('insuranceProvider', value)
                    }
                    error={errors.insuranceProvider}
                    placeholder="e.g., AHPRA Professional Indemnity Insurance"
                  />
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Working with Children Check{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="hasWorkingWithChildrenCheck"
                        value="yes"
                        checked={formData.hasWorkingWithChildrenCheck === true}
                        onChange={() =>
                          updateField('hasWorkingWithChildrenCheck', true)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        Yes, I have a current Working with Children Check
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="hasWorkingWithChildrenCheck"
                        value="no"
                        checked={formData.hasWorkingWithChildrenCheck === false}
                        onChange={() =>
                          updateField('hasWorkingWithChildrenCheck', false)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        No, I do not have a Working with Children Check
                      </span>
                    </label>
                  </div>
                  {errors.hasWorkingWithChildrenCheck && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.hasWorkingWithChildrenCheck}
                    </p>
                  )}
                </div>

                {formData.hasWorkingWithChildrenCheck && (
                  <FormField
                    label="Working with Children Check Number"
                    name="workingWithChildrenNumber"
                    value={formData.workingWithChildrenNumber || ''}
                    onChange={(value) =>
                      updateField('workingWithChildrenNumber', value)
                    }
                    error={errors.workingWithChildrenNumber}
                    placeholder="WWC number"
                  />
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Medicare Billing Preferences
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.willingToAcceptMedicare || false}
                        onChange={(e) =>
                          updateField(
                            'willingToAcceptMedicare',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        I am willing to accept Medicare rebates
                      </span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.willingToAcceptPrivateOnly || false}
                        onChange={(e) =>
                          updateField(
                            'willingToAcceptPrivateOnly',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        I prefer private billing only
                      </span>
                    </label>
                  </div>
                </div>

                <FormField
                  label="Preferred Hourly Rate (AUD)"
                  name="preferredHourlyRate"
                  type="number"
                  value={formData.preferredHourlyRate || ''}
                  onChange={(value) =>
                    updateField('preferredHourlyRate', value)
                  }
                  error={errors.preferredHourlyRate}
                  placeholder="200"
                  min={100}
                  max={500}
                  helpText="Your preferred hourly rate for private clients"
                />
              </div>
            </div>
          )}

          {/* Step 6: References */}
          {currentStep === 6 && qualificationPassed !== false && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Professional References
                </h2>
                <p className="text-gray-600">
                  Please provide two professional references who can speak to
                  your clinical work
                </p>
              </div>

              <div className="space-y-8">
                {/* Reference 1 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Reference 1
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Full Name"
                      name="reference1Name"
                      value={formData.reference1Name || ''}
                      onChange={(value) => updateField('reference1Name', value)}
                      error={errors.reference1Name}
                      required
                      placeholder="Dr. Jane Smith"
                    />

                    <FormField
                      label="Email Address"
                      name="reference1Email"
                      type="email"
                      value={formData.reference1Email || ''}
                      onChange={(value) =>
                        updateField('reference1Email', value)
                      }
                      error={errors.reference1Email}
                      required
                      placeholder="jane.smith@example.com"
                    />
                  </div>

                  <div className="mt-4">
                    <FormField
                      label="Relationship to You"
                      name="reference1Relationship"
                      value={formData.reference1Relationship || ''}
                      onChange={(value) =>
                        updateField('reference1Relationship', value)
                      }
                      error={errors.reference1Relationship}
                      required
                      placeholder="e.g., Clinical Supervisor, Colleague, Former Employer"
                      helpText="Please specify their professional relationship to you"
                    />
                  </div>
                </div>

                {/* Reference 2 */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Reference 2
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Full Name"
                      name="reference2Name"
                      value={formData.reference2Name || ''}
                      onChange={(value) => updateField('reference2Name', value)}
                      error={errors.reference2Name}
                      required
                      placeholder="Prof. John Doe"
                    />

                    <FormField
                      label="Email Address"
                      name="reference2Email"
                      type="email"
                      value={formData.reference2Email || ''}
                      onChange={(value) =>
                        updateField('reference2Email', value)
                      }
                      error={errors.reference2Email}
                      required
                      placeholder="john.doe@university.edu.au"
                    />
                  </div>

                  <div className="mt-4">
                    <FormField
                      label="Relationship to You"
                      name="reference2Relationship"
                      value={formData.reference2Relationship || ''}
                      onChange={(value) =>
                        updateField('reference2Relationship', value)
                      }
                      error={errors.reference2Relationship}
                      required
                      placeholder="e.g., Clinical Supervisor, Colleague, Former Employer"
                      helpText="Please specify their professional relationship to you"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Reference Check Process</p>
                      <p className="mt-1">
                        We will contact your references to verify your
                        professional qualifications and clinical experience.
                        Please ensure they are expecting our call and have your
                        permission to provide this information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Documents & Declaration */}
          {currentStep === 7 && qualificationPassed !== false && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Documents & Declaration
                </h2>
                <p className="text-gray-600">
                  Please upload required documents and complete your application
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Curriculum Vitae (CV){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <FileUpload
                    onFileSelect={(file) => updateField('cvFile', file)}
                    acceptedTypes={[
                      'application/pdf',
                      'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ]}
                    maxSizeMB={10}
                    currentFile={formData.cvFile}
                    label="Upload CV"
                    helpText="PDF, DOC, or DOCX format, maximum 10MB"
                  />
                  {errors.cvFile && (
                    <p className="mt-2 text-sm text-red-600">{errors.cvFile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    AHPRA Registration Certificate (Optional)
                  </label>
                  <FileUpload
                    onFileSelect={(file) =>
                      updateField('ahpraCertificateFile', file)
                    }
                    acceptedTypes={[
                      'application/pdf',
                      'image/jpeg',
                      'image/png',
                    ]}
                    maxSizeMB={5}
                    currentFile={formData.ahpraCertificateFile}
                    label="Upload AHPRA Certificate"
                    helpText="PDF, JPG, or PNG format, maximum 5MB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Professional Indemnity Insurance Certificate (Optional)
                  </label>
                  <FileUpload
                    onFileSelect={(file) =>
                      updateField('insuranceCertificateFile', file)
                    }
                    acceptedTypes={[
                      'application/pdf',
                      'image/jpeg',
                      'image/png',
                    ]}
                    maxSizeMB={5}
                    currentFile={formData.insuranceCertificateFile}
                    label="Upload Insurance Certificate"
                    helpText="PDF, JPG, or PNG format, maximum 5MB"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Why do you want to join Life Psychology Australia?{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <FormField
                    name="motivation"
                    type="textarea"
                    value={formData.motivation || ''}
                    onChange={(value) => updateField('motivation', value)}
                    error={errors.motivation}
                    required
                    rows={6}
                    placeholder="Please tell us about your interest in joining our practice, your experience with telehealth, and what you believe you can contribute to our team and clients..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      checked={formData.privacyConsent || false}
                      onChange={(e) =>
                        updateField('privacyConsent', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label
                      htmlFor="privacyConsent"
                      className="text-sm text-gray-700"
                    >
                      <span className="font-semibold">Privacy Consent</span>{' '}
                      <span className="text-red-500">*</span>
                      <br />I consent to Life Psychology Australia collecting,
                      using, and disclosing my personal information in
                      accordance with the Privacy Act 1988 (Cth) for the
                      purposes of assessing my application and, if successful,
                      managing my engagement with the practice.
                    </label>
                  </div>
                  {errors.privacyConsent && (
                    <p className="text-sm text-red-600">
                      {errors.privacyConsent}
                    </p>
                  )}

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="backgroundCheckConsent"
                      checked={formData.backgroundCheckConsent || false}
                      onChange={(e) =>
                        updateField('backgroundCheckConsent', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label
                      htmlFor="backgroundCheckConsent"
                      className="text-sm text-gray-700"
                    >
                      <span className="font-semibold">
                        Background Check Consent
                      </span>{' '}
                      <span className="text-red-500">*</span>
                      <br />I consent to Life Psychology Australia conducting
                      background checks, including verification of my AHPRA
                      registration, professional references, and Working with
                      Children Check where applicable.
                    </label>
                  </div>
                  {errors.backgroundCheckConsent && (
                    <p className="text-sm text-red-600">
                      {errors.backgroundCheckConsent}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium">Ready to Submit</p>
                      <p className="mt-1">
                        By submitting this application, you confirm that all
                        information provided is true and accurate. We will
                        review your application and contact you within 5-7
                        business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 1 && qualificationPassed !== false && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
            )}

            {currentStep < 7 && qualificationPassed !== false && (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-[transform,box-shadow,background-color] duration-200"
              >
                Next Step →
              </button>
            )}

            {currentStep === 7 && (
              <button
                type="submit"
                disabled={submitting}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-[transform,box-shadow,background-color] duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
              {errors.submit}
            </div>
          )}
        </form>
      </div>
    </>
  );
};
