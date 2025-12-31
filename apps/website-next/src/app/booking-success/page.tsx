import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Booking Confirmed | Life Psychology Australia',
  description: 'Your booking has been confirmed. Check your email for confirmation details.',
  robots: { index: false, follow: false },
};

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <svg className="h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-center text-gray-600 mb-8">
            Thank you for booking with Life Psychology Australia. You&apos;ll receive a confirmation email shortly.
          </p>

          {/* What&apos;s Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Check your email for confirmation details
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                You&apos;ll receive a reminder before your appointment
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Join via the secure telehealth link provided
              </li>
            </ul>
          </div>

          {/* Return Home */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
