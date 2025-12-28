import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { halaxyClient, HalaxyClient } from '../utils/halaxyClient';
import { TimeSlotCalendar } from './TimeSlotCalendar';
import { apiService } from '../services/ApiService';

import {
  trackBookingStart,
  trackDetailsComplete,
  trackDatetimeSelected,
  trackPaymentInitiated,
  trackBookingComplete,
  trackBookingAbandonment,
  trackBookingConfirmed,
} from '../tracking';

// Lazy load StripePayment to reduce initial bundle size
const StripePayment = lazy(() => import('./StripePayment').then(m => ({ default: m.StripePayment })));

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
  const [_medicareSelectedThisSession, setMedicareSelectedThisSession] =
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

    if (!phone.trim()) {
      newErrors['phone'] = 'Phone number is required';
    } else if (!HalaxyClient.validatePhone(phone)) {
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
      phone.trim() !== '' &&
      HalaxyClient.validatePhone(phone) &&
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';
      const response = await fetch(`${apiUrl}/verify-code`, {
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';
      const response = await fetch(`${apiUrl}/send-verification-code`, {
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

  const handleSessionNext = async () => {
    if (validateSessionStep()) {
      // NDIS sessions skip payment - book directly
      if (appointmentType === 'ndis-psychology-session') {
        // Track as NDIS booking (no payment)
        trackPaymentInitiated({
          payment_method: 'ndis',
          booking_value: 0,
        });
        
        // Directly submit the booking without payment
        await handleSubmit();
        return;
      }
      
      // Track payment initiation for paid sessions
      const bookingValue = appointmentType === 'couples-session' ? 300 : 250;
      trackPaymentInitiated({
        payment_method: 'card',
        booking_value: bookingValue,
      });
      
      setStep('payment');
      // Scroll modal to top when changing steps
      window.dispatchEvent(new CustomEvent('bookingStepChanged'));
    }
  };

  /**
   * Handle payment authorization - implements Authorize → Book → Capture flow
   * 1. Payment is already authorized when this is called
   * 2. Create the Halaxy booking
   * 3. If booking succeeds → capture payment
   * 4. If booking fails → cancel payment authorization
   */
  const handlePaymentAuthorized = async (authorizedPaymentIntentId: string) => {
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
      // Convert DD/MM/YYYY to YYYY-MM-DD for Halaxy API
      if (dateOfBirth) {
        const dobParts = dateOfBirth.split('/');
        if (dobParts.length === 3) {
          patientData.dateOfBirth = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
        }
      }

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

      console.log('[BookingForm] Creating booking after payment authorization...');
      const result = await halaxyClient.createBooking(
        patientData,
        appointmentData
      );

      if (result.success && result.appointmentId) {
        // Booking succeeded - capture the payment
        console.log('[BookingForm] Booking created, capturing payment...');
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';
        const captureResponse = await apiService.post<{ success: boolean; error?: string }>(
          `${apiUrl}/capture-payment`,
          { 
            paymentIntentId: authorizedPaymentIntentId,
            appointmentId: result.appointmentId,
          }
        );

        if (!captureResponse.success) {
          // Payment capture failed - but booking exists
          // Log error but still show success (payment is authorized, will be captured later)
          console.error('[BookingForm] Payment capture failed:', captureResponse);
        } else {
          console.log('[BookingForm] Payment captured successfully');
        }

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
        trackBookingConfirmed({
          bookingId: result.appointmentId,
          booking_value: bookingValue,
        });
        
        setStep('success');
        onSuccess?.(result.appointmentId);
      } else {
        // Booking failed - cancel the payment authorization
        console.log('[BookingForm] Booking failed, canceling payment authorization...', { 
          paymentIntentId: authorizedPaymentIntentId,
          bookingError: result.error 
        });
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';
        let cancelSuccess = false;
        
        // Retry cancel up to 3 times
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const cancelResponse = await apiService.post<{ success: boolean }>(
              `${apiUrl}/cancel-payment`,
              { 
                paymentIntentId: authorizedPaymentIntentId,
                reason: 'booking_failed',
              }
            );
            console.log('[BookingForm] Payment authorization canceled', { attempt, response: cancelResponse });
            cancelSuccess = true;
            break;
          } catch (cancelError) {
            console.error(`[BookingForm] Failed to cancel payment (attempt ${attempt}/3):`, cancelError);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Wait 1s, 2s, 3s
            }
          }
        }

        if (!cancelSuccess) {
          // Critical: Payment cancel failed - alert user to contact support
          console.error('[BookingForm] CRITICAL: Failed to cancel payment authorization after 3 attempts');
          setErrorMessage(
            'Failed to create booking. There was an issue releasing the payment hold. Please contact support@life-psychology.com.au with reference: ' + authorizedPaymentIntentId
          );
        } else {
          setErrorMessage(
            result.error || 'Failed to create booking. Your payment has not been charged. Please try again.'
          );
        }
        setStep('error');
      }
    } catch (error) {
      console.error('[BookingForm] Submission error:', error);
      
      // Try to cancel the payment authorization with retries
      let cancelSuccess = false;
      if (authorizedPaymentIntentId) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await apiService.post(
              `${apiUrl}/cancel-payment`,
              { 
                paymentIntentId: authorizedPaymentIntentId,
                reason: 'booking_error',
              }
            );
            console.log('[BookingForm] Payment authorization canceled after error', { attempt });
            cancelSuccess = true;
            break;
          } catch (cancelError) {
            console.error(`[BookingForm] Failed to cancel payment after error (attempt ${attempt}/3):`, cancelError);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        if (!cancelSuccess) {
          console.error('[BookingForm] CRITICAL: Failed to cancel payment authorization after error');
          setErrorMessage(
            'An unexpected error occurred. There was an issue releasing the payment hold. Please contact support@life-psychology.com.au with reference: ' + authorizedPaymentIntentId
          );
          setStep('error');
          return;
        }
      }
      
      setErrorMessage('An unexpected error occurred. Your payment has not been charged. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // Convert DD/MM/YYYY to YYYY-MM-DD for Halaxy API
      if (dateOfBirth) {
        const dobParts = dateOfBirth.split('/');
        if (dobParts.length === 3) {
          patientData.dateOfBirth = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
        }
      }

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
        <div className="flex-shrink-0 mb-[clamp(8px,2vh,24px)]">
          {/* Title */}
          <div className="text-center mb-[clamp(8px,1.5vh,20px)]">
            <h2 className="text-[clamp(1.1rem,2.5vh,1.5rem)] font-bold text-slate-800 tracking-tight">
              Book Your Appointment
            </h2>
            <p className="text-slate-500 text-[clamp(0.75rem,1.5vh,0.875rem)] mt-1">
              Telehealth with Zoe Semmler
            </p>
          </div>
          
          {/* Progress indicator - clean horizontal stepper */}
          <div className="flex items-center justify-center gap-0">
            {[
              { num: 1, key: 'details', label: 'Details' },
              { num: 2, key: 'datetime', label: 'Date' },
              { num: 3, key: 'session', label: 'Session' },
              { num: 4, key: 'payment', label: 'Payment' },
            ].map(({ num, key, label }, index) => {
              const isActive = step === key || (key === 'datetime' && step === 'verify');
              const isPast = 
                (key === 'details' && ['verify', 'datetime', 'session', 'payment', 'success'].includes(step)) ||
                (key === 'datetime' && ['session', 'payment', 'success'].includes(step)) ||
                (key === 'session' && ['payment', 'success'].includes(step)) ||
                (key === 'payment' && step === 'success');
              return (
                <React.Fragment key={key}>
                  <div className="flex flex-col items-center min-w-[clamp(40px,8vw,60px)]">
                    <div
                      className={`w-[clamp(28px,4vh,40px)] h-[clamp(28px,4vh,40px)] rounded-full flex items-center justify-center text-[clamp(0.75rem,1.5vh,1rem)] font-bold transition-all ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-100'
                          : isPast
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                      }`}
                    >
                      {isPast ? '✓' : num}
                    </div>
                    <span 
                      className={`mt-1 text-[clamp(0.65rem,1.2vh,0.875rem)] font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-[clamp(24px,4vw,48px)] h-1 rounded-full mx-1 ${isPast ? 'bg-emerald-400' : isActive ? 'bg-blue-200' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Patient Details - scales to fit viewport */}
      {step === 'details' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden" onKeyDown={(e) => {
          if (e.key === 'Enter' && isDetailsStepValid() && !loading) {
            e.preventDefault();
            handleDetailsNext();
          }
        }}>
          <div className="flex flex-col gap-[clamp(8px,1.5vh,20px)] flex-1">
            {/* Name row - side by side */}
            <div className="grid grid-cols-2 gap-[clamp(6px,1.5vw,12px)]">
              <div>
                <label
                  htmlFor="firstName-input"
                  className="block text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold text-slate-700 mb-1"
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
                  className={`w-full px-2 py-[clamp(6px,1.2vh,10px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border ${errors['firstName'] ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
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
                    className="text-red-500 text-xs mt-1 font-medium"
                    role="alert"
                  >
                    {errors['firstName']}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName-input"
                  className="block text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold text-slate-700 mb-1"
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
                  className={`w-full px-2 py-[clamp(6px,1.2vh,10px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border ${errors['lastName'] ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
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
                    className="text-red-500 text-xs mt-1 font-medium"
                    role="alert"
                  >
                    {errors['lastName']}
                  </p>
                )}
              </div>
            </div>

          {/* Email and Phone row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(12px,2vh,16px)] sm:gap-[clamp(8px,1.5vw,12px)]">
            {/* Email field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold text-slate-700 mb-1"
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
                  className={`w-full px-2 py-[clamp(6px,1.2vh,10px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border ${errors['email'] ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                  placeholder="you@email.com"
                  aria-required="true"
                  aria-invalid={!!errors['email']}
                  aria-describedby={errors['email'] ? 'email-error' : 'email-hint'}
                />
                {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !errors['email'] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">✓</span>
                )}
              </div>
              {errors['email'] && (
                <p id="email-error" className="text-red-500 text-xs mt-1 font-medium" role="alert">{errors['email']}</p>
              )}
              {/* Smart email validation hint */}
              {email && email.length >= 3 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !errors['email'] && (() => {
                let message = '';
                let icon = '💡';
                
                const hasAt = email.includes('@');
                const atIndex = email.indexOf('@');
                const afterAt = hasAt ? email.slice(atIndex + 1) : '';
                const hasDot = afterAt.includes('.');
                const beforeAt = hasAt ? email.slice(0, atIndex) : email;
                
                if (!hasAt) {
                  message = 'Add @ followed by your email provider';
                  icon = '📧';
                } else if (beforeAt.length === 0) {
                  message = 'Add your name before the @';
                  icon = '✏️';
                } else if (afterAt.length === 0) {
                  message = 'Add your email provider after @';
                  icon = '🌐';
                } else if (!hasDot) {
                  message = 'Add .com, .au, etc. after the provider';
                  icon = '🌐';
                } else if (afterAt.endsWith('.')) {
                  message = 'Complete the domain (e.g. .com)';
                  icon = '✏️';
                }
                
                if (!message) return null;
                
                return (
                  <div id="email-hint" className="flex items-center gap-1.5 mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                    <span className="text-sm">{icon}</span>
                    <span className="text-amber-700 text-xs font-medium">{message}</span>
                  </div>
                );
              })()}
            </div>

            {/* Phone field */}
            <div>
              <label
                htmlFor="phone-input"
                className="block text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold text-slate-700 mb-1"
              >
                Phone{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <div className="relative">
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-2 py-[clamp(6px,1.2vh,10px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border ${errors['phone'] ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
                  placeholder="0412345678"
                  aria-required="true"
                  aria-invalid={!!errors['phone']}
                  aria-describedby={errors['phone'] ? 'phone-error' : 'phone-hint'}
                />
                {phone && HalaxyClient.validatePhone(phone) && !errors['phone'] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">✓</span>
                )}
              </div>
              {errors['phone'] && (
                <p id="phone-error" className="text-red-500 text-xs mt-1 font-medium" role="alert">{errors['phone']}</p>
              )}
              {/* Smart phone validation hint */}
              {phone && !HalaxyClient.validatePhone(phone) && !errors['phone'] && (() => {
                const digitsOnly = phone.replace(/\D/g, '');
                const digitCount = digitsOnly.length;
                
                // Don't show hint until they've typed at least 4 characters
                if (digitCount < 4) return null;
                
                // Determine what's wrong and give helpful guidance
                let message = '';
                let icon = '💡';
                
                if (!digitsOnly.startsWith('04')) {
                  message = 'Australian mobiles start with 04';
                  icon = '📱';
                } else if (digitCount < 10) {
                  const remaining = 10 - digitCount;
                  message = `${remaining} more digit${remaining === 1 ? '' : 's'} needed`;
                  icon = '✏️';
                } else if (digitCount > 10) {
                  const extra = digitCount - 10;
                  message = `${extra} digit${extra === 1 ? '' : 's'} too many`;
                  icon = '⚠️';
                }
                
                if (!message) return null;
                
                return (
                  <div id="phone-hint" className="flex items-center gap-1.5 mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                    <span className="text-sm">{icon}</span>
                    <span className="text-amber-700 text-xs font-medium">{message}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* DOB and Gender row - stacks on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(8px,1.5vh,16px)] sm:gap-[clamp(6px,1.5vw,12px)]">
            <div>
              <label className="block text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold text-slate-700 mb-1">
                Date of Birth <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="dob-day"
                  value={dateOfBirth.split('/')[0] || ''}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className={`flex-1 min-w-0 pl-2 pr-6 py-[clamp(6px,1.2vh,12px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border appearance-none ${errors['dateOfBirth'] ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'}`}
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                    backgroundSize: '12px'
                  }}
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
                  className={`flex-1 min-w-0 pl-2 pr-6 py-[clamp(6px,1.2vh,12px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border appearance-none ${errors['dateOfBirth'] ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'}`}
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                    backgroundSize: '12px'
                  }}
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
                  className={`flex-1 min-w-0 pl-2 pr-6 py-[clamp(6px,1.2vh,12px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border appearance-none ${errors['dateOfBirth'] ? 'border-red-300' : 'border-slate-200 focus:border-blue-400'}`}
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                    backgroundSize: '12px'
                  }}
                  aria-label="Year of birth"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              {errors['dateOfBirth'] && (
                <p id="dob-error" className="text-red-500 text-xs mt-1" role="alert">{errors['dateOfBirth']}</p>
              )}
            </div>
            <div>
              <label htmlFor="gender-select" className="block text-[clamp(0.75rem,1.5vh,0.875rem)] font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                id="gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
                className="w-full pl-2 pr-6 py-[clamp(6px,1.2vh,12px)] text-[clamp(0.8rem,1.6vh,1rem)] bg-white rounded-lg focus:outline-none transition-all border border-slate-200 focus:border-blue-400 appearance-none"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 6px center',
                  backgroundSize: '12px'
                }}
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
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0" role="img" aria-label="info">👋</span>
                <p className="text-[clamp(0.7rem,1.3vh,0.875rem)] font-medium text-blue-900">{dobWarning}</p>
              </div>
            </div>
          )}

          {/* Action button - pushed to bottom */}
          <div className="flex justify-center pt-[clamp(4px,1vh,8px)] mt-auto">
            <button
              type="button"
              onClick={handleDetailsNext}
              disabled={!isDetailsStepValid()}
              className={`w-full sm:w-auto px-6 py-[clamp(10px,2vh,14px)] text-[clamp(0.875rem,1.8vh,1rem)] font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDetailsStepValid()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400 cursor-pointer shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              aria-disabled={!isDetailsStepValid()}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                'Next'
              )}
            </button>
          </div>
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest bg-white rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
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
                  ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white border-2 border-blue-400 hover:from-blue-600 hover:to-blue-700'
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
                className="text-blue-600 hover:text-blue-700 font-medium"
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Calendar Section - takes all available space */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3 flex-shrink-0 pt-2 pb-1 mt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="font-semibold rounded-lg text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
              style={{ padding: 'clamp(6px, 1.5vh, 10px) clamp(10px, 3vw, 16px)', fontSize: 'clamp(11px, 2.5vw, 13px)' }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleDateTimeNext}
              disabled={!isDateTimeStepValid()}
              className={`font-semibold rounded-lg transition-all ${
                isDateTimeStepValid()
                  ? 'text-white bg-blue-500 hover:bg-blue-600 cursor-pointer shadow-md'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
              }`}
              style={{ padding: 'clamp(6px, 1.5vh, 10px) clamp(12px, 4vw, 20px)', fontSize: 'clamp(11px, 2.5vw, 13px)' }}
              aria-disabled={!isDateTimeStepValid()}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Session Type & Notes */}
      {step === 'session' && (
        <div className="flex flex-col flex-1 min-h-0 gap-[1.5vh]">
          {/* Appointment Type Section */}
          <div>
            <label
              htmlFor="appointmentType-select"
              className="block text-[clamp(10px,1.5vh,14px)] font-semibold text-slate-700 mb-[0.5vh] uppercase tracking-wide"
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
              className={`w-full px-[1.5vh] py-[1.2vh] text-[clamp(14px,2vh,18px)] font-medium bg-white rounded-lg focus:outline-none transition-all border ${errors['appointmentType'] ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100'}`}
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
                className="text-red-500 text-[clamp(10px,1.4vh,12px)] mt-[0.5vh] font-medium"
                role="alert"
              >
                {errors['appointmentType']}
              </p>
            )}

            <p
              id="appointmentType-hint"
              className="mt-[0.8vh] text-[clamp(11px,1.6vh,14px)] text-slate-500 px-1"
            >
              💡 Medicare rebates available for eligible appointments ($250 − $98.95 rebate = $151.05 gap)
            </p>
          </div>

          {/* Notes Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <label
              htmlFor="notes-textarea"
              className="block text-[clamp(10px,1.5vh,14px)] font-semibold text-slate-700 mb-[0.5vh] uppercase tracking-wide"
            >
              Notes <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>

            <div className="mb-[0.8vh] flex items-center gap-2">
              <input
                type="checkbox"
                id="first-session-toggle"
                checked={isFirstSession}
                onChange={(e) => setIsFirstSession(e.target.checked)}
                className="h-[2vh] w-[2vh] min-h-[16px] min-w-[16px] cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-200"
                aria-describedby="first-session-hint"
              />
              <label
                htmlFor="first-session-toggle"
                className="text-[clamp(12px,1.8vh,14px)] text-slate-700 cursor-pointer"
              >
                👋 This is my first session with Zoe
              </label>
            </div>

            {isFirstSession && (
              <div className="mb-[0.8vh] p-[1vh] rounded-lg bg-slate-50 border border-slate-200 text-[clamp(11px,1.5vh,13px)] text-slate-600">
                <p className="font-medium text-slate-700">What to include:</p>
                <p>Your goals, previous therapy experience, current challenges, and session preferences.</p>
              </div>
            )}

            <textarea
              id="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full flex-1 min-h-[6vh] rounded-lg border border-slate-200 px-[1.5vh] py-[1vh] text-[clamp(14px,2vh,16px)] focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all bg-white resize-none"
              placeholder={
                isFirstSession
                  ? 'Share the top things Zoe should know before your first session...'
                  : "Any additional information you'd like to share..."
              }
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3 flex-shrink-0 pt-[0.5vh]">
            <button
              type="button"
              onClick={() => {
                setStep('datetime');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-[1.5vh] py-[1vh] text-[clamp(10px,1.5vh,12px)] font-semibold rounded-md text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSessionNext}
              disabled={!isSessionStepValid() || loading}
              className={`px-[2vh] py-[1vh] text-[clamp(10px,1.5vh,12px)] font-semibold rounded-md transition-all ${
                isSessionStepValid() && !loading
                  ? 'text-white bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
              }`}
              aria-disabled={!isSessionStepValid() || loading}
            >
              {loading ? 'Booking...' : appointmentType === 'ndis-psychology-session' ? 'Book Now →' : 'Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 'payment' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Payment Summary */}
          <div className="mb-[2vh] p-[1.5vh] bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center text-[clamp(11px,1.8vh,14px)]">
              <span className="text-slate-600">
                {appointmentType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
              <span className="font-bold text-slate-800">
                ${appointmentType === 'couples-session' ? '300.00' : appointmentType === 'ndis-psychology-session' ? '232.99' : '250.00'}
              </span>
            </div>
            <div className="text-[clamp(9px,1.4vh,12px)] text-slate-500 mt-1">
              {formatDateForDisplay()}
            </div>
          </div>

          {/* Stripe Payment Form */}
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          }>
            <StripePayment
              amount={appointmentType === 'couples-session' ? 300 : appointmentType === 'ndis-psychology-session' ? 232.99 : 250}
              customerEmail={email}
              customerName={`${firstName} ${lastName}`}
              onSuccess={handlePaymentAuthorized}
              onCancel={() => {
                setStep('session');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
            />
          </Suspense>

          {/* Loading overlay when processing booking */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg">
              <div className="animate-spin h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full mb-3"></div>
              <p className="text-slate-600 font-medium">Creating your booking...</p>
              <p className="text-slate-400 text-sm">Please wait, do not close this window</p>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-2">
          <div className="mb-[2vh] rounded-2xl bg-gradient-to-b from-blue-400 to-blue-500 flex items-center justify-center border-4 border-blue-300" style={{ width: 'clamp(48px, 10vh, 80px)', height: 'clamp(48px, 10vh, 80px)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)' }}>
            <svg
              className="text-white"
              style={{ width: 'clamp(24px, 5vh, 40px)', height: 'clamp(24px, 5vh, 40px)' }}
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
          <h3 className="font-extrabold text-slate-800 mb-[0.5vh] text-center" style={{ fontSize: 'clamp(16px, 3vh, 24px)' }}>
            Booking Confirmed!
          </h3>
          <p className="text-slate-500 font-medium text-center mb-[1.5vh]" style={{ fontSize: 'clamp(12px, 2vh, 16px)' }}>
            Your appointment has been successfully booked.
          </p>
          <div className="w-full rounded-xl border-2 border-slate-300 bg-gradient-to-b from-slate-100 to-white text-left mb-[2vh]" style={{ padding: 'clamp(8px, 2vh, 24px)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08)' }}>
            <div className="space-y-[0.5vh]">
              <div className="flex flex-col sm:flex-row sm:gap-2 py-[0.5vh] border-b border-slate-200">
                <span className="font-bold text-slate-600 min-w-[100px] uppercase tracking-wide" style={{ fontSize: 'clamp(10px, 1.5vh, 14px)' }}>
                  Appointment ID
                </span>
                <span className="text-slate-800 font-mono font-semibold" style={{ fontSize: 'clamp(11px, 1.8vh, 14px)' }}>{appointmentId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2 py-[0.5vh]">
                <span className="font-bold text-slate-600 min-w-[100px] uppercase tracking-wide" style={{ fontSize: 'clamp(10px, 1.5vh, 14px)' }}>
                  Date & Time
                </span>
                <span className="text-slate-800 font-semibold" style={{ fontSize: 'clamp(11px, 1.8vh, 14px)' }}>{formatDateForDisplay()}</span>
              </div>
            </div>
            <div className="mt-[1vh] pt-[1vh] border-t-2 border-slate-200">
              <p className="text-slate-600 leading-relaxed font-medium" style={{ fontSize: 'clamp(10px, 1.5vh, 14px)' }}>
                A confirmation email has been sent to{' '}
                <strong className="text-slate-800">{email}</strong> with your
                appointment details and telehealth link.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="bg-gradient-to-b from-blue-500 to-blue-600 text-white font-bold rounded-lg border-2 border-blue-400 hover:from-blue-400 hover:to-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-offset-2 transition-all active:scale-[0.98]"
            style={{ padding: 'clamp(8px, 1.5vh, 12px) clamp(24px, 5vw, 32px)', fontSize: 'clamp(12px, 2vh, 16px)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)' }}
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
                setStep('details');
                setErrorMessage('');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-6 sm:px-8 md:px-10 py-2 sm:py-3 md:py-4 bg-gradient-to-b from-blue-500 to-blue-600 text-white text-xs sm:text-sm md:text-base font-bold rounded-lg border-2 border-blue-400 hover:from-blue-400 hover:to-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-300 focus:ring-offset-2 transition-all active:scale-[0.98]"
              style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
