/**
 * Send Appointment Reminders Timer Function
 * 
 * Azure Function that runs on a schedule to send appointment reminder
 * notifications to patients and clinicians.
 * 
 * Schedule: Runs every hour to catch appointments 24 hours away
 * 
 * STATELESS DESIGN (Privacy-first):
 * - No patient data stored locally
 * - Halaxy is the single source of truth  
 * - Reminders sent based on appointment time window only
 * - Tight time window minimizes duplicate risk without storing tracking data
 */

import { app, InvocationContext, Timer } from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { sendPatientAppointmentReminderSms } from '../services/sms';
import { sendPatientAppointmentReminder, sendClinicianAppointmentReminder } from '../services/email';
import { getDbConnection } from '../services/database';
import type { FHIRAppointment } from '../services/halaxy/types';

// Reminder window configuration
// Tight 30-minute window ensures each appointment only gets one reminder
// Even if function runs twice, the window moves and won't pick up same appointments
const REMINDER_HOURS_BEFORE = 24;
const REMINDER_WINDOW_MINUTES = 30;

// Skip reminders for appointments booked within this many hours of the appointment time
// This prevents sending both confirmation and reminder for same-day/next-day bookings
const MIN_BOOKING_TO_APPOINTMENT_HOURS = 4;

/**
 * Get appointments that need reminders
 * Returns appointments scheduled 24 hours (+/- 30 min) from now
 */
