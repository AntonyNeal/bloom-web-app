'use client';

import { useBooking } from '@/components/providers';

export function AppointmentsCTA() {
  const { openBookingModal } = useBooking('appointments_page');

  return (
    <button
      onClick={() => openBookingModal('appointments_main_cta')}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg"
    >
      📅 Book Your Appointment Now
    </button>
  );
}
