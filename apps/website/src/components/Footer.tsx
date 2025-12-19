import { Link } from 'react-router-dom';
import { useBooking } from '../hooks/useBooking';

const Footer = () => {
  // Show recruitment link in all environments
  const showRecruitment = true;
  const { openBookingModal } = useBooking('footer');

  // Determine the correct "Join Our Team" URL based on current hostname
  const getJoinTeamUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'staging.life-psychology.com.au') {
        return 'https://staging.bloom.life-psychology.com.au';
      }
    }
    return 'https://bloom.life-psychology.com.au';
  };

  return (
    <>
      <footer 
        className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 min-h-[650px] md:min-h-[500px]" 
        style={{ 
          contentVisibility: 'auto',
          containIntrinsicSize: '0 650px'
        }}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Life Psychology Australia
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="text-sm leading-relaxed">
                Telehealth psychology for Newcastle and the Greater Hunter,
                available Australia-wide.
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span>{' '}
                <a
                  href="mailto:info@life-psychology.com.au"
                  className="text-blue-600 hover:text-blue-700 transition-colors underline min-h-[44px] flex items-center py-1"
                  onClick={() => {
                    if (window.gtag) {
                      window.gtag('event', 'email_click', {
                        event_category: 'Contact',
                        event_label: 'footer_email_click',
                        value: 30,
                        email_address: 'info@life-psychology.com.au',
                        click_location: 'footer',
                      });
                    }
                  }}
                >
                  info@life-psychology.com.au
                </a>
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={(event) =>
                  openBookingModal(event, {
                    buttonLocation: 'footer_primary_cta',
                    pageSection: 'footer',
                  })
                }
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full sm:w-auto justify-center gap-2"
              >
                <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100/70 rounded-md border border-blue-200/60 shadow-sm text-sm sm:text-lg">
                  📅
                </span>
                <span className="sm:text-sm">Book Appointment</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link
                  to="/"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  Homepage
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/greater-hunter"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  Newcastle & Greater Hunter
                </Link>
              </li>
              {showRecruitment && (
                <li>
                  <a
                    href={getJoinTeamUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  >
                    Join Our Team
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Our Services
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link
                  to="/individual-therapy"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  Individual therapy
                </Link>
              </li>
              <li>
                <Link
                  to="/anxiety-depression"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  Anxiety support
                </Link>
              </li>
              <li>
                <Link
                  to="/couples-therapy"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  Couples therapy
                </Link>
              </li>
              <li>
                <Link
                  to="/neurodiversity"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  Neurodiversity support
                </Link>
              </li>
              <li>
                <Link
                  to="/ndis-services"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                >
                  NDIS psychology services
                </Link>
              </li>
            </ul>
          </div>

          {/* Rebates & Accessibility */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Rebates & Accessibility
            </h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start">
                <span className="text-emerald-600 mr-2 mt-1">✓</span>
                Medicare rebates (with a valid plan)
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2 mt-1">✓</span>
                NDIS (self or plan managed)
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2 mt-1">✓</span>
                Private health rebates
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2 mt-1">✓</span>
                Telehealth: secure video sessions
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm text-center sm:text-left">
              © 2025 Life Psychology Australia. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link
                to="/privacy"
                className="hover:text-blue-400 transition-colors min-h-[44px] flex items-center py-1"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Privacy Policy
              </Link>
              {/* Smoke Test Link - navigates to bloom admin */}
              {import.meta.env.DEV && (
                <a
                  href="http://localhost:5174/admin/smoke-tests"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors min-h-[44px] flex items-center py-1 opacity-50 hover:opacity-100"
                  title="Run Smoke Tests (Dev Only)"
                >
                  🧪 Smoke Tests
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
