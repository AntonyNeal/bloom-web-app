'use client';

import Link from 'next/link';
import { useBooking } from '@/components/providers';

export function GreaterHunterCTA() {
  const { openBookingModal } = useBooking('greater_hunter_page');

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <button
        onClick={() => openBookingModal('greater_hunter_cta')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="mr-2">📅</span>
        Book an appointment
      </button>
      <Link
        href="/services"
        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-4 px-8 rounded-lg transition-all duration-200"
      >
        View all services
      </Link>
    </div>
  );
}
