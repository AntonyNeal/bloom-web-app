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
      {/* Background overlay - frosted glass effect */}
      <div
        className="fixed inset-0 backdrop-blur-md bg-slate-900/30"
        onClick={onClose}
      ></div>

      {/* Modal panel - HEAVY steel & glass aesthetic, responsive to screen size */}
      <div
        ref={modalContentRef}
        className="relative z-10 w-full h-full sm:h-auto sm:max-h-[95vh] md:max-h-[92vh] lg:max-h-[95vh] max-w-[100vw] sm:max-w-[85vw] md:max-w-[70vw] lg:max-w-xl overflow-hidden rounded-none sm:rounded-xl bg-gradient-to-b from-slate-50 to-white border-0 sm:border-[3px] border-slate-300/40 flex flex-col"
        style={{
          boxShadow: `
            0 0 0 6px rgba(255, 255, 255, 0.15),
            0 0 0 8px rgba(148, 163, 184, 0.2),
            0 4px 6px -1px rgba(0, 0, 0, 0.15),
            0 12px 24px -4px rgba(0, 0, 0, 0.25),
            0 24px 48px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(148, 163, 184, 0.2)
          `,
          background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.98))'
        }}
      >
        {/* Top accent bar - steel ridge */}
        <div className="hidden sm:block h-2 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-t-lg" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.1)' }} />
        
        {/* Close button - extruded steel control from backplate */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:top-[-12px] sm:right-[-12px] text-slate-600 hover:text-slate-800 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-full p-3 z-30 border-[3px] border-slate-300 hover:border-slate-400 transition-all duration-200"
          style={{
            boxShadow: `
              0 0 0 2px rgba(255, 255, 255, 0.8),
              0 4px 12px rgba(0,0,0,0.2),
              0 8px 24px rgba(0,0,0,0.15),
              inset 0 2px 0 rgba(255,255,255,0.95),
              inset 0 -2px 4px rgba(100,116,139,0.2),
              inset 0 0 0 1px rgba(148,163,184,0.1)
            `,
            background: 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)'
          }}
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Booking form - responsive padding based on screen size */}
        <div className="p-[1.2vh] sm:p-[1.5vh] md:p-[2vh] pt-10 sm:pt-4">
          <BookingForm onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
};
