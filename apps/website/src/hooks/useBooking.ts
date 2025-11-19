import { useState } from 'react';

/**
 * Shared hook for managing booking modal across all pages
 * Centralizes booking button behavior to ensure consistency
 */
export const useBooking = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const openBookingModal = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    console.log('[useBooking] Opening booking modal');
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    console.log('[useBooking] Closing booking modal');
    setIsBookingModalOpen(false);
  };

  return {
    isBookingModalOpen,
    openBookingModal,
    closeBookingModal,
  };
};
