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
      className="py-8 sm:py-10 lg:py-12 bg-white relative overflow-hidden hero-section"
      aria-label="Life Psychology Australia header"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 hero-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          
          {/* Image - Cropped portrait style */}
          <div className="order-2 lg:order-1 hero-image-container">
            <div className="relative max-w-[280px] sm:max-w-[320px] mx-auto lg:mx-0">
              <div className="overflow-hidden rounded-2xl shadow-lg" style={{ aspectRatio: '3/4' }}>
                <img
                  src="/assets/hero-zoe-main.jpg"
                  alt="Zoe Semmler, Registered Psychologist"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                  style={{ objectPosition: 'center 15%' }}
                />
              </div>
            </div>
          </div>

          {/* Content - Clean and minimal */}
          <div className="order-1 lg:order-2 text-center lg:text-left content-sections">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              Online Psychology Services
            </h1>

            <p className="text-slate-500 text-base sm:text-lg mb-4">
              Professional telehealth psychology across Australia.
            </p>

            <p className="text-slate-700 mb-2">
              Support for anxiety, depression, relationships, and personal growth.
            </p>

            <p className="text-sm text-slate-600 mb-6">
              <span className="font-semibold">Zoe Semmler</span> — Registered Psychologist, Newcastle
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5">
              <button
                onClick={(event) => {
                  log.info('Book Now button clicked', 'MinimalHeader');
                  handleBookAppointment(event);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
              >
                📅 Book appointment
              </button>
              <Link
                to="/about"
                className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 text-sm"
              >
                ℹ️ Learn more
              </Link>
            </div>

            {/* Compact trust indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Medicare
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                NDIS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
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
