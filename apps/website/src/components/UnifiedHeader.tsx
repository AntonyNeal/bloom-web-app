import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookingService } from '../hooks/useBookingService';
import { log } from '../utils/logger';
import { getNextAvailableSlot } from '../utils/availabilityPreloader';
import { getTimeUntilAvailability } from '../utils/halaxyAvailability';

const UnifiedHeader = () => {
  const { isModalOpen, handleBookingClick } = useBookingService();
  const [availabilityText, setAvailabilityText] = useState<string | null>(null);

  useEffect(() => {
    log.debug('Component mounted', 'UnifiedHeader', {
      modalState: isModalOpen,
    });
    
    const updateAvailability = () => {
      const nextSlot = getNextAvailableSlot();
      if (nextSlot) {
        setAvailabilityText(getTimeUntilAvailability(nextSlot.start));
      }
      // Don't show anything if no slot available yet
    };
    
    // Check immediately in case cache is already populated
    updateAvailability();
    
    // Listen for when availability is loaded
    window.addEventListener('availabilityLoaded', updateAvailability);
    return () => window.removeEventListener('availabilityLoaded', updateAvailability);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    log.debug('Modal state changed', 'UnifiedHeader', {
      isModalOpen,
    });
  }, [isModalOpen]);

  const handleBookAppointment = (
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    log.info('Book appointment clicked', 'UnifiedHeader', {
      eventType: event.type,
    });
    event.preventDefault();

    handleBookingClick(event, {
      buttonLocation: 'unified_header_cta',
      pageSection: 'hero',
      variant: 'healthcare-optimized',
    });
  };

  // --- A/B Test Button Dev Tool ---
  const [showABTestButton, setShowABTestButton] = useState(false);
  // Keyboard shortcut: Ctrl+Shift+A
  const abTestKeyHandler = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      setShowABTestButton((v) => !v);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', abTestKeyHandler);
    return () => window.removeEventListener('keydown', abTestKeyHandler);
  }, [abTestKeyHandler]);

  // Floating toggle icon (⚙️)

  const abTestButtonStyle: React.CSSProperties = {
    position: 'fixed',
    top: 20,
    left: 70,
    background: 'rgb(59, 130, 246)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: '0.2s',
    display: showABTestButton ? 'inline-block' : 'none',
  };

  return (
    <>
      {/* Hero image preload is handled in index.html for earlier discovery */}
      {/* A/B Test button (hidden by default) */}
      <button style={abTestButtonStyle}>🧪 A/B Test</button>

      {/* Main header section - min-height set to prevent CLS */}
      <section
        className="pt-3 pb-8 sm:pt-4 sm:pb-12 lg:pt-6 lg:pb-16 bg-gradient-to-br from-blue-50/30 to-white relative overflow-hidden hero-section"
        aria-label="Life Psychology Australia header"
        style={{ minHeight: '80vh' }}
      >
        {/* Simplified background - removed blur effects for performance */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/10 rounded-full -z-10"></div>
        <div className="absolute bottom-40 left-0 w-80 h-80 bg-purple-100/5 rounded-full -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hero-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 items-start sm:items-start /* removed lg:items-center to prevent Safari vertical crop */ content-start">
            {/* Image - Top on mobile portrait, side-by-side on landscape and desktop */}
            <div
              className="order-1 sm:order-2 lg:order-1 hero-image-container self-start"
              style={{
                /* iOS Safari fixes for image cropping */
                overflow: 'visible',
                minHeight: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Optimized hero image with responsive formats - 65% larger */}
              <div
                className="relative mx-auto"
                style={{
                  /* Ensure container doesn't limit image height on iOS */
                  overflow: 'visible',
                  minHeight: 'fit-content',
                  width: '165%',
                  maxWidth: '165%',
                  marginLeft: '-32.5%',
                }}
              >
                {/* Hero image optimized for performance with WebP and responsive sizing */}
                <picture>
                  <source
                    srcSet="/assets/hero-zoe-main.webp"
                    type="image/webp"
                    width="1200"
                    height="1600"
                  />
                  <source
                    srcSet="/assets/hero-zoe-main.jpg"
                    type="image/jpeg"
                    width="1200"
                    height="1600"
                  />
                  <img
                    src="/assets/hero-zoe-main.jpg"
                    alt="Zoe Semmler, Registered Psychologist - warm, professional, and approachable telehealth psychology services in Newcastle and across Australia"
                    className="w-full h-auto object-contain rounded-2xl shadow-xl"
                    width="1200"
                    height="1600"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      height: 'auto',
                      maxHeight: '85vh',
                    }}
                  />
                </picture>
              </div>
            </div>

            {/* Content */}
            <div className="order-2 sm:order-1 lg:order-2 text-center content-sections">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                Life Psychology Australia
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-blue-600 font-medium mb-4 sm:mb-6">
                Telehealth psychology for Newcastle and the Greater Hunter,
                available Australia-wide.
              </p>

              {/* More comprehensive, focused messaging */}
              <div className="text-gray-700 mb-6 space-y-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100 text-center">
                  <p className="text-lg sm:text-xl font-medium text-gray-800 mb-2">
                    <strong>Zoe Semmler</strong> — Registered Psychologist,
                    Newcastle
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 mb-3">
                    Supporting you through anxiety, depression, relationship
                    challenges, and personal growth with warm, evidence-based
                    therapy.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      Telehealth sessions
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      Medicare accepted
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                      NDIS provider
                    </span>
                  </div>
                </div>

                {/* Healthcare social proof */}
                <div className="text-xs text-gray-600 text-center">
                  <p className="italic">
                    "Taking the first step can feel overwhelming. I'm here to
                    make therapy feel safe and supportive from day one."
                  </p>
                </div>
              </div>

              {/* Healthcare-optimized CTA with trust elements */}
              <div className="flex flex-col gap-4 justify-center items-center">
                {/* Primary CTA with healthcare messaging */}
                <button
                  onClick={(event) => {
                    log.debug('Book Now button clicked', 'UnifiedHeader', {
                      eventType: event.type,
                    });
                    handleBookAppointment(event);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto text-lg"
                >
                  Book your first session
                </button>

                {/* Healthcare-specific reassurance */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 text-base shadow-sm max-w-lg w-full">
                  {availabilityText && (
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{availabilityText}</span>
                    </div>
                  )}
                  <div className="text-green-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <span>Medicare rebates available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <span>NDIS approved provider</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <span>Secure telehealth platform</span>
                    </div>
                  </div>
                </div>

                {/* Secondary actions */}
                <div className="flex flex-col sm:flex-row gap-3 text-sm justify-center">
                  <Link
                    to="/appointments"
                    className="inline-flex items-center px-4 py-2 border border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-all duration-200"
                  >
                    <span className="mr-2">📋</span>
                    How booking works
                  </Link>
                  <Link
                    to="/faq"
                    className="inline-flex items-center px-4 py-2 border border-gray-200 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
                  >
                    <span className="mr-2">❓</span>
                    Common questions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug output */}
        {(() => {
          log.debug('Render state', 'UnifiedHeader', {
            isModalOpen,
          });
          return null;
        })()}
      </section>
    </>
  );
};

export default UnifiedHeader;
