/**
 * Create Appointment Form - BLOOM Design System
 * Miyazaki-inspired appointment creation with gentle animations
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, FileText, Loader2 } from 'lucide-react';
import { Card, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { useToast } from '@/hooks';
import api from '@/services/api';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
}

interface CreateAppointmentFormProps {
  practitionerId: string;
  preselectedDate?: Date;
  preselectedTime?: string;
  preselectedClient?: Client;
  onSuccess?: (appointmentId: string) => void;
  onCancel?: () => void;
}

export function CreateAppointmentForm({
  practitionerId,
  preselectedDate,
  preselectedTime,
  preselectedClient,
  onSuccess,
  onCancel,
}: CreateAppointmentFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: preselectedClient?.id || '',
    appointment_date: preselectedDate
      ? preselectedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    start_time: preselectedTime || '09:00',
    duration_minutes: 60,
    appointment_type: 'session',
    is_telehealth: true,
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, [practitionerId]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const { data } = await api.get<{ clients: Client[] }>(
        `/clients?practitioner_id=${practitionerId}`
      );
      setClients(data.clients);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load clients',
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.client_id || !formData.appointment_date || !formData.start_time) {
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: 'Please select a client, date, and time',
      });
      return;
    }

    try {
      setLoading(true);
      const endTime = calculateEndTime(formData.start_time, formData.duration_minutes);

      const { data } = await api.post<{ appointment_id: string }>(
        '/appointments',
        {
          practitioner_id: practitionerId,
          client_id: formData.client_id,
          appointment_date: formData.appointment_date,
          start_time: formData.start_time,
          end_time: endTime,
          duration_minutes: formData.duration_minutes,
          appointment_type: formData.appointment_type,
          is_telehealth: formData.is_telehealth,
          notes: formData.notes || null,
        }
      );

      toast({
        title: 'Appointment created',
        description: formData.is_telehealth
          ? 'Session link will be generated automatically'
          : 'Client will receive confirmation',
      });

      onSuccess?.(data.appointment_id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create appointment',
        description: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientDisplayName = (client: Client) => {
    if (client.preferred_name) return client.preferred_name;
    return `${client.first_name} ${client.last_name}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="p-6 border-bloom-stone shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-bloom-forest">Schedule Appointment</h2>
            <p className="text-sm text-bloom-moss mt-1">
              Create a new session with your client
            </p>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-bloom-forest flex items-center gap-2">
              <User className="w-4 h-4" />
              Client
            </Label>
            {loadingClients ? (
              <div className="flex items-center gap-2 text-sm text-bloom-moss">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading clients...
              </div>
            ) : (
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger className="bg-white border-bloom-stone focus:border-bloom-sage">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {getClientDisplayName(client)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-bloom-forest flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="bg-white border-bloom-stone focus:border-bloom-sage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-bloom-forest flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="bg-white border-bloom-stone focus:border-bloom-sage"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-bloom-forest">
              Duration
            </Label>
            <Select
              value={formData.duration_minutes.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, duration_minutes: parseInt(value) })
              }
            >
              <SelectTrigger className="bg-white border-bloom-stone focus:border-bloom-sage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                <SelectItem value="90">90 minutes (1.5 hours)</SelectItem>
                <SelectItem value="120">120 minutes (2 hours)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-bloom-forest">
              Appointment Type
            </Label>
            <Select
              value={formData.appointment_type}
              onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
            >
              <SelectTrigger className="bg-white border-bloom-stone focus:border-bloom-sage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">Regular Session</SelectItem>
                <SelectItem value="initial">Initial Consultation</SelectItem>
                <SelectItem value="review">Review Session</SelectItem>
                <SelectItem value="assessment">Psychological Assessment</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Telehealth Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bloom-cream border border-bloom-stone">
            <input
              id="telehealth"
              type="checkbox"
              checked={formData.is_telehealth}
              onChange={(e) => setFormData({ ...formData, is_telehealth: e.target.checked })}
              className="w-4 h-4 text-bloom-sage focus:ring-bloom-sage border-bloom-stone rounded"
            />
            <Label htmlFor="telehealth" className="flex items-center gap-2 cursor-pointer text-bloom-forest">
              <Video className="w-4 h-4" />
              Telehealth session (video call)
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-bloom-forest flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes (optional)
            </Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this appointment..."
              rows={3}
              className="w-full px-3 py-2 border border-bloom-stone rounded-lg focus:border-bloom-sage focus:ring-1 focus:ring-bloom-sage bg-white transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-bloom-stone">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 border-bloom-stone text-bloom-forest hover:bg-bloom-cream"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !formData.client_id}
              className="flex-1 bg-bloom-sage hover:bg-bloom-fern text-white transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
