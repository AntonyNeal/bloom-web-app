import React, { useEffect, useState } from 'react';
import {
  fetchAvailableSlots,
  formatTimeSlot,
  groupSlotsByDate,
  type AvailableSlot,
} from '../utils/halaxyAvailability';
import { getCachedAvailability } from '../utils/availabilityPreloader';

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

const SLOT_ROW_HEIGHT_PX = 34; // Compact height for grid view

/**
 * Format a date as YYYY-MM-DD in Melbourne timezone
 * This must match the format used in groupSlotsByDate
 */
const formatDateKeyMelbourne = (date: Date): string => {
  // Create a date representing "midnight" on the given date in Melbourne time
  // We need to find what UTC time corresponds to midnight Melbourne on this date
  
  // For display dates (which are in browser local time), we want to show
  // slots that occur on that calendar date in Melbourne
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

        // Check if we have cached availability from the preloader
        const cachedSlots = getCachedAvailability(currentWeekStart);
        let slots: AvailableSlot[];

        if (cachedSlots !== null && !practitionerId) {
          // Use cached data (only if no practitioner filter, since cache doesn't filter)
          console.log('[TimeSlotCalendar] Using cached availability:', cachedSlots.length, 'slots');
          slots = cachedSlots;
        } else {
          // Fetch fresh data
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

          slots = await fetchAvailableSlots(params);

          console.log(
            '[TimeSlotCalendar] Received slots from Halaxy:',
            slots.length
          );
          console.log('[TimeSlotCalendar] First 10 slots:', slots.slice(0, 10));
        }
        
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
  const getTimeRangeForDay = (slots: TimeSlot[]): string => {
    if (slots.length === 0) return '';
    
    const times = slots.map(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour;
    }).sort((a, b) => a - b);
    
    const minHour = times[0];
    const maxHour = times[times.length - 1];
    
    const formatter = new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      hour12: true,
    });
    
    const minTime = formatter.format(new Date(0, 0, 0, minHour));
    const maxTime = formatter.format(new Date(0, 0, 0, maxHour));
    
    return `${minTime} - ${maxTime}`;
  };

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

      // Format date key as YYYY-MM-DD to match groupSlotsByDate format
      // Use the calendar date directly (not UTC conversion)
      const dateKey = formatDateKeyMelbourne(date);
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

    // Filter out past days
    const upcomingDays = schedule.filter(
      (day) => day.date.getTime() >= today.getTime()
    );

    // Ensure Monday is always first (if it exists in upcoming days)
    const mondayIndex = upcomingDays.findIndex(day => {
      const dayOfWeek = day.date.getDay();
      return dayOfWeek === 1; // Monday = 1
    });

    let result = upcomingDays;
    
    // If Monday exists but isn't first, reorder to put it first
    if (mondayIndex > 0) {
      const monday = upcomingDays[mondayIndex];
      result = [monday, ...upcomingDays.slice(0, mondayIndex), ...upcomingDays.slice(mondayIndex + 1)];
    }

    // Drop days from the end (Friday, Saturday, Sunday) if they have no availabilities
    // But keep at least Monday and any days with availability
    while (result.length > 1) {
      const lastDay = result[result.length - 1];
      const dayOfWeek = lastDay.date.getDay();
      
      // If last day has no slots AND it's Friday/Saturday/Sunday, remove it
      if (lastDay.slots.length === 0 && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)) {
        result = result.slice(0, -1);
      } else {
        break; // Stop if we hit a day with slots or a weekday
      }
    }

    // Only show days that have availability - this improves UX by:
    // - Preventing confusion about unavailable days
    // - Saving mobile screen space
    // - Guiding users to bookable times clearly
    const daysWithAvailability = result.filter(day => day.slots.length > 0);

    return daysWithAvailability;
  };

  // Helper functions - defined before use
  const formatDateForValue = (date: Date): string => {
    // Use local date components to avoid timezone issues
    // (toISOString uses UTC which can be a different day in Australia)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weekSchedule = generateWeekSchedule();
  const selectedDateIndex = selectedDate
    ? weekSchedule.findIndex(
        (day) => formatDateForValue(day.date) === selectedDate
      )
    : -1;

  // Track if user has manually selected a day (to prevent auto-selection from overriding)
  const [userSelectedDay, setUserSelectedDay] = useState(false);

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
      setUserSelectedDay(false); // Reset user selection when week changes
    }
  }, [currentWeekStart, selectedDateIndex]);

  // Auto-select the first day with availability when the modal opens
  // Only runs once when slots first load, not on every render
  useEffect(() => {
    // Skip if user has manually selected a day
    if (userSelectedDay) return;
    
    // Only auto-select if no date is currently selected and we have availability
    if (!selectedDate && !loading && availableSlots.length > 0) {
      // Find the first day in the schedule that has available slots
      const firstAvailableDay = weekSchedule.find((day) => day.slots.length > 0);
      
      if (firstAvailableDay) {
        const dateValue = formatDateForValue(firstAvailableDay.date);
        console.log('[TimeSlotCalendar] Auto-selecting first available day:', dateValue);
        
        // Update mobile active day index
        const dayIndex = weekSchedule.findIndex((day) => day.slots.length > 0);
        if (dayIndex >= 0) {
          setMobileActiveDayIndex(dayIndex);
        }
        
        // Note: We don't call onSelectSlot here because we only want to highlight the day,
        // not actually select a time slot. The user still needs to pick a specific time.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, loading, availableSlots.length, userSelectedDay]);

  const mobileActiveDay = weekSchedule[mobileActiveDayIndex] || weekSchedule[0];

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

    return (
      <button
        key={`${formatDateForValue(day.date)}-${slot.isoDateTime}-${slotIndex}`}
        type="button"
        onClick={() => handleSlotClick(day, slot)}
        className={`w-full h-full flex items-center justify-center transition-all duration-150 font-semibold text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:z-20 touch-manipulation rounded-md mx-0.5 ${
          isSelected 
            ? 'bg-emerald-600 text-white shadow-md' 
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
        }`}
        style={{
          minHeight: '28px',
          maxWidth: 'calc(100% - 4px)'
        }}
        aria-label={`${day.dayName} ${day.month} ${day.dayNumber} at ${slot.time}${isSelected ? ' (selected)' : ''}`}
        aria-pressed={isSelected}
      >
        {slot.time}
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
    // Check if current week has any availability
    const currentWeekHasAvailability = weekSchedule.some(day => day.slots.length > 0);
    
    if (currentWeekHasAvailability) {
      // Current week has slots - no need to search
      return;
    }
    
    // Reset search state and trigger search for availability
    setSearchedWeeksWithNoSlots(new Set());
    setIsSearchingForAvailability(true);
    nextWeek();
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
          className="grid gap-1.5 pb-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(weekSchedule.length, 5)}, 1fr)` }}
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
                onClick={() => {
                  console.log('[TimeSlotCalendar] Day clicked:', index, day.dayName, day.dayNumber);
                  setUserSelectedDay(true);
                  setMobileActiveDayIndex(index);
                }}
                className={`flex flex-col rounded-lg px-2 py-2 text-left transition-all ${
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
                <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70 leading-tight">
                  {day.dayName}
                </span>
                <span className="text-sm font-bold leading-tight">
                  {day.dayNumber}
                </span>
                {isToday && (
                  <span className="text-[8px] font-medium text-amber-600 leading-tight">
                    Today
                  </span>
                )}
                {!isToday && (
                  <span className="text-[8px] font-medium text-emerald-600 leading-tight">
                    {day.slots.length > 1 ? `${day.slots.length} times` : '1 time'}
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
                    {mobileActiveDay.slots.length > 0 
                      ? getTimeRangeForDay(mobileActiveDay.slots)
                      : 'No times available'}
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
                className="rounded-lg"
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

          {/* Day headers */}
          <div
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: `60px repeat(${weekSchedule.length}, minmax(0, 1fr))`,
              background: 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.95) 100%)',
              borderBottom: '1px solid rgba(226,232,240,0.6)'
            }}
            role="row"
            aria-label="Days of the week"
          >
            {/* Empty corner cell for time column */}
            <div className="py-2 px-1" />
            
            {weekSchedule.map((day, dayIndex) => {
              const isToday =
                day.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dayIndex}
                  className="text-center py-2 px-1"
                  style={{
                    background: isToday 
                      ? 'linear-gradient(135deg, rgba(254,243,199,0.5) 0%, rgba(253,230,138,0.3) 100%)'
                      : 'transparent'
                  }}
                  role="columnheader"
                  aria-label={`${day.dayName} ${day.dayNumber} ${day.month}${isToday ? ' (Today)' : ''}`}
                >
                  <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wide">
                    {day.dayName}
                  </div>
                  <div
                    className={`text-base font-bold ${isToday ? 'text-amber-600' : 'text-slate-700'}`}
                  >
                    {day.dayNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">{day.month}</div>
                  {isToday && <span className="sr-only">Today</span>}
                </div>
              );
            })}
          </div>

          {/* Time slots grid - aligned by time across all days */}
          {(() => {
            // Collect all unique times across all days and sort them
            const allTimesSet = new Set<string>();
            weekSchedule.forEach(day => {
              day.slots.forEach(slot => {
                allTimesSet.add(slot.time);
              });
            });
            const allTimes = Array.from(allTimesSet).sort((a, b) => {
              // Parse times like "8:00 am" or "6:00 pm" for comparison
              const parseTime = (t: string) => {
                const [time, period] = t.split(' ');
                const [hours, minutes] = time.split(':').map(Number);
                let hour = hours;
                if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
                if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
                return hour * 60 + minutes;
              };
              return parseTime(a) - parseTime(b);
            });

            // Create a lookup for each day's slots by time
            const slotsByDayAndTime = new Map<number, Map<string, TimeSlot>>();
            weekSchedule.forEach((day, dayIndex) => {
              const daySlots = new Map<string, TimeSlot>();
              day.slots.forEach(slot => {
                daySlots.set(slot.time, slot);
              });
              slotsByDayAndTime.set(dayIndex, daySlots);
            });

            // Grid with time labels on left
            const gridCols = `60px repeat(${weekSchedule.length}, minmax(0, 1fr))`;

            return (
              <div role="grid" aria-label="Available appointment time slots" className="bg-white">
                {allTimes.map((time, rowIndex) => (
                  <div
                    key={time}
                    className={`grid items-center ${rowIndex % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}
                    style={{ 
                      gridTemplateColumns: gridCols,
                      minHeight: `${SLOT_ROW_HEIGHT_PX}px`
                    }}
                    role="row"
                  >
                    {/* Time label */}
                    <div className="text-[10px] font-medium text-slate-400 text-right pr-3 py-1">
                      {time}
                    </div>
                    
                    {/* Day columns */}
                    {weekSchedule.map((day, dayIndex) => {
                      const daySlots = slotsByDayAndTime.get(dayIndex);
                      const slot = daySlots?.get(time);
                      
                      return (
                        <div
                          key={`${dayIndex}-${time}`}
                          className="flex items-center justify-center py-0.5 px-0.5"
                          role="gridcell"
                        >
                          {slot ? (
                            renderSlotButton(day, slot, rowIndex)
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
      )}

    </div>
  );
};
