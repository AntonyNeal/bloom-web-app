import { lazy, Suspense } from 'react';
import { useBookingService } from '../hooks/useBookingService';

// Lazy load BookingModal to reduce initial bundle size
const BookingModal = lazy(() => import('./BookingModal').then(m => ({ default: m.BookingModal })));

/**
 * Renders a single instance of the booking modal and subscribes to global booking state
 * BookingModal is lazy loaded to improve initial page performance
 */
const GlobalBookingModal = () => {
  const { isModalOpen, closeModal } = useBookingService();

  // Only render Suspense wrapper when modal should be open
  // This prevents loading the BookingModal chunk until actually needed
  if (!isModalOpen) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <BookingModal isOpen={isModalOpen} onClose={closeModal} />
    </Suspense>
  );
};

export default GlobalBookingModal;
