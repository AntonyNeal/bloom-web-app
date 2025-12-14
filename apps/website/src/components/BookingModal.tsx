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
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Background overlay - instant appearance, no transitions */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-opacity-95 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal panel - HEAVY steel & glass aesthetic, fixed size */}
      <div
        ref={modalContentRef}
        className="relative z-10 w-full h-full sm:h-[600px] sm:max-h-[98vh] max-w-xl overflow-hidden rounded-none sm:rounded-xl bg-gradient-to-b from-slate-50 to-white border-0 sm:border-2 border-slate-300"
        style={{
          boxShadow: `
            0 0 0 1px rgba(148, 163, 184, 0.4),
            0 4px 6px -1px rgba(0, 0, 0, 0.15),
            0 12px 24px -4px rgba(0, 0, 0, 0.25),
            0 24px 48px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(148, 163, 184, 0.2)
          `
        }}
      >
        {/* Top accent bar - steel ridge */}
        <div className="hidden sm:block h-2 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-t-lg" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.1)' }} />
        
        {/* Close button - heavy, tactile feel */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 text-slate-500 hover:text-slate-700 bg-gradient-to-b from-white to-slate-100 rounded-lg p-2.5 z-20 border-2 border-slate-300 hover:border-slate-400"
          style={{
            boxShadow: `
              0 2px 4px rgba(0,0,0,0.1),
              0 4px 8px rgba(0,0,0,0.1),
              inset 0 1px 0 rgba(255,255,255,0.9),
              inset 0 -1px 0 rgba(148,163,184,0.3)
            `
          }}
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Booking form - constrained to modal height */}
        <div className="p-3 sm:p-4 pt-10 sm:pt-4 h-full overflow-y-auto">
          <BookingForm onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
};
