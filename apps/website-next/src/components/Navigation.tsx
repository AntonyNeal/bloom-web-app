'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBooking } from './providers';

export function Navigation() {
  const pathname = usePathname();
  const { openBookingModal } = useBooking('navigation');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Our Team', path: '/team' },
    { name: 'Services', path: '/services' },
    { name: 'How to Book', path: '/appointments' },
    { name: 'Fees & Funding', path: '/pricing' },
  ];

  const isActive = (path: string) => {
    if (path === '/services') {
      return pathname?.includes('/services') || 
             pathname?.includes('/individual-therapy') ||
             pathname?.includes('/couples-therapy') ||
             pathname?.includes('/anxiety-depression');
    }
    if (path === '/team') {
      return pathname?.startsWith('/team');
    }
    return pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Book Now Button */}
            <button
              type="button"
              onClick={() => openBookingModal('desktop_navigation')}
              className="ml-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
            >
              <span className="flex items-center gap-1">
                <span className="text-sm">📅</span>
                <span>Book Now</span>
              </span>
            </button>
          </nav>

          {/* Mobile Header - Book Now + Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Book Now Button */}
            <button
              type="button"
              onClick={() => openBookingModal('mobile_navigation')}
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
