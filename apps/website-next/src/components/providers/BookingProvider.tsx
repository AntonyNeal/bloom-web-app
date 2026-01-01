'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { trackBookingClick } from './AnalyticsProvider';

const BOOKING_URL = 'https://life-psychology.au2.halaxy.com/book';

interface BookingContextType {
  isModalOpen: boolean;
  openBookingModal: (location?: string, serviceType?: string) => void;
  closeBookingModal: () => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

// Modal component
function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Book an appointment"
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 backdrop-blur-md bg-slate-900/30"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full h-[92dvh] sm:w-[95vw] sm:h-[90vh] md:max-w-4xl overflow-hidden rounded-t-2xl sm:rounded-xl bg-white flex flex-col"
        style={{
          boxShadow: '0 24px 48px -8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Book an Appointment</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Iframe content */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={BOOKING_URL}
            title="Book an appointment with Life Psychology Australia"
            className="w-full h-full border-0"
            allow="payment"
          />
        </div>
      </div>
    </div>
  );
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openBookingModal = useCallback((location = 'unknown', serviceType?: string) => {
    trackBookingClick(location, serviceType);
    setIsModalOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsModalOpen(false);
    // Restore body scroll
    document.body.style.overflow = '';
  }, []);

  return (
    <BookingContext.Provider value={{ isModalOpen, openBookingModal, closeBookingModal }}>
      {children}
      <BookingModal isOpen={isModalOpen} onClose={closeBookingModal} />
    </BookingContext.Provider>
  );
}

export function useBooking(fallbackSource = 'shared_booking_cta') {
  const context = useContext(BookingContext);
  
  if (!context) {
    // Return a fallback that just opens booking directly (shouldn't happen if provider is set up)
    return {
      isBookingModalOpen: false,
      openBookingModal: (location?: string, serviceType?: string) => {
        trackBookingClick(location || fallbackSource, serviceType);
        window.open(BOOKING_URL, '_blank');
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
