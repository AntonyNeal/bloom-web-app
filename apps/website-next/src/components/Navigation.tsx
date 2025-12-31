'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBooking } from './providers';

export function Navigation() {
  const pathname = usePathname();
  const { openBookingModal } = useBooking('navigation');

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'How to Book', path: '/appointments' },
    { name: 'Fees & Funding', path: '/pricing' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
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
                href={item.path}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  pathname === item.path
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => openBookingModal('top_navigation_cta')}
              className="ml-6 sm:ml-8 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
            >
              <span className="flex items-center gap-1">
                <span className="text-sm">📅</span>
                <span className="hidden sm:inline">Book Now</span>
                <span className="sm:hidden">Book</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
