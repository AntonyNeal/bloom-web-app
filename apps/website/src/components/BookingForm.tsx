import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { halaxyClient, HalaxyClient } from '../utils/halaxyClient';
import { TimeSlotCalendar } from './TimeSlotCalendar';

// Lazy load StripePayment to reduce initial bundle size (~240KB savings)
const StripePayment = lazy(() => import('./StripePayment').then(m => ({ default: m.StripePayment })));

import {
  trackBookingStart,
  trackDetailsComplete,
  trackDatetimeSelected,
  trackPaymentInitiated,
  trackBookingConfirmed,
  trackBookingComplete,
  trackBookingAbandonment,
} from '../tracking';

interface BookingFormProps {
  onSuccess?: (appointmentId: string) => void;
  onCancel?: () => void;
}

// Interface for cached user details
interface CachedUserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  appointmentType: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  console.log('[BookingForm] Component rendered');

  const [step, setStep] = useState<
    'details' | 'verify' | 'datetime' | 'session' | 'payment' | 'confirm' | 'success' | 'error'
  >('details');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const hasTrackedStart = useRef(false);

  // Form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dobWarning, setDobWarning] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'unknown'>(
    'unknown'
  );
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [medicareSelectedThisSession, setMedicareSelectedThisSession] =
    useState(false);

  // Phone verification state
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load cached user details on mount
  useEffect(() => {
    try {
      const cachedDetails = localStorage.getItem('lpa_user_details');
      if (cachedDetails) {
        const details: CachedUserDetails = JSON.parse(cachedDetails);
        setFirstName(details.firstName || '');
        setLastName(details.lastName || '');
        setEmail(details.email || '');
        setPhone(details.phone || '');
        setDateOfBirth(details.dateOfBirth || '');
        setGender(details.gender || 'unknown');
        setAppointmentType(details.appointmentType || '');
        console.log('[BookingForm] Loaded cached user details');
      }
    } catch (error) {
      console.error('[BookingForm] Error loading cached details:', error);
    }

    // Track booking flow start
    if (!hasTrackedStart.current) {
      trackBookingStart({ entry_point: 'booking_modal' });
      hasTrackedStart.current = true;
    }
  }, []);

  // Track abandonment on unmount if not completed
  useEffect(() => {
    return () => {
      if (step !== 'success' && hasTrackedStart.current) {
        trackBookingAbandonment({ abandon_step: step });
      }
    };
  }, [step]);

  // Save user details to localStorage whenever they change
  useEffect(() => {
    // Only save if at least first name and email are provided
    if (firstName && email) {
      try {
        const detailsToCache: CachedUserDetails = {
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth,
          gender,
          appointmentType,
        };
        localStorage.setItem(
          'lpa_user_details',
          JSON.stringify(detailsToCache)
        );
        console.log('[BookingForm] Saved user details to cache');
      } catch (error) {
        console.error('[BookingForm] Error saving details to cache:', error);
      }
    }
  }, [firstName, lastName, email, phone, dateOfBirth, gender, appointmentType]);

  // Helper function to calculate age from date of birth
  const calculateAge = (dob: string): number | null => {
    const parts = dob.split('/');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Handle year change with age validation
  const handleYearChange = (year: string) => {
    const parts = dateOfBirth.split('/');
    const newDob = `${parts[0] || ''}/${parts[1] || ''}/${year}`;
    setDateOfBirth(newDob);

    // Check age if all parts are filled
    if (parts[0] && parts[1] && year) {
      const age = calculateAge(newDob);
      if (age !== null && age < 18) {
        setDobWarning(
          "We're sorry, but our telehealth services are only available for adults 18 and over. If you need support, please contact Kids Helpline (1800 55 1800) or Mental Health Line NSW (1800 011 511) for youth mental health services."
        );
      } else {
        setDobWarning('');
      }
    }
  };

  // Handle day change with age validation
  const handleDayChange = (day: string) => {
    const parts = dateOfBirth.split('/');
    const newDob = `${day}/${parts[1] || ''}/${parts[2] || ''}`;
    setDateOfBirth(newDob);

    // Check age if all parts are filled
    if (day && parts[1] && parts[2]) {
      const age = calculateAge(newDob);
      if (age !== null && age < 18) {
        setDobWarning(
          "We're sorry, but our telehealth services are only available for adults 18 and over. If you need support, please contact Kids Helpline (1800 55 1800) or Mental Health Line NSW (1800 011 511) for youth mental health services."
        );
      } else {
        setDobWarning('');
      }
    }
  };

  // Handle month change with age validation
  const handleMonthChange = (month: string) => {
    const parts = dateOfBirth.split('/');
    const newDob = `${parts[0] || ''}/${month}/${parts[2] || ''}`;
    setDateOfBirth(newDob);

    // Check age if all parts are filled
    if (parts[0] && month && parts[2]) {
      const age = calculateAge(newDob);
      if (age !== null && age < 18) {
        setDobWarning(
          "We're sorry, but our telehealth services are only available for adults 18 and over. If you need support, please contact Kids Helpline (1800 55 1800) or Mental Health Line NSW (1800 011 511) for youth mental health services."
        );
      } else {
        setDobWarning('');
      }
    }
  };

  const validateDetailsStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors['firstName'] = 'First name is required';
    if (!lastName.trim()) newErrors['lastName'] = 'Last name is required';
    if (!email.trim()) {
      newErrors['email'] = 'Email is required';
    } else if (!HalaxyClient.validateEmail(email)) {
      newErrors['email'] = 'Please enter a valid email address';
    }

    if (phone && !HalaxyClient.validatePhone(phone)) {
      newErrors['phone'] = 'Please enter a valid Australian phone number';
    }

    // Validate Date of Birth is filled
    const dobParts = dateOfBirth.split('/');
    if (!dobParts[0] || !dobParts[1] || !dobParts[2]) {
      newErrors['dateOfBirth'] = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if details step is valid (without setting errors)
  const isDetailsStepValid = (): boolean => {
    const dobParts = dateOfBirth.split('/');
    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      HalaxyClient.validateEmail(email) &&
      (!phone || HalaxyClient.validatePhone(phone)) &&
      dobParts.length === 3 &&
      (dobParts[0] ?? '') !== '' &&
      (dobParts[1] ?? '') !== '' &&
      (dobParts[2] ?? '') !== ''
    );
  };

  const validateDateTimeStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!appointmentDate) {
      newErrors['appointmentDate'] = 'Please select a date';
    } else {
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors['appointmentDate'] = 'Please select a future date';
      }
    }

    if (!appointmentTime) newErrors['appointmentTime'] = 'Please select a time';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSessionStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!appointmentType) {
      newErrors['appointmentType'] = 'Please select an appointment type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if date/time step is valid (without setting errors)
  const isDateTimeStepValid = (): boolean => {
    if (!appointmentDate || !appointmentTime) {
      return false;
    }

    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate >= today;
  };

  // Check if session step is valid (without setting errors)
  const isSessionStepValid = (): boolean => {
    return !!appointmentType;
  };

  const handleDetailsNext = async () => {
    if (validateDetailsStep()) {
      try {
        setLoading(true);
        setErrorMessage('');

        // Track details completion
        trackDetailsComplete({
          firstName,
          lastName,
          email,
          phone,
          appointmentType,
          is_returning_user: !!localStorage.getItem('lpa_user_details'),
        });

        // Skip SMS verification - go directly to datetime selection
        // Phone verification can be re-enabled later when SMS provider is configured
        setStep('datetime');

        // Scroll modal to top when changing steps
        window.dispatchEvent(new CustomEvent('bookingStepChanged'));
      } catch (error) {
        console.error('[BookingForm] Verification check failed:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to verify contact details'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationError('');

      // Call our verification API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071';
      const response = await fetch(`${apiUrl}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: verificationId?.toString() || '',
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Verification request failed');
      }

      const data = await response.json();

      if (data.verified) {
        // Show brief success feedback
        const codeInput = document.getElementById('verification-code');
        if (codeInput) {
          const successMsg = document.createElement('div');
          successMsg.textContent = '✓ Verified!';
          successMsg.className = 'text-green-600 font-bold text-center text-lg mb-2 animate-fade-in';
          codeInput.parentElement?.insertBefore(successMsg, codeInput);
          setTimeout(() => successMsg.remove(), 500);
        }
        
        // Proceed to datetime after brief delay
        setTimeout(() => {
          setStep('datetime');
          window.dispatchEvent(new CustomEvent('bookingStepChanged'));
        }, 600);
      } else {
        const attemptsMsg = data.attemptsRemaining !== undefined 
          ? ` (${data.attemptsRemaining} attempts remaining)`
          : '';
        setVerificationError(
          `Invalid verification code. Please try again.${attemptsMsg}`
        );
      }
    } catch (error) {
      console.error('[BookingForm] Code verification failed:', error);
      setVerificationError(
        error instanceof Error ? error.message : 'Verification failed'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsVerifying(true);
      setVerificationError('');

      // Resend code by calling our send-verification-code endpoint again
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071';
      const response = await fetch(`${apiUrl}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to resend code');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to resend code');
      }

      // Update verification ID with new one
      setVerificationId(data.verificationId);
      
      // Show success message
      alert('Verification code sent!');
    } catch (error) {
      console.error('[BookingForm] Resend code failed:', error);
      setVerificationError('Failed to resend code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDateTimeNext = () => {
    if (validateDateTimeStep()) {
      // Track datetime selection
      trackDatetimeSelected({
        selectedDate: appointmentDate,
        selectedTime: appointmentTime,
      });
      
      setStep('session');
      // Scroll modal to top when changing steps
      window.dispatchEvent(new CustomEvent('bookingStepChanged'));
    }
  };

  const handleSessionNext = () => {
    if (validateSessionStep()) {
      // Track payment initiation
      const bookingValue = appointmentType === 'couples-session' ? 300 : 
                          appointmentType === 'ndis-psychology-session' ? 232.99 : 250;
      trackPaymentInitiated({
        payment_method: 'card',
        booking_value: bookingValue,
      });
      
      setStep('payment');
      // Scroll modal to top when changing steps
      window.dispatchEvent(new CustomEvent('bookingStepChanged'));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Build appointment start/end times
      const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

      const patientData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        dateOfBirth?: string;
        gender: 'male' | 'female' | 'other' | 'unknown';
      } = {
        firstName,
        lastName,
        email,
        gender,
      };

      if (phone) patientData.phone = phone;
      if (dateOfBirth) patientData.dateOfBirth = dateOfBirth;

      const appointmentData: {
        startTime: string;
        endTime: string;
        minutesDuration: number;
        notes?: string;
      } = {
        startTime: HalaxyClient.formatDateTime(startDateTime),
        endTime: HalaxyClient.formatDateTime(endDateTime),
        minutesDuration: 60,
      };

      // Include appointment type and notes
      const appointmentTypeLabel = appointmentType
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const fullNotes = `Appointment Type: ${appointmentTypeLabel}${notes ? `\n\nPatient Notes: ${notes}` : ''}`;
      appointmentData.notes = fullNotes;

      const result = await halaxyClient.createBooking(
        patientData,
        appointmentData
      );

      if (result.success && result.appointmentId) {
        setAppointmentId(result.appointmentId);
        
        // Track booking completion (PRIMARY CONVERSION)
        const bookingValue = appointmentType === 'couples-session' ? 300 : 
                            appointmentType === 'ndis-psychology-session' ? 232.99 : 250;
        trackBookingComplete({
          bookingId: result.appointmentId,
          booking_value: bookingValue,
          transaction_id: `lpa_${result.appointmentId}_${Date.now()}`,
          is_first_booking: isFirstSession,
        });
        
        setStep('success');
        onSuccess?.(result.appointmentId);
      } else {
        setErrorMessage(
          result.error || 'Failed to create booking. Please try again.'
        );
        setStep('error');
      }
    } catch (error) {
      console.error('[BookingForm] Submission error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = () => {
    if (!appointmentDate || !appointmentTime) return '';
    const date = new Date(`${appointmentDate}T${appointmentTime}`);
    return date.toLocaleString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Header with integrated progress */}
      {step !== 'success' && step !== 'error' && (
        <div className="flex-shrink-0 mb-3 sm:mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 tracking-tight leading-tight">
              Book Your Appointment
            </h2>
            <p className="text-slate-400 text-[11px] sm:text-xs">
              Telehealth with Zoe Semmler
            </p>
          </div>
          
          {/* Progress indicator - right aligned, compact */}
          <div className="flex items-center gap-0.5 mt-1">
            {[
              { num: 1, key: 'details' },
              { num: 2, key: 'datetime' },
              { num: 3, key: 'session' },
              { num: 4, key: 'payment' },
              { num: 5, key: 'confirm' },
            ].map(({ num, key }, index) => {
              const isActive = step === key || (key === 'datetime' && step === 'verify');
              const isPast = 
                (key === 'details' && ['verify', 'datetime', 'session', 'payment', 'confirm'].includes(step)) ||
                (key === 'datetime' && ['session', 'payment', 'confirm'].includes(step)) ||
                (key === 'session' && ['payment', 'confirm'].includes(step)) ||
                (key === 'payment' && step === 'confirm');
              return (
                <React.Fragment key={key}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isPast
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : num}
                  </div>
                  {index < 4 && <div className={`w-4 sm:w-6 h-0.5 ${isPast || isActive ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Patient Details - flex to fill available space */}
      {step === 'details' && (
        <div className="flex-1 flex flex-col min-h-0" onKeyDown={(e) => {
          if (e.key === 'Enter' && isDetailsStepValid() && !loading) {
            e.preventDefault();
            handleDetailsNext();
          }
        }}>
          <div className="flex-1 flex flex-col gap-3 sm:gap-4 md:gap-6 min-h-0 justify-center">
            {/* Name row - side by side */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label
                  htmlFor="firstName-input"
                  className="block text-xs sm:text-sm font-semibold text-slate-600 mb-0.5 sm:mb-1 tracking-wide"
                >
                  First Name{' '}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <input
                  id="firstName-input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['firstName'] ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100'}`}
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                  placeholder="John"
                  aria-required="true"
                  aria-invalid={!!errors['firstName']}
                  aria-describedby={
                    errors['firstName'] ? 'firstName-error' : undefined
                  }
                />
                {errors['firstName'] && (
                  <p
                    id="firstName-error"
                    className="text-red-500 text-xs mt-0.5 font-medium"
                    role="alert"
                  >
                    {errors['firstName']}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName-input"
                  className="block text-xs sm:text-sm font-semibold text-slate-600 mb-0.5 sm:mb-1 tracking-wide"
                >
                  Last Name{' '}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <input
                  id="lastName-input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['lastName'] ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100'}`}
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                  placeholder="Smith"
                  aria-required="true"
                  aria-invalid={!!errors['lastName']}
                  aria-describedby={
                    errors['lastName'] ? 'lastName-error' : undefined
                  }
                />
                {errors['lastName'] && (
                  <p
                    id="lastName-error"
                    className="text-red-500 text-xs mt-0.5 font-medium"
                    role="alert"
                  >
                    {errors['lastName']}
                  </p>
                )}
              </div>
            </div>

          {/* Email and Phone row - side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs sm:text-sm font-semibold text-slate-600 mb-0.5 sm:mb-1 tracking-wide"
              >
                Email{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <div className="relative">
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['email'] ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100'}`}
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                  placeholder="john@example.com"
                  aria-required="true"
                  aria-invalid={!!errors['email']}
                  aria-describedby={errors['email'] ? 'email-error' : undefined}
                />
                {email && email.includes('@') && email.includes('.') && !errors['email'] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">✓</span>
                )}
              </div>
              {errors['email'] && (
                <p id="email-error" className="text-red-500 text-xs mt-0.5 font-medium" role="alert">{errors['email']}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone-input"
                className="block text-xs sm:text-sm font-semibold text-slate-600 mb-0.5 sm:mb-1 tracking-wide"
              >
                Phone{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <input
                id="phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['phone'] ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100'}`}
                style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                placeholder="0412 345 678"
                aria-required="true"
                aria-invalid={!!errors['phone']}
                aria-describedby={errors['phone'] ? 'phone-error' : undefined}
              />
              {errors['phone'] && (
                <p id="phone-error" className="text-red-500 text-xs mt-0.5 font-medium" role="alert">{errors['phone']}</p>
              )}
            </div>
          </div>

          {/* DOB and Gender row - side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-0.5 sm:mb-1 tracking-wide">
                Date of Birth <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                <select
                  id="dob-day"
                  value={dateOfBirth.split('/')[0] || ''}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className={`w-full px-1 sm:px-2 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['dateOfBirth'] ? 'border-red-300' : 'border-slate-200 focus:border-emerald-400'}`}
                  aria-label="Day of birth"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                  ))}
                </select>
                <select
                  id="dob-month"
                  value={dateOfBirth.split('/')[1] || ''}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className={`w-full px-1 sm:px-2 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['dateOfBirth'] ? 'border-red-300' : 'border-slate-200 focus:border-emerald-400'}`}
                  aria-label="Month of birth"
                >
                  <option value="">Mon</option>
                  <option value="01">Jan</option>
                  <option value="02">Feb</option>
                  <option value="03">Mar</option>
                  <option value="04">Apr</option>
                  <option value="05">May</option>
                  <option value="06">Jun</option>
                  <option value="07">Jul</option>
                  <option value="08">Aug</option>
                  <option value="09">Sep</option>
                  <option value="10">Oct</option>
                  <option value="11">Nov</option>
                  <option value="12">Dec</option>
                </select>
                <select
                  id="dob-year"
                  value={dateOfBirth.split('/')[2] || ''}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className={`w-full px-1 sm:px-2 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border ${errors['dateOfBirth'] ? 'border-red-300' : 'border-slate-200 focus:border-emerald-400'}`}
                  aria-label="Year of birth"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 101 }, (_, i) => 2025 - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              {errors['dateOfBirth'] && (
                <p id="dob-error" className="text-red-600 text-xs mt-0.5" role="alert">{errors['dateOfBirth']}</p>
              )}
            </div>
            <div>
              <label htmlFor="gender-select" className="block text-xs sm:text-sm font-semibold text-slate-600 mb-0.5 sm:mb-1 tracking-wide">
                Gender
              </label>
              <select
                id="gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base font-normal bg-white rounded-lg focus:outline-none transition-all border border-slate-200 focus:border-emerald-400"
              >
                <option value="unknown">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* DOB Warning */}
          {dobWarning && (
            <div className="p-1.5 sm:p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-1 sm:gap-2">
                <span className="text-lg sm:text-xl flex-shrink-0" role="img" aria-label="info">👋</span>
                <p className="text-xs sm:text-sm font-medium text-blue-900">{dobWarning}</p>
              </div>
            </div>
          )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-2 pt-3 sm:pt-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleDetailsNext}
              disabled={!isDetailsStepValid()}
              className={`px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 border ${
                isDetailsStepValid()
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-400 hover:from-emerald-400 hover:to-emerald-500 focus:ring-emerald-300 cursor-pointer active:scale-[0.98]'
                  : 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 border-slate-300 cursor-not-allowed'
              }`}
              style={isDetailsStepValid() ? { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)' } : { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
              aria-disabled={!isDetailsStepValid()}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                <>Next {isDetailsStepValid() && '→'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Phone Verification */}
      {step === 'verify' && (
        <div className="space-y-6" onKeyDown={(e) => {
          if (e.key === 'Enter' && verificationCode.length === 6 && !isVerifying) {
            e.preventDefault();
            handleVerifyCode();
          }
        }}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Verify Your Phone Number
            </h3>
            <p className="text-slate-600 text-sm">
              We've sent a 6-digit code to <span className="font-semibold">{phone}</span>
            </p>
          </div>

          <div>
            <label htmlFor="verification-code" className="block text-sm font-bold text-slate-700 mb-2 text-center">
              Enter 6-digit code sent to {phone}
            </label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setVerificationCode(value);
                setVerificationError('');
              }}
              className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest bg-white rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
              placeholder="000000"
              disabled={isVerifying}
              autoFocus
            />
            {verificationError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium text-center" role="alert">
                  {verificationError}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className={`w-full py-3 px-6 rounded-lg font-bold text-base transition-all ${
                verificationCode.length === 6 && !isVerifying
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400 hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 border-slate-300 cursor-not-allowed'
              }`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-slate-600 hover:text-slate-800 font-medium"
                disabled={isVerifying}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
                disabled={isVerifying}
              >
                {isVerifying ? 'Sending New Code...' : 'Send New Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 'datetime' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Calendar Section - takes all available space */}
          <div className="flex-1 flex flex-col min-h-0">
          <TimeSlotCalendar
              onSelectSlot={(date, time) => {
                setAppointmentDate(date);
                setAppointmentTime(time);
                const newErrors = { ...errors };
                delete newErrors['appointmentDate'];
                delete newErrors['appointmentTime'];
                setErrors(newErrors);
              }}
              selectedDate={appointmentDate}
              selectedTime={appointmentTime}
              duration={60}
            />
          </div>
          {(errors['appointmentDate'] || errors['appointmentTime']) && (
            <p className="text-red-500 text-sm mt-1 font-medium flex-shrink-0">
              {errors['appointmentDate'] || errors['appointmentTime']}
            </p>
          )}

          {/* Action buttons - Balanced */}
          <div className="flex justify-between items-center gap-3 flex-shrink-0 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-4 py-2 text-xs font-semibold rounded-md text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleDateTimeNext}
              disabled={!isDateTimeStepValid()}
              className={`px-5 py-2 text-xs font-semibold rounded-md transition-all ${
                isDateTimeStepValid()
                  ? 'text-white bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
              }`}
              aria-disabled={!isDateTimeStepValid()}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Session Type & Notes */}
      {step === 'session' && (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          {/* Appointment Type Section */}
          <div>
            <label
              htmlFor="appointmentType-select"
              className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"
            >
              Appointment Type <span className="text-red-500">*</span>
            </label>

            <select
              id="appointmentType-select"
              value={appointmentType}
              onChange={(e) => {
                setAppointmentType(e.target.value);
                if (e.target.value === 'medicare-psychologist-session') {
                  setMedicareSelectedThisSession(true);
                }
              }}
              className={`w-full px-3 py-2 text-sm font-medium bg-white rounded-lg focus:outline-none transition-all border ${errors['appointmentType'] ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100'}`}
              aria-required="true"
              aria-invalid={!!errors['appointmentType']}
              aria-describedby={
                errors['appointmentType']
                  ? 'appointmentType-error'
                  : 'appointmentType-hint'
              }
            >
              <option value="">Select appointment type</option>
              <option value="psychologist-session">
                Psychologist Session - Online (60 mins) - $250.00
              </option>
              <option value="medicare-psychologist-session">
                Medicare Psychologist Session - Online (60 mins) - $250.00
              </option>
              <option value="couples-session">
                Couples Session - Online (60 mins) - $300.00
              </option>
              <option value="ndis-psychology-session">
                NDIS Psychology Session - Online (60 mins) - $232.99
              </option>
            </select>
            {errors['appointmentType'] && (
              <p
                id="appointmentType-error"
                className="text-red-500 text-xs mt-1 font-medium"
                role="alert"
              >
                {errors['appointmentType']}
              </p>
            )}

            {appointmentType === 'medicare-psychologist-session' &&
              medicareSelectedThisSession && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium">
                    💚 Medicare: $250 − $98.95 rebate = <strong>$151.05 gap</strong>
                    <span className="block text-emerald-600 mt-1 font-normal">Requires a valid GP Mental Health Treatment Plan</span>
                  </p>
                </div>
              )}

            {!(
              appointmentType === 'medicare-psychologist-session' &&
              medicareSelectedThisSession
            ) && (
              <p
                id="appointmentType-hint"
                className="mt-2 text-xs text-slate-500 px-1"
              >
                💡 Medicare rebates available for eligible appointments ($250 − $98.95 rebate = $151.05 gap)
              </p>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <label
              htmlFor="notes-textarea"
              className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"
            >
              Notes <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>

            <div className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="first-session-toggle"
                checked={isFirstSession}
                onChange={(e) => setIsFirstSession(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-1 focus:ring-emerald-200"
                aria-describedby="first-session-hint"
              />
              <label
                htmlFor="first-session-toggle"
                className="text-sm text-slate-600 cursor-pointer"
              >
                👋 This is my first session with Zoe
              </label>
            </div>

            {isFirstSession && (
              <div className="mb-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <p className="font-medium text-slate-700 mb-1">What to include:</p>
                <p>Your goals, previous therapy experience, current challenges, and session preferences.</p>
              </div>
            )}

            <textarea
              id="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={isFirstSession ? 3 : 2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all bg-white"
              placeholder={
                isFirstSession
                  ? 'Share the top things Zoe should know before your first session...'
                  : "Any additional information you'd like to share..."
              }
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3 flex-shrink-0 pt-2 mt-auto">
            <button
              type="button"
              onClick={() => {
                setStep('datetime');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-4 py-2 text-xs font-semibold rounded-md text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSessionNext}
              disabled={!isSessionStepValid()}
              className={`px-5 py-2 text-xs font-semibold rounded-md transition-all ${
                isSessionStepValid()
                  ? 'text-white bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
              }`}
              aria-disabled={!isSessionStepValid()}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 'payment' && (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          {/* Order Summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">
                {appointmentType === 'psychologist-session'
                  ? 'Psychologist Session'
                  : appointmentType === 'medicare-psychologist-session'
                    ? 'Medicare Psychologist Session'
                    : appointmentType === 'couples-session'
                      ? 'Couples Session'
                      : 'NDIS Psychology Session'}
                <span className="text-slate-400 ml-1">(60 mins)</span>
              </span>
              <span className="text-lg font-bold text-slate-800">
                {appointmentType === 'couples-session'
                  ? '$300.00'
                  : appointmentType === 'ndis-psychology-session'
                    ? '$232.99'
                    : '$250.00'}
              </span>
            </div>
          </div>

          <Suspense fallback={
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-slate-100 rounded-lg"></div>
              <div className="h-10 bg-slate-100 rounded-lg"></div>
            </div>
          }>
            <StripePayment
              amount={
                appointmentType === 'couples-session'
                  ? 300
                  : appointmentType === 'ndis-psychology-session'
                    ? 232.99
                    : 250
              }
              customerEmail={email}
              customerName={`${firstName} ${lastName}`}
              onSuccess={(paymentIntentId) => {
                console.log('[BookingForm] Payment successful:', paymentIntentId);
                
                // Track payment completion and booking confirmation
                trackBookingConfirmed({
                  booking_value: appointmentType === 'couples-session' ? 300 : 
                                 appointmentType === 'ndis-psychology-session' ? 232.99 : 250,
                  appointment_type: appointmentType,
                });
                
                setStep('confirm');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              onCancel={() => {
                setStep('session');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 'confirm' && (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          {/* Success Header */}
          <div className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 mb-3" style={{ boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Payment Successful!</h3>
            <p className="text-sm text-slate-500 mt-1">Please confirm your booking details below</p>
          </div>

          {/* Booking Details Card */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* Card Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3">
              <h4 className="text-white font-semibold text-sm tracking-wide">Booking Summary</h4>
            </div>
            
            {/* Card Content */}
            <div className="divide-y divide-slate-100">
              <div className="flex items-center px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 mr-4">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Patient</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{firstName} {lastName}</p>
                </div>
              </div>
              
              <div className="flex items-center px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 mr-4">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{email}</p>
                </div>
              </div>
              
              {phone && (
                <div className="flex items-center px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 mr-4">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-semibold text-slate-800">{phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 mr-4">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Session Type</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {appointmentType
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center px-5 py-3.5 bg-emerald-50/50">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 mr-4">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Date & Time</p>
                  <p className="text-sm font-bold text-emerald-700">{formatDateForDisplay()}</p>
                </div>
              </div>
            </div>
            
            {notes && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Additional Notes</p>
                <p className="text-sm text-slate-600">{notes}</p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-100">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">A confirmation email will be sent to <span className="font-semibold">{email}</span> with your appointment details.</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('payment')}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 flex items-center justify-center transition-all"
              style={{ boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Confirming...
                </>
              ) : (
                'Confirm Booking →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {step === 'success' && (
        <div className="text-center py-8 sm:py-12">
          <div className="mb-6 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-500 flex items-center justify-center border-4 border-emerald-300" style={{ boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)' }}>
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
            Booking Confirmed!
          </h3>
          <p className="text-slate-500 text-lg mb-8 font-medium">
            Your appointment has been successfully booked.
          </p>
          <div className="rounded-xl border-2 border-slate-300 bg-gradient-to-b from-slate-100 to-white p-6 sm:p-8 text-left mb-8" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08)' }}>
            <div className="space-y-3 text-base">
              <div className="flex flex-col sm:flex-row sm:gap-2 py-2 border-b border-slate-200">
                <span className="font-bold text-slate-600 min-w-[140px] uppercase text-sm tracking-wide">
                  Appointment ID
                </span>
                <span className="text-slate-800 font-mono font-semibold">{appointmentId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2 py-2">
                <span className="font-bold text-slate-600 min-w-[140px] uppercase text-sm tracking-wide">
                  Date & Time
                </span>
                <span className="text-slate-800 font-semibold">{formatDateForDisplay()}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-slate-200">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                A confirmation email has been sent to{' '}
                <strong className="text-slate-800">{email}</strong> with your
                appointment details and telehealth link.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="px-10 py-4 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-base font-bold rounded-lg border-2 border-emerald-400 hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-300 focus:ring-offset-2 transition-all active:scale-[0.98]"
            style={{ boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)' }}
          >
            Done
          </button>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && (
        <div className="text-center py-8 sm:py-12">
          <div className="mb-6 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-b from-red-400 to-red-500 flex items-center justify-center border-4 border-red-300" style={{ boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)' }}>
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
            Booking Failed
          </h3>
          <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto leading-relaxed font-medium">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setStep('confirm');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-6 sm:px-8 md:px-10 py-2 sm:py-3 md:py-4 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm md:text-base font-bold rounded-lg border-2 border-emerald-400 hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-300 focus:ring-offset-2 transition-all active:scale-[0.98]"
              style={{ boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
