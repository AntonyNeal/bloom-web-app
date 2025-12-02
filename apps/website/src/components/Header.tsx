import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getEnvBool } from '../utils/env';
import { BookingModal } from './BookingModal';
import { trackBookNowClick } from '../utils/trackingEvents';

// Extend Window interface for our custom properties
declare global {
  interface Window {
    VITE_ASSESSMENT_ENABLED?: string;
    VITE_CHAT_ENABLED?: string;
    __ENV_VARS__?: Record<string, string>;
    halaxyBookingTracker?: {
      handleBookingClick: (
        eventOrButton?:
          | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
          | HTMLButtonElement
          | Event,
        customUrl?: string
      ) => void;
    };
  }
}

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Feature switches default to false unless explicitly set to 'true'
  const isAssessmentEnabled = getEnvBool('VITE_ASSESSMENT_ENABLED');
  const isChatEnabled = getEnvBool('VITE_CHAT_ENABLED');

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'How to Book', path: '/appointments' },
    { name: 'Fees & Funding', path: '/pricing' },
    ...(isAssessmentEnabled
      ? [{ name: 'Assessment', path: '/assessment' }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/services') {
      return (
        location.pathname.includes('/services') ||
        location.pathname.includes('/individual-therapy') ||
        location.pathname.includes('/couples-therapy') ||
        location.pathname.includes('/anxiety-depression')
      );
    }
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Skip to main content
      </a>

      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link to="/" className="flex-shrink-0">
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray-800 hover:text-blue-700 transition-colors duration-200"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <span className="hidden sm:inline">
                  Life Psychology Australia
                </span>
                <span className="sm:hidden">Life Psychology</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    item.name === 'Assessment'
                      ? // Special styling for Assessment
                        isActive(item.path)
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-b-2 border-purple-600 shadow-md'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transform hover:scale-105'
                      : // Regular styling for other items
                        isActive(item.path)
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    // Track page navigation
                    if (window.gtag) {
                      window.gtag('event', 'page_navigation', {
                        event_category: 'Navigation',
                        event_label: `header_${item.name.toLowerCase()}_click`,
                        value: 10,
                        destination_page: item.path,
                        navigation_location: 'header',
                      });
                    }

                    // Only scroll to top for non-appointments links
                    if (item.path !== '/appointments') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    // Focus management for accessibility
                    setTimeout(() => {
                      const mainContent =
                        document.getElementById('main-content');
                      if (mainContent) mainContent.focus();
                    }, 100);
                  }}
                >
                  {item.name === 'Assessment' && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-xs">📊</span>
                      <span>{item.name}</span>
                    </span>
                  )}
                  {item.name !== 'Assessment' && item.name}
                </Link>
              ))}

              {/* Book Now Button */}
              <button
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  console.log('[Header] Desktop Book Now clicked');

                  // GA4 tracking
                  trackBookNowClick({
                    page_section: 'header',
                    button_location: 'desktop_navigation',
                  });

                  setShowBookingModal(true);
                }}
                className="ml-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span>
                  <span>Book Now</span>
                </span>
              </button>

              {/* Need Help Button - Only show if chat is enabled */}
              {isChatEnabled && (
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('toggleChat'))
                  }
                  className="ml-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-emerald-500/20"
                  aria-label="Need help? Chat with us"
                >
                  <span className="flex items-center gap-1">
                    <span className="text-sm">💬</span>
                    <span>Help</span>
                  </span>
                </button>
              )}
            </nav>

            {/* Mobile Header - Always visible Book Now + Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Book Now Button - Always Visible */}
              <button
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  console.log('[Header] Mobile Book Now clicked');

                  // GA4 tracking
                  trackBookNowClick({
                    page_section: 'header',
                    button_location: 'mobile_navigation',
                  });

                  setShowBookingModal(true);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-500/20"
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span>
                  <span>Book</span>
                </span>
              </button>

              {/* Mobile Need Help Button - Only show if chat is enabled */}
              {isChatEnabled && (
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('toggleChat'))
                  }
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-emerald-500/20"
                  aria-label="Need help? Chat with us"
                >
                  <span className="flex items-center gap-1">
                    <span className="text-sm">💬</span>
                    <span>Help</span>
                  </span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      // Track mobile navigation
                      if (window.gtag) {
                        window.gtag('event', 'page_navigation', {
                          event_category: 'Navigation',
                          event_label: `mobile_${item.name.toLowerCase()}_click`,
                          value: 10,
                          destination_page: item.path,
                          navigation_location: 'mobile_menu',
                        });
                      }

                      setMobileMenuOpen(false);
                      // Only scroll to top for non-appointments links
                      if (item.path !== '/appointments') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      // Focus management for accessibility
                      setTimeout(() => {
                        const mainContent =
                          document.getElementById('main-content');
                        if (mainContent) mainContent.focus();
                      }, 100);
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          console.log('[Header] Closing booking modal');
          setShowBookingModal(false);
        }}
      />
    </>
  );
};

export default Header;
