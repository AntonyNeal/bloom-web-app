import React, { useEffect, useRef } from 'react';
import { BookingForm } from './BookingForm';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
}) => {
  console.log('[BookingModal] Rendered with isOpen:', isOpen);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll and hide mobile CTA when modal is open
  useEffect(() => {
    if (isOpen) {
      // Dispatch event to hide mobile CTA bar
      window.dispatchEvent(new CustomEvent('bookingModalOpened'));

      // Store original body styles
      const originalOverflow = document.body.style.overflow;
      const originalPaddingBottom = document.body.style.paddingBottom;

      // Prevent body scroll and remove bottom padding (since CTA will be hidden)
      document.body.style.overflow = 'hidden';
      document.body.style.paddingBottom = '0';

      return () => {
        // Dispatch event to show mobile CTA bar again
        window.dispatchEvent(new CustomEvent('bookingModalClosed'));

        // Restore original styles when modal closes
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingBottom = originalPaddingBottom;
      };
    }

    return undefined;
  }, [isOpen]);

  // Scroll to top when step changes
  useEffect(() => {
    const handleScrollToTop = () => {
      if (modalContentRef.current) {
        modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('bookingStepChanged', handleScrollToTop);
    return () => {
      window.removeEventListener('bookingStepChanged', handleScrollToTop);
    };
  }, []);

  if (!isOpen) {
    console.log('[BookingModal] Not rendering - isOpen is false');
    return null;
  }

  console.log('[BookingModal] Rendering modal content');

  const handleSuccess = (appointmentId: string) => {
    console.log('[BookingModal] Booking successful:', appointmentId);
    // Modal will show success state, user closes it manually
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal panel - full screen on mobile, large modal on desktop */}
      <div
        ref={modalContentRef}
        className="relative z-10 w-full h-full sm:h-auto sm:max-h-[95vh] max-w-4xl overflow-y-auto rounded-none sm:rounded-2xl bg-white shadow-2xl"
      >
        {/* Close button - positioned absolutely in top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all z-20 border border-gray-200"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Booking form */}
        <div className="p-3 sm:p-6 pt-8 sm:pt-10">
          <BookingForm onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
};
