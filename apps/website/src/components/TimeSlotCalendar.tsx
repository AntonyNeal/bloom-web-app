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
  const [isSearchingForAvailability, setIsSearchingForAvailability] = useState(true);
  const [searchedWeeksWithNoSlots, setSearchedWeeksWithNoSlots] = useState<Set<string>>(new Set());

  // Fetch available slots when week changes and auto-advance if no availability
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 7);
        const weekKey = currentWeekStart.toISOString();

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
        
        // If no slots found and we haven't exceeded search limit, auto-advance to next week
        if (slots.length === 0 && isSearchingForAvailability) {
          const newSearchedWeeks = new Set(searchedWeeksWithNoSlots);
          newSearchedWeeks.add(weekKey);
          
          // Stop searching after 12 weeks to prevent infinite loop
          if (newSearchedWeeks.size < 12) {
            console.log('[TimeSlotCalendar] No availability this week, advancing to next week');
            setSearchedWeeksWithNoSlots(newSearchedWeeks);
            const nextWeekStart = new Date(currentWeekStart);
            nextWeekStart.setDate(currentWeekStart.getDate() + 7);
            setCurrentWeekStart(nextWeekStart);
            return; // Don't set slots or finish loading - let next fetch handle it
          } else {
            console.log('[TimeSlotCalendar] Searched 12 weeks, stopping search');
            setIsSearchingForAvailability(false);
          }
        } else if (slots.length > 0) {
          // Found availability, stop searching
          setIsSearchingForAvailability(false);
        }
        
        setAvailableSlots(slots);
      } catch (err) {
        console.error('[TimeSlotCalendar] Error fetching slots:', err);
        setError('Failed to load availability. Please try again.');
        setIsSearchingForAvailability(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentWeekStart, duration, practitionerId, isSearchingForAvailability, searchedWeeksWithNoSlots]);

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

    // Filter out past days but keep all upcoming days (even those with no availability)
    const upcomingDays = schedule.filter(
      (day) => day.date.getTime() >= today.getTime()
    );

    return upcomingDays;
  };

  // Helper functions - defined before use
  const formatDateForValue = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
        className="w-full text-xs py-2.5 transition-all duration-150 font-medium relative focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-inset focus:z-20 touch-manipulation min-h-[40px]"
        style={{
          background: isSelected 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(180deg, rgba(236,253,245,0.7) 0%, rgba(209,250,229,0.5) 100%)',
          color: isSelected ? '#ffffff' : '#047857',
          borderBottom: '1px solid rgba(226,232,240,0.3)',
          boxShadow: isSelected 
            ? 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(16,185,129,0.2)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8)'
        }}
        aria-label={`${day.dayName} ${day.month} ${day.dayNumber} at ${slot.time}${isSelected ? ' (selected)' : ''}`}
        aria-pressed={isSelected}
      >
        <div className="flex items-center justify-center px-2">
          {isWholeHour ? (
            <span className={`${isSelected ? 'font-bold' : 'font-semibold'}`}>{slot.time}</span>
          ) : (
            <div className="flex items-center gap-1 w-full justify-center">
              <span className="text-[10px] opacity-70">
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

  // Find and navigate to first week with availability (triggered by button click)
  const goToFirstAvailableWeek = () => {
    // Reset search state and let the effect handle finding availability
    if (weekSchedule.length === 0) {
      setSearchedWeeksWithNoSlots(new Set());
      setIsSearchingForAvailability(true);
      nextWeek();
    }
  };

  return (
    <div className="w-full">
      {/* Navigation - Refined steel finish */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={previousWeek}
            disabled={
              loading ||
              currentWeekStart.getTime() <= minWeekStart.getTime()
            }
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
            aria-label="Previous week"
          >
            <svg
              className="w-4 h-4 text-slate-500"
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

          <span className="text-sm font-semibold text-slate-700 min-w-[130px] text-center">
            {getWeekDateRange()}
          </span>

          <button
            onClick={nextWeek}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
            aria-label="Next week"
          >
            <svg
              className="w-4 h-4 text-slate-500"
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
          onClick={goToFirstAvailableWeek}
          className="text-emerald-600 hover:text-emerald-700 font-medium text-xs flex items-center gap-1 transition-colors"
          aria-label="Find first available week"
        >
          <svg
            className="w-3.5 h-3.5"
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
          Find availability
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

      {/* No availability message - only show after search is complete and week has no slots */}
      {!loading && !isSearchingForAvailability && !error && weekSchedule.every(day => day.slots.length === 0) && (
        <div
          className="p-6 text-center rounded-lg"
          style={{
            background: 'linear-gradient(145deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.98) 100%)',
            border: '1px solid rgba(226,232,240,0.6)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="text-slate-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-2">No availability found</p>
          <p className="text-sm text-slate-500 mb-4">We searched 12 weeks ahead but couldn't find any available appointments. Please check back later or contact us directly.</p>
          <button
            onClick={nextWeek}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
            }}
          >
            <span>Keep looking</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile-first stacked calendar - Glass finish */}
      {weekSchedule.length > 0 && (
      <div
        className="lg:hidden space-y-3"
        role="region"
        aria-label="Mobile appointment calendar"
      >
        <div
          className="-mx-1 flex gap-1.5 overflow-x-auto pb-2 px-1"
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
                className={`flex flex-col min-w-[80px] rounded-lg px-2.5 py-2 text-left transition-all ${
                  isActive
                    ? 'text-emerald-800'
                    : 'text-slate-600'
                }`}
                style={{
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(236,253,245,0.95) 0%, rgba(209,250,229,0.8) 100%)'
                    : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(226,232,240,0.8)',
                  boxShadow: isActive 
                    ? '0 2px 8px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.9)'
                    : '0 1px 2px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)'
                }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {day.dayName}
                </span>
                <span className="text-base font-bold">
                  {day.dayNumber} {day.month}
                </span>
                {isToday && (
                  <span className="text-[10px] font-medium text-amber-600">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div 
          className="rounded-xl p-3"
          style={{
            background: 'linear-gradient(145deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.98) 100%)',
            border: '1px solid rgba(226,232,240,0.6)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)'
          }}
        >
          {mobileActiveDay ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {mobileActiveDay.dayName}, {mobileActiveDay.dayNumber}{' '}
                    {mobileActiveDay.month}
                  </p>
                  <p className="text-xs text-slate-500">
                    {mobileActiveDay.slots.length || 'No'} times available
                  </p>
                </div>
                <span 
                  className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                  style={{
                    background: mobileActiveDay.slots.length > 0 
                      ? 'linear-gradient(135deg, rgba(236,253,245,0.9) 0%, rgba(209,250,229,0.7) 100%)'
                      : 'linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.7) 100%)',
                    color: mobileActiveDay.slots.length > 0 ? '#047857' : '#64748b',
                    border: mobileActiveDay.slots.length > 0 ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(148,163,184,0.2)'
                  }}
                >
                  {mobileActiveDay.slots.length > 0 ? 'Tap a time' : 'No times'}
                </span>
              </div>

              <div 
                className="max-h-[350px] overflow-y-auto rounded-lg"
                style={{
                  border: '1px solid rgba(226,232,240,0.5)',
                  background: 'rgba(255,255,255,0.6)'
                }}
              >
                {mobileActiveDay.slots.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
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
            <div className="p-4 text-center text-sm text-slate-400">
              No days loaded
            </div>
          )}
        </div>
      </div>
      )}

      {/* Desktop calendar grid - Clean glass finish */}
      {weekSchedule.length > 0 && (
      <div
        className="hidden lg:block"
        role="region"
        aria-labelledby="calendar-month-label"
        aria-label="Weekly appointment calendar"
      >
        <div 
          className="rounded-lg overflow-hidden relative"
          style={{
            border: '1px solid rgba(226,232,240,0.8)',
            background: 'rgba(255,255,255,0.98)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)'
          }}
        >
          {(loading || isSearchingForAvailability) && (
            <div
              className="absolute top-2 right-2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
              }}
              role="status"
              aria-live="polite"
            >
              <div
                className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"
                aria-hidden="true"
              ></div>
              <span>{isSearchingForAvailability ? 'Finding availability...' : 'Loading...'}</span>
            </div>
          )}

          <div
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: gridColumnTemplate,
              background: 'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(241,245,249,0.8) 100%)',
              borderBottom: '1px solid rgba(226,232,240,0.6)'
            }}
            role="row"
            aria-label="Days of the week"
          >
            {weekSchedule.map((day, dayIndex) => {
              const isToday =
                day.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dayIndex}
                  className="text-center p-2 sm:p-2.5"
                  style={{
                    borderRight: dayIndex < weekSchedule.length - 1 ? '1px solid rgba(226,232,240,0.4)' : 'none',
                    background: isToday 
                      ? 'linear-gradient(135deg, rgba(254,243,199,0.6) 0%, rgba(253,230,138,0.4) 100%)'
                      : 'transparent'
                  }}
                  role="columnheader"
                  aria-label={`${day.dayName} ${day.dayNumber} ${day.month}${isToday ? ' (Today)' : ''}`}
                >
                  <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-wide">
                    {day.dayName}
                  </div>
                  <div
                    className={`text-sm font-bold ${isToday ? 'text-amber-700' : 'text-slate-700'}`}
                  >
                    {day.dayNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">{day.month}</div>
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
                className="flex flex-col"
                style={{
                  borderRight: dayIndex < weekSchedule.length - 1 ? '1px solid rgba(226,232,240,0.4)' : 'none',
                  minHeight: `${maxSlotsInWeek * SLOT_ROW_HEIGHT_PX}px`
                }}
                role="gridcell"
              >
                <div className="flex flex-1 flex-col">
                  {day.slots.length === 0 ? (
                    <div
                      className="p-3 text-center text-xs text-slate-400 flex-1 flex items-center justify-center"
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
      )}

    </div>
  );
};
