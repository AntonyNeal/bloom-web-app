/**
 * Send Appointment Reminders Timer Function
 * 
 * Azure Function that runs on a schedule to send appointment reminders.
 * 
 * Schedule: Runs every hour
 * 
 * Reminder Windows:
 * - 24 hours before: Patient only (email + SMS) - skip if recently booked
 * - 1 hour before: Clinician only (email + SMS)
 * 
 * DEDUPLICATION:
 * - Uses reminder_sent table to track which reminders have been sent
 * - Each (appointment_id, reminder_type, recipient_type) combination is unique
 * - Prevents duplicate reminders even if function runs multiple times
 */

import { app, InvocationContext, Timer } from '@azure/functions';
import * as sql from 'mssql';
import { getHalaxyClient } from '../services/halaxy/client';
import { sendPatientAppointmentReminderSms, sendClinicianAppointmentReminderSms } from '../services/sms';
import { sendPatientAppointmentReminder, sendClinicianAppointmentReminder } from '../services/email';
import { getDbConnection } from '../services/database';
import type { FHIRAppointment } from '../services/halaxy/types';

// Reminder window configuration
// Use asymmetric window: appointments that start 23.5h-24.5h from now (for 24h)
// and 0.5h-1.5h from now (for 1h) to avoid overlap between hourly runs
const REMINDER_24H_HOURS_BEFORE = 24;
const REMINDER_1H_HOURS_BEFORE = 1;
const REMINDER_WINDOW_MINUTES = 30; // +/- 30 min window = 1 hour total

// Skip 24h reminders for appointments booked within this many hours of the appointment time
// This prevents sending both confirmation and reminder for same-day/next-day bookings
const MIN_BOOKING_TO_APPOINTMENT_HOURS = 4;

/**
 * Check if a reminder has already been sent
 */
async function hasReminderBeenSent(
  pool: sql.ConnectionPool,
  appointmentId: string,
  reminderType: string,
  recipientType: string
): Promise<boolean> {
  const result = await pool.request()
    .input('appointmentId', sql.NVarChar, appointmentId)
    .input('reminderType', sql.NVarChar, reminderType)
    .input('recipientType', sql.NVarChar, recipientType)
    .query(`
      SELECT 1 FROM reminder_sent 
      WHERE appointment_id = @appointmentId 
        AND reminder_type = @reminderType 
        AND recipient_type = @recipientType
    `);
  return result.recordset.length > 0;
}

/**
 * Record that a reminder has been sent
 */
async function recordReminderSent(
  pool: sql.ConnectionPool,
  appointmentId: string,
  reminderType: string,
  recipientType: string
): Promise<void> {
  try {
    await pool.request()
      .input('appointmentId', sql.NVarChar, appointmentId)
      .input('reminderType', sql.NVarChar, reminderType)
      .input('recipientType', sql.NVarChar, recipientType)
      .query(`
        INSERT INTO reminder_sent (appointment_id, reminder_type, recipient_type)
        VALUES (@appointmentId, @reminderType, @recipientType)
      `);
  } catch (error) {
    // Ignore duplicate key errors (reminder already recorded)
    const sqlError = error as { number?: number };
    if (sqlError.number !== 2627) { // 2627 = unique constraint violation
      throw error;
    }
  }
}

/**
 * Get appointments in a specific time window
 * @param hoursAhead - How many hours ahead to look
 * @param context - Invocation context for logging
 */
