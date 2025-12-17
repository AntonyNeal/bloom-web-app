import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { trackBookNowClick } from '../tracking';
import { useBooking } from '../hooks/useBooking';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openBookingModal } = useBooking('header');

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'How to Book', path: '/appointments' },
    { name: 'Fees & Funding', path: '/pricing' },
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
                  {item.name}
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

                  openBookingModal(event, {
                    buttonLocation: 'desktop_navigation',
                    pageSection: 'header',
                  });
                }}
                className="ml-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span>
                  <span>Book Now</span>
                </span>
              </button>
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

                  openBookingModal(event, {
                    buttonLocation: 'mobile_navigation',
                    pageSection: 'header',
                  });
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-500/20"
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span>
                  <span>Book</span>
                </span>
              </button>

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

    </>
  );
};

export default Header;
