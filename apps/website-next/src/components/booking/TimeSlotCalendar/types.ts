/**
 * TimeSlotCalendar Type Definitions
 */

export interface TimeSlot {
  time: string;
  available: boolean;
  isoDateTime: string;
}

export interface DaySchedule {
  date: Date;
  dayName: string;
  dayNumber: number;
  month: string;
  slots: TimeSlot[];
}

export interface TimeSlotCalendarProps {
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  duration?: number;
  practitionerId?: string;
  clinicId?: string;
  feeId?: string;
}
