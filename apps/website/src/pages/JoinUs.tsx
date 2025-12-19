import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { PsychologistApplicationForm } from '../components/forms/PsychologistApplicationForm';
import { trackServicePageViewed } from '../utils/analytics';

export default function JoinUs() {
  useEffect(() => {
    try {
      trackServicePageViewed('Join Us');
      if (import.meta.env.MODE !== 'production') {
        console.log('[Analytics] service_page_viewed: Join Us');
      }
    } catch (err) {
      if (import.meta.env.MODE !== 'production') {
        console.log('[Analytics] Error tracking service_page_viewed:', err);
      }
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>
          Join Our Team | Psychologists Wanted Newcastle | Life Psychology
          Australia
        </title>
        <meta
          name="description"
          content="Join Life Psychology Australia's innovative practice platform. Keep 80% of everything you bill. Technology-enabled practice management, marketing support, and collaborative network for registered psychologists."
        />
        <meta
          name="keywords"
          content="psychologist jobs Newcastle, telehealth psychology career, psychology practice opportunities, AHPRA registered psychologist positions"
        />
        <link rel="canonical" href="https://www.life-psychology.com.au/join-us" />
        <meta
          property="og:title"
          content="Join Our Team | Psychologists Wanted Newcastle"
        />
        <meta
          property="og:description"
          content="Join Life Psychology Australia's innovative practice platform. Keep 80% of everything you bill. Technology-enabled practice management and collaborative network for psychologists."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/join-us"
        />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section with Value Proposition */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Text Content */}
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Join Australia's Most Generous Psychology Practice
              </h1>
              <p className="text-2xl text-gray-700 font-semibold mb-8">
                Keep 80% of everything you bill. We handle the rest.
              </p>
            </div>

            {/* Right Column: Hero Image */}
            <div className="relative p-4 lg:p-6">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <picture>
                  <source
                    srcSet="/assets/therapy-session-1-1200w.webp"
                    type="image/webp"
                    media="(min-width: 768px)"
                  />
                  <source
                    srcSet="/assets/therapy-session-1-800w.webp"
                    type="image/webp"
                  />
                  <img
                    src="/assets/therapy-session-1-1200w.jpg"
                    alt="Join a collaborative and supportive psychology practice - professional therapy environment"
                    className="w-full h-auto object-cover rounded-2xl"
                    loading="eager"
                    width="1200"
                    height="900"
                  />
                </picture>
              </div>
            </div>
          </div>

          {/* Value Proposition Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">80%</div>
              <div className="text-lg font-semibold mb-2">Revenue Share</div>
              <div className="text-gray-600">
                Industry standard is 50-60%. We believe you deserve more.
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                Minimal
              </div>
              <div className="text-lg font-semibold mb-2">Admin Burden</div>
              <div className="text-gray-600">
                We work with you to minimize administrative tasks through
                technology and continuous innovation.
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-lg font-semibold mb-2">Flexibility</div>
              <div className="text-gray-600">
                Work from anywhere, set your own hours, choose your clients.
              </div>
            </div>
          </div>

          {/* Why Life Psychology Benefits List */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Why Psychologists Join Us
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>Industry-leading 80% revenue share</strong> - $200
                  session = $160 to you
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>Full-service telehealth platform</strong> - Secure
                  video, automated reminders, integrated notes
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>Marketing & client acquisition handled</strong> - We
                  fill your calendar, you do therapy
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>All admin automated</strong> - Billing, Medicare,
                  insurance claims, scheduling
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>Professional development tokens</strong> - Funded
                  supervision, training, conferences
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>Family-first culture</strong> - No quotas, no
                  pressure, sustainable practice
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>True flexibility</strong> - Set your hours (5-40 per
                  week), work from anywhere in Australia
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5"
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
                <span>
                  <strong>No lock-in contracts</strong> - Leave anytime, no
                  penalties
                </span>
              </li>
            </ul>
          </div>

          {/* Qualification Requirements Box */}
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Minimum Requirements
            </h3>
            <p className="text-gray-700 mb-4">
              To apply, you must meet at least ONE of these criteria:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold text-amber-700 mr-2">•</span>
                <span>
                  <strong>Registered Clinical Psychologist</strong> with AHPRA
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-amber-700 mr-2">•</span>
                <span>
                  <strong>8+ years</strong> as a registered psychologist with
                  AHPRA
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-amber-700 mr-2">•</span>
                <span>
                  <strong>PhD in Psychology</strong> with current AHPRA
                  registration
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* About the Founder Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Portrait Image */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-gray-50">
                <picture>
                  <source
                    srcSet="/assets/zoe-760w.webp"
                    type="image/webp"
                    media="(min-width: 768px)"
                  />
                  <source srcSet="/assets/zoe-380w.webp" type="image/webp" />
                  <img
                    src="/assets/zoe-760w.jpg"
                    alt="Zoe Semmler, Founder of Life Psychology Australia - Registered Psychologist dedicated to supporting mental health professionals"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    width="800"
                    height="1000"
                  />
                </picture>
              </div>
            </div>

            {/* Right Column: Text Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Built by a Psychologist, for Psychologists
              </h2>
              <div className="prose prose-lg text-gray-700 space-y-4">
                <p>
                  Life Psychology Australia was founded by{' '}
                  <strong>Zoe Semmler</strong>, a registered clinical
                  psychologist with deep understanding of the challenges facing
                  modern practitioners.
                </p>
                <p>
                  After years of working within traditional practice models, Zoe
                  saw talented psychologists leaving the profession—not because
                  they didn't love the work, but because the business side was
                  unsustainable.
                </p>
                <p>
                  "I built Life Psychology around a simple question:{' '}
                  <em>
                    What if psychologists could focus entirely on client care,
                    while earning what they truly deserve?
                  </em>
                  "
                </p>
                <p>
                  Our 80% revenue share isn't just generous—it's fair. Our
                  technology platform isn't just convenient—it's transformative.
                  And our culture isn't just supportive—it's built on genuine
                  respect for work-life balance.
                </p>
                <p className="font-semibold text-gray-900">
                  Join a practice designed by someone who understands your work,
                  your challenges, and your worth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Apply to Join Our Team
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your psychology practice? Complete the
              application below.
            </p>
          </div>

          <PsychologistApplicationForm />
        </div>
      </section>
    </>
  );
}
