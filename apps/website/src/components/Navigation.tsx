import { Link, useLocation } from 'react-router-dom';
import { getEnvVar } from '../utils/env';
import { Link } from 'react-router-dom';

// Extend window interface for halaxyBookingTracker
declare global {
  interface Window {
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

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
  ];

  const ctaButton = {
    name: 'Book Now',
    href: getEnvVar('VITE_BOOKING_URL') || '#',
    external: true,
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 hover:text-blue-700 transition-colors duration-200">
                <span className="hidden sm:inline">
                  Life Psychology Australia
                </span>
                <span className="sm:hidden">Life Psychology</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {ctaButton.external ? (
              <a
                href={ctaButton.href}
                onClick={(e) => {
                  // GA4 tracking
                  trackBookNowClick({
                    page_section: 'navigation',
                    button_location: 'top_navigation_cta',
                  });

                  if (window.halaxyBookingTracker) {
                    window.halaxyBookingTracker.handleBookingClick(e);
                  } else {
                    console.warn(
                      '[Navigation] halaxyBookingTracker not available on window'
                    );
                  }
                }}
                rel="noopener noreferrer"
                className="ml-6 sm:ml-8 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span>
                  <span className="hidden sm:inline">Book Now</span>
                  <span className="sm:hidden">Book</span>
                </span>
              </a>
            ) : (
              <Link
                to={ctaButton.href}
                className="ml-6 sm:ml-8 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
              >
                <span className="flex items-center gap-1">
                  <span className="text-sm">📅</span>
                  <span className="hidden sm:inline">Book Now</span>
                  <span className="sm:hidden">Book</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
