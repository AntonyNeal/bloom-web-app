'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { trackBookingClick } from './AnalyticsProvider';
import { BookingModal } from '../booking/BookingModal';

interface BookingContextType {
  isModalOpen: boolean;
  selectedPractitionerSlug: string | null;
  openBookingModal: (location?: string, serviceType?: string, practitionerSlug?: string) => void;
  closeBookingModal: () => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPractitionerSlug, setSelectedPractitionerSlug] = useState<string | null>(null);

  const openBookingModal = useCallback((location = 'unknown', serviceType?: string, practitionerSlug?: string) => {
    trackBookingClick(location, serviceType);
    setSelectedPractitionerSlug(practitionerSlug || null);
    setIsModalOpen(true);
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPractitionerSlug(null);
  }, []);

  return (
    <BookingContext.Provider value={{ isModalOpen, selectedPractitionerSlug, openBookingModal, closeBookingModal }}>
      {children}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={closeBookingModal} 
        practitionerSlug={selectedPractitionerSlug}
      />
    </BookingContext.Provider>
  );
}

export function useBooking(fallbackSource = 'shared_booking_cta') {
  const context = useContext(BookingContext);
  
  if (!context) {
    // Return a fallback that just opens booking directly (shouldn't happen if provider is set up)
    return {
      isBookingModalOpen: false,
      selectedPractitionerSlug: null,
      openBookingModal: (location?: string, serviceType?: string, practitionerSlug?: string) => {
        trackBookingClick(location || fallbackSource, serviceType);
        // Include practitioner in URL if specified
        const url = practitionerSlug 
          ? `https://life-psychology.au2.halaxy.com/book?practitioner=${practitionerSlug}`
          : 'https://life-psychology.au2.halaxy.com/book';
        window.open(url, '_blank');
      },
      closeBookingModal: () => {},
    };
  }
  
  return {
    isBookingModalOpen: context.isModalOpen,
    selectedPractitionerSlug: context.selectedPractitionerSlug,
    openBookingModal: (location?: string, serviceType?: string, practitionerSlug?: string) => 
      context.openBookingModal(location || fallbackSource, serviceType, practitionerSlug),
    closeBookingModal: context.closeBookingModal,
  };
}
