import { useBookingService } from '../hooks/useBookingService';
import { BookingModal } from './BookingModal';

/**
 * Renders a single instance of the booking modal and subscribes to global booking state.
 * 
 * The modal is always rendered but hidden when not open. This approach:
 * - Eliminates loading delay when user clicks "Book Now"
 * - Keeps the modal in memory for instant display
 * - Uses CSS visibility/pointer-events for hiding (not DOM removal)
 */
const GlobalBookingModal = () => {
  const { isModalOpen, closeModal } = useBookingService();

  // Always render the modal - it handles its own visibility
  return <BookingModal isOpen={isModalOpen} onClose={closeModal} />;
};

export default GlobalBookingModal;
