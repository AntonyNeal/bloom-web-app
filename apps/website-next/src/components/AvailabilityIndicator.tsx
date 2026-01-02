'use client';

import { useState, useEffect } from 'react';

interface AvailableSlot {
  start: string;
  end: string;
  duration: number;
}

/**
 * Get human-readable availability text from a slot's start time
 * Uses Australia/Melbourne timezone for correct local time display
 */
function getTimeUntilAvailability(nextSlotStart: string): string {
  const slotTime = new Date(nextSlotStart);
  const now = new Date();

  // Check if the slot is today (in Melbourne timezone)
  const dateFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const slotDateStr = dateFormatter.format(slotTime);
  const todayDateStr = dateFormatter.format(now);
  const isToday = slotDateStr === todayDateStr;

  // Format time part
  const timeFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const timeParts = timeFormatter.formatToParts(slotTime);
  const hour = timeParts.find(p => p.type === 'hour')?.value || '';
  const minute = timeParts.find(p => p.type === 'minute')?.value || '';
  const dayPeriod = timeParts.find(p => p.type === 'dayPeriod')?.value || '';
  const time = `${hour}:${minute} ${dayPeriod}`;

  if (isToday) {
    return `Available today ${time}`;
  }

  // Get day name for non-today slots
  const dayFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
  });
  const dayName = dayFormatter.format(slotTime);

  return `Available ${dayName} ${time}`;
}

export function AvailabilityIndicator() {
  const [availabilityText, setAvailabilityText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // Get the Azure Function URL
        const baseUrl = process.env.NEXT_PUBLIC_AZURE_FUNCTION_URL || '';
        
        // Fetch availability for the next 7 days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        
        const url = `${baseUrl}/api/halaxy/availability?from=${startDate.toISOString()}&to=${endDate.toISOString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn('[AvailabilityIndicator] Failed to fetch availability:', response.status);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        // Parse FHIR-style response or direct slots array
        let slots: AvailableSlot[] = [];
        if (data.entry && Array.isArray(data.entry)) {
          // FHIR Bundle format
          slots = data.entry.map((entry: { resource: { start: string; end: string } }) => ({
            start: entry.resource.start,
            end: entry.resource.end,
            duration: 60,
          }));
        } else if (Array.isArray(data)) {
          slots = data;
        }
        
        // Filter out past slots and get the next available one
        const now = new Date();
        const futureSlots = slots.filter(slot => new Date(slot.start) > now);
        
        if (futureSlots.length > 0) {
          const nextSlot = futureSlots[0];
          setAvailabilityText(getTimeUntilAvailability(nextSlot.start));
        }
      } catch (error) {
        console.warn('[AvailabilityIndicator] Error fetching availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer until after initial render using requestIdleCallback
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as typeof window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
          .requestIdleCallback(() => fetchAvailability(), { timeout: 5000 });
      } else {
        // Fallback: delay by 2 seconds
        setTimeout(fetchAvailability, 2000);
      }
    }
  }, []);

  // Reserve space to prevent CLS, show content when loaded
  return (
    <div className="min-h-[24px] flex items-center gap-2 justify-center lg:justify-start text-sm text-emerald-700">
      {!isLoading && availabilityText && (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-medium">{availabilityText}</span>
        </>
      )}
    </div>
  );
}
