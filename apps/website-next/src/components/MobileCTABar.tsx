'use client';

import { useState, useEffect } from 'react';
import { useBooking } from './providers';

interface AvailableSlot {
  start: string;
  end: string;
}

function getTimeUntilAvailability(startTime: string): string {
  const slotDate = new Date(startTime);
  const now = new Date();
  
  const diffMs = slotDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[slotDate.getDay()];
  
  const hours = slotDate.getHours();
  const minutes = slotDate.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  if (diffDays === 0) {
    return `Today ${timeStr}`;
  } else if (diffDays === 1) {
    return `Tomorrow ${timeStr}`;
  } else {
    return `${dayName} ${timeStr}`;
  }
}

export function MobileCTABar() {
  const [availabilityText, setAvailabilityText] = useState<string | null>(null);
  const { openBookingModal } = useBooking('mobile_cta_bar');

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_AZURE_FUNCTION_URL || '';
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        
        const url = `${baseUrl}/api/halaxy/availability?from=${startDate.toISOString()}&to=${endDate.toISOString()}`;
        const response = await fetch(url);
        
        if (!response.ok) return;
        
        const data = await response.json();
        let slots: AvailableSlot[] = [];
        
        if (data.entry && Array.isArray(data.entry)) {
          slots = data.entry.map((entry: { resource: { start: string; end: string } }) => ({
            start: entry.resource.start,
            end: entry.resource.end,
          }));
        } else if (Array.isArray(data)) {
          slots = data;
        }
        
        if (slots.length > 0) {
          setAvailabilityText(getTimeUntilAvailability(slots[0].start));
        }
      } catch {
        // Silently fail - availability text is optional
      }
    };

    // Defer fetch to not block initial render
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => fetchAvailability());
      } else {
        setTimeout(fetchAvailability, 2000);
      }
    }
  }, []);

  return (
    <>
      {/* Mobile-only conversion-optimized CTA bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Availability indicator */}
            <div className="flex flex-col min-w-[120px]" style={{ minHeight: '24px' }}>
              {availabilityText && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-gray-700 text-sm font-medium">
                    {availabilityText}
                  </span>
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => openBookingModal('mobile_cta_bar')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-base">📅</span>
              <span className="text-sm">Book Now</span>
            </button>
          </div>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="pb-safe" />
      </div>
    </>
  );
}
