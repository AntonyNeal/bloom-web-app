/**
 * SMS Service
 * 
 * Handles SMS notifications using Infobip.
 * Used for sending booking notifications to clinicians.
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

interface InfobipResponse {
  bulkId?: string;
  messages?: Array<{
    messageId: string;
    to: string;
    status: {
      groupId: number;
      groupName: string;
      id: number;
      name: string;
      description: string;
    };
  }>;
  requestError?: {
    serviceException?: {
      messageId: string;
      text: string;
    };
  };
}

/**
 * Normalize phone number to E.164 format
 * Handles Australian phone numbers
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 61 (Australia)
  if (normalized.startsWith('0')) {
    normalized = '61' + normalized.substring(1);
  }
  
  // Remove + if present (Infobip prefers without +)
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

/**
 * Send an SMS message via Infobip
 */
async function sendSms(to: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_BASE_URL; // e.g., https://xxxxx.api.infobip.com
  const fromNumber = process.env.INFOBIP_SENDER_ID || 'LifePsych'; // Alphanumeric sender ID or phone number

  if (!apiKey) {
    console.error('[SMS] Infobip API key not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  if (!baseUrl) {
    console.error('[SMS] Infobip base URL not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const normalizedTo = normalizePhoneNumber(to);
    
    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: normalizedTo }],
            from: fromNumber,
            text: message,
          },
        ],
      }),
    });

    const data = await response.json() as InfobipResponse;

    if (!response.ok) {
      const errorText = data.requestError?.serviceException?.text || 'SMS send failed';
      console.error('[SMS] Infobip error:', errorText);
      return { success: false, error: errorText };
    }

    const messageResult = data.messages?.[0];
    if (!messageResult) {
      console.error('[SMS] No message result from Infobip');
      return { success: false, error: 'No message result' };
    }

    // Check if message was accepted (groupId 1 = PENDING, which is good)
    if (messageResult.status.groupId === 1 || messageResult.status.groupId === 3) {
      console.log('[SMS] Message sent successfully:', messageResult.messageId);
      return { 
        success: true, 
        messageId: messageResult.messageId 
      };
    }

    console.error('[SMS] Message failed:', messageResult.status.description);
    return { 
      success: false, 
      error: messageResult.status.description 
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
