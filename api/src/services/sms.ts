/**
 * SMS Service
 * 
 * Handles SMS notifications using Infobip's direct API.
 * 
 * Configuration required:
 * - INFOBIP_API_KEY
 * - INFOBIP_BASE_URL (optional, defaults to api.infobip.com)
 * - SMS_SENDER_ID (optional, defaults to "LifePsych")
 */
import https from 'https';

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
 * Normalize phone number to E.164 format (without +)
 * Handles Australian phone numbers
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 61 (Australia)
  if (normalized.startsWith('0')) {
    normalized = '61' + normalized.substring(1);
  }
  
  // Remove + prefix if present (Infobip doesn't need it)
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

/**
 * Send an SMS message via Infobip direct API
 */
async function sendSms(to: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_BASE_URL || 'api.infobip.com';
  const senderId = process.env.SMS_SENDER_ID || 'LifePsych';

  if (!apiKey) {
    console.error('[SMS] INFOBIP_API_KEY not configured');
    return { success: false, error: 'Infobip API key not configured' };
  }

  const normalizedTo = normalizePhoneNumber(to);
  
  console.log(`[SMS] Sending to ${normalizedTo} from ${senderId} via Infobip`);
  console.log(`[SMS] Message: ${message}`);

  const data = JSON.stringify({
    messages: [{
      destinations: [{ to: normalizedTo }],
      from: senderId,
      text: message,
    }],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: baseUrl,
      path: '/sms/2/text/advanced',
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (res.statusCode === 200 && response.messages?.[0]) {
            const msg = response.messages[0];
            console.log(`[SMS] Message sent successfully: ${msg.messageId}, status: ${msg.status?.name}`);
            resolve({
              success: true,
              messageId: msg.messageId,
            });
          } else {
            console.error('[SMS] Infobip error:', body);
            resolve({
              success: false,
              error: response.requestError?.serviceException?.text || `HTTP ${res.statusCode}`,
            });
          }
        } catch (parseError) {
          console.error('[SMS] Failed to parse response:', body);
          resolve({ success: false, error: 'Invalid response from Infobip' });
        }
      });
    });

    req.on('error', (error) => {
      console.error('[SMS] Request error:', error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
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

  // Get appointment type display
  const appointmentTypeDisplay = appointmentType === 'ndis-psychology-session' 
    ? 'NDIS' 
    : 'Standard';

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

  // Get appointment type display
  const appointmentTypeDisplay = appointmentType === 'ndis-psychology-session' 
    ? 'NDIS session' 
    : 'session';

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
  sendAdminBookingNotificationSms,
  sendAdminAppointmentReminderSms,
  isSmsNotificationEnabled,
  isPatientSmsNotificationEnabled,
};

export default smsService;
