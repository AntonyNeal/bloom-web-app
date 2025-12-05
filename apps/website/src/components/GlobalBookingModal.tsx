import { BookingModal } from './BookingModal';
import { useBookingService } from '../hooks/useBookingService';

/**
 * Renders a single instance of the booking modal and subscribes to global booking state
 */
const GlobalBookingModal = () => {
  const { isModalOpen, closeModal } = useBookingService();

  return <BookingModal isOpen={isModalOpen} onClose={closeModal} />;
};

export default GlobalBookingModal;
