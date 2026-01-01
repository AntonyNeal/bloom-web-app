'use client';

import { useBooking } from './providers';

interface BookNowButtonProps {
  variant: 'desktop' | 'mobile';
}

export function BookNowButton({ variant }: BookNowButtonProps) {
  const { openBookingModal } = useBooking(`${variant}_navigation`);

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={() => openBookingModal(`${variant}_navigation`)}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-500/20"
      >
        <span className="flex items-center gap-1">
          <span className="text-sm">📅</span>
          <span>Book</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openBookingModal(`${variant}_navigation`)}
      className="ml-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-blue-500/20"
    >
      <span className="flex items-center gap-1">
        <span className="text-sm">📅</span>
        <span>Book Now</span>
      </span>
    </button>
  );
}
