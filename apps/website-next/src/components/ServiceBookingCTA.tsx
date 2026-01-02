'use client';

import { useBooking } from './providers';

interface ServiceBookingCTAProps {
  label?: string;
  buttonLocation?: string;
  serviceType?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ServiceBookingCTA({ 
  label = 'Book an Appointment',
  buttonLocation = 'service_page_cta',
  serviceType,
  className,
  children
}: ServiceBookingCTAProps) {
  const { openBookingModal } = useBooking(buttonLocation);

  return (
    <button
      onClick={() => openBookingModal(buttonLocation, serviceType)}
      className={className || "inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"}
      type="button"
    >
      {children || label}
    </button>
  );
}
