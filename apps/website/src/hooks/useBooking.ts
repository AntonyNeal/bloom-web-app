import { useCallback } from 'react';
import type React from 'react';
import { useBookingService } from './useBookingService';
import type { BookingClickOptions } from '../services/BookingService';

type OpenBookingOptions = Partial<BookingClickOptions>;

/**
 * Shared hook that proxies all booking interactions through the global BookingService
 * Ensures every CTA triggers the same modal instance regardless of component
 */
export const useBooking = (fallbackSource = 'shared_booking_cta') => {
  const { isModalOpen, handleBookingClick, openModal, closeModal } =
    useBookingService();

  const openBookingModal = useCallback(
    (
      event?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
      options: OpenBookingOptions = {}
    ) => {
      const resolvedOptions: BookingClickOptions = {
        buttonLocation: options.buttonLocation || fallbackSource,
        pageSection: options.pageSection,
        variant: options.variant,
      };

      if (event) {
        handleBookingClick(event, resolvedOptions);
        return;
      }

      openModal(resolvedOptions.buttonLocation);
    },
    [fallbackSource, handleBookingClick, openModal]
  );

  const closeBookingModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return {
    isBookingModalOpen: isModalOpen,
    openBookingModal,
    closeBookingModal,
  };
};
