import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { tracker } from '../utils/UnifiedTracker';
import { useBooking } from '../hooks/useBooking';

const NDISServices = () => {
  const { openBookingModal } = useBooking('ndis_services_page');

  useEffect(() => {
    tracker.trackServicePage();
  }, []);

  return (
    <>
      <Helmet>
        <title>
          NDIS Services Newcastle | Capacity Building & Therapeutic Supports |
          Zoe Semmler
        </title>
        <meta
          name="description"
          content="Comprehensive NDIS services in Newcastle NSW including coaching, functional support, community connection, skills development, and therapeutic supports. NDIS plan-managed and self-managed participants welcome."
        />
        <meta
          name="keywords"
          content="NDIS services Newcastle, NDIS capacity building, NDIS therapeutic supports, disability support Newcastle, NDIS coaching, NDIS skills development, Zoe Semmler NDIS"
        />
        <link
          rel="canonical"
          href="https://www.life-psychology.com.au/ndis-services"
        />
        <meta
          property="og:title"
          content="NDIS Services Newcastle | Capacity Building & Therapeutic Supports"
        />
        <meta
          property="og:description"
          content="Comprehensive NDIS services in Newcastle NSW including coaching, functional support, community connection, skills development, and therapeutic supports."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/ndis-services"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="NDIS Services Newcastle | Capacity Building & Therapeutic Supports"
        />
        <meta
          name="twitter:description"
          content="Comprehensive NDIS services in Newcastle NSW including coaching, functional support, community connection, skills development, and therapeutic supports."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              NDIS Services Newcastle | Capacity Building & Therapeutic Supports
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Comprehensive NDIS services including coaching, functional
              support, community connection, skills development, and therapeutic
              supports for participants in Newcastle and the Greater Hunter
              region.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                NDIS Capacity Building
              </span>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                Medicare Rebates
              </span>
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                Therapeutic Supports
              </span>
            </div>
          </div>

          {/* Welcome Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Supporting Your NDIS Journey
              </h2>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    As an AHPRA registered psychologist and NDIS provider, we
                    specialise in delivering comprehensive capacity building and
                    therapeutic supports that align with your NDIS plan
                    objectives. Our practice embraces your unique story and
                    aspirations, turning NDIS plan objectives into meaningful
                    progress.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Both self-managed and plan-managed participants can begin
                    their journey with us immediately. We offer a full range of
                    NDIS services including coaching, functional support,
                    community connection, skills development, and therapeutic
                    interventions.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    All our services are delivered via secure telehealth, making
                    it convenient to access support from your own home or
                    preferred environment across the Greater Hunter region.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-6xl mb-4">🛡️</div>
                  <p className="text-gray-600 italic">
                    "Your goals, your way – we're here to support your NDIS
                    journey with professionalism and compassion."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights as a NDIS Client */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Your Rights as an NDIS Participant
            </h2>
            {/* Top Row - Core Rights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8">
              <div className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Person-Centred Supports
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Providers must deliver supports that promote, uphold, and
                  respect your legal and human rights, allowing you to make
                  informed choices.
                </p>
              </div>
              <div className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Individual Values and Beliefs
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Supports must respect your culture, diversity, values, and
                  beliefs.
                </p>
              </div>
              <div className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Privacy and Dignity
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Providers are responsible for protecting your dignity and
                  right to privacy.
                </p>
              </div>
            </div>

            {/* Bottom Row - Additional Rights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-2xl mx-auto">
              <div className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60">
                <div className="text-4xl mb-4">🆓</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Independence and Informed Choice
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Supports should be designed to help you make informed choices
                  and maximise your independence.
                </p>
              </div>
              <div className="bg-blue-100/70 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-200/60">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Freedom from Harm
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You will be free from all forms of violence, abuse, neglect,
                  exploitation, and discrimination.
                </p>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 lg:p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Using Your NDIS Funding With Us
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-xl text-gray-800 mb-4">
                    Quick Start Process
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Book your first session using your NDIS funding
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Share your NDIS goals and current needs
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Receive personalized support plan across all service areas
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Begin your comprehensive NDIS journey immediately
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-gray-800 mb-4">
                    Comprehensive Ongoing Support
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Regular sessions across all NDIS service areas
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Integrated coaching and skills development
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Community connection and participation support
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Functional support for daily living activities
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Start Your NDIS Journey Today
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Book your first session now and begin accessing comprehensive NDIS
              services including coaching, functional support, community
              connection, skills development, and therapeutic supports. We
              accept both self-managed and plan-managed participants.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                type="button"
                onClick={openBookingModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">📅</span>
                </span>
                Book your first session
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Registered NDIS provider
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Immediate telehealth availability
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Plan & self-managed welcome
              </span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default NDISServices;
