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

const DISPLAY_START_HOUR = 8;
const DISPLAY_END_HOUR = 20; // 8 pm
const SLOT_ROW_HEIGHT_PX = 44;

const getWeekStart = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const TimeSlotCalendar: React.FC<TimeSlotCalendarProps> = ({
  onSelectSlot,
  selectedDate,
  selectedTime,
  duration = 60,
  practitionerId,
}) => {
  const [minWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(minWeekStart);
  const [mobileActiveDayIndex, setMobileActiveDayIndex] = useState(0);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const upcomingDays = schedule.filter(
      (day) => day.date.getTime() >= today.getTime()
    );

    return upcomingDays.filter((day) => {
      const isToday =
        day.date.toDateString() === today.toDateString();
      if (isToday && day.slots.length === 0) {
        return false;
      }
      return true;
    });
  };

  const weekSchedule = generateWeekSchedule();
  const gridColumnTemplate = `repeat(${Math.max(weekSchedule.length, 1)}, minmax(0, 1fr))`;
  const selectedDateIndex = selectedDate
    ? weekSchedule.findIndex(
        (day) => formatDateForValue(day.date) === selectedDate
      )
    : -1;

  useEffect(() => {
    if (selectedDateIndex >= 0) {
      setMobileActiveDayIndex(selectedDateIndex);
      return;
    }

    setMobileActiveDayIndex((currentIndex) =>
      currentIndex < weekSchedule.length ? currentIndex : 0
    );
  }, [selectedDateIndex, weekSchedule.length]);

  useEffect(() => {
    if (selectedDateIndex === -1) {
      setMobileActiveDayIndex(0);
    }
  }, [currentWeekStart, selectedDateIndex]);

  const mobileActiveDay = weekSchedule[mobileActiveDayIndex] || weekSchedule[0];

  // Ensure consistent column heights by anchoring to a full 8am-8pm window
  const slotsPerHour = Math.max(
    1,
    Math.ceil(60 / Math.max(duration, 1))
  );
  const minDisplayRows = Math.max(
    1,
    (DISPLAY_END_HOUR - DISPLAY_START_HOUR) * slotsPerHour
  );

  // Calculate the maximum number of slots across all days for consistent height
  const maxSlotsInWeek = Math.max(
    minDisplayRows,
    ...weekSchedule.map((day) => day.slots.length)
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

  const renderSlotButton = (
    day: DaySchedule,
    slot: TimeSlot,
    slotIndex: number
  ) => {
    const isSelected = isSlotSelected(day, slot);
    const isWholeHour = slot.time.includes(':00 ');

    return (
      <button
        key={`${formatDateForValue(day.date)}-${slot.isoDateTime}-${slotIndex}`}
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
            <span className="font-semibold">{slot.time}</span>
          ) : (
            <div className="flex items-center gap-1.5 w-full">
              <div className="h-px w-2 bg-blue-400" aria-hidden="true"></div>
              <span className="text-[10px] sm:text-xs opacity-60">
                {slot.time.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
      </button>
    );
  };

  // Navigation handlers
  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);

    if (newStart.getTime() < minWeekStart.getTime()) {
      setCurrentWeekStart(minWeekStart);
      return;
    }

    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  return (
    <div className="w-full">
      {/* Halaxy-style Navigation - Simple date range with arrows */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={previousWeek}
            disabled={
              loading ||
              currentWeekStart.getTime() <= minWeekStart.getTime()
            }
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

      {/* Mobile-first stacked calendar */}
      <div
        className="lg:hidden space-y-4"
        role="region"
        aria-label="Mobile appointment calendar"
      >
        <div
          className="-mx-1 flex gap-2 overflow-x-auto pb-2 px-1"
          role="tablist"
          aria-label="Select a day"
        >
          {weekSchedule.map((day, index) => {
            const isActive = index === mobileActiveDayIndex;
            const isToday =
              day.date.toDateString() === new Date().toDateString();

            return (
              <button
                key={`${day.dayName}-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMobileActiveDayIndex(index)}
                className={`flex flex-col min-w-[90px] rounded-xl border-2 px-3 py-2 text-left shadow-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {day.dayName}
                </span>
                <span className="text-lg font-bold">
                  {day.dayNumber} {day.month}
                </span>
                {isToday && (
                  <span className="text-xs font-medium text-amber-600">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-2 border-gray-200 rounded-2xl bg-white p-4 shadow-sm">
          {mobileActiveDay ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {mobileActiveDay.dayName}, {mobileActiveDay.dayNumber}{' '}
                    {mobileActiveDay.month}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mobileActiveDay.slots.length || 'No'} times today
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {mobileActiveDay.slots.length > 0
                    ? 'Tap a time'
                    : 'No times'}
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-gray-100">
                {mobileActiveDay.slots.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No availability for this day
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {mobileActiveDay.slots.map((slot, slotIndex) =>
                      renderSlotButton(mobileActiveDay, slot, slotIndex)
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No days loaded
            </div>
          )}
        </div>
      </div>

      {/* Desktop calendar grid */}
      <div
        className="hidden lg:block"
        role="region"
        aria-labelledby="calendar-month-label"
        aria-label="Weekly appointment calendar"
      >
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative">
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

          <div
            className="grid gap-0 border-b-2 border-gray-300 bg-gray-50"
            style={{ gridTemplateColumns: gridColumnTemplate }}
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

          <div
            className="grid gap-0"
            style={{ gridTemplateColumns: gridColumnTemplate }}
            role="grid"
            aria-label="Available appointment time slots"
          >
            {weekSchedule.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-gray-200 last:border-r-0 flex flex-col"
                role="gridcell"
                style={{ minHeight: `${maxSlotsInWeek * SLOT_ROW_HEIGHT_PX}px` }}
              >
                <div className="flex flex-1 flex-col">
                  {day.slots.length === 0 ? (
                    <div
                      className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-400 flex-1 flex items-center justify-center"
                      role="status"
                    >
                      No availability
                    </div>
                  ) : (
                    day.slots.map((slot, slotIndex) =>
                      renderSlotButton(day, slot, slotIndex)
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
