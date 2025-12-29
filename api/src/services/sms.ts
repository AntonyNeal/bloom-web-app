/**
 * SMS Service
 * 
 * Handles SMS notifications using Azure Communication Services.
 * Used for sending booking notifications to clinicians.
 */

import { SmsClient } from '@azure/communication-sms';

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
 * Normalize phone number to E.164 format
 * Handles Australian phone numbers
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +61 (Australia)
  if (normalized.startsWith('0')) {
    normalized = '61' + normalized.substring(1);
  }
  
  // Add + if not present
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

/**
 * Send an SMS message via Azure Communication Services
 */
async function sendSms(to: string, message: string): Promise<SmsResult> {
  const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
  const fromNumber = process.env.AZURE_COMMUNICATION_SERVICES_PHONE_NUMBER;

  if (!connectionString) {
    console.error('[SMS] Azure Communication Services not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  if (!fromNumber) {
    console.error('[SMS] No phone number configured');
    return { success: false, error: 'SMS sender number not configured' };
  }

  try {
    const smsClient = new SmsClient(connectionString);
    const normalizedTo = normalizePhoneNumber(to);
    
    const sendResults = await smsClient.send({
      from: fromNumber,
      to: [normalizedTo],
      message,
    });

    const result = sendResults[0];
    
    if (!result.successful) {
      console.error('[SMS] Send failed:', result.errorMessage);
      return { success: false, error: result.errorMessage || 'SMS send failed' };
    }

    return { 
      success: true, 
      messageId: result.messageId 
    };
  } catch (error) {
    console.error('[SMS] Error sending:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
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

  // Get appointment type display
  const appointmentTypeDisplay = appointmentType === 'ndis-psychology-session' 
    ? 'NDIS' 
    : 'Standard';

  // Keep SMS concise (SMS has 160 char limit for single message)
  const message = `Hi ${clinicianFirstName}! New booking: ${patientFirstName} ${patientLastName} on ${formattedDateTime} (${appointmentTypeDisplay}). Check Halaxy for details - Life Psychology`;

  return sendSms(clinicianPhone, message);
}

/**
 * Check if SMS notifications are enabled for clinicians
 */
export function isSmsNotificationEnabled(): boolean {
  // Can be controlled via environment variable
  const enabled = process.env.CLINICIAN_SMS_NOTIFICATIONS_ENABLED;
  return enabled !== 'false'; // Default to enabled
}

export const smsService = {
  sendClinicianBookingSms,
  isSmsNotificationEnabled,
};

export default smsService;
