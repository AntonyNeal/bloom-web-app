import React from 'react';
import { useBookingService } from '../hooks/useBookingService';

const MobileCTABar: React.FC = () => {
  const { isModalOpen, handleBookingClick } = useBookingService();

  const handleBookingClickEvent = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    handleBookingClick(event, {
      buttonLocation: 'mobile_cta_bar',
      pageSection: 'floating_bar',
      variant: 'mobile',
    });
  };

  // Don't render if booking modal is open
  if (isModalOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile-only conversion-optimized CTA bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Social proof + urgency */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 text-sm font-medium">
                  Available this week
                </span>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              onClick={handleBookingClickEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-base">📅</span>
              <span className="text-sm">Book Now</span>
            </button>
          </div>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white"></div>
      </div>

      {/* Add bottom padding to body when mobile CTA is present */}
      <style>
        {`
          @media (max-width: 767px) {
            body {
              padding-bottom: 60px !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default MobileCTABar;
