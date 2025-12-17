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

      {/* Main header section - optimized for above-the-fold CTA */}
      <section
        className="pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden hero-section"
        aria-label="Life Psychology Australia header"
      >
        {/* Subtle background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-100/20 to-transparent rounded-full -z-10 translate-x-1/4 -translate-y-1/4"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 hero-container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            
            {/* Image - 2 columns on desktop, cropped to upper body */}
            <div className="order-1 lg:order-1 lg:col-span-2 hero-image-container">
              <div className="relative mx-auto max-w-[320px] lg:max-w-none">
                {/* Cropped hero image - focusing on face and upper body */}
                <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ aspectRatio: '3/4' }}>
                  <picture>
                    <source
                      srcSet="/assets/hero-zoe-main.webp"
                      type="image/webp"
                    />
                    <source
                      srcSet="/assets/hero-zoe-main.jpg"
                      type="image/jpeg"
                    />
                    <img
                      src="/assets/hero-zoe-main.jpg"
                      alt="Zoe Semmler, Registered Psychologist - warm and approachable telehealth psychology in Newcastle"
                      className="w-full h-full object-cover object-top"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      style={{
                        objectPosition: 'center 15%',
                      }}
                    />
                  </picture>
                </div>
                {/* Floating credential badge */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                  <p className="text-xs font-semibold text-slate-700">Registered Psychologist</p>
                  <p className="text-[10px] text-slate-500">Newcastle, NSW</p>
                </div>
              </div>
            </div>

            {/* Content - 3 columns on desktop */}
            <div className="order-2 lg:order-2 lg:col-span-3 text-center lg:text-left content-sections">
              {/* Name and Title */}
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                  Zoe Semmler
                </h1>
                <p className="text-blue-600 font-medium text-lg">
                  Psychologist • Newcastle & Australia-wide
                </p>
              </div>

              {/* Value proposition */}
              <p className="text-slate-600 text-base sm:text-lg mb-6 max-w-xl lg:max-w-none">
                Supporting you through anxiety, depression, and life transitions with warm, evidence-based telehealth therapy.
              </p>

              {/* Trust badges - compact row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Medicare rebates
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  NDIS provider
                </span>
                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Secure telehealth
                </span>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                {/* Primary CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    onClick={(event) => {
                      log.debug('Book Now button clicked', 'UnifiedHeader', {
                        eventType: event.type,
                      });
                      handleBookAppointment(event);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base"
                  >
                    Book your first session
                  </button>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-semibold transition-all duration-200 text-base"
                  >
                    Learn more
                  </Link>
                </div>

                {/* Availability indicator */}
                {availabilityText && (
                  <div className="flex items-center gap-2 justify-center lg:justify-start text-sm text-emerald-700">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium">{availabilityText}</span>
                  </div>
                )}
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
