/**
 * Appointment Calendar - BLOOM Design System
 * Week view calendar with organic animations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video, User } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { useToast } from '@/hooks';
import api from '@/services/api';

interface Appointment {
  id: string;
  client_id: string;
  client_name?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'confirmed';
  is_telehealth: boolean;
  notes?: string;
}

interface AppointmentCalendarProps {
  practitionerId: string;
  onSelectAppointment?: (appointment: Appointment) => void;
  onCreateAppointment?: (date: Date, time: string) => void;
}

export function AppointmentCalendar({
  practitionerId,
  onSelectAppointment,
  onCreateAppointment,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();

  const weekStart = getWeekStart(currentDate);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  }, [weekStart]);

  const loadAppointments = useCallback(async () => {
    try {
      const dateFrom = formatDate(weekDays[0]);
      const dateTo = formatDate(weekDays[6]);
      
      const { data } = await api.get<{ appointments: Appointment[] }>(
        `/appointments?practitioner_id=${practitionerId}&date_from=${dateFrom}&date_to=${dateTo}`
      );
      setAppointments(data.appointments);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to load appointments',
        description: 'Please try again',
      });
      console.error('Failed to load appointments:', err);
    }
  }, [practitionerId, weekDays, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = formatDate(date);
    return appointments.filter((apt) => apt.appointment_date === dateStr);
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      confirmed: 'bg-bloom-sage/20 text-bloom-forest border-bloom-sage/30',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
      'no-show': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || colors.scheduled;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-bloom-forest">Your Schedule</h2>
          <Button
            onClick={goToToday}
            variant="outline"
            size="sm"
            className="border-bloom-stone text-bloom-sage hover:bg-bloom-sage hover:text-white transition-all"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={goToPreviousWeek}
            variant="ghost"
            size="sm"
            className="text-bloom-sage hover:bg-bloom-cream"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium text-bloom-forest min-w-[200px] text-center">
            {weekDays[0].toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </div>
          <Button
            onClick={goToNextWeek}
            variant="ghost"
            size="sm"
            className="text-bloom-sage hover:bg-bloom-cream"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border-bloom-stone">
        <div className="grid grid-cols-7 border-b border-bloom-stone bg-bloom-cream">
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={index}
                className={`p-3 text-center border-r border-bloom-stone last:border-r-0 ${
                  isToday ? 'bg-bloom-sage/10' : ''
                }`}
              >
                <div className="text-xs font-medium text-bloom-moss uppercase">
                  {day.toLocaleDateString('en-AU', { weekday: 'short' })}
                </div>
                <div
                  className={`text-lg font-semibold mt-1 ${
                    isToday
                      ? 'text-bloom-sage'
                      : 'text-bloom-forest'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 divide-x divide-bloom-stone min-h-[500px]">
          {weekDays.map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={dayIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: dayIndex * 0.05 }}
                className={`p-2 space-y-2 ${isToday ? 'bg-bloom-sage/5' : 'bg-white'}`}
                onClick={() => onCreateAppointment?.(day, '09:00')}
              >
                <AnimatePresence mode="popLayout">
                  {dayAppointments.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center h-full text-xs text-bloom-moss cursor-pointer hover:text-bloom-sage transition-colors"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    dayAppointments.map((apt, index) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment?.(apt);
                        }}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        <div className="flex items-start gap-1 mb-1">
                          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            {formatTime(apt.start_time)}
                          </span>
                        </div>
                        
                        {apt.client_name && (
                          <div className="flex items-center gap-1 text-xs truncate">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{apt.client_name}</span>
                          </div>
                        )}
                        
                        {apt.is_telehealth && (
                          <div className="flex items-center gap-1 mt-1">
                            <Video className="w-3 h-3" />
                            <span className="text-xs">Telehealth</span>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-bloom-moss">
        <div>
          {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'} this week
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-bloom-sage/20 border border-bloom-sage/30" />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200" />
            <span>Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
