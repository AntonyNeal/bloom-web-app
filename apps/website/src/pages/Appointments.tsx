import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { trackPageView } from '../utils/trackingEvents';
import { trackBookNowClick } from '../tracking';
import { useBooking } from '../hooks/useBooking';

const Appointments = () => {
  const { openBookingModal } = useBooking('appointments_page');

  // Interactive service selection state
  const [serviceSelectionExpanded, setServiceSelectionExpanded] =
    useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceSelectionComplete, setServiceSelectionComplete] =
    useState(false);

  // Ref for managing focus
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstServiceButtonRef = useRef<HTMLButtonElement>(null);

  // Service options for booking
  const serviceOptions = [
    {
      id: 'medicare',
      title: 'Medicare Psychology',
      description: 'Have a GP Mental Health Plan',
    },
    {
      id: 'ndis',
      title: 'NDIS Psychology',
      description: 'NDIS participant with funding',
    },
    {
      id: 'couples',
      title: 'Couples Therapy',
      description: 'Relationship support together',
    },
    {
      id: 'individual',
      title: 'Individual Session',
      description: 'Private or health insurance',
    },
    {
      id: 'supervision',
      title: 'Professional Supervision',
      description: 'For provisional psychologists',
    },
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setServiceSelectionComplete(true);
    setServiceSelectionExpanded(false);
  };

  const toggleServiceSelection = () => {
    const newState = !serviceSelectionExpanded;
    setServiceSelectionExpanded(newState);

    // Focus first service button when opening dropdown
    if (newState) {
      setTimeout(() => {
        firstServiceButtonRef.current?.focus();
      }, 100);
    }
  };

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && serviceSelectionExpanded) {
        setServiceSelectionExpanded(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [serviceSelectionExpanded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setServiceSelectionExpanded(false);
      }
    };

    if (serviceSelectionExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [serviceSelectionExpanded]);

  const getSelectedServiceLabel = () => {
    const service = serviceOptions.find((s) => s.id === selectedService);
    return service ? `${service.title} - ${service.description}` : '';
  };

  // Track page view
  useEffect(() => {
    trackPageView({
      page_type: 'appointments',
      page_title: 'Book an Appointment',
    });
  }, []);

  return (
    <>
      <Helmet>
        <title>Book an Appointment - Life Psychology Australia</title>
        <meta
          name="description"
          content="Book your psychology appointment online. Medicare rebates, NDIS, private health insurance accepted. Individual therapy, couples counselling, professional supervision."
        />
        <meta
          name="keywords"
          content="psychology appointment, book psychologist, Medicare rebate, NDIS psychology, couples therapy, mental health appointment"
        />
        <link
          rel="canonical"
          href="https://lifepsychology.com.au/appointments"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                How to Book Your Appointment
              </h1>
              <p className="text-xl text-gray-600">
                Four simple steps to get started with your therapy journey
              </p>
            </div>

            {/* Four Horizontal Circles */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8">
              {/* Circles Row */}
              <div
                className="flex flex-col sm:flex-row justify-center items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-4 lg:space-x-8 mb-8 sm:mb-12"
                role="list"
                aria-label="Booking process steps"
              >
                {/* Step 1: Click Book Now */}
                <div
                  className="flex flex-col items-center text-center max-w-full sm:max-w-32 w-full sm:w-auto"
                  role="listitem"
                >
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mb-3 sm:mb-4 shadow-md"
                    aria-hidden="true"
                  >
                    1
                  </div>
                  <div className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                    Click Book Now
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight px-2 sm:px-0">
                    Click 'Book Now' to access our secure, confidential booking
                    service
                  </div>
                </div>

                {/* Step 2: Select a Service */}
                <div
                  className="flex flex-col items-center text-center max-w-full sm:max-w-32 w-full sm:w-auto relative"
                  role="listitem"
                  ref={dropdownRef}
                >
                  <button
                    onClick={toggleServiceSelection}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleServiceSelection();
                      }
                    }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mb-3 sm:mb-4 transition-all cursor-pointer touch-manipulation shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 ${
                      serviceSelectionComplete
                        ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300'
                    }`}
                    aria-label={
                      serviceSelectionComplete
                        ? `Service selected: ${getSelectedServiceLabel()}. Click to change.`
                        : 'Step 2: Select a service. Click to open service options.'
                    }
                    aria-expanded={serviceSelectionExpanded}
                    aria-haspopup="true"
                  >
                    {serviceSelectionComplete ? (
                      <span
                        className="text-xl sm:text-2xl font-bold"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    ) : (
                      '2'
                    )}
                  </button>
                  <button
                    onClick={toggleServiceSelection}
                    className={`text-sm sm:text-base font-medium mb-2 cursor-pointer transition-colors touch-manipulation focus:outline-none focus:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 ${
                      serviceSelectionComplete
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-gray-900 hover:text-blue-600'
                    }`}
                    aria-label={
                      serviceSelectionComplete
                        ? `Change service: ${getSelectedServiceLabel()}`
                        : 'Select a service'
                    }
                  >
                    {serviceSelectionComplete ? (
                      <span className="flex items-center justify-center flex-wrap gap-1">
                        <span
                          className="text-green-600 text-base sm:text-lg"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        <span className="text-green-600 font-semibold text-sm sm:text-base">
                          {getSelectedServiceLabel()}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span>Select a Service</span>{' '}
                        <span
                          className={`inline-block transition-transform duration-200 ${
                            serviceSelectionExpanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        >
                          ▼
                        </span>
                      </span>
                    )}
                  </button>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight px-2 sm:px-0">
                    Choose your service type from the options below
                  </div>

                  {/* Service Selection Dropdown - Positioned directly under Step 2 */}
                  {serviceSelectionExpanded && (
                    <div
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-50 w-[95vw] sm:w-96 max-w-md"
                      role="dialog"
                      aria-label="Select your service type"
                    >
                      <div className="service-options-dropdown bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 sm:p-5 animate-in slide-in-from-top-2 duration-300 ease-in-out">
                        <div className="max-w-2xl mx-auto">
                          <h3
                            className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-center"
                            id="service-selection-title"
                          >
                            Choose Your Service Type
                          </h3>
                          <div
                            className="grid grid-cols-1 gap-3"
                            role="list"
                            aria-labelledby="service-selection-title"
                          >
                            {serviceOptions.map((service, index) => (
                              <button
                                key={service.id}
                                ref={
                                  index === 0
                                    ? firstServiceButtonRef
                                    : undefined
                                }
                                onClick={() => handleServiceSelect(service.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleServiceSelect(service.id);
                                  }
                                }}
                                className="flex items-center p-3 sm:p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all duration-200 text-left group focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation min-h-[60px] sm:min-h-[auto]"
                                role="listitem"
                                aria-label={`${service.title}: ${service.description}`}
                              >
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                                    {service.title}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 group-hover:text-blue-600 transition-colors mt-1">
                                    {service.description}
                                  </div>
                                </div>
                                <div
                                  className="ml-3 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
                                  aria-hidden="true"
                                >
                                  <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Select Time */}
                <div
                  className="flex flex-col items-center text-center max-w-full sm:max-w-32 w-full sm:w-auto"
                  role="listitem"
                >
                  <button
                    onClick={() =>
                      serviceSelectionComplete &&
                      alert(
                        'Time selection will be available in the booking system'
                      )
                    }
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mb-3 sm:mb-4 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-offset-2 touch-manipulation ${
                      serviceSelectionComplete
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer focus:ring-blue-300'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed focus:ring-gray-300'
                    }`}
                    disabled={!serviceSelectionComplete}
                    aria-label={
                      serviceSelectionComplete
                        ? 'Step 3: Select Time - Available after service selection'
                        : 'Step 3: Select Time - Complete step 2 first'
                    }
                    aria-disabled={!serviceSelectionComplete}
                  >
                    3
                  </button>
                  <div
                    className={`text-sm sm:text-base font-medium mb-2 ${
                      serviceSelectionComplete
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    Select Time
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight px-2 sm:px-0">
                    Choose a convenient time that works best for you
                  </div>
                </div>

                {/* Step 4: Complete Forms */}
                <div
                  className="flex flex-col items-center text-center max-w-full sm:max-w-32 w-full sm:w-auto"
                  role="listitem"
                >
                  <button
                    onClick={() =>
                      serviceSelectionComplete &&
                      alert(
                        'Form completion will be available in the booking system'
                      )
                    }
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mb-3 sm:mb-4 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-offset-2 touch-manipulation ${
                      serviceSelectionComplete
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer focus:ring-blue-300'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed focus:ring-gray-300'
                    }`}
                    disabled={!serviceSelectionComplete}
                    aria-label={
                      serviceSelectionComplete
                        ? 'Step 4: Complete Forms - Available after service selection'
                        : 'Step 4: Complete Forms - Complete step 2 first'
                    }
                    aria-disabled={!serviceSelectionComplete}
                  >
                    4
                  </button>
                  <div
                    className={`text-sm sm:text-base font-medium mb-2 ${
                      serviceSelectionComplete
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    Complete Forms
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight px-2 sm:px-0">
                    Fill out brief intake forms to help us prepare for your
                    session
                  </div>
                </div>
              </div>

              {/* Always Visible Booking Button - Emphasized when service selected */}
              <div className="booking-button-container mt-6 sm:mt-10 mb-6 sm:mb-10 text-center">
                {/* Live region for screen reader announcements */}
                <div
                  role="status"
                  aria-live="polite"
                  className="sr-only"
                  aria-atomic="true"
                >
                  {selectedService &&
                    `Service selected: ${getSelectedServiceLabel()}`}
                </div>

                <button
                  className={`book-appointment-button font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 touch-manipulation focus:outline-none focus:ring-4 focus:ring-offset-2 min-h-[56px] ${
                    selectedService
                      ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-xl scale-105 focus:ring-green-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg focus:ring-blue-300'
                  }`}
                  onClick={(event) => {
                    // GA4 tracking
                    trackBookNowClick({
                      page_section: 'appointments_page',
                      button_location: 'service_selection_cta',
                      service_type: selectedService || 'no_service_selected',
                    });
                    openBookingModal(event);
                  }}
                  aria-label={
                    selectedService
                      ? `Book your ${getSelectedServiceLabel()} appointment now`
                      : 'Book your appointment now'
                  }
                >
                  <span className="flex items-center justify-center gap-2">
                    <span aria-hidden="true">📅</span>
                    <span>Book Now</span>
                  </span>
                </button>

                {selectedService && (
                  <p
                    className="mt-3 text-sm text-green-700 font-medium"
                    aria-live="polite"
                  >
                    ✓ Ready to book your{' '}
                    {
                      serviceOptions.find((s) => s.id === selectedService)
                        ?.title
                    }
                  </p>
                )}
              </div>

              {/* What Happens Next Section */}
              <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  What Happens Next?
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Confirmation Email
                    </h3>
                    <p className="text-gray-600">
                      After booking, you'll receive confirmation via email with
                      all appointment details.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Appointment Reminder
                    </h3>
                    <p className="text-gray-600">
                      We'll send appointment reminders 24 hours before your
                      session.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Telehealth Link
                    </h3>
                    <p className="text-gray-600">
                      Telehealth link provided on booking day for your secure
                      online session.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy Section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-lg p-8 mt-8 border border-amber-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-amber-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Cancellation Policy
                </h2>
                <div className="max-w-2xl mx-auto">
                  <p className="text-gray-700 text-center mb-6">
                    We understand that plans can change. You can cancel or
                    reschedule your appointment easily via our secure booking
                    portal using the link in your confirmation email.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-green-600 mt-1"
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
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            24+ Hours Notice
                          </h3>
                          <p className="text-gray-600">
                            Full refund - no questions asked
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-red-600 mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Less Than 24 Hours
                          </h3>
                          <p className="text-gray-600">
                            Full session fee applies
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-6 italic">
                    No reason required to cancel - manage your bookings anytime
                    using your confirmation email or by contacting our team
                  </p>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Need Help?
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Can't Find a Time?
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Contact us directly and we'll help find a suitable
                      appointment time.
                    </p>
                    <a
                      href="mailto:info@life-psychology.com.au"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Email info@life-psychology.com.au
                    </a>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Questions About Funding?
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Check our comprehensive Fees & Funding page for detailed
                      information.
                    </p>
                    <Link
                      to="/pricing"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Fees & Funding
                    </Link>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Explore Our Services
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Learn more about our comprehensive range of psychology
                      services and treatment options.
                    </p>
                    <Link
                      to="/services"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Services
                    </Link>
                  </div>
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center mt-8">
                <Link
                  to="/"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Appointments;
