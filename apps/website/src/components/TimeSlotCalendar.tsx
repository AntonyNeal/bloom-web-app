import React, { useEffect, useState } from 'react';
import {
  fetchAvailableSlots,
  formatTimeSlot,
  groupSlotsByDate,
  type AvailableSlot,
} from '../utils/halaxyAvailability';

interface TimeSlot {
  time: string;
  available: boolean;
  isoDateTime: string; // Add ISO datetime for precise matching
}

interface DaySchedule {
  date: Date;
  dayName: string;
  dayNumber: number;
  month: string;
  slots: TimeSlot[];
}

interface TimeSlotCalendarProps {
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  duration?: number; // Appointment duration in minutes (default 60)
  practitionerId?: string; // Optional: filter by specific practitioner
}

export const TimeSlotCalendar: React.FC<TimeSlotCalendarProps> = ({
  onSelectSlot,
  selectedDate,
  selectedTime,
  duration = 60,
  practitionerId,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available slots when week changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 7);

        console.log('[TimeSlotCalendar] Fetching Halaxy availability:', {
          start: currentWeekStart.toISOString(),
          end: weekEnd.toISOString(),
          duration,
          practitionerId,
          timestamp: new Date().toISOString(),
        });

        const params = {
          startDate: currentWeekStart,
          endDate: weekEnd,
          duration,
          ...(practitionerId ? { practitionerId } : {}),
        };

        const slots = await fetchAvailableSlots(params);

        console.log(
          '[TimeSlotCalendar] Received slots from Halaxy:',
          slots.length
        );
        console.log('[TimeSlotCalendar] First 10 slots:', slots.slice(0, 10));
        setAvailableSlots(slots);
      } catch (err) {
        console.error('[TimeSlotCalendar] Error fetching slots:', err);
        setError('Failed to load availability. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentWeekStart, duration, practitionerId]);

  // Auto-refresh availability every 60 seconds to mirror Halaxy in real-time
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      console.log('[TimeSlotCalendar] Auto-refreshing Halaxy availability');

      try {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 7);

        const params = {
          startDate: currentWeekStart,
          endDate: weekEnd,
          duration,
          ...(practitionerId ? { practitionerId } : {}),
        };

        const slots = await fetchAvailableSlots(params);
        setAvailableSlots(slots);
        console.log(
          '[TimeSlotCalendar] Auto-refresh complete:',
          slots.length,
          'slots'
        );
      } catch (err) {
        console.warn('[TimeSlotCalendar] Auto-refresh failed:', err);
        // Don't show error to user for background refresh failures
      }
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(refreshInterval);
  }, [currentWeekStart, duration, practitionerId]);

  // Generate week schedule from Halaxy availability data
  const generateWeekSchedule = (): DaySchedule[] => {
    const schedule: DaySchedule[] = [];
    const daysToShow = 7;

    // Group available slots by date
    const slotsByDate = groupSlotsByDate(availableSlots);

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
      const dayNumber = date.getDate();
      const month = date.toLocaleDateString('en-AU', { month: 'short' });

      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const daySlotsFromHalaxy = slotsByDate.get(dateKey) || [];

      // Only show available slots from Halaxy (no unavailable slots)
      const slots: TimeSlot[] = daySlotsFromHalaxy.map((slot) => ({
        time: formatTimeSlot(slot.start),
        available: true,
        isoDateTime: slot.start,
      }));

      schedule.push({
        date,
        dayName,
        dayNumber,
        month,
        slots,
      });
    }

    return schedule;
  };

  const weekSchedule = generateWeekSchedule();

  // Calculate the maximum number of slots across all days for consistent height
  const maxSlotsInWeek = Math.max(
    ...weekSchedule.map((day) => day.slots.length),
    1 // Minimum 1 to avoid height 0
  );

  // Format date range display (e.g., "09 Nov - 15 Nov")
  const getWeekDateRange = (): string => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    const startDay = currentWeekStart.getDate();
    const startMonth = currentWeekStart.toLocaleDateString('en-AU', {
      month: 'short',
    });
    const endDay = endDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-AU', { month: 'short' });

    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  const formatDateForValue = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeForValue = (timeStr: string): string => {
    // Convert "8:00 am" to "08:00:00"
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);

    if (period.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const handleSlotClick = (day: DaySchedule, slot: TimeSlot) => {
    if (!slot.available) return;

    const dateStr = formatDateForValue(day.date);
    const timeStr = formatTimeForValue(slot.time);

    onSelectSlot(dateStr, timeStr);
  };

  const isSlotSelected = (day: DaySchedule, slot: TimeSlot): boolean => {
    if (!selectedDate || !selectedTime) return false;

    const dateStr = formatDateForValue(day.date);
    const timeStr = formatTimeForValue(slot.time);

    return dateStr === selectedDate && timeStr === selectedTime;
  };

  // Navigation handlers
  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  return (
    <div className="w-full">
      {/* Halaxy-style Navigation - Simple date range with arrows */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={previousWeek}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous week"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
            {getWeekDateRange()}
          </span>

          <button
            onClick={nextWeek}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next week"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={goToToday}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
          aria-label="View full calendar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          View calendar
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm sm:text-base"
          role="alert"
          aria-live="assertive"
        >
          <strong className="font-semibold">Error: </strong>
          {error}
        </div>
      )}

      {/* Calendar grid - Always visible */}
      <div
        className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative"
        role="region"
        aria-labelledby="calendar-month-label"
        aria-label="Weekly appointment calendar"
      >
        {/* Loading overlay - subtle, doesn't hide calendar */}
        {loading && (
          <div
            className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium"
            role="status"
            aria-live="polite"
          >
            <div
              className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"
              aria-hidden="true"
            ></div>
            <span>Loading...</span>
          </div>
        )}

        {/* Day headers - Fixed at top */}
        <div
          className="grid grid-cols-7 gap-0 border-b-2 border-gray-300 bg-gray-50 sticky top-0 z-10"
          role="row"
          aria-label="Days of the week"
        >
          {weekSchedule.map((day, dayIndex) => {
            const isToday =
              day.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayIndex}
                className={`text-center p-2 sm:p-3 border-r border-gray-200 last:border-r-0 ${
                  isToday
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300'
                    : 'bg-gray-50 text-gray-700'
                }`}
                role="columnheader"
                aria-label={`${day.dayName} ${day.dayNumber} ${day.month}${isToday ? ' (Today)' : ''}`}
              >
                <div className="text-xs font-medium uppercase">
                  {day.dayName}
                </div>
                <div
                  className={`text-base sm:text-lg font-bold ${isToday ? 'text-amber-900' : 'text-gray-900'}`}
                >
                  {day.dayNumber}
                </div>
                <div className="text-xs">{day.month}</div>
                {isToday && <span className="sr-only">Today</span>}
              </div>
            );
          })}
        </div>

        {/* Time slots grid - Fixed height based on max slots */}
        <div
          className="grid grid-cols-7 gap-0"
          role="grid"
          aria-label="Available appointment time slots"
        >
          {weekSchedule.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="border-r border-gray-200 last:border-r-0 flex flex-col"
              role="gridcell"
              style={{ minHeight: `${maxSlotsInWeek * 44}px` }} // 44px per slot minimum
            >
              <div className="flex flex-col">
                {day.slots.length === 0 ? (
                  <div
                    className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-400"
                    role="status"
                  >
                    No availability
                  </div>
                ) : (
                  day.slots.map((slot, slotIndex) => {
                    const isSelected = isSlotSelected(day, slot);
                    // Check if this is a whole hour (e.g., "8:00 am", "9:00 am")
                    const isWholeHour = slot.time.includes(':00 ');

                    return (
                      <button
                        key={slotIndex}
                        type="button"
                        onClick={() => handleSlotClick(day, slot)}
                        className={`
                            w-full text-xs sm:text-sm py-2 sm:py-3 transition-all duration-150 font-medium relative
                            border-b border-gray-100 last:border-b-0
                            focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-inset focus:z-20
                            touch-manipulation min-h-[44px]
                            ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-sm ring-2 ring-inset ring-blue-400 z-10'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm'
                            }
                          `}
                        aria-label={`${day.dayName} ${day.month} ${day.dayNumber} at ${slot.time}${isSelected ? ' (selected)' : ''}`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center px-2">
                          {isWholeHour ? (
                            // Show full hour label
                            <span className="font-semibold">{slot.time}</span>
                          ) : (
                            // Show small notch for 15-min intervals
                            <div className="flex items-center gap-1.5 w-full">
                              <div
                                className="h-px w-2 bg-blue-400"
                                aria-hidden="true"
                              ></div>
                              <span className="text-[10px] sm:text-xs opacity-60">
                                {slot.time.split(' ')[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        className="mt-4 sm:mt-6 flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-lg border-2 border-gray-200"
        role="note"
        aria-label="Calendar legend"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-50 border-2 border-blue-200 rounded flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="font-medium text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded shadow flex-shrink-0"
            aria-hidden="true"
          ></div>
          <span className="font-medium text-gray-700">Selected</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-white px-2 sm:px-3 py-1.5 rounded-md border border-gray-300">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Only available times are shown</span>
        </div>
      </div>
    </div>
  );
};
