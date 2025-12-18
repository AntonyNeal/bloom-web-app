/**
 * TimeSlotCalendar Component
 * 
 * A weekly appointment booking calendar that integrates with Halaxy.
 * Displays available time slots and allows users to select appointments.
 */

import React, { useEffect, useState } from 'react';
import {
  fetchAvailableSlots,
  formatTimeSlot,
  groupSlotsByDate,
  type AvailableSlot,
} from '../../utils/halaxyAvailability';
import { getCachedAvailability } from '../../utils/availabilityPreloader';

import type { TimeSlotCalendarProps, TimeSlot, DaySchedule } from './types';
import {
  BUSINESS_HOURS,
  AUTO_REFRESH_INTERVAL_MS,
  MAX_WEEKS_TO_SEARCH,
  DEFAULT_DURATION_MINUTES,
  TIME_COLUMN_WIDTH,
} from './constants';
import {
  formatHourLabel,
  formatDateKey,
  getWeekStart,
  formatTimeForValue,
  getTimeRangeForDay,
  getWeekDateRange,
  isToday,
  createSlotLookup,
} from './utils';

export const TimeSlotCalendar: React.FC<TimeSlotCalendarProps> = ({
  onSelectSlot,
  selectedDate,
  selectedTime,
  duration = DEFAULT_DURATION_MINUTES,
  practitionerId,
}) => {
  // ─────────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────────
  const [minWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(minWeekStart);
  const [mobileActiveDayIndex, setMobileActiveDayIndex] = useState(0);
  const [userSelectedDay, setUserSelectedDay] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthPickerDate, setMonthPickerDate] = useState<Date>(() => new Date());

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchingForAvailability, setIsSearchingForAvailability] = useState(true);
  const [searchedWeeksWithNoSlots, setSearchedWeeksWithNoSlots] = useState<Set<string>>(new Set());

  // ─────────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 7);
        const weekKey = currentWeekStart.toISOString();

        // Check cache first
        const cachedSlots = getCachedAvailability(currentWeekStart);
        let slots: AvailableSlot[];

        if (cachedSlots !== null && !practitionerId) {
          slots = cachedSlots;
        } else {
          const params = {
            startDate: currentWeekStart,
            endDate: weekEnd,
            duration,
            ...(practitionerId ? { practitionerId } : {}),
          };
          slots = await fetchAvailableSlots(params);
        }

        // Auto-advance if no slots and still searching
        if (slots.length === 0 && isSearchingForAvailability) {
          const newSearchedWeeks = new Set(searchedWeeksWithNoSlots);
          newSearchedWeeks.add(weekKey);

          if (newSearchedWeeks.size < MAX_WEEKS_TO_SEARCH) {
            setSearchedWeeksWithNoSlots(newSearchedWeeks);
            const nextWeekStart = new Date(currentWeekStart);
            nextWeekStart.setDate(currentWeekStart.getDate() + 7);
            setCurrentWeekStart(nextWeekStart);
            return;
          } else {
            setIsSearchingForAvailability(false);
          }
        } else if (slots.length > 0) {
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

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
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
      } catch {
        // Silent fail for background refresh
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshInterval);
  }, [currentWeekStart, duration, practitionerId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Week Schedule Generation
  // ─────────────────────────────────────────────────────────────────────────────
  const generateWeekSchedule = (): DaySchedule[] => {
    const schedule: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slotsByDate = groupSlotsByDate(availableSlots);

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      const dayName = date.toLocaleDateString('en-AU', { weekday: 'short' });
      const dayNumber = date.getDate();
      const month = date.toLocaleDateString('en-AU', { month: 'short' });

      const dateKey = formatDateKey(date);
      const daySlotsFromHalaxy = slotsByDate.get(dateKey) || [];

      // Only show slots for today and future days
      const isPastDay = date.getTime() < today.getTime();
      const slots: TimeSlot[] = isPastDay ? [] : daySlotsFromHalaxy.map((slot) => ({
        time: formatTimeSlot(slot.start),
        available: true,
        isoDateTime: slot.start,
      }));

      schedule.push({ date, dayName, dayNumber, month, slots });
    }

    // Return full 7-day week for desktop (Mon-Sun order)
    return schedule;
  };

  const weekSchedule = generateWeekSchedule();
  
  // Mobile only shows upcoming days with availability
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mobileWeekSchedule = weekSchedule.filter((day) => 
    day.date.getTime() >= today.getTime() && day.slots.length > 0
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Selection State Management
  // ─────────────────────────────────────────────────────────────────────────────
  const selectedDateIndex = selectedDate
    ? mobileWeekSchedule.findIndex((day) => formatDateKey(day.date) === selectedDate)
    : -1;

  useEffect(() => {
    if (selectedDateIndex >= 0) {
      setMobileActiveDayIndex(selectedDateIndex);
      return;
    }
    setMobileActiveDayIndex((idx) => (idx < mobileWeekSchedule.length ? idx : 0));
  }, [selectedDateIndex, mobileWeekSchedule.length]);

  useEffect(() => {
    if (selectedDateIndex === -1) {
      setMobileActiveDayIndex(0);
      setUserSelectedDay(false);
    }
  }, [currentWeekStart, selectedDateIndex]);

  // Auto-highlight first available day (for mobile)
  useEffect(() => {
    if (userSelectedDay) return;
    if (!selectedDate && !loading && availableSlots.length > 0) {
      setMobileActiveDayIndex(0); // First day in mobileWeekSchedule already has availability
    }
  }, [selectedDate, loading, availableSlots.length, userSelectedDay]);

  const mobileActiveDay = mobileWeekSchedule[mobileActiveDayIndex] || mobileWeekSchedule[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSlotClick = (day: DaySchedule, slot: TimeSlot) => {
    if (!slot.available) return;
    const dateStr = formatDateKey(day.date);
    const timeStr = formatTimeForValue(slot.time);
    onSelectSlot(dateStr, timeStr);
  };

  const isSlotSelected = (day: DaySchedule, slot: TimeSlot): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const dateStr = formatDateKey(day.date);
    const timeStr = formatTimeForValue(slot.time);
    return dateStr === selectedDate && timeStr === selectedTime;
  };

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

  const toggleMonthPicker = () => {
    setMonthPickerDate(new Date(currentWeekStart));
    setShowMonthPicker(!showMonthPicker);
  };

  const goToDate = (date: Date) => {
    const weekStart = getWeekStart(date);
    // Don't allow going to past weeks
    if (weekStart.getTime() < minWeekStart.getTime()) {
      setCurrentWeekStart(minWeekStart);
    } else {
      setCurrentWeekStart(weekStart);
    }
    setShowMonthPicker(false);
  };

  const previousMonth = () => {
    const newDate = new Date(monthPickerDate);
    newDate.setMonth(newDate.getMonth() - 1);
    // Don't go before current month
    const today = new Date();
    if (newDate.getFullYear() < today.getFullYear() || 
        (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() < today.getMonth())) {
      return;
    }
    setMonthPickerDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(monthPickerDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setMonthPickerDate(newDate);
  };

  // Generate calendar days for month picker
  const getMonthCalendarDays = () => {
    const year = monthPickerDate.getFullYear();
    const month = monthPickerDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, adjust to Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render Helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const renderSlotButton = (day: DaySchedule, slot: TimeSlot, slotIndex: number) => {
    const selected = isSlotSelected(day, slot);

    return (
      <button
        key={`${formatDateKey(day.date)}-${slot.isoDateTime}-${slotIndex}`}
        type="button"
        onClick={() => handleSlotClick(day, slot)}
        className={`w-full flex items-center justify-center transition-all duration-150 font-medium text-sm lg:text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-400 focus:z-20 touch-manipulation rounded ${
          selected
            ? 'bg-blue-500 text-white'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        }`}
        style={{ minHeight: '36px', margin: '0 2px' }}
        aria-label={`${day.dayName} ${day.month} ${day.dayNumber} at ${slot.time}${selected ? ' (selected)' : ''}`}
        aria-pressed={selected}
      >
        {slot.time}
      </button>
    );
  };

  const renderDesktopTimeGrid = () => {
    const slotLookup = createSlotLookup(weekSchedule);
    const gridCols = `${TIME_COLUMN_WIDTH} repeat(${Math.max(weekSchedule.length, 5)}, minmax(0, 1fr))`;

    return (
      <div
        role="grid"
        aria-label="Available appointment time slots"
        className="bg-white flex-1 grid min-h-0"
        style={{ gridTemplateRows: `repeat(${BUSINESS_HOURS.length}, 1fr)` }}
      >
        {BUSINESS_HOURS.map((hour, rowIndex) => (
          <div
            key={hour}
            className={`grid items-center border-b border-slate-100 last:border-b-0 ${rowIndex % 2 === 0 ? 'bg-slate-50/30' : ''}`}
            style={{ gridTemplateColumns: gridCols }}
            role="row"
          >
            <div className="text-[10px] font-medium text-slate-400 text-right pr-1.5">
              {formatHourLabel(hour)}
            </div>

            {weekSchedule.map((day, dayIndex) => {
              const slot = slotLookup.get(dayIndex)?.get(hour);
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="flex items-center justify-center py-0.5 h-full"
                  role="gridcell"
                >
                  {slot ? (
                    renderSlotButton(day, slot, rowIndex)
                  ) : (
                    <span className="text-slate-200 text-[9px]">—</span>
                  )}
                </div>
              );
            })}

            {weekSchedule.length < 5 &&
              Array.from({ length: 5 - weekSchedule.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center justify-center" role="gridcell">
                  <span className="text-slate-200 text-[10px]">—</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex-1 flex flex-col min-h-0 relative">
      {/* Navigation - Larger on mobile for readability */}
      <div className="mb-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-1">
          <button
            onClick={previousWeek}
            disabled={loading || currentWeekStart.getTime() <= minWeekStart.getTime()}
            className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300 bg-white"
            aria-label="Previous week"
          >
            <svg className="w-4 h-4 sm:w-3 sm:h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm sm:text-xs font-semibold text-slate-700 min-w-[100px] sm:min-w-[100px] text-center">
            {getWeekDateRange(currentWeekStart)}
          </span>

          <button
            onClick={nextWeek}
            disabled={loading}
            className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-slate-300 bg-white"
            aria-label="Next week"
          >
            <svg className="w-4 h-4 sm:w-3 sm:h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={toggleMonthPicker}
          className={`font-medium text-xs flex items-center gap-1 transition-colors ${
            showMonthPicker ? 'text-blue-700' : 'text-blue-600 hover:text-blue-700'
          }`}
          aria-label="Open month picker"
          aria-expanded={showMonthPicker}
        >
          <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {showMonthPicker ? 'Close' : 'Month'}
        </button>
      </div>

      {/* Month Picker Overlay */}
      {showMonthPicker && (
        <>
          {/* Backdrop to close on click outside */}
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setShowMonthPicker(false)}
            aria-hidden="true"
          />
          <div 
            className="absolute top-8 right-0 z-30 bg-white rounded-lg shadow-lg border border-slate-200 p-3 w-64"
            role="dialog"
            aria-label="Month picker"
          >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={previousMonth}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {monthPickerDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-[10px] font-semibold text-slate-400 text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {getMonthCalendarDays().map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="w-8 h-8" />;
              }
              
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);
              const isPast = date.getTime() < todayDate.getTime();
              const isCurrentDay = date.toDateString() === todayDate.toDateString();
              const isInCurrentWeek = date >= currentWeekStart && 
                date < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !isPast && goToDate(date)}
                  disabled={isPast}
                  className={`w-8 h-8 text-xs rounded flex items-center justify-center transition-all ${
                    isPast
                      ? 'text-slate-300 cursor-not-allowed'
                      : isInCurrentWeek
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : isCurrentDay
                          ? 'bg-amber-100 text-amber-700 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm"
          role="alert"
        >
          <strong className="font-semibold">Error: </strong>
          {error}
        </div>
      )}

      {/* No Availability Message - show when no slots in any day */}
      {!loading && !isSearchingForAvailability && !error && mobileWeekSchedule.length === 0 && (
        <div
          className="p-6 text-center rounded-lg"
          style={{
            background: 'linear-gradient(145deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.98) 100%)',
            border: '1px solid rgba(226,232,240,0.6)',
          }}
        >
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-slate-600 font-medium mb-2">No availability found</p>
          <p className="text-sm text-slate-500 mb-4">
            We searched {MAX_WEEKS_TO_SEARCH} weeks ahead but couldn't find any available appointments.
          </p>
          <button
            onClick={nextWeek}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            Keep looking
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile Calendar - only shows days with availability */}
      {mobileWeekSchedule.length > 0 && (
        <div className="lg:hidden space-y-3" role="region" aria-label="Mobile appointment calendar">
          <div
            className="grid gap-1.5 pb-1"
            style={{ gridTemplateColumns: `repeat(${Math.min(mobileWeekSchedule.length, 5)}, 1fr)` }}
            role="tablist"
          >
            {mobileWeekSchedule.map((day, index) => {
              const isActive = index === mobileActiveDayIndex;
              const dayIsToday = isToday(day.date);

              return (
                <button
                  key={`${day.dayName}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setUserSelectedDay(true);
                    setMobileActiveDayIndex(index);
                  }}
                  className={`flex flex-col rounded-lg px-2 py-2 text-left transition-all ${
                    isActive ? 'text-blue-800' : 'text-slate-600'
                  }`}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(236,253,245,0.95) 0%, rgba(209,250,229,0.8) 100%)'
                      : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(226,232,240,0.8)',
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 leading-none">
                    {day.dayName}
                  </span>
                  <span className="text-base font-bold leading-tight">{day.dayNumber}</span>
                  {dayIsToday ? (
                    <span className="text-[9px] font-medium text-amber-600 leading-none">Today</span>
                  ) : (
                    <span className="text-[9px] font-medium text-blue-600 leading-none">
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
            }}
          >
            {mobileActiveDay ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {mobileActiveDay.dayName}, {mobileActiveDay.dayNumber} {mobileActiveDay.month}
                    </p>
                    <p className="text-xs text-slate-500">
                      {mobileActiveDay.slots.length > 0 ? getTimeRangeForDay(mobileActiveDay.slots) : 'No times available'}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      background:
                        mobileActiveDay.slots.length > 0
                          ? 'linear-gradient(135deg, rgba(236,253,245,0.9) 0%, rgba(209,250,229,0.7) 100%)'
                          : 'linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.7) 100%)',
                      color: mobileActiveDay.slots.length > 0 ? '#047857' : '#64748b',
                      border:
                        mobileActiveDay.slots.length > 0
                          ? '1px solid rgba(16,185,129,0.2)'
                          : '1px solid rgba(148,163,184,0.2)',
                    }}
                  >
                    {mobileActiveDay.slots.length > 0 ? 'Tap a time' : 'No times'}
                  </span>
                </div>

                <div
                  className="rounded-md max-h-[220px] overflow-y-auto"
                  style={{ border: '1px solid rgba(226,232,240,0.5)', background: 'rgba(255,255,255,0.6)' }}
                >
                  {/* Show all business hours 8am-6pm */}
                  <div className="flex flex-col">
                    {BUSINESS_HOURS.map((hour) => {
                      // Find if there's an available slot for this hour
                      const slot = mobileActiveDay.slots.find((s) => {
                        const slotHour = parseInt(s.time.split(':')[0]);
                        return slotHour === hour;
                      });
                      
                      if (slot) {
                        return renderSlotButton(mobileActiveDay, slot, hour);
                      }
                      
                      // Render empty/unavailable slot
                      return (
                        <div
                          key={`empty-${hour}`}
                          className="w-full flex items-center justify-center font-medium text-sm text-slate-300 rounded"
                          style={{ minHeight: '36px', margin: '0 2px' }}
                        >
                          {formatHourLabel(hour)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">No days loaded</div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Calendar Grid */}
      {weekSchedule.length > 0 && (
        <div
          className="hidden lg:flex lg:flex-col flex-1 min-h-0"
          role="region"
          aria-label="Weekly appointment calendar"
        >
          <div
            className="rounded-lg overflow-hidden relative flex-1 flex flex-col"
            style={{
              border: '1px solid rgba(226,232,240,0.8)',
              background: 'rgba(255,255,255,0.98)',
            }}
          >
            {/* Loading Indicator */}
            {(loading || isSearchingForAvailability) && (
              <div
                className="absolute top-2 right-2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                role="status"
              >
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                <span>{isSearchingForAvailability ? 'Finding availability...' : 'Loading...'}</span>
              </div>
            )}

            {/* Day Headers - Compact */}
            <div
              className="grid gap-0 flex-shrink-0"
              style={{
                gridTemplateColumns: `${TIME_COLUMN_WIDTH} repeat(${Math.max(weekSchedule.length, 5)}, minmax(0, 1fr))`,
                background: 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.95) 100%)',
                borderBottom: '1px solid rgba(226,232,240,0.6)',
              }}
              role="row"
            >
              <div className="py-0.5" />

              {weekSchedule.map((day, dayIndex) => {
                const dayIsToday = isToday(day.date);
                return (
                  <div
                    key={dayIndex}
                    className="text-center py-0.5"
                    style={{
                      background: dayIsToday
                        ? 'linear-gradient(135deg, rgba(254,243,199,0.5) 0%, rgba(253,230,138,0.3) 100%)'
                        : 'transparent',
                    }}
                    role="columnheader"
                  >
                    <div className="text-[8px] font-semibold uppercase text-slate-400 leading-none">
                      {day.dayName}
                    </div>
                    <div className={`text-xs font-bold leading-tight ${dayIsToday ? 'text-amber-600' : 'text-slate-700'}`}>
                      {day.dayNumber}
                    </div>
                  </div>
                );
              })}

              {weekSchedule.length < 5 &&
                Array.from({ length: 5 - weekSchedule.length }).map((_, i) => (
                  <div key={`empty-header-${i}`} className="text-center py-1 px-0.5" role="columnheader" />
                ))}
            </div>

            {/* Time Grid */}
            {renderDesktopTimeGrid()}
          </div>
        </div>
      )}
    </div>
  );
};
