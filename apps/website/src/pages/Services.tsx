import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { tracker } from '../utils/UnifiedTracker';
import { useBooking } from '../hooks/useBooking';

const Services = () => {
  const { openBookingModal } = useBooking('services_page');
  useEffect(() => {
    // Initialize services page tracking with unified tracker
    tracker.trackServicePage();
  }, []);

  const services = [
    {
      title: 'Individual Therapy',
      description:
        'One-on-one CBT and ACT therapy for anxiety, depression, and life challenges. Build practical coping strategies in a safe, confidential space via secure telehealth sessions. Together, we will work toward your goals of improved mental health and personal growth.',
      icon: '🧑‍⚕️',
      features: ['CBT & ACT', '50-min sessions', 'Medicare Rebate'],
      href: '/individual-therapy',
      price: 'A$250.00',
      popular: false,
    },
    {
      title: 'Couples Counselling',
      description:
        'Specialized couples counselling using Gottman Method and EFT approaches to improve communication, rebuild trust, and strengthen emotional connection. Professional guidance for relationship challenges, helping couples build stronger partnerships.',
      icon: '👥',
      features: ['Gottman Method', 'EFT Therapy', 'Private Health'],
      href: '/couples-therapy',
      price: 'A$300.00',
      popular: false,
    },
    {
      title: 'Anxiety & Depression',
      description:
        'Evidence-based treatment combining CBT, mindfulness, and behavioral activation. Learn practical tools for managing symptoms and building resilience, supporting your journey toward mental wellness and personal empowerment.',
      icon: '🧠',
      features: ['CBT Therapy', 'Mindfulness', 'Medicare Rebate'],
      href: '/anxiety-depression',
      price: 'A$250.00',
      popular: false,
    },
    {
      title: 'Neurodiversity Support',
      description:
        'Affirming support for ADHD and autism, focusing on strengths, self-advocacy, and practical life strategies. Tailored approaches for neurodivergent adults, celebrating neurodiversity while building skills for success and well-being.',
      icon: '🌈',
      features: ['ADHD Support', 'ND Affirming', 'NDIS Eligible'],
      href: '/neurodiversity',
      price: 'A$250.00',
      popular: false,
    },
    {
      title: 'NDIS Psychology Services',
      description:
        'Registered NDIS provider offering therapeutic supports, capacity building, and assessments. Specialized psychological services for NDIS participants.',
      icon: '🛡️',
      features: ['NDIS Registered', 'Capacity Building', 'Assessments'],
      href: '/ndis-services',
      price: 'A$232.99',
      popular: false,
    },
    {
      title: 'Trauma Recovery',
      description:
        'Safe, paced trauma therapy using EMDR and somatic approaches. Process difficult experiences at your own speed with evidence-based trauma-informed care, supporting your healing journey toward renewed strength.',
      icon: '🌱',
      features: ['EMDR Therapy', 'Trauma-Informed', 'Medicare Rebate'],
      href: '/trauma-recovery',
      price: 'A$250.00',
      popular: false,
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Psychology Services Newcastle | Anxiety, Depression & Couples Therapy
          | Zoe Semmler
        </title>
        <meta
          name="description"
          content="Comprehensive psychology services in Newcastle NSW. Individual therapy, couples counselling, anxiety treatment, depression support, neurodiversity services, and NDIS psychology via secure telehealth."
        />
        <meta
          name="keywords"
          content="psychology services Newcastle, therapy Newcastle, mental health services Newcastle, counselling Newcastle, telehealth psychology, Zoe Semmler"
        />
        <link rel="canonical" href="https://lifepsychology.com.au/services" />
        <meta
          property="og:title"
          content="Psychology Services Newcastle | Anxiety, Depression & Couples Therapy"
        />
        <meta
          property="og:description"
          content="Comprehensive psychology services in Newcastle NSW. Individual therapy, couples counselling, anxiety treatment, depression support, neurodiversity services, and NDIS psychology."
        />
        <meta
          property="og:url"
          content="https://lifepsychology.com.au/services"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Psychology Services Newcastle | Anxiety, Depression & Couples Therapy"
        />
        <meta
          name="twitter:description"
          content="Comprehensive psychology services in Newcastle NSW. Individual therapy, couples counselling, anxiety treatment, depression support, neurodiversity services, and NDIS psychology."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section with Trust Signals */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Evidence-Based Psychology Services
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
                Professional therapeutic support for anxiety, depression,
                couples issues, and neurodiversity. All sessions via secure
                telehealth with{' '}
                <span className="font-semibold text-blue-600">
                  multiple funding options available
                </span>
                .
              </p>
            </div>

            {/* Trust Signal Strip */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-green-600">✓</span>
                Medicare Rebates Available
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-blue-600">✓</span>
                NDIS Registered Provider
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-purple-600">✓</span>
                Available 6 Days/Week
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-orange-600">✓</span>
                Evening Appointments
              </div>
            </div>

            {/* Primary CTA */}
            <div className="mb-6">
              <button
                onClick={(e) => {
                  // Unified tracking for booking click
                  tracker.trackBookingClick(
                    'services_top_cta',
                    'general_psychology'
                  );
                  openBookingModal(e);
                }}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">📅</span>
                </span>
                Book Your First Session
              </button>
            </div>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              <Link
                to="/greater-hunter"
                className="text-blue-600 hover:text-blue-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-1 rounded transition-colors"
                onClick={() => {
                  tracker.trackConversion({
                    conversion_type: 'page_navigation',
                    value: 10,
                    currency: 'AUD',
                    page_section: 'services_hero',
                    button_location: 'greater_hunter_link',
                  });
                }}
              >
                Serving Newcastle and the Greater Hunter region
              </Link>
            </p>
          </div>

          {/* What to Expect - Visual Section */}
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-gray-100 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="order-2 md:order-1">
                  <picture>
                    <source
                      srcSet="/assets/therapy-session-3-1200w.webp"
                      type="image/webp"
                      media="(min-width: 768px)"
                    />
                    <source
                      srcSet="/assets/therapy-session-3-800w.webp"
                      type="image/webp"
                    />
                    <img
                      src="/assets/therapy-session-3-1200w.jpg"
                      alt="Warm and professional therapy session environment - what you can expect from your sessions"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="1200"
                      height="800"
                    />
                  </picture>
                </div>

                {/* Text Content */}
                <div className="order-1 md:order-2 p-8 lg:p-12 flex flex-col justify-center">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                    What to Expect
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Every session is a safe, confidential space where you can
                    explore your thoughts and feelings without judgment.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    I use evidence-based approaches tailored to your unique
                    needs, working collaboratively to help you achieve your
                    goals.
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                      Warm, non-judgmental approach
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                      Evidence-based therapeutic methods
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                      Collaborative goal-setting
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                      Practical tools for lasting change
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {services.map((service, index) => (
              <Link
                key={index}
                to={service.href}
                className="bg-blue-100/70 backdrop-blur-sm border border-blue-200/60 shadow-sm rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => {
                  tracker.trackServiceCardClick(
                    service.title,
                    service.price,
                    index + 1
                  );
                }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {service.icon}
                </div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3 group-hover:text-gray-700 transition-colors">
                  {service.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.features.map((feature, featureIndex) => (
                    <span
                      key={featureIndex}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium group-hover:bg-blue-100 transition-colors"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Pricing */}
                {service.price && (
                  <div className="mb-4">
                    <span className="inline-block bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      {service.price}
                    </span>
                  </div>
                )}

                {/* Learn More Indicator */}
                <div className="text-blue-600 text-sm font-medium inline-flex items-center group-hover:translate-x-1 group-hover:text-blue-700 transition-all duration-200">
                  Learn more
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-200"
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
              </Link>
            ))}
          </div>

          {/* Pricing Overview Section - Simplified */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/60 p-8 lg:p-12 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Transparent Pricing
              </h2>
              <p className="text-lg text-slate-700 max-w-2xl mx-auto">
                Clear session fees with multiple funding options to reduce your
                costs
              </p>
            </div>

            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                A$232.99-A$300.00
              </div>
              <div className="text-lg text-slate-700">
                per 50-60 minute session
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl mb-2">💚</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Medicare Rebates
                </h3>
                <p className="text-slate-700 text-sm">
                  Up to $139.25 back per session for eligible mental health
                  services
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  NDIS Funding
                </h3>
                <p className="text-slate-700 text-sm">
                  Full session cost covered for eligible NDIS participants
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl mb-2">🏥</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Private Health
                </h3>
                <p className="text-slate-700 text-sm">
                  Psychology cover available with most private health funds
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => {
                  tracker.trackConversion({
                    conversion_type: 'pricing_page_click',
                    value: 25,
                    currency: 'AUD',
                    page_section: 'services_pricing_overview',
                    button_location: 'pricing_cta',
                  });
                }}
              >
                Calculate Your Costs
                <svg
                  className="w-4 h-4 ml-2"
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
              </Link>
            </div>
          </section>

          {/* CTA Section - Enhanced */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Take the first step toward better mental health. Book a
              confidential consultation with experienced psychological support
              available{' '}
              <span className="font-semibold text-blue-600">6 days a week</span>
              .
            </p>

            <div className="flex justify-center items-center mb-6">
              <button
                onClick={(e) => {
                  // Unified tracking for booking click
                  tracker.trackBookingClick(
                    'services_bottom_cta',
                    'general_psychology'
                  );
                  openBookingModal(e);
                }}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">📅</span>
                </span>
                Book Your First Session
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mb-4">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Medicare rebates up to $139.25
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                NDIS participants fully covered
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Private health extras cover
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Secure telehealth appointments • Evening sessions available • No
              wait lists
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default Services;
