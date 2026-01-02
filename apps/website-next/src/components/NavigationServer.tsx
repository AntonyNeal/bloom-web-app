import Link from 'next/link';
import { MobileNavButton } from './MobileNavButton';
import { BookNowButton } from './BookNowButton';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'How to Book', path: '/appointments' },
  { name: 'Fees & Funding', path: '/pricing' },
];

// Server Component - most of the nav is static HTML
export function Navigation() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Server rendered */}
          <Link href="/" className="flex-shrink-0">
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray-800 hover:text-blue-700 transition-colors duration-200"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <span className="hidden sm:inline">Life Psychology Australia</span>
              <span className="sm:hidden">Life Psychology</span>
            </h1>
          </Link>

          {/* Desktop Navigation - Server rendered links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:text-blue-600 transition-all duration-200"
              >
                {item.name}
              </Link>
            ))}
            {/* Client component for booking button */}
            <BookNowButton variant="desktop" />
          </nav>

          {/* Mobile Header - minimal client JS */}
          <div className="md:hidden flex items-center space-x-2 relative">
            <BookNowButton variant="mobile" />
            <MobileNavButton />
          </div>
        </div>
      </div>
    </header>
  );
}
