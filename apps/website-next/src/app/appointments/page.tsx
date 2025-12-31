import type { Metadata } from 'next';
import { AppointmentsCTA } from './AppointmentsCTA';

export const metadata: Metadata = {
  title: 'Book an Appointment - Life Psychology Australia',
  description: 'Book your psychology appointment online. Medicare rebates, NDIS, private health insurance accepted.',
  alternates: {
    canonical: '/appointments',
  },
};

const steps = [
  { num: 1, title: 'Click Book Now', description: "Click 'Book Now' to access our secure booking service" },
  { num: 2, title: 'Select a Service', description: 'Choose from Medicare, NDIS, couples, or individual sessions' },
  { num: 3, title: 'Pick a Time', description: 'Choose a convenient appointment time that works for you' },
  { num: 4, title: 'Confirm Details', description: 'Enter your details and confirm your booking' },
];

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How to Book Your Appointment</h1>
            <p className="text-xl text-gray-600">Four simple steps to get started with your therapy journey</p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-center items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 mb-12">
              {steps.map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center max-w-32">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-md">
                    {step.num}
                  </div>
                  <div className="font-medium text-gray-900 mb-2">{step.title}</div>
                  <div className="text-sm text-gray-600">{step.description}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <AppointmentsCTA />
            </div>
          </div>

          {/* Service Options */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Available Services</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900">Medicare Psychology</h3>
                <p className="text-sm text-gray-600">Have a GP Mental Health Plan</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900">NDIS Psychology</h3>
                <p className="text-sm text-gray-600">NDIS participant with funding</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900">Couples Therapy</h3>
                <p className="text-sm text-gray-600">Relationship support together</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900">Individual Session</h3>
                <p className="text-sm text-gray-600">Private or health insurance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
