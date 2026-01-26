/**
 * SMS Service
 * 
 * Handles SMS notifications using Twilio API.
 * This sends SMS directly through Twilio's REST API for reliable delivery.
 * 
 * Configuration required:
 * - TWILIO_ACCOUNT_SID: Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Twilio phone number (E.164 format, e.g., +61...)
 */

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ClinicianBookingSmsContext {
  clinicianPhone: string;
  clinicianFirstName: string;
  patientFirstName: string;
  patientLastName: string;
  appointmentDateTime: Date;
  appointmentType?: string;
}

/**
 * Get human-readable display name for appointment type
 * Maps appointment type slugs from booking form to display names
 */
function getAppointmentTypeDisplay(appointmentType: string | undefined, forPatient: boolean = false): string {
  if (!appointmentType) {
    return forPatient ? 'session' : 'Standard';
  }

  // Map appointment type slugs to display names
  const displayMap: Record<string, { clinician: string; patient: string }> = {
    'psychologist-session': { clinician: 'Standard', patient: 'Psychology session' },
    'medicare-psychologist-session': { clinician: 'Medicare', patient: 'Medicare Psychology session' },
    'couples-session': { clinician: 'Couples', patient: 'Couples session' },
    'ndis-psychology-session': { clinician: 'NDIS', patient: 'NDIS session' },
  };

  const display = displayMap[appointmentType];
  if (display) {
    return forPatient ? display.patient : display.clinician;
  }

  // Fallback: convert slug to readable format
  // e.g., 'some-other-type' -> 'Some Other Type'
  const fallback = appointmentType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return forPatient ? fallback : fallback;
}

/**
 * Normalize phone number to E.164 format (with +)
 * Handles Australian phone numbers
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 61 (Australia)
  if (normalized.startsWith('0')) {
    normalized = '61' + normalized.substring(1);
  }
  
  // Ensure + prefix for E.164 format
  return '+' + normalized;
}

/**
 * Send an SMS message via Twilio API
 * 
 * Uses Twilio's REST API for SMS delivery.
 * https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource
 */
