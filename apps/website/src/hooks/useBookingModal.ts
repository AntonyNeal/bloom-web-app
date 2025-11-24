import { useState } from 'react';

/**
 * Hook for managing booking modal state
 */
export const useBookingModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openBookingModal = () => setIsOpen(true);
  const closeBookingModal = () => setIsOpen(false);

  return {
    isOpen,
    openBookingModal,
    closeBookingModal,
  };
};