async function getAppointmentsInWindow(
  hoursAhead: number,
  context: InvocationContext
): Promise<FHIRAppointment[]> {
  const halaxyClient = getHalaxyClient();
  
  // Calculate target window (X hours from now, +/- 30 min)
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - REMINDER_WINDOW_MINUTES * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);
  
  context.log(`[Reminders] Looking for ${hoursAhead}h window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);

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
 * Get actual names by fetching from Halaxy if display names are empty
 */
async function resolveParticipantNames(
  participants: ReturnType<typeof parseAppointmentParticipants>,
  context: InvocationContext
): Promise<{ patientName: string; practitionerName: string }> {
  const halaxyClient = getHalaxyClient();
  let patientName = participants.patientName || '';
  let practitionerName = participants.practitionerName || '';

  // Fetch patient name if not available
  if (!patientName && participants.patientId) {
    try {
      const patient = await halaxyClient.getPatient(participants.patientId);
      if (patient?.name?.[0]) {
        const name = patient.name[0];
        const given = name.given?.join(' ') || '';
        const family = name.family || '';
        patientName = `${given} ${family}`.trim();
      }
    } catch (error) {
      context.warn(`[Reminders] Failed to fetch patient ${participants.patientId}:`, error);
    }
  }

  // Fetch practitioner name if not available
  if (!practitionerName && participants.practitionerId) {
    try {
      const practitioner = await halaxyClient.getPractitioner(participants.practitionerId);
      if (practitioner?.name?.[0]) {
        const name = practitioner.name[0];
        const given = name.given?.join(' ') || '';
        const family = name.family || '';
        practitionerName = `${given} ${family}`.trim();
      }
    } catch (error) {
      context.warn(`[Reminders] Failed to fetch practitioner ${participants.practitionerId}:`, error);
    }
  }

  return {
    patientName: patientName || 'Patient',
    practitionerName: practitionerName || 'Practitioner',
  };
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

    // Generate session token for telehealth link
    let telehealthLink: string | undefined;
    try {
      const pool = await getDbConnection();
      
      // Get practitioner UUID from halaxy_practitioner_id
      const practResult = await pool.request()
        .input('halaxyId', sql.NVarChar, participants.practitionerId)
        .query(`SELECT id FROM practitioners WHERE halaxy_practitioner_id = @halaxyId`);
      
      if (practResult.recordset.length > 0) {
        const practitionerUuid = practResult.recordset[0].id;
        const durationMinutes = appointment.minutesDuration || 50;
        
        // Generate token directly
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('base64url');
        const tokenId = crypto.randomUUID();
        
        // Token expires 24 hours after appointment
        const expiresAt = new Date(appointmentDateTime.getTime() + 24 * 60 * 60 * 1000);

        await pool.request()
          .input('id', sql.UniqueIdentifier, tokenId)
          .input('token', sql.NVarChar, token)
          .input('appointmentId', sql.NVarChar, appointment.id)
          .input('patientId', sql.NVarChar, participants.patientId)
          .input('patientFirstName', sql.NVarChar, patientFirstName)
          .input('patientEmail', sql.NVarChar, patientEmail)
          .input('practitionerId', sql.UniqueIdentifier, practitionerUuid)
          .input('practitionerName', sql.NVarChar, practitionerName)
          .input('appointmentTime', sql.DateTime2, appointmentDateTime)
          .input('appointmentDuration', sql.Int, durationMinutes)
          .input('expiresAt', sql.DateTime2, expiresAt)
          .query(`
            -- Insert or update existing token
            MERGE session_tokens AS target
            USING (SELECT @appointmentId AS appointment_halaxy_id) AS source
            ON target.appointment_halaxy_id = source.appointment_halaxy_id
            WHEN MATCHED AND target.expires_at > GETUTCDATE() THEN
              UPDATE SET id = target.id -- No-op, token already exists and valid
            WHEN NOT MATCHED THEN
              INSERT (id, token, appointment_halaxy_id, patient_halaxy_id,
                      patient_first_name, patient_email, practitioner_id, practitioner_name,
                      appointment_time, appointment_duration_mins, expires_at, created_at)
              VALUES (@id, @token, @appointmentId, @patientId,
                      @patientFirstName, @patientEmail, @practitionerId, @practitionerName,
                      @appointmentTime, @appointmentDuration, @expiresAt, GETUTCDATE());
          `);
        
        // Get the token (in case it was already there)
        const tokenResult = await pool.request()
          .input('appointmentId', sql.NVarChar, appointment.id)
          .query(`SELECT token FROM session_tokens WHERE appointment_halaxy_id = @appointmentId`);
        
        if (tokenResult.recordset.length > 0) {
          const finalToken = tokenResult.recordset[0].token;
          telehealthLink = `${process.env.BLOOM_URL || 'https://bloom.life-psychology.com.au'}/session?token=${finalToken}`;
          context.log(`[Reminders] Generated session link for appointment ${appointment.id}`);
        }
      }
    } catch (error) {
      context.warn(`[Reminders] Failed to generate session token for ${appointment.id}:`, error);
      // Continue without telehealth link - not critical
    }

    let success = false;

    // Send email reminder
    if (patientEmail) {
      try {
        await sendPatientAppointmentReminder({
          patientEmail,
          patientFirstName,
          practitionerName,
          appointmentDateTime,
          telehealthLink, // Include session link if generated
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
          telehealthLink,
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
 * @param isShortNotice - If true, this is the 1-hour "heads up" reminder (sends both email + SMS)
 */
async function sendClinicianReminder(
  appointment: FHIRAppointment,
  participants: ReturnType<typeof parseAppointmentParticipants>,
  context: InvocationContext,
  isShortNotice: boolean = false
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
    const practitionerPhone = practitioner.telecom?.find(t => t.system === 'phone')?.value;
    const practitionerFirstName = practitioner.name?.[0]?.given?.[0] || 'Practitioner';
    
    if (!practitionerEmail && !practitionerPhone) {
      context.warn(`[Reminders] No contact info for practitioner ${participants.practitionerId}`);
      return false;
    }

    const appointmentDateTime = new Date(appointment.start);
    const patientName = participants.patientName || 'Patient';
    const reminderType = isShortNotice ? '1h' : '24h';

    let success = false;

    // Send email
    if (practitionerEmail) {
      try {
        await sendClinicianAppointmentReminder({
          practitionerEmail,
          practitionerFirstName,
          patientName,
          appointmentDateTime,
          isShortNotice,
        });
        context.log(`[Reminders] ${reminderType} email sent to clinician for appointment ${appointment.id}`);
        success = true;
      } catch (error) {
        context.warn(`[Reminders] Failed to send ${reminderType} clinician email for ${appointment.id}:`, error);
      }
    }

    // Send SMS for 1-hour reminders
    if (isShortNotice && practitionerPhone) {
      try {
        const smsResult = await sendClinicianAppointmentReminderSms({
          clinicianPhone: practitionerPhone,
          clinicianFirstName: practitionerFirstName,
          patientName,
          appointmentDateTime,
        });
        if (smsResult.success) {
          context.log(`[Reminders] ${reminderType} SMS sent to clinician for appointment ${appointment.id}: ${smsResult.messageId}`);
          success = true;
        } else {
          context.warn(`[Reminders] Failed to send ${reminderType} clinician SMS for ${appointment.id}: ${smsResult.error}`);
        }
      } catch (error) {
        context.warn(`[Reminders] Failed to send ${reminderType} clinician SMS for ${appointment.id}:`, error);
      }
    }

    return success;
  } catch (error) {
    context.error(`[Reminders] Error sending clinician reminder for ${appointment.id}:`, error);
    return false;
  }
}

/**
 * Main timer trigger handler
 * Runs every hour to send appointment reminders
 * 
 * Two reminder windows:
 * - 24h: Patient only (email + SMS) - skip if recently booked
 * - 1h: Clinician only (email + SMS - final heads-up)
 * 
 * Uses reminder_sent table to prevent duplicate reminders.
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

  // Get database connection for deduplication tracking
  const pool = await getDbConnection();

  let patientRemindersSent = 0;
  let clinician1hRemindersSent = 0;
  let skippedDuplicates = 0;

  // ==========================================
  // 24-HOUR REMINDERS (Patient only)
  // ==========================================
  const appointments24h = await getAppointmentsInWindow(REMINDER_24H_HOURS_BEFORE, context);

  // Filter out recently booked appointments (they just got a confirmation)
  const eligible24h = appointments24h.filter(appt => {
    if (!appt.created) {
      return true; // No timestamp - send to be safe
    }
    
    const createdTime = new Date(appt.created).getTime();
    const appointmentTime = new Date(appt.start).getTime();
    const hoursFromBookingToAppointment = (appointmentTime - createdTime) / (1000 * 60 * 60);
    
    if (hoursFromBookingToAppointment < MIN_BOOKING_TO_APPOINTMENT_HOURS) {
      context.log(`[Reminders] Skipping 24h reminder for ${appt.id} - booked only ${hoursFromBookingToAppointment.toFixed(1)}h before appointment`);
      return false;
    }
    return true;
  });

  context.log(`[Reminders] 24h window: ${appointments24h.length} found, ${eligible24h.length} eligible`);

  for (const appointment of eligible24h) {
    const participants = parseAppointmentParticipants(appointment);

    // Check if patient reminder already sent
    if (!await hasReminderBeenSent(pool, appointment.id, '24h', 'patient')) {
      const patientSent = await sendPatientReminder(appointment, participants, context);
      if (patientSent) {
        await recordReminderSent(pool, appointment.id, '24h', 'patient');
        patientRemindersSent++;
      }
    } else {
      context.log(`[Reminders] Skipping duplicate 24h patient reminder for ${appointment.id}`);
      skippedDuplicates++;
    }
  }

  // ==========================================
  // 1-HOUR REMINDERS (Clinician only - ALL appointments)
  // ==========================================
  const appointments1h = await getAppointmentsInWindow(REMINDER_1H_HOURS_BEFORE, context);
  
  context.log(`[Reminders] 1h window: ${appointments1h.length} appointments found`);

  for (const appointment of appointments1h) {
    const participants = parseAppointmentParticipants(appointment);

    // Check if clinician 1h reminder already sent
    if (!await hasReminderBeenSent(pool, appointment.id, '1h', 'clinician')) {
      const clinicianSent = await sendClinicianReminder(appointment, participants, context, true);
      if (clinicianSent) {
        await recordReminderSent(pool, appointment.id, '1h', 'clinician');
        clinician1hRemindersSent++;
      }
    } else {
      context.log(`[Reminders] Skipping duplicate 1h clinician reminder for ${appointment.id}`);
      skippedDuplicates++;
    }
  }

  const duration = Date.now() - startTime;
  context.log(`[Reminders] Job completed in ${duration}ms`, {
    appointments24h: eligible24h.length,
    appointments1h: appointments1h.length,
    patientRemindersSent,
    clinician1hRemindersSent,
    skippedDuplicates,
  });
}

// Register the timer trigger
// Runs every hour at minute 0 (0:00, 1:00, 2:00, etc.)
// Uses reminder_sent table for deduplication
app.timer('send-appointment-reminders', {
  schedule: '0 0 * * * *',
  handler: sendAppointmentReminders,
  runOnStartup: false,
});

export { sendAppointmentReminders };