async function sendSms(to: string, message: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    console.error('[SMS] Twilio credentials not configured');
    return { success: false, error: 'Twilio credentials not configured' };
  }

  if (!fromNumber) {
    console.error('[SMS] TWILIO_PHONE_NUMBER not configured');
    return { success: false, error: 'Twilio phone number not configured' };
  }

  const normalizedTo = normalizePhoneNumber(to);
  
  console.log(`[SMS] Sending via Twilio to ${normalizedTo} from ${fromNumber}`);
  console.log(`[SMS] Message: ${message}`);

  try {
    // Twilio uses Basic Auth with Account SID and Auth Token
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    // Twilio requires form-urlencoded body
    const body = new URLSearchParams({
      To: normalizedTo,
      From: fromNumber,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    const data = await response.json();
    
    if (response.ok && data.sid) {
      console.log(`[SMS] Message sent successfully: ${data.sid}, status: ${data.status}`);
      return {
        success: true,
        messageId: data.sid,
      };
    } else {
      const errorMessage = data.message || data.error_message || `HTTP ${response.status}`;
      console.error('[SMS] Twilio API error:', errorMessage, data);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Error sending SMS:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send SMS notification to clinician when a new booking is made
 */
export async function sendClinicianBookingSms(context: ClinicianBookingSmsContext): Promise<SmsResult> {
  const {
    clinicianPhone,
    clinicianFirstName,
    patientFirstName,
    patientLastName,
    appointmentDateTime,
    appointmentType,
  } = context;

  // Format the appointment date/time for Australian timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedDateTime = appointmentDateTime.toLocaleString('en-AU', dateOptions);

  // Get appointment type display using helper function
  const appointmentTypeDisplay = getAppointmentTypeDisplay(appointmentType, false);

  // Keep SMS concise (SMS has 160 char limit for single message)
  const message = `Hi ${clinicianFirstName}! New booking: ${patientFirstName} ${patientLastName} on ${formattedDateTime} (${appointmentTypeDisplay}). Check Halaxy for details - Life Psychology`;

  return sendSms(clinicianPhone, message);
}

/**
 * Context for sending patient booking confirmation SMS
 */
interface PatientBookingConfirmationSmsContext {
  patientPhone: string;
  patientFirstName: string;
  practitionerName: string;
  appointmentDateTime: Date;
  appointmentType?: string;
  locationType?: 'telehealth' | 'in-person' | 'phone';
  locationDetails?: string;
}

/**
 * Send SMS confirmation to patient when a booking is made
 */
export async function sendPatientBookingConfirmationSms(context: PatientBookingConfirmationSmsContext): Promise<SmsResult> {
  const {
    patientPhone,
    patientFirstName,
    practitionerName,
    appointmentDateTime,
    appointmentType,
    locationType,
    locationDetails,
  } = context;

  // Format the appointment date/time for Australian timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedDateTime = appointmentDateTime.toLocaleString('en-AU', dateOptions);

  // Get appointment type display using helper function (patient-friendly format)
  const appointmentTypeDisplay = getAppointmentTypeDisplay(appointmentType, true);

  // Build message based on location type (keep under 160 chars for single SMS)
  let message: string;
  if (locationType === 'telehealth' && locationDetails) {
    // Include video link for telehealth
    message = `Hi ${patientFirstName}! Your ${appointmentTypeDisplay} with ${practitionerName} is confirmed for ${formattedDateTime}. Join: ${locationDetails}`;
  } else {
    // Default message with email reference
    message = `Hi ${patientFirstName}! Your ${appointmentTypeDisplay} with ${practitionerName} is confirmed for ${formattedDateTime}. Check your email for details - Life Psychology`;
  }

  return sendSms(patientPhone, message);
}

/**
 * Context for sending appointment reminder SMS
 */
interface AppointmentReminderSmsContext {
  recipientPhone: string;
  recipientFirstName: string;
  appointmentDateTime: Date;
  practitionerName?: string; // For patient reminders
  patientName?: string; // For clinician reminders
  telehealthLink?: string;
}

/**
 * Send appointment reminder SMS to patient (24 hours before)
 */
export async function sendPatientAppointmentReminderSms(context: AppointmentReminderSmsContext): Promise<SmsResult> {
  const {
    recipientPhone,
    recipientFirstName,
    appointmentDateTime,
    practitionerName,
    telehealthLink,
  } = context;

  // Format time only (they know the date from booking)
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedTime = appointmentDateTime.toLocaleString('en-AU', timeOptions);
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    timeZone: 'Australia/Sydney',
  };
  const formattedDay = appointmentDateTime.toLocaleString('en-AU', dateOptions);

  // Build message - include link if available
  let message: string;
  if (telehealthLink) {
    message = `Hi ${recipientFirstName}! Reminder: Session with ${practitionerName || 'Life Psychology'} tomorrow (${formattedDay}) at ${formattedTime}. Join: ${telehealthLink}`;
  } else {
    message = `Hi ${recipientFirstName}! Reminder: Session with ${practitionerName || 'Life Psychology'} tomorrow (${formattedDay}) at ${formattedTime}. Check email for details - Life Psychology`;
  }

  return sendSms(recipientPhone, message);
}

/**
 * Check if SMS notifications are enabled for clinicians
 */
export function isSmsNotificationEnabled(): boolean {
  // Can be controlled via environment variable
  const enabled = process.env.CLINICIAN_SMS_NOTIFICATIONS_ENABLED;
  return enabled !== 'false'; // Default to enabled
}

/**
 * Check if patient SMS notifications are enabled
 */
export function isPatientSmsNotificationEnabled(): boolean {
  const enabled = process.env.PATIENT_SMS_NOTIFICATIONS_ENABLED;
  return enabled !== 'false'; // Default to enabled
}

/**
 * Send appointment reminder SMS to clinician (1 hour before)
 */
export async function sendClinicianAppointmentReminderSms(context: {
  clinicianPhone: string;
  clinicianFirstName: string;
  patientName: string;
  appointmentDateTime: Date;
}): Promise<SmsResult> {
  const { clinicianPhone, clinicianFirstName, patientName, appointmentDateTime } = context;

  // Format time only (date is "today" at 1 hour notice)
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedTime = appointmentDateTime.toLocaleString('en-AU', timeOptions);

  const message = `Hi ${clinicianFirstName}! Reminder: Session with ${patientName} at ${formattedTime} (in ~1hr) - Life Psychology`;

  return sendSms(clinicianPhone, message);
}

/**
 * Send admin/owner notification for new bookings
 * Julian Della Bosca receives SMS for every booking
 */
export async function sendAdminBookingNotificationSms(context: {
  patientFirstName: string;
  patientLastName: string;
  appointmentDateTime: Date;
  practitionerName?: string;
}): Promise<SmsResult> {
  const adminPhone = process.env.ADMIN_NOTIFICATION_PHONE || '0401527587';
  
  // Format the appointment date/time for Australian timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedDateTime = context.appointmentDateTime.toLocaleString('en-AU', dateOptions);

  const practitioner = context.practitionerName || 'Zoe';
  const message = `New booking! ${context.patientFirstName} ${context.patientLastName} with ${practitioner} on ${formattedDateTime} - Life Psychology`;

  return sendSms(adminPhone, message);
}

/**
 * Send admin 1-hour appointment reminder
 * Julian Della Bosca receives SMS 1 hour before every appointment
 */
export async function sendAdminAppointmentReminderSms(context: {
  patientName: string;
  practitionerName: string;
  appointmentDateTime: Date;
}): Promise<SmsResult> {
  const adminPhone = process.env.ADMIN_NOTIFICATION_PHONE || '0401527587';
  
  // Format time only (date is "today" at 1 hour notice)
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedTime = context.appointmentDateTime.toLocaleString('en-AU', timeOptions);

  const message = `🔔 Starting in 1hr: ${context.patientName} with ${context.practitionerName} at ${formattedTime} - Life Psychology`;

  return sendSms(adminPhone, message);
}

export const smsService = {
  sendClinicianBookingSms,
  sendPatientBookingConfirmationSms,
  sendPatientAppointmentReminderSms,
  sendClinicianAppointmentReminderSms,
  sendAdminBookingNotificationSms,
  sendAdminAppointmentReminderSms,
  isSmsNotificationEnabled,
  isPatientSmsNotificationEnabled,
};

export default smsService;
