import React, { useState, useEffect } from 'react';
import { useBookingService } from '../hooks/useBookingService';
import { getNextAvailableSlot } from '../utils/availabilityPreloader';
import { getTimeUntilAvailability } from '../utils/halaxyAvailability';

const MobileCTABar: React.FC = () => {
  const { isModalOpen, handleBookingClick } = useBookingService();
  const [availabilityText, setAvailabilityText] = useState<string | null>(null);
  
  // Update availability text when cache is populated
  useEffect(() => {
    const updateAvailability = () => {
      const nextSlot = getNextAvailableSlot();
      if (nextSlot) {
        setAvailabilityText(getTimeUntilAvailability(nextSlot.start));
      }
      // Don't show anything if no slot available yet
    };
    
    // Check immediately in case cache is already populated
    updateAvailability();
    
    // Listen for when availability is loaded
    window.addEventListener('availabilityLoaded', updateAvailability);
    return () => window.removeEventListener('availabilityLoaded', updateAvailability);
  }, []);

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
            {/* Social proof + urgency - always render container to prevent CLS */}
            <div className="flex flex-col min-w-[120px]" style={{ minHeight: '24px' }}>
              {availabilityText && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 text-sm font-medium">
                    {availabilityText}
                  </span>
                </div>
              )}
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
      {/* CLS Prevention: padding-bottom is now set statically in App.css instead of dynamic injection */}
    </>
  );
};

export default MobileCTABar;
