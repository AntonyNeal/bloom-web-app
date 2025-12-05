import React, { useState, useEffect, useRef } from 'react';
import { halaxyClient, HalaxyClient } from '../utils/halaxyClient';
import { TimeSlotCalendar } from './TimeSlotCalendar';
import { StripePayment } from './StripePayment';
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
    'details' | 'datetime' | 'payment' | 'confirm' | 'success' | 'error'
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

    if (!appointmentType) {
      newErrors['appointmentType'] = 'Please select an appointment type';
    }

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

  // Check if date/time step is valid (without setting errors)
  const isDateTimeStepValid = (): boolean => {
    if (!appointmentType || !appointmentDate || !appointmentTime) {
      return false;
    }

    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate >= today;
  };

  const handleDetailsNext = () => {
    if (validateDetailsStep()) {
      // Track details completion
      trackDetailsComplete({
        firstName,
        lastName,
        email,
        phone,
        appointmentType,
        is_returning_user: !!localStorage.getItem('lpa_user_details'),
      });
      
      setStep('datetime');
      // Scroll modal to top when changing steps
      window.dispatchEvent(new CustomEvent('bookingStepChanged'));
    }
  };

  const handleDateTimeNext = () => {
    if (validateDateTimeStep()) {
      // Track datetime selection
      trackDatetimeSelected({
        selectedDate: appointmentDate,
        selectedTime: appointmentTime,
      });
      
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
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-[28px] font-bold text-gray-900">
          Book Your Appointment
        </h2>
        <p className="text-gray-600 mt-1.5 text-base">
          Schedule a telehealth session with Zoe Semmler
        </p>
      </div>

      {/* Progress indicator */}
      {step !== 'success' && step !== 'error' && (
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm font-semibold">
            <div
              className={`${step === 'details' ? 'text-blue-600' : step === 'datetime' || step === 'payment' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}
            >
              <div className="text-center">1. Details</div>
            </div>
            <div
              className={`${step === 'datetime' ? 'text-blue-600' : step === 'payment' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}
            >
              <div className="text-center">2. Time</div>
            </div>
            <div
              className={`${step === 'payment' ? 'text-blue-600' : step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}
            >
              <div className="text-center">3. Payment</div>
            </div>
            <div
              className={`${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div className="text-center">4. Confirm</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width:
                  step === 'details'
                    ? '25%'
                    : step === 'datetime'
                      ? '50%'
                      : step === 'payment'
                        ? '75%'
                        : '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Patient Details */}
      {step === 'details' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName-input"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                First Name{' '}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </label>
              <input
                id="firstName-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors ${errors['firstName'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
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
                  className="text-red-600 text-sm mt-2"
                  role="alert"
                >
                  {errors['firstName']}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName-input"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                Last Name{' '}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </label>
              <input
                id="lastName-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors ${errors['lastName'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
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
                  className="text-red-600 text-sm mt-2"
                  role="alert"
                >
                  {errors['lastName']}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email-input"
              className="block text-base font-medium text-gray-900 mb-2"
            >
              Email{' '}
              <span className="text-red-600" aria-label="required">
                *
              </span>
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors ${errors['email'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
              placeholder="john.smith@example.com"
              aria-required="true"
              aria-invalid={!!errors['email']}
              aria-describedby={errors['email'] ? 'email-error' : undefined}
            />
            {errors['email'] && (
              <p
                id="email-error"
                className="text-red-600 text-sm mt-2"
                role="alert"
              >
                {errors['email']}
              </p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-gray-900 mb-2">
              Date of Birth
              <span className="text-red-600 ml-1" aria-label="required">
                *
              </span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="dob-day" className="sr-only">
                  Day
                </label>
                <select
                  id="dob-day"
                  value={dateOfBirth.split('/')[0] || ''}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors bg-white ${errors['dateOfBirth'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                  aria-label="Day of birth"
                  aria-required="true"
                  aria-invalid={!!errors['dateOfBirth']}
                  aria-describedby={
                    errors['dateOfBirth'] ? 'dob-error' : undefined
                  }
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dob-month" className="sr-only">
                  Month
                </label>
                <select
                  id="dob-month"
                  value={dateOfBirth.split('/')[1] || ''}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors bg-white ${errors['dateOfBirth'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                  aria-label="Month of birth"
                  aria-required="true"
                  aria-invalid={!!errors['dateOfBirth']}
                  aria-describedby={
                    errors['dateOfBirth'] ? 'dob-error' : undefined
                  }
                >
                  <option value="">Month</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div>
                <label htmlFor="dob-year" className="sr-only">
                  Year
                </label>
                <select
                  id="dob-year"
                  value={dateOfBirth.split('/')[2] || ''}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors bg-white ${errors['dateOfBirth'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                  aria-label="Year of birth"
                  aria-required="true"
                  aria-invalid={!!errors['dateOfBirth']}
                  aria-describedby={
                    errors['dateOfBirth'] ? 'dob-error' : undefined
                  }
                >
                  <option value="">Year</option>
                  {/* Current year back to 100 years ago (age 0-100) */}
                  {Array.from({ length: 101 }, (_, i) => 2025 - i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            {dobWarning && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <span
                    className="text-3xl flex-shrink-0"
                    role="img"
                    aria-label="waving hand"
                  >
                    👋
                  </span>
                  <div>
                    <p className="text-sm font-medium text-blue-900 leading-relaxed">
                      {dobWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {errors['dateOfBirth'] && (
              <p
                id="dob-error"
                className="text-red-600 text-sm mt-2"
                role="alert"
              >
                {errors['dateOfBirth']}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              Required - helps us provide age-appropriate care
            </p>
          </div>

          <div>
            <label
              htmlFor="phone-input"
              className="block text-base font-medium text-gray-900 mb-2"
            >
              Phone (optional - enables SMS appointment notifications)
            </label>
            <input
              id="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none transition-colors ${errors['phone'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
              placeholder="0400 000 000"
              aria-invalid={!!errors['phone']}
              aria-describedby={errors['phone'] ? 'phone-error' : undefined}
            />
            {errors['phone'] && (
              <p
                id="phone-error"
                className="text-red-600 text-sm mt-2"
                role="alert"
              >
                {errors['phone']}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="gender-select"
              className="block text-base font-medium text-gray-900 mb-2"
            >
              Gender
            </label>
            <select
              id="gender-select"
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white"
            >
              <option value="unknown">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="genderqueer">Genderqueer</option>
              <option value="genderfluid">Genderfluid</option>
              <option value="agender">Agender</option>
              <option value="transgender-male">Transgender Male</option>
              <option value="transgender-female">Transgender Female</option>
              <option value="two-spirit">Two-Spirit</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 sm:pt-10 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3.5 text-base font-medium border-2 border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDetailsNext}
              disabled={!isDetailsStepValid()}
              className={`px-8 py-3.5 text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDetailsStepValid()
                  ? 'bg-green-700 text-white hover:bg-green-800 focus:ring-green-600 shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
              aria-disabled={!isDetailsStepValid()}
            >
              Next {isDetailsStepValid() && '→'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 'datetime' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="order-2 lg:order-1 space-y-4">
              <div>
                <label className="block text-xl font-bold text-gray-900 mb-3">
                  Pick a time{' '}
                  <span className="text-red-600" aria-label="required">
                    *
                  </span>
                </label>
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
                {(errors['appointmentDate'] || errors['appointmentTime']) && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors['appointmentDate'] || errors['appointmentTime']}
                  </p>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <label
                  htmlFor="appointmentType-select"
                  className="block text-lg font-semibold text-gray-900 mb-2"
                >
                  Appointment Type{' '}
                  <span className="text-red-600" aria-label="required">
                    *
                  </span>
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
                  className={`w-full px-4 py-3.5 text-base border-2 rounded-lg focus:outline-none transition-colors bg-white ${errors['appointmentType'] ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
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
                    className="text-red-600 text-sm mt-2"
                    role="alert"
                  >
                    {errors['appointmentType']}
                  </p>
                )}

                {appointmentType === 'medicare-psychologist-session' &&
                  medicareSelectedThisSession && (
                    <div className="mt-3 space-y-3 rounded-lg border border-green-200 bg-green-50/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span aria-hidden="true">💚</span>
                        Medicare Session Cost Breakdown
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-gray-700">
                        <div className="rounded-lg border border-green-200 bg-white p-3">
                          <div className="mb-1">Session Fee</div>
                          <div className="text-lg font-bold text-gray-900">
                            $250
                          </div>
                        </div>
                        <div className="rounded-lg border border-green-200 bg-white p-3">
                          <div className="mb-1">Medicare Rebate</div>
                          <div className="text-lg font-bold text-green-600">
                            -$145.25
                          </div>
                        </div>
                        <div className="rounded-lg border border-blue-500 bg-gradient-to-br from-blue-500 to-indigo-600 p-3 text-blue-50">
                          <div className="mb-1">Your Gap</div>
                          <div className="text-lg font-bold text-white">
                            $104.75
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-600 text-center">
                        Requires a valid GP Mental Health Treatment Plan
                      </p>
                    </div>
                  )}

                {!(
                  appointmentType === 'medicare-psychologist-session' &&
                  medicareSelectedThisSession
                ) && (
                  <p
                    id="appointmentType-hint"
                    className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-gray-700"
                  >
                    💡 Medicare rebates available for eligible appointments ($250 -
                    $145.25 rebate = $104.75 gap)
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="notes-textarea"
                  className="block text-base font-medium text-gray-900 mb-2"
                >
                  Notes (optional)
                </label>
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3">
                  <input
                    type="checkbox"
                    id="first-session-toggle"
                    checked={isFirstSession}
                    onChange={(e) => setIsFirstSession(e.target.checked)}
                    className="h-5 w-5 cursor-pointer rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-describedby="first-session-hint"
                  />
                  <label
                    htmlFor="first-session-toggle"
                    className="text-sm font-semibold text-gray-900 cursor-pointer"
                  >
                    👋 This is my first session with Zoe
                  </label>
                </div>

                {isFirstSession && (
                  <details
                    open
                    className="mb-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-sm text-gray-700"
                  >
                    <summary className="mb-2 cursor-pointer font-semibold text-gray-900">
                      What should I include?
                    </summary>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>What brings you to therapy and your goals</li>
                      <li>Any previous therapy experience</li>
                      <li>Current challenges or symptoms</li>
                      <li>How you prefer sessions to run</li>
                    </ul>
                    <p className="mt-2 text-[12px] text-gray-600">
                      Keep it brief—Zoe will explore everything in session, this just gives her a heads‑up.
                    </p>
                  </details>
                )}

                <textarea
                  id="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={isFirstSession ? 5 : 3}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder={
                    isFirstSession
                      ? 'Share the top things Zoe should know before your first session...'
                      : "Any additional information you'd like to share..."
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 border-t border-gray-100 pt-4 sm:pt-8">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-8 py-3.5 text-base font-medium border-2 border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleDateTimeNext}
              disabled={!isDateTimeStepValid()}
              className={`px-8 py-3.5 text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDateTimeStepValid()
                  ? 'bg-green-700 text-white hover:bg-green-800 focus:ring-green-600 shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
              aria-disabled={!isDateTimeStepValid()}
            >
              Next {isDateTimeStepValid() && '→'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-8 rounded-xl shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-5">
              Payment Details
            </h3>
            <div className="text-base text-gray-900 space-y-3">
              <div>
                <span className="font-semibold">Appointment Type:</span>{' '}
                {appointmentType === 'psychologist-session'
                  ? 'Psychologist Session'
                  : appointmentType === 'medicare-psychologist-session'
                    ? 'Medicare Psychologist Session'
                    : appointmentType === 'couples-session'
                      ? 'Couples Session'
                      : 'NDIS Psychology Session'}
              </div>
              <div>
                <span className="font-semibold">Amount:</span>{' '}
                {appointmentType === 'couples-session'
                  ? '$300.00'
                  : appointmentType === 'ndis-psychology-session'
                    ? '$232.99'
                    : '$250.00'}
              </div>
            </div>
          </div>

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
              setStep('datetime');
              window.dispatchEvent(new CustomEvent('bookingStepChanged'));
            }}
          />
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-8 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-5">
              Please confirm your booking details:
            </h3>

            <div className="space-y-3 text-base">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-gray-700 min-w-[140px]">
                  Patient:
                </span>
                <span className="text-gray-900">
                  {firstName} {lastName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-gray-700 min-w-[140px]">
                  Email:
                </span>
                <span className="text-gray-900">{email}</span>
              </div>
              {phone && (
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="font-semibold text-gray-700 min-w-[140px]">
                    Phone:
                  </span>
                  <span className="text-gray-900">{phone}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-gray-700 min-w-[140px]">
                  Appointment:
                </span>
                <span className="text-gray-900">
                  {appointmentType
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-gray-700 min-w-[140px]">
                  Date & Time:
                </span>
                <span className="text-gray-900">{formatDateForDisplay()}</span>
              </div>
              {notes && (
                <div className="flex flex-col sm:flex-row sm:gap-2 pt-2 border-t border-green-200">
                  <span className="font-semibold text-gray-700 min-w-[140px]">
                    Notes:
                  </span>
                  <span className="text-gray-900">{notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
            <button
              type="button"
              onClick={() => setStep('payment')}
              disabled={loading}
              className="px-8 py-3.5 text-base font-medium border-2 border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3.5 text-base font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 shadow-md hover:shadow-lg flex items-center justify-center transition-all"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {step === 'success' && (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg
              className="w-20 h-20 text-green-500 mx-auto"
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
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Booking Confirmed!
          </h3>
          <p className="text-gray-600 text-lg mb-8">
            Your appointment has been successfully booked.
          </p>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-8 rounded-xl text-left mb-8 shadow-sm">
            <div className="space-y-3 text-base">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-gray-700 min-w-[140px]">
                  Appointment ID:
                </span>
                <span className="text-gray-900 font-mono">{appointmentId}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-gray-700 min-w-[140px]">
                  Date & Time:
                </span>
                <span className="text-gray-900">{formatDateForDisplay()}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                A confirmation email has been sent to{' '}
                <strong className="text-gray-900">{email}</strong> with your
                appointment details and telehealth link.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="px-8 py-3.5 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg
              className="w-20 h-20 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Booking Failed
          </h3>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setStep('confirm');
                window.dispatchEvent(new CustomEvent('bookingStepChanged'));
              }}
              className="px-8 py-3.5 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="px-8 py-3.5 border-2 border-gray-300 rounded-lg text-gray-900 text-base font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
