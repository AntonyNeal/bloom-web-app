import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBooking } from '../hooks/useBooking';

const GreaterHunter = () => {
  const { openBookingModal } = useBooking('greater_hunter_page');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>
          Greater Hunter Psychology Services | Telehealth Therapy Across
          Newcastle Region | Zoe Semmler
        </title>
        <meta
          name="description"
          content="Psychology services across the Greater Hunter region NSW. Telehealth therapy available for residents of Newcastle, Lake Macquarie, Maitland, Cessnock, and surrounding areas. Anxiety, depression, couples therapy."
        />
        <meta
          name="keywords"
          content="Greater Hunter psychologist, Newcastle region therapy, telehealth psychology Hunter, Lake Macquarie psychologist, Maitland counselling, Cessnock therapy"
        />
        <link
          rel="canonical"
          href="https://www.life-psychology.com.au/greater-hunter"
        />
        <meta
          property="og:title"
          content="Greater Hunter Psychology Services | Telehealth Therapy Across Newcastle Region"
        />
        <meta
          property="og:description"
          content="Psychology services across the Greater Hunter region NSW. Telehealth therapy available for residents of Newcastle, Lake Macquarie, Maitland, Cessnock, and surrounding areas."
        />
        <meta
          property="og:url"
          content="https://www.life-psychology.com.au/greater-hunter"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Greater Hunter Psychology Services | Telehealth Therapy Across Newcastle Region"
        />
        <meta
          name="twitter:description"
          content="Psychology services across the Greater Hunter region NSW. Telehealth therapy available for residents of Newcastle, Lake Macquarie, Maitland, Cessnock, and surrounding areas."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/10 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-lg shadow-lg">
                {/* Base64 placeholder for instant display */}
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NDAiIHZpZXdCb3g9IjAgMCAxMjAwIDY0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                  width="1200"
                  height="640"
                />
                <img
                  src="https://images.pexels.com/photos/5934491/pexels-photo-5934491.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Scenic Hunter Valley landscape with vineyards and rolling hills"
                  className="w-full max-w-4xl mx-auto h-64 md:h-80 object-cover rounded-lg shadow-lg"
                  width="1200"
                  height="640"
                  loading="eager"
                  decoding="async"
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    const placeholder = target.parentElement?.querySelector(
                      'img[aria-hidden]'
                    ) as HTMLImageElement;
                    if (placeholder) {
                      placeholder.style.opacity = '0';
                    }
                    target.style.opacity = '1';
                  }}
                />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Zoe Semmler, Registered Psychologist
            </h1>
            <p className="text-xl text-blue-600 font-medium mb-4">
              Online Psychologist in Newcastle and the Greater Hunter
            </p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Telehealth psychology for Newcastle & the Hunter. Get
              confidential, convenient psychology care in Newcastle and across
              the Greater Hunter. We focus on clear guidance, privacy, and
              practical strategies you can use between sessions.
            </p>
          </div>

          {/* Credentials */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Registered Psychologist (AHPRA)
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ APS Full Member
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Evidence-based care: CBT, ACT, and mindfulness
            </span>
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Secure, encrypted telehealth
            </span>
          </div>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 lg:p-12 text-center border border-blue-100 mb-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                type="button"
                onClick={openBookingModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="mr-2">📅</span>
                Book an appointment
              </button>

              <a
                href="/services"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-4 px-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
                  <span className="text-sm">ℹ️</span>
                </span>
                How booking works
              </a>
            </div>

            <p className="text-sm text-gray-500">
              New clients welcome — no referral needed.
            </p>
          </section>

          {/* Navigation Links */}
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Why choose us · How it works · Fees & rebates · FAQ
            </h3>
          </div>

          {/* Service Area Section */}
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              Our Service Area in Greater Hunter
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {/* Newcastle and Surrounds */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4">
                  Newcastle and Surrounds:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Newcastle CBD, The Hill, Cooks Hill</li>
                  <li>• Hamilton, Broadmeadow, Mayfield</li>
                  <li>• Merewether, Bar Beach, Newcastle East</li>
                  <li>• Wallsend, Jesmond, Lambton</li>
                  <li>• New Lambton, Kotara, Charlestown</li>
                </ul>
              </div>

              {/* Lake Macquarie Region */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4">
                  Lake Macquarie Region:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Belmont, Cardiff, Warners Bay</li>
                  <li>• Toronto, Morisset, Bonnells Bay</li>
                  <li>• Swansea, Catherine Hill Bay</li>
                  <li>• Speers Point, Eleebana</li>
                </ul>
              </div>

              {/* Hunter Valley Areas */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4">
                  Hunter Valley Areas:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Maitland, Cessnock, Singleton</li>
                  <li>• Raymond Terrace, Kurri Kurri</li>
                  <li>• Branxton, Greta, Lovedale</li>
                </ul>
              </div>
            </div>

            {/* Upper Hunter - Centered */}
            <div className="flex justify-center">
              <div className="max-w-md text-center">
                <h3 className="text-lg font-semibold text-blue-600 mb-4">
                  Upper Hunter:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Muswellbrook, Scone, Aberdeen</li>
                  <li>• Denman, Merriwa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GreaterHunter;
