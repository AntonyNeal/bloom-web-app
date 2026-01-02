import Link from 'next/link';
import { FooterBookingButton } from './FooterBookingButton';

// Footer is a Server Component - no client interactivity needed for basic links
// The booking button is a separate client component

export function Footer() {
  return (
    <footer 
      className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 min-h-[650px] md:min-h-[500px]"
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
                >
                  info@life-psychology.com.au
                </a>
              </p>
            </div>
            <div className="mt-4">
              <FooterBookingButton />
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
                  href="/"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Homepage
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/greater-hunter"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Newcastle & Greater Hunter
                </Link>
              </li>
              <li>
                <a
                  href="https://bloom.life-psychology.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Join Our Team
                </a>
              </li>
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
                  href="/individual-therapy"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Individual therapy
                </Link>
              </li>
              <li>
                <Link
                  href="/anxiety-depression"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Anxiety support
                </Link>
              </li>
              <li>
                <Link
                  href="/couples-therapy"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Couples therapy
                </Link>
              </li>
              <li>
                <Link
                  href="/neurodiversity"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
                >
                  Neurodiversity support
                </Link>
              </li>
              <li>
                <Link
                  href="/ndis-services"
                  className="hover:text-blue-600 transition-colors flex items-center py-1 min-h-[44px]"
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
        <div className="border-t border-gray-400 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-600 text-sm text-center sm:text-left">
              © 2025 Life Psychology Australia. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link
                href="/privacy"
                className="hover:text-blue-600 transition-colors min-h-[44px] flex items-center py-1"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Client component for the footer booking button is imported at the top

export default Footer;
