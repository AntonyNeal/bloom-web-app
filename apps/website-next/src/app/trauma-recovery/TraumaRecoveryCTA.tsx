'use client';

import { useBooking } from '@/components/providers';

export function TraumaRecoveryCTA() {
  const { openBookingModal } = useBooking('trauma_recovery_page');

  return (
    <button
      type="button"
      onClick={() => openBookingModal('trauma_recovery_cta', 'trauma')}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100/70 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm mr-3">
        <span className="text-sm">📅</span>
      </span>
      Book a consultation
    </button>
  );
}
