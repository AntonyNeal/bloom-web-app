import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import UnifiedHeader from '../components/UnifiedHeader';

const CounsellingNewcastle = () => {
  return (
    <>
      <Helmet>
        <title>
          Counselling Newcastle | Professional Therapy Services | Life
          Psychology Australia
        </title>
        <meta
          name="description"
          content="Professional counselling Newcastle for anxiety, depression, relationships. $250/session. Medicare rebates. Telehealth available. Registered psychologist Zoe Semmler."
        />
        <meta
          name="keywords"
          content="counselling Newcastle, counsellor Newcastle, therapy Newcastle, psychologist Newcastle, anxiety counselling Newcastle, depression therapy Newcastle, couples counselling Newcastle"
        />
        <link
          rel="canonical"
          href="https://www.life-psychology.com.au/counselling-newcastle"
        />
        <meta
          property="og:title"
          content="Counselling Newcastle | Professional Therapy Services | Life Psychology Australia"
        />
        <meta
          property="og:description"
          content="Professional counselling Newcastle for anxiety, depression, relationships. $250/session. Medicare rebates. Telehealth available."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/counselling-newcastle"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Counselling Newcastle | Professional Therapy Services"
        />
        <meta
          name="twitter:description"
          content="Professional counselling Newcastle for anxiety, depression, relationships. $250/session. Medicare rebates."
        />
        <script type="application/ld+json">
          {`{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Counselling Newcastle",
          "description": "Professional counselling services in Newcastle NSW for anxiety, depression, and relationships",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Life Psychology Australia",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Newcastle",
              "addressRegion": "NSW",
              "addressCountry": "AU"
            }
          },
          "areaServed": {
            "@type": "City",
            "name": "Newcastle",
            "addressRegion": "NSW"
          },
          "serviceType": "Counselling",
          "offers": {
            "@type": "Offer",
            "price": "250",
            "priceCurrency": "AUD",
            "description": "Individual counselling session"
          }
        }`}
        </script>
      </Helmet>

      <div className="min-h-screen">
        <UnifiedHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Counselling Newcastle - Professional Therapy Services
            </h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 mb-6">
                Professional counselling services in Newcastle NSW. Specializing
                in anxiety, depression, relationships, and personal growth.
                Medicare rebates available. Telehealth appointments across the
                Greater Hunter region.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Services Offered
                  </h2>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Anxiety counselling Newcastle
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Depression therapy Newcastle
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Couples counselling Newcastle
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Personal development coaching
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      NDIS psychology services
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Why Choose Us
                  </h2>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">💼</span>
                      AHPRA registered psychologist
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">💰</span>
                      Medicare rebates available
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">📅</span>
                      Flexible telehealth appointments
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">🏠</span>
                      Sessions from your home
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">⭐</span>
                      AHPRA Registered Psychologist
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  Session Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      Individual Sessions: $250
                    </p>
                    <p className="text-gray-600">
                      Medicare rebate: $98.95 (gap $151.05)
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Couples Sessions: $300
                    </p>
                    <p className="text-gray-600">
                      No Medicare rebate (private pay)
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Book Your Counselling Session
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Next available appointments this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CounsellingNewcastle;
