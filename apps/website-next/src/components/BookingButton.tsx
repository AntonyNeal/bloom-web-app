'use client';

import { useBooking } from './providers';

interface BookingButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function BookingButton({ children, className = '' }: BookingButtonProps) {
  const { openBookingModal } = useBooking('hero_booking_button');

  return (
    <button
      onClick={() => openBookingModal('hero_booking_button')}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
