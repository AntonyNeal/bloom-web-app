/**
 * useBookingService - React hook for booking functionality
 *
 * Provides a clean interface for components to interact with BookingService
 */

import { useEffect, useState, useCallback } from 'react';
import {
  bookingService,
  BookingModalState,
  BookingClickOptions,
} from '../services/BookingService';

export function useBookingService() {
  const [modalState, setModalState] = useState<BookingModalState>({
    isOpen: false,
  });

  // Subscribe to modal state changes
  useEffect(() => {
    const unsubscribe = bookingService.onModalStateChange(setModalState);
    return unsubscribe;
  }, []);

  // Handle booking click
  const handleBookingClick = useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
      options: BookingClickOptions
    ) => {
      bookingService.handleBookingClick(event, options);
    },
    []
  );

  // Open modal programmatically
  const openModal = useCallback((source: string) => {
    bookingService.openBookingModal(source);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    bookingService.closeBookingModal();
  }, []);

  return {
    modalState,
    isModalOpen: modalState.isOpen,
    handleBookingClick,
    openModal,
    closeModal,
  };
}
