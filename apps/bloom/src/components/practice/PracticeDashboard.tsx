/**
 * Practice Dashboard - BLOOM Design System
 * Main practitioner workspace with Miyazaki aesthetics
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { ClientsList } from './ClientsList';
import { AppointmentCalendar } from './AppointmentCalendar';
import { CreateAppointmentForm } from './CreateAppointmentForm';

interface PracticeDashboardProps {
  practitionerId: string;
  practitionerName: string;
}

type View = 'calendar' | 'clients' | 'create-appointment';

export function PracticeDashboard({ practitionerId, practitionerName }: PracticeDashboardProps) {
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const handleCreateAppointmentClick = (date?: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentView('create-appointment');
  };

  const handleAppointmentCreated = () => {
    setCurrentView('calendar');
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  return (
    <div className="min-h-screen bg-bloom-cream">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-bloom-stone shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-bloom-forest">
                Welcome back, {practitionerName}
              </h1>
              <p className="text-sm text-bloom-moss mt-1">
                Your practice at a glance
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-bloom-sage/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-bloom-sage" />
                </div>
                <div>
                  <div className="text-xs text-bloom-moss">This Week</div>
                  <div className="text-lg font-semibold text-bloom-forest">12</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-bloom-moss">Clients</div>
                  <div className="text-lg font-semibold text-bloom-forest">48</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'clients', label: 'Clients', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as View)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentView === tab.id
                    ? 'bg-bloom-sage text-white shadow-md'
                    : 'text-bloom-forest hover:bg-bloom-cream'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <AppointmentCalendar
                practitionerId={practitionerId}
                onCreateAppointment={handleCreateAppointmentClick}
              />
            </motion.div>
          )}

          {currentView === 'clients' && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ClientsList
                practitionerId={practitionerId}
                onCreateClient={() => {
                  // Future: Open create client modal
                }}
              />
            </motion.div>
          )}

          {currentView === 'create-appointment' && (
            <motion.div
              key="create-appointment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CreateAppointmentForm
                practitionerId={practitionerId}
                preselectedDate={selectedDate}
                preselectedTime={selectedTime}
                onSuccess={handleAppointmentCreated}
                onCancel={() => setCurrentView('calendar')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button (when not creating) */}
      <AnimatePresence>
        {currentView !== 'create-appointment' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCreateAppointmentClick()}
            className="fixed bottom-8 right-8 w-16 h-16 bg-bloom-sage text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            <Calendar className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
