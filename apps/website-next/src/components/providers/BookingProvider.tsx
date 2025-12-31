'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { trackBookingClick } from './AnalyticsProvider';

interface BookingContextType {
  isModalOpen: boolean;
  openBookingModal: (location?: string, serviceType?: string) => void;
  closeBookingModal: () => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openBookingModal = useCallback((location = 'unknown', serviceType?: string) => {
    trackBookingClick(location, serviceType);
    // Open external Halaxy booking in new tab
    window.open('https://life-psychology.au2.halaxy.com/book', '_blank');
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <BookingContext.Provider value={{ isModalOpen, openBookingModal, closeBookingModal }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(fallbackSource = 'shared_booking_cta') {
  const context = useContext(BookingContext);
  
  if (!context) {
    // Return a fallback that just opens booking directly
    return {
      isBookingModalOpen: false,
      openBookingModal: (location?: string, serviceType?: string) => {
        trackBookingClick(location || fallbackSource, serviceType);
        window.open('https://life-psychology.au2.halaxy.com/book', '_blank');
      },
      closeBookingModal: () => {},
    };
  }
  
  return {
    isBookingModalOpen: context.isModalOpen,
    openBookingModal: (location?: string, serviceType?: string) => 
      context.openBookingModal(location || fallbackSource, serviceType),
    closeBookingModal: context.closeBookingModal,
  };
}