async function getUpcomingAppointments(
  context: InvocationContext
): Promise<FHIRAppointment[]> {
  const halaxyClient = getHalaxyClient();
  
  // Calculate target window (24 hours from now, +/- 30 min)
  const now = new Date();
  const targetTime = new Date(now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - REMINDER_WINDOW_MINUTES * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);
  
  context.log(`[Reminders] Looking for appointments between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

  try {
    // Get active practitioner IDs from database (just IDs, no patient data)
    const pool = await getDbConnection();
    const practitionersResult = await pool.request().query<{ halaxy_practitioner_id: string }>(`
      SELECT halaxy_practitioner_id 
      FROM practitioners 
      WHERE is_active = 1 
        AND halaxy_practitioner_id IS NOT NULL
    `);

    const practitionerIds = practitionersResult.recordset.map(p => p.halaxy_practitioner_id);
    context.log(`[Reminders] Found ${practitionerIds.length} active practitioners`);

    if (practitionerIds.length === 0) {
      return [];
    }

    // Fetch appointments for each practitioner in the window
    const allAppointments: FHIRAppointment[] = [];
    
    for (const practitionerId of practitionerIds) {
      try {
        const appointments = await halaxyClient.getAppointmentsByPractitioner(
          practitionerId,
          windowStart,
          windowEnd,
          ['booked', 'pending']
        );
        allAppointments.push(...appointments);
      } catch (error) {
        context.warn(`[Reminders] Error fetching appointments for ${practitionerId}:`, error);
      }
    }

    context.log(`[Reminders] Found ${allAppointments.length} appointments needing reminders`);
    return allAppointments;
  } catch (error) {
    context.error('[Reminders] Error fetching appointments:', error);
    return [];
  }
}

/**
 * Extract patient and practitioner IDs from appointment participants
 * Only extracts IDs and display names from the appointment itself - no extra data fetching
 */
function parseAppointmentParticipants(appointment: FHIRAppointment): {
  patientId?: string;
  practitionerId?: string;
  patientName?: string;
  practitionerName?: string;
} {
  const result: {
    patientId?: string;
    practitionerId?: string;
    patientName?: string;
    practitionerName?: string;
  } = {};

  for (const participant of appointment.participant || []) {
    const ref = participant.actor.reference;
    if (ref.includes('Patient/')) {
      result.patientId = ref.split('Patient/')[1];
      result.patientName = participant.actor.display;
    } else if (ref.includes('Practitioner/')) {
      result.practitionerId = ref.split('Practitioner/')[1];
      result.practitionerName = participant.actor.display;
    }
  }

  return result;
}

/**
 * Send reminder to patient
 * Fetches contact info from Halaxy just-in-time, doesn't store it
 */
async function sendPatientReminder(
  appointment: FHIRAppointment,
  participants: ReturnType<typeof parseAppointmentParticipants>,
  context: InvocationContext
): Promise<boolean> {
  if (!participants.patientId) {
    context.warn(`[Reminders] No patient found for appointment ${appointment.id}`);
    return false;
  }

  const halaxyClient = getHalaxyClient();
  
  try {
    // Fetch patient contact info just-in-time from Halaxy
    const patient = await halaxyClient.getPatient(participants.patientId);
    if (!patient) {
      context.warn(`[Reminders] Patient not found: ${participants.patientId}`);
      return false;
    }

    // Extract only what we need for the notification
    const patientEmail = patient.telecom?.find(t => t.system === 'email')?.value;
    const patientPhone = patient.telecom?.find(t => t.system === 'phone')?.value;
    const patientFirstName = patient.name?.[0]?.given?.[0] || 'there';
    
    if (!patientEmail && !patientPhone) {
      context.warn(`[Reminders] No contact info for patient ${participants.patientId}`);
      return false;
    }

    const appointmentDateTime = new Date(appointment.start);
    const practitionerName = participants.practitionerName || 'Your Psychologist';

    let success = false;

    // Send email reminder
    if (patientEmail) {
      try {
        await sendPatientAppointmentReminder({
          patientEmail,
          patientFirstName,
          practitionerName,
          appointmentDateTime,
        });
        context.log(`[Reminders] Email sent to patient for appointment ${appointment.id}`);
        success = true;
      } catch (error) {
        context.warn(`[Reminders] Failed to send email for ${appointment.id}:`, error);
      }
    }

    // Send SMS reminder
    if (patientPhone) {
      try {
        await sendPatientAppointmentReminderSms({
          recipientPhone: patientPhone,
          recipientFirstName: patientFirstName,
          appointmentDateTime,
          practitionerName,
        });
        context.log(`[Reminders] SMS sent to patient for appointment ${appointment.id}`);
        success = true;
      } catch (error) {
        context.warn(`[Reminders] Failed to send SMS for ${appointment.id}:`, error);
      }
    }

    return success;
  } catch (error) {
    context.error(`[Reminders] Error sending patient reminder for ${appointment.id}:`, error);
    return false;
  }
}

/**
 * Send reminder to clinician
 * Fetches contact info from Halaxy just-in-time
 */
async function sendClinicianReminder(
  appointment: FHIRAppointment,
  participants: ReturnType<typeof parseAppointmentParticipants>,
  context: InvocationContext
): Promise<boolean> {
  if (!participants.practitionerId) {
    context.warn(`[Reminders] No practitioner found for appointment ${appointment.id}`);
    return false;
  }

  const halaxyClient = getHalaxyClient();
  
  try {
    // Fetch practitioner contact info just-in-time
    const practitioner = await halaxyClient.getPractitioner(participants.practitionerId);
    if (!practitioner) {
      context.warn(`[Reminders] Practitioner not found: ${participants.practitionerId}`);
      return false;
    }

    const practitionerEmail = practitioner.telecom?.find(t => t.system === 'email')?.value;
    const practitionerFirstName = practitioner.name?.[0]?.given?.[0] || 'Practitioner';
    
    if (!practitionerEmail) {
      context.warn(`[Reminders] No email for practitioner ${participants.practitionerId}`);
      return false;
    }

    const appointmentDateTime = new Date(appointment.start);
    const patientName = participants.patientName || 'Patient';

    try {
      await sendClinicianAppointmentReminder({
        practitionerEmail,
        practitionerFirstName,
        patientName,
        appointmentDateTime,
      });
      context.log(`[Reminders] Email sent to clinician for appointment ${appointment.id}`);
      return true;
    } catch (error) {
      context.warn(`[Reminders] Failed to send clinician email for ${appointment.id}:`, error);
      return false;
    }
  } catch (error) {
    context.error(`[Reminders] Error sending clinician reminder for ${appointment.id}:`, error);
    return false;
  }
}

/**
 * Main timer trigger handler
 * Runs every hour to send 24-hour appointment reminders
 * 
 * Stateless: No tracking data stored. Uses tight time window to prevent duplicates.
 */
async function sendAppointmentReminders(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = Date.now();
  context.log('[Reminders] Starting appointment reminder job...');

  if (timer.isPastDue) {
    context.log('[Reminders] Timer is past due, running catch-up');
  }

  // Get appointments that need reminders from Halaxy
  const allAppointments = await getUpcomingAppointments(context);

  // Filter out recently booked appointments (they just got a confirmation)
  const appointments = allAppointments.filter(appt => {
    if (!appt.created) {
      // No created timestamp - send reminder to be safe
      return true;
    }
    
    const createdTime = new Date(appt.created).getTime();
    const appointmentTime = new Date(appt.start).getTime();
    const hoursFromBookingToAppointment = (appointmentTime - createdTime) / (1000 * 60 * 60);
    
    if (hoursFromBookingToAppointment < MIN_BOOKING_TO_APPOINTMENT_HOURS) {
      context.log(`[Reminders] Skipping ${appt.id} - booked only ${hoursFromBookingToAppointment.toFixed(1)}h before appointment (confirmation was recent)`);
      return false;
    }
    return true;
  });

  context.log(`[Reminders] ${allAppointments.length} appointments found, ${appointments.length} eligible for reminders (${allAppointments.length - appointments.length} recently booked)`);

  if (appointments.length === 0) {
    context.log('[Reminders] No appointments need reminders at this time');
    return;
  }

  let patientRemindersSent = 0;
  let clinicianRemindersSent = 0;

  // Process each appointment
  for (const appointment of appointments) {
    const participants = parseAppointmentParticipants(appointment);

    // Send patient reminder
    const patientSent = await sendPatientReminder(appointment, participants, context);
    if (patientSent) patientRemindersSent++;

    // Send clinician reminder  
    const clinicianSent = await sendClinicianReminder(appointment, participants, context);
    if (clinicianSent) clinicianRemindersSent++;
  }

  const duration = Date.now() - startTime;
  context.log(`[Reminders] Job completed in ${duration}ms`, {
    appointmentsProcessed: appointments.length,
    patientRemindersSent,
    clinicianRemindersSent,
  });
}

// Register the timer trigger
// Runs every hour at minute 0 (0:00, 1:00, 2:00, etc.)
app.timer('send-appointment-reminders', {
  schedule: '0 0 * * * *',
  handler: sendAppointmentReminders,
  runOnStartup: false,
});
