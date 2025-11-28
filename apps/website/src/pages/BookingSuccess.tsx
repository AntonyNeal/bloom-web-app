import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  fireAllConversionEvents,
  ConversionResult,
} from '../utils/conversionTracking';
import { trackBookingComplete, conversionManager } from '../tracking';

/**
 * Booking Success Page
 * Displayed after successful booking completion via Halaxy redirect
 * Handles all conversion tracking for Google Ads, GA4, and Microsoft Clarity
 *
 * Testing Steps:
 * 1. Click Book Now → Redirected to Halaxy
 * 2. Complete test booking in Halaxy
 * 3. Redirected back to /booking-success
 * 4. Open console → See all conversion logs
 * 5. Check GA4 Realtime → See events
 * 6. Check Google Ads → See conversion (may take 3 hours)
 */

const BookingSuccess = () => {
  const [trackingResults, setTrackingResults] = useState<ConversionResult[]>(
    []
  );
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    // Fire all conversion events on page load
    const trackConversions = async () => {
      console.log(
        '[BookingSuccess] 🎉 Page loaded - initiating conversion tracking...'
      );

      try {
        const results = await fireAllConversionEvents();
        setTrackingResults(results);
        console.log('[BookingSuccess] ✅ All tracking complete:', results);

        // Also fire new unified tracking system for booking completion
        // This provides normalized funnel tracking alongside legacy conversions
        trackBookingComplete({
          bookingId: `halaxy-redirect-${Date.now()}`,
          serviceType: 'initial_consultation',
          practitionerName: 'Unknown', // Halaxy redirect doesn't pass this
          appointmentDate: 'Unknown',
          value: 220, // Standard consultation fee
        });
        conversionManager.fireGoogleAdsConversion('booking_completed', 220);
        console.log(
          '[BookingSuccess] ✅ Unified tracking system conversion fired'
        );
      } catch (error) {
        console.error('[BookingSuccess] ❌ Error during tracking:', error);
      } finally {
        setIsTracking(false);
      }
    };

    trackConversions();
  }, []);

  return (
    <>
      <Helmet>
        <title>Booking Confirmed | Life Psychology Australia</title>
        <meta
          name="description"
          content="Your booking has been confirmed. Check your email for confirmation details."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon and Main Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <svg
                  className="h-16 w-16 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Booking Confirmed!
            </h1>

            <p className="text-lg text-center text-gray-600 mb-8">
              Thank you for booking with Life Psychology Australia. We're
              looking forward to supporting you on your journey.
            </p>

            {/* Booking Reference (if available) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                <strong>Important:</strong> Please check your email for booking
                confirmation and appointment details.
              </p>
            </div>
          </div>

          {/* What Happens Next Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg
                className="h-6 w-6 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              What Happens Next?
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Confirmation Email
                  </h3>
                  <p className="text-gray-600">
                    You'll receive a confirmation email within the next few
                    minutes with your appointment details and booking reference.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    24-Hour Reminder
                  </h3>
                  <p className="text-gray-600">
                    We'll send you a reminder 24 hours before your appointment
                    with all the details you need.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Telehealth Link
                  </h3>
                  <p className="text-gray-600">
                    Your secure telehealth session link will be included in your
                    reminder email. Simply click to join at your appointment
                    time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preparing for Your Session */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg
                className="h-6 w-6 text-teal-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Preparing for Your Session
            </h2>

            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-teal-500 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Find a quiet, private space where you feel comfortable talking
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-teal-500 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Test your internet connection and device audio/video beforehand
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-teal-500 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Have a pen and paper ready if you'd like to take notes
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-teal-500 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Think about what you'd like to discuss in your session
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-teal-500 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Arrive a few minutes early to settle in and test your connection
              </li>
            </ul>
          </div>

          {/* Need Help Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg
                className="h-6 w-6 text-purple-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Need to Change Your Booking?
            </h2>

            <p className="text-gray-600 mb-4">
              If you need to reschedule or cancel your appointment, please log
              back into your Halaxy account or contact us directly:
            </p>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <svg
                  className="h-5 w-5 text-gray-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:info@life-psychology.com.au"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  info@life-psychology.com.au
                </a>
              </div>
            </div>
          </div>

          {/* Emergency Resources */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 mb-8">
            <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center">
              <svg
                className="h-5 w-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              In Case of Emergency
            </h3>
            <p className="text-red-800 mb-3">
              If you're experiencing a mental health crisis and need immediate
              support:
            </p>
            <ul className="space-y-2 text-red-900">
              <li className="flex items-start">
                <span className="font-semibold mr-2">Emergency Services:</span>
                <a
                  href="tel:000"
                  className="text-red-700 hover:text-red-900 font-bold"
                >
                  000
                </a>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Lifeline:</span>
                <a
                  href="tel:131114"
                  className="text-red-700 hover:text-red-900 font-bold"
                >
                  13 11 14
                </a>
                <span className="ml-2 text-sm">(24/7 crisis support)</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Beyond Blue:</span>
                <a
                  href="tel:1300224636"
                  className="text-red-700 hover:text-red-900 font-bold"
                >
                  1300 22 4636
                </a>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return to Homepage
            </Link>

            <Link
              to="/services"
              className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-2 border-blue-600"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Learn About Our Services
            </Link>
          </div>

          {/* Debug Info (only in development) */}
          {import.meta.env.DEV && (
            <div className="mt-8 bg-gray-900 text-gray-100 rounded-lg p-6 text-xs font-mono">
              <h3 className="text-sm font-bold mb-3 text-green-400">
                🔧 Debug Info (Development Only)
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="text-yellow-400">Tracking Status:</span>{' '}
                  {isTracking ? 'In Progress...' : 'Complete'}
                </p>
                <p className="text-yellow-400">Conversion Results:</p>
                <pre className="bg-gray-800 p-3 rounded overflow-x-auto">
                  {JSON.stringify(trackingResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingSuccess;
