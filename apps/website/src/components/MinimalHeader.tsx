import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBookingService } from '../hooks/useBookingService';
import { log } from '../utils/logger';

const MinimalHeader = () => {
  const { handleBookingClick } = useBookingService();

  useEffect(() => {
    // Component mounted - no additional setup needed
  }, []);

  const handleBookAppointment = (
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    handleBookingClick(event, {
      buttonLocation: 'minimal_header_cta',
      pageSection: 'hero',
      variant: 'minimal',
    });
  };

  return (
    <section
      className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50/20 to-white relative overflow-hidden hero-section"
      aria-label="Life Psychology Australia header"
    >
      {/* Minimal background */}
      <div className="absolute top-32 right-16 w-64 h-64 bg-blue-100/5 rounded-full -z-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 hero-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1 hero-image-container">
            <div className="relative w-full max-w-[500px] mx-auto rounded-2xl shadow-2xl bg-white">
              <img
                src="/assets/hero-zoe-main.jpg"
                alt="Zoe Semmler, Registered Psychologist - warm, professional, and approachable telehealth psychology services in Newcastle and across Australia"
                className="w-full h-auto object-contain rounded-2xl"
                width="1200"
                height="800"
                loading="eager"
                decoding="sync"
              />
            </div>
          </div>

          {/* Content - Simplified */}
          <div className="order-1 lg:order-2 text-center lg:text-left content-sections">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Online Psychology Services
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 font-medium mb-6">
              Professional telehealth psychology across Australia.
            </p>

            <div className="text-gray-700 mb-8 space-y-4">
              <p className="text-base sm:text-lg">
                Professional psychology support for anxiety, depression,
                relationships, and personal growth.
              </p>

              <p className="text-sm text-gray-600">
                <strong>Zoe Semmler</strong> — Registered Psychologist,
                Newcastle
              </p>
            </div>

            {/* Multiple CTAs - Original approach */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              {/* Primary CTA */}
              <button
                onClick={(event) => {
                  log.info('Book Now button clicked', 'MinimalHeader');
                  handleBookAppointment(event);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                📅 Book appointment
              </button>

              {/* Secondary CTA */}
              <Link
                to="/appointments"
                className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-6 rounded-lg border-2 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                ℹ️ Learn more
              </Link>
            </div>

            {/* Basic service indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Medicare
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                NDIS
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Telehealth
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MinimalHeader;
