import React, { useEffect, useRef, useState } from 'react';
import { BookingForm } from './BookingForm';

// Skeleton loading component for seamless modal open
const BookingFormSkeleton: React.FC = () => (
  <div className="max-w-xl w-full mx-auto animate-pulse">
    {/* Header skeleton */}
    <div className="mb-4">
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
    </div>
    
    {/* Progress bar skeleton */}
    <div className="mb-4 p-3 rounded-lg bg-slate-100">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="text-center">
            <div className="mx-auto w-5 h-5 rounded-md bg-slate-200 mb-1"></div>
            <div className="h-2 bg-slate-200 rounded w-12 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="mt-2 h-1.5 bg-slate-200 rounded-full"></div>
    </div>
    
    {/* Form fields skeleton */}
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-slate-200 rounded-lg"></div>
        <div className="h-12 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-12 bg-slate-200 rounded-lg"></div>
      <div className="h-12 bg-slate-200 rounded-lg"></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-12 bg-slate-200 rounded-lg"></div>
        <div className="h-12 bg-slate-200 rounded-lg"></div>
        <div className="h-12 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-12 bg-slate-200 rounded-lg"></div>
      <div className="h-12 bg-slate-200 rounded-lg mt-4"></div>
    </div>
  </div>
);

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
  const [isReady, setIsReady] = useState(false);

  // Handle form ready state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Delay showing the actual form to allow skeleton to display briefly
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => {
        clearTimeout(timer);
        setIsReady(false);
      };
    }
  }, [isOpen]);

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

  // Always render the modal but hide it with CSS when not open
  // This keeps it in memory for instant display
  console.log('[BookingModal] Rendering modal, isOpen:', isOpen);

  const handleSuccess = (appointmentId: string) => {
    console.log('[BookingModal] Booking successful:', appointmentId);
    // Modal will show success state, user closes it manually
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      {/* Background overlay - frosted glass effect with fade animation */}
      <div
        className={`fixed inset-0 backdrop-blur-md bg-slate-900/30 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Modal panel - fills viewport, uses dvh for mobile browser chrome */}
      <div
        ref={modalContentRef}
        className={`relative z-10 w-dvw h-dvh sm:w-[95vw] sm:h-[95vh] sm:max-h-[95vh] md:max-w-4xl overflow-hidden sm:rounded-xl bg-gradient-to-b from-slate-50 to-white sm:border-[3px] border-slate-300/40 flex flex-col transition-all duration-200 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
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

        {/* Booking form - fills available space, no scroll */}
        <div className="p-2 sm:p-4 md:p-5 pt-4 sm:pt-4 flex-1 flex flex-col min-h-0">
          {isReady ? (
            <div className="animate-fadeIn flex-1 flex flex-col min-h-0">
              <BookingForm onSuccess={handleSuccess} onCancel={onClose} />
            </div>
          ) : (
            <BookingFormSkeleton />
          )}
        </div>
      </div>
      
      {/* Fade-in animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};
