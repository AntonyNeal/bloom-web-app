import type { Metadata } from 'next';
import { PricingCalculator } from './PricingCalculator';

export const metadata: Metadata = {
  title: 'Psychology Session Fees & Funding Options | Medicare, NDIS, Private Health',
  description: 'Psychology session fees and funding options. Medicare rebates up to $98.95, NDIS $233, private health insurance. Transparent pricing for therapy sessions.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Affordable Mental Health Support
            <br />
            <span className="text-blue-100">When You Need It Most</span>
          </h1>
          <p className="text-xl lg:text-2xl mb-6 text-blue-100">
            From <span className="text-white font-bold">$151.05</span> out-of-pocket with Medicare rebates
          </p>
          <p className="text-lg mb-8 text-blue-50">
            No waiting lists • Start today • Secure online sessions
          </p>
        </div>
      </section>

      {/* Trust Signal Strip */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600 text-xl">✓</span>
              <span className="text-sm font-medium text-gray-700">Medicare Approved</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-600 text-xl">👥</span>
              <span className="text-sm font-medium text-gray-700">Registered Psychologist</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-purple-600 text-xl">📅</span>
              <span className="text-sm font-medium text-gray-700">Available 6 Days/Week</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-indigo-600 text-xl">🔒</span>
              <span className="text-sm font-medium text-gray-700">Secure Online Platform</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Calculator */}
      <PricingCalculator />

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How much will I actually pay with Medicare?</h3>
              <p className="text-gray-600">With a valid GP Mental Health Care Plan, you&apos;ll receive a Medicare rebate of $98.95 per session. This means you&apos;ll pay $151.05 out-of-pocket for a $250 session.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What funding options are available?</h3>
              <p className="text-gray-600">Medicare rebates, self/plan-managed NDIS funding, and private health insurance rebates are all available options.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How do NDIS payments work?</h3>
              <p className="text-gray-600">As an NDIS provider, we offer psychology sessions at $232.99 per session for participants with self-managed or plan-managed funding.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
