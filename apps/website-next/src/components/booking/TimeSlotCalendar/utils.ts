/**
 * TimeSlotCalendar Utility Functions
 */

import type { TimeSlot } from './types';

/**
 * Format hour number to short display label (e.g., 8 -> "8am", 13 -> "1pm")
 */
export const formatHourLabel = (hour: number): string => {
  if (hour === 12) return '12pm';
  if (hour > 12) return `${hour - 12}pm`;
  return `${hour}am`;
};

/**
 * Format a date as YYYY-MM-DD in local timezone
 * Used for matching slots to calendar dates
 */
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the Monday of the week containing the given date
 */
export const getWeekStart = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Convert display time (e.g., "8:00 am") to 24h format (e.g., "08:00:00")
 */
export const formatTimeForValue = (timeStr: string): string => {
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

/**
 * Get time range string for a day's slots (e.g., "9 am - 5 pm")
 */
export const getTimeRangeForDay = (slots: TimeSlot[]): string => {
  if (slots.length === 0) return '';

  const times = slots
    .map((slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour;
    })
    .sort((a, b) => a - b);

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

/**
 * Format week date range for display (e.g., "15 Dec - 21 Dec")
 */
export const getWeekDateRange = (weekStart: Date): string => {
  const endDate = new Date(weekStart);
  endDate.setDate(weekStart.getDate() + 6);

  const startDay = weekStart.getDate();
  const startMonth = weekStart.toLocaleDateString('en-AU', { month: 'short' });
  const endDay = endDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-AU', { month: 'short' });

  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return date.toDateString() === new Date().toDateString();
};

/**
 * Parse slot time to get the hour (0-23)
 */
export const parseSlotHour = (slot: TimeSlot): number => {
  const [time, period] = slot.time.split(' ');
  const [hours] = time.split(':').map(Number);
  let hour = hours;
  if (period.toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (period.toLowerCase() === 'am' && hour === 12) hour = 0;
  return hour;
};

/**
 * Create a lookup map of slots by day index and hour
 */
export const createSlotLookup = (
  weekSchedule: { slots: TimeSlot[] }[]
): Map<number, Map<number, TimeSlot>> => {
  const slotsByDayAndHour = new Map<number, Map<number, TimeSlot>>();

  weekSchedule.forEach((day, dayIndex) => {
    const daySlots = new Map<number, TimeSlot>();
    day.slots.forEach((slot) => {
      const hour = parseSlotHour(slot);
      daySlots.set(hour, slot);
    });
    slotsByDayAndHour.set(dayIndex, daySlots);
  });

  return slotsByDayAndHour;
};
