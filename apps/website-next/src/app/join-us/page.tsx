import type { Metadata } from 'next';
import { JoinUsForm } from './JoinUsForm';

export const metadata: Metadata = {
  title: 'Join Our Team | Psychologists Wanted Newcastle | Life Psychology Australia',
  description: "Join Life Psychology Australia's innovative practice platform. Keep 80% of everything you bill. Technology-enabled practice management for registered psychologists.",
  alternates: {
    canonical: '/join-us',
  },
};

export default function JoinUsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Join Australia&apos;s Most Generous Psychology Practice
              </h1>
              <p className="text-2xl text-gray-700 font-semibold mb-8">
                Keep 80% of everything you bill. We handle the rest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#application-form" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-lg text-center">
                  Apply Now →
                </a>
                <a href="#benefits" className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-4 px-8 rounded-lg shadow-md border-2 border-blue-200 text-lg text-center">
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <picture>
                  <source srcSet="/assets/therapy-session-1-1200w.webp" type="image/webp" />
                  <img src="/assets/therapy-session-1-1200w.jpg" alt="Join a collaborative psychology practice" className="w-full h-auto object-cover" width="1200" height="900" />
                </picture>
              </div>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">80%</div>
              <div className="text-lg font-semibold mb-2">Revenue Share</div>
              <div className="text-gray-600">Industry standard is 50-60%. We believe you deserve more.</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">Minimal</div>
              <div className="text-lg font-semibold mb-2">Admin Burden</div>
              <div className="text-gray-600">We minimize administrative tasks through technology.</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-lg font-semibold mb-2">Flexibility</div>
              <div className="text-gray-600">Work from anywhere, set your own hours.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Psychologists Join Us</h2>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Industry-leading 80% revenue share</strong> - $200 session = $160 to you</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Full-service telehealth platform</strong> - Secure video, automated reminders</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Marketing & client acquisition handled</strong> - We fill your calendar</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Work from anywhere</strong> - 100% telehealth practice</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Apply to Join</h2>
          <JoinUsForm />
        </div>
      </section>
    </>
  );
}
