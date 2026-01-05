/**
 * Email Service for Application Workflow
 * 
 * Uses Azure Communication Services Email to send notifications
 * for application status changes (deny, waitlist, interview, accept).
 */

import { EmailClient, EmailMessage } from '@azure/communication-email';

// Email configuration - domain must be verified in Azure Communication Services
const FROM_EMAIL = process.env.ACS_EMAIL_FROM || 'donotreply@life-psychology.com.au';
const COMPANY_NAME = 'Life Psychology Australia';
// Bloom is the internal practitioner app/community - clients don't need to know about it
const BLOOM_NAME = 'Bloom';

// Admin email for booking notifications (always CC'd on clinician alerts)
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'julian.dellabosca@gmail.com';

// Interview booking link (Calendly, Cal.com, or similar)
const INTERVIEW_BOOKING_URL = process.env.INTERVIEW_BOOKING_URL || 'https://calendly.com/zoe-lifepsychology/interview';

// Onboarding base URL
const ONBOARDING_BASE_URL = process.env.ONBOARDING_BASE_URL || 'https://staging.bloom.life-psychology.com.au';

interface EmailContext {
  firstName: string;
  lastName: string;
  email: string;
  interviewDate?: Date;
  interviewNotes?: string;
  decisionReason?: string;
  bookingUrl?: string; // Optional override for booking URL
  onboardingLink?: string; // Full onboarding URL with token
  contractUrl?: string; // URL to practitioner agreement PDF
}

/**
 * Get the Azure Communication Services Email client
 */
function getEmailClient(): EmailClient | null {
  const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
  
  if (!connectionString) {
    console.warn('[EmailService] AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING not configured');
    return null;
  }
  
  return new EmailClient(connectionString);
}

/**
 * Send an email using Azure Communication Services
 */
async function sendEmail(
  to: string | string[],
  subject: string,
  htmlContent: string,
  plainTextContent: string,
  cc?: string | string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const toAddresses = Array.isArray(to) ? to : [to];
  const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
  
  console.log(`[EmailService] Sending email to: ${toAddresses.join(', ')}, cc: ${ccAddresses.join(', ') || 'none'}, subject: ${subject}`);
  console.log(`[EmailService] From address: ${FROM_EMAIL}`);
  
  const client = getEmailClient();
  
  if (!client) {
    console.error('[EmailService] Email client not available - ACS not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const message: EmailMessage = {
      senderAddress: FROM_EMAIL,
      recipients: {
        to: toAddresses.map(addr => ({ address: addr })),
        ...(ccAddresses.length > 0 && { cc: ccAddresses.map(addr => ({ address: addr })) }),
      },
      content: {
        subject,
        html: htmlContent,
        plainText: plainTextContent,
      },
    };

    console.log('[EmailService] Starting email send...');
    const poller = await client.beginSend(message);
    const result = await poller.pollUntilDone();

    console.log(`[EmailService] Send result: status=${result.status}, id=${result.id}`);
    
    if (result.status !== 'Succeeded') {
      console.error('[EmailService] Email send failed:', JSON.stringify(result));
    }

    return { 
      success: result.status === 'Succeeded', 
      messageId: result.id 
    };
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Base email template wrapper
 */
/**
 * Base email template wrapper for practitioner emails
 * Uses Bloom branding (internal practitioner app)
 */
function wrapInTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
      <h1 style="margin: 0; color: #10b981; font-size: 28px;">🌸 ${BLOOM_NAME}</h1>
      <p style="margin: 5px 0 0; color: #666; font-size: 14px;">${COMPANY_NAME}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 0;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
      <p style="margin: 0;">This email was sent by ${COMPANY_NAME}</p>
      <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Client-facing email template wrapper
 * Uses Life Psychology Australia branding only (no Bloom reference)
 */
function wrapInClientTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
      <h1 style="margin: 0; color: #10b981; font-size: 28px;">🌸 ${COMPANY_NAME}</h1>
      <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Telehealth Psychology Services</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 0;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
      <p style="margin: 0;">This email was sent by ${COMPANY_NAME}</p>
      <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// PRACTITIONER APPLICATION EMAIL TEMPLATES
// These emails go to practitioners applying to join the Bloom community
// ============================================================================

/**
 * Denial Email Template (Practitioner Application)
 */
export async function sendDenialEmail(context: EmailContext) {
  const { firstName, email } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Your Practitioner Application</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Thank you for your interest in joining the ${COMPANY_NAME} team.</p>
    
    <p>After careful consideration of your application, we regret to inform you that we are unable to proceed at this time.</p>
    
    <p>We appreciate the time and effort you put into your application, and we wish you all the best in your professional journey.</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Your Practitioner Application

Dear ${firstName},

Thank you for your interest in joining the ${COMPANY_NAME} team.

After careful consideration of your application, we regret to inform you that we are unable to proceed at this time.

We appreciate the time and effort you put into your application, and we wish you all the best in your professional journey.

Warm regards,
The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Your Practitioner Application - ${COMPANY_NAME}`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Waitlist Email Template (Practitioner Application)
 */
export async function sendWaitlistEmail(context: EmailContext) {
  const { firstName, email } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Your Practitioner Application - Waitlist</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Thank you for your application to join the ${COMPANY_NAME} team.</p>
    
    <p>We were impressed with your credentials and experience. However, we don't currently have positions available that match your profile.</p>
    
    <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #7c3aed;">
        <strong>📋 You've been added to our waitlist</strong><br>
        We'll reach out when opportunities arise that match your expertise.
      </p>
    </div>
    
    <p>We appreciate your patience and interest in working with us.</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Your Practitioner Application - Waitlist

Dear ${firstName},

Thank you for your application to join the ${COMPANY_NAME} team.

We were impressed with your credentials and experience. However, we don't currently have positions available that match your profile.

You've been added to our waitlist. We'll reach out when opportunities arise that match your expertise.

We appreciate your patience and interest in working with us.

Warm regards,
The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Your Practitioner Application - Waitlist`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Interview Invitation Email Template (Practitioner Application)
 * Sends a booking link for the applicant to schedule their interview
 * Includes contract/practitioner agreement for review
 */
export async function sendInterviewEmail(context: EmailContext) {
  const { firstName, email, interviewNotes, bookingUrl, contractUrl } = context;

  const schedulingLink = bookingUrl || INTERVIEW_BOOKING_URL;

  const contractSection = contractUrl ? `
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 15px; color: #b45309;">📄 Practitioner Agreement</h3>
      <p style="margin: 5px 0;">Before your interview, please review our Practitioner Agreement:</p>
      <div style="margin: 15px 0;">
        <a href="${contractUrl}" 
           style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          📄 View Agreement (PDF)
        </a>
      </div>
      <p style="margin: 10px 0 0; color: #92400e; font-size: 14px;">
        Please read through this document carefully. We'll be happy to answer any questions during the interview.
      </p>
    </div>
  ` : '';

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Interview Invitation - ${COMPANY_NAME}</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Great news! We've reviewed your application and would love to meet with you to learn more about your experience and discuss how you might fit with our team at ${COMPANY_NAME}.</p>
    
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 15px; color: #059669;">📅 Schedule Your Interview</h3>
      <p style="margin: 5px 0;">Please click the button below to choose a time that works best for you:</p>
      <div style="margin: 20px 0;">
        <a href="${schedulingLink}" 
           style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          📅 Book Interview Time
        </a>
      </div>
      ${interviewNotes ? `<p style="margin: 15px 0 0; color: #666;"><strong>Note from our team:</strong> ${interviewNotes}</p>` : ''}
    </div>
    
    ${contractSection}
    
    <p>The interview will be a friendly conversation (approximately 30 minutes) where we'll discuss:</p>
    <ul style="color: #555;">
      <li>Your clinical experience and specializations</li>
      <li>Your approach to client care</li>
      <li>How we can support your telehealth practice</li>
      ${contractUrl ? '<li>Any questions about the Practitioner Agreement</li>' : ''}
    </ul>
    
    <p>If you have any questions before the interview, feel free to reply to this email.</p>
    
    <p>We look forward to meeting you!</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>Zoe & The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Interview Invitation - ${COMPANY_NAME}

Dear ${firstName},

Great news! We've reviewed your application and would love to meet with you to learn more about your experience and discuss how you might fit with our team at ${COMPANY_NAME}.

SCHEDULE YOUR INTERVIEW
-----------------------
Please visit the link below to choose a time that works best for you:
${schedulingLink}

${interviewNotes ? `Note from our team: ${interviewNotes}\n` : ''}
${contractUrl ? `PRACTITIONER AGREEMENT
----------------------
Before your interview, please review our Practitioner Agreement:
${contractUrl}

Please read through this document carefully. We'll be happy to answer any questions during the interview.

` : ''}The interview will be a friendly conversation (approximately 30 minutes) where we'll discuss:
- Your clinical experience and specializations
- Your approach to client care
- How we can support your telehealth practice${contractUrl ? '\n- Any questions about the Practitioner Agreement' : ''}

If you have any questions before the interview, feel free to reply to this email.

We look forward to meeting you!

Warm regards,
Zoe & The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `${COMPANY_NAME} - Schedule Your Interview 📅`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Acceptance/Onboarding Email Template (Practitioner Application)
 */
export async function sendAcceptanceEmail(context: EmailContext) {
  const { firstName, email, onboardingLink: providedLink, contractUrl } = context;

  // Use provided onboarding link or fallback
  const onboardingLink = providedLink || `${ONBOARDING_BASE_URL}/onboarding`;

  // Contract section (only if contract URL is provided)
  const contractSection = contractUrl ? `
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px; color: #92400e;">📄 Practitioner Agreement</h3>
      <p style="margin: 0 0 15px; color: #78350f;">Please review and sign your practitioner agreement as part of the onboarding process.</p>
      <a href="${contractUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View Contract →
      </a>
    </div>
  ` : '';

  const contractPlainText = contractUrl ? `
PRACTITIONER AGREEMENT
----------------------
Please review and sign your practitioner agreement:
${contractUrl}

` : '';

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">🎉 Welcome to ${COMPANY_NAME}!</h2>
    
    <p>Dear ${firstName},</p>
    
    <p><strong>Congratulations!</strong> We're thrilled to let you know that your application to join the ${COMPANY_NAME} practitioner team has been accepted.</p>
    
    ${contractSection}
    
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 15px; color: #059669;">Get Started with Onboarding</h3>
      <p style="margin: 0 0 15px;">Complete your profile and set up your account:</p>
      <a href="${onboardingLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Start Onboarding →
      </a>
    </div>
    
    <p>During onboarding, you'll:</p>
    <ul style="color: #666;">
      <li>Review and accept your practitioner agreement</li>
      <li>Create your secure password</li>
      <li>Complete your professional profile</li>
      <li>Get access to the ${BLOOM_NAME} practitioner portal</li>
    </ul>
    
    <p style="color: #888; font-size: 14px;"><em>Note: This link will expire in 7 days. If you need a new link, please contact us.</em></p>
    
    <p>We're excited to have you join our practitioner community!</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>Zoe & The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
🎉 Welcome to ${COMPANY_NAME}!

Dear ${firstName},

Congratulations! We're thrilled to let you know that your application to join the ${COMPANY_NAME} practitioner team has been accepted.

${contractPlainText}GET STARTED WITH ONBOARDING
---------------------------
Complete your profile and set up your account:
${onboardingLink}

During onboarding, you'll:
- Review and accept your practitioner agreement
- Create your secure password
- Complete your professional profile
- Get access to the ${BLOOM_NAME} practitioner portal

Note: This link will expire in 7 days. If you need a new link, please contact us.

We're excited to have you join our practitioner community!

Warm regards,
Zoe & The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Welcome to ${COMPANY_NAME}! 🎉`,
    htmlContent,
    plainTextContent
  );
}

// ============================================================================
// CLINICIAN BOOKING NOTIFICATION TEMPLATES
// These emails go to practitioners - can reference Bloom as their internal portal
// ============================================================================

interface BookingNotificationContext {
  practitionerEmail: string;
  practitionerFirstName: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone?: string;
  appointmentDateTime: Date;
  appointmentType?: string;
}

/**
 * Send email notification to clinician when a new booking is made
 */
export async function sendClinicianBookingNotification(context: BookingNotificationContext) {
  const {
    practitionerEmail,
    practitionerFirstName,
    patientFirstName,
    patientLastName,
    patientEmail,
    patientPhone,
    appointmentDateTime,
    appointmentType,
  } = context;

  // Format the appointment date/time nicely for Australian timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedDateTime = appointmentDateTime.toLocaleString('en-AU', dateOptions);
  
  // Format time only for quick reference
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedTime = appointmentDateTime.toLocaleString('en-AU', timeOptions);

  // Get appointment type display text
  const appointmentTypeDisplay = appointmentType === 'ndis-psychology-session' 
    ? '🟢 NDIS Psychology Session'
    : '💜 Standard Psychology Session';

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">📅 New Booking Alert</h2>
    
    <p>Hi ${practitionerFirstName},</p>
    
    <p>Great news! You have a new appointment booked through the ${COMPANY_NAME} website.</p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 15px 0; color: #166534;">Appointment Details</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 120px;"><strong>📅 When:</strong></td>
          <td style="padding: 8px 0; color: #333;">${formattedDateTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>🏷️ Type:</strong></td>
          <td style="padding: 8px 0; color: #333;">${appointmentTypeDisplay}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #334155;">Client Information</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 120px;"><strong>👤 Name:</strong></td>
          <td style="padding: 8px 0; color: #333;">${patientFirstName} ${patientLastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>📧 Email:</strong></td>
          <td style="padding: 8px 0; color: #333;"><a href="mailto:${patientEmail}" style="color: #10b981;">${patientEmail}</a></td>
        </tr>
        ${patientPhone ? `
        <tr>
          <td style="padding: 8px 0; color: #666;"><strong>📱 Phone:</strong></td>
          <td style="padding: 8px 0; color: #333;"><a href="tel:${patientPhone}" style="color: #10b981;">${patientPhone}</a></td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      <em>This booking was made through the ${COMPANY_NAME} website. 
      Please check Halaxy for full appointment details and client history.</em>
    </p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
📅 New Booking Alert

Hi ${practitionerFirstName},

Great news! You have a new appointment booked through the ${COMPANY_NAME} website.

APPOINTMENT DETAILS
-------------------
📅 When: ${formattedDateTime}
🏷️ Type: ${appointmentTypeDisplay}

CLIENT INFORMATION
------------------
👤 Name: ${patientFirstName} ${patientLastName}
📧 Email: ${patientEmail}
${patientPhone ? `📱 Phone: ${patientPhone}` : ''}

This booking was made through the ${COMPANY_NAME} website.
Please check Halaxy for full appointment details and client history.

Best regards,
The ${COMPANY_NAME} Team
  `.trim();

  // Send to practitioner with admin CC'd
  return sendEmail(
    practitionerEmail,
    `📅 New Booking: ${patientFirstName} ${patientLastName} - ${formattedTime}`,
    htmlContent,
    plainTextContent,
    ADMIN_NOTIFICATION_EMAIL // CC admin on all booking alerts
  );
}

// ============================================================================
// PATIENT BOOKING CONFIRMATION EMAIL
// Client-facing - NO Bloom references, only Life Psychology Australia
// ============================================================================

interface PatientBookingConfirmationContext {
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  practitionerName: string;
  appointmentDateTime: Date;
  appointmentType?: string;
  appointmentId?: string;
}

/**
 * Send booking confirmation email to patient/client
 * Uses client-facing branding (Life Psychology Australia only)
 */
export async function sendPatientBookingConfirmation(context: PatientBookingConfirmationContext) {
  const {
    patientFirstName,
    patientEmail,
    practitionerName,
    appointmentDateTime,
    appointmentType,
  } = context;

  // Format the appointment date/time nicely for Australian timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Australia/Sydney',
  };
  const formattedDate = appointmentDateTime.toLocaleString('en-AU', dateOptions);
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedTime = appointmentDateTime.toLocaleString('en-AU', timeOptions);

  // Get appointment type display text
  const appointmentTypeDisplay = appointmentType === 'ndis-psychology-session' 
    ? 'NDIS Psychology Session'
    : 'Psychology Session';

  const htmlContent = wrapInClientTemplate(`
    <h2 style="color: #333; margin-top: 0;">🎉 Your Appointment is Confirmed!</h2>
    
    <p>Hi ${patientFirstName},</p>
    
    <p>Great news! Your appointment with ${COMPANY_NAME} has been successfully booked.</p>
    
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #a7f3d0;">
      <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px;">📅 Appointment Details</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #047857; font-weight: 600; width: 100px;">Date:</td>
          <td style="padding: 10px 0; color: #065f46; font-size: 16px;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #047857; font-weight: 600;">Time:</td>
          <td style="padding: 10px 0; color: #065f46; font-size: 16px; font-weight: 600;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #047857; font-weight: 600;">Type:</td>
          <td style="padding: 10px 0; color: #065f46;">${appointmentTypeDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #047857; font-weight: 600;">With:</td>
          <td style="padding: 10px 0; color: #065f46;">${practitionerName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #047857; font-weight: 600;">Format:</td>
          <td style="padding: 10px 0; color: #065f46;">Telehealth (Video Call)</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📹 How to Join Your Session</h3>
      <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
        You'll receive a Telehealth link closer to your appointment time. 
        Please ensure you have a quiet, private space with a stable internet connection.
      </p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📋 Before Your Appointment</h3>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
        <li style="margin-bottom: 8px;">Ensure you're in a private, comfortable space</li>
        <li style="margin-bottom: 8px;">Test your video and audio before the session</li>
        <li style="margin-bottom: 8px;">Have a glass of water nearby</li>
        <li style="margin-bottom: 0;">Feel free to jot down any topics you'd like to discuss</li>
      </ul>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 16px;">💡 Medicare Rebates</h3>
      <p style="margin: 0; color: #475569; font-size: 14px;">
        If you have a valid GP Mental Health Treatment Plan, you may be eligible for Medicare rebates. 
        Please have your referral ready for your first session.
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 24px;">
      Need to reschedule or have questions? Simply reply to this email or contact us at 
      <a href="mailto:hello@life-psychology.com.au" style="color: #10b981;">hello@life-psychology.com.au</a>
    </p>
    
    <p style="margin-top: 30px;">
      We look forward to seeing you!<br><br>
      <strong>Warm regards,</strong><br>
      <strong style="color: #10b981;">${practitionerName}</strong><br>
      <span style="color: #666;">${COMPANY_NAME}</span>
    </p>
  `);

  const plainTextContent = `
🎉 Your Appointment is Confirmed!

Hi ${patientFirstName},

Great news! Your appointment with ${COMPANY_NAME} has been successfully booked.

APPOINTMENT DETAILS
-------------------
📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
🏷️ Type: ${appointmentTypeDisplay}
👩‍⚕️ With: ${practitionerName}
📹 Format: Telehealth (Video Call)

HOW TO JOIN YOUR SESSION
------------------------
You'll receive a Telehealth link closer to your appointment time.
Please ensure you have a quiet, private space with a stable internet connection.

BEFORE YOUR APPOINTMENT
-----------------------
• Ensure you're in a private, comfortable space
• Test your video and audio before the session
• Have a glass of water nearby
• Feel free to jot down any topics you'd like to discuss

MEDICARE REBATES
----------------
If you have a valid GP Mental Health Treatment Plan, you may be eligible for Medicare rebates.
Please have your referral ready for your first session.

Need to reschedule or have questions? Reply to this email or contact us at hello@life-psychology.com.au

We look forward to seeing you!

Warm regards,
${practitionerName}
${COMPANY_NAME}
  `.trim();

  return sendEmail(
    patientEmail,
    `✅ Booking Confirmed - ${formattedDate} at ${formattedTime}`,
    htmlContent,
    plainTextContent
  );
}

// ============================================================================
// OFFER EMAIL TEMPLATE
// Practitioner-facing - can mention Bloom as the practitioner portal
// ============================================================================

interface OfferEmailContext {
  firstName: string;
  email: string;
  offerUrl: string;
  contractUrl: string;
}

/**
 * Send Offer Email
 * 
 * Sent when admin wants to extend an offer to a candidate.
 * Includes the contract and a link to accept the offer.
 */
export async function sendOfferEmail(context: OfferEmailContext) {
  const { firstName, email, offerUrl, contractUrl } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">🎉 You've Received an Offer!</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>We're excited to inform you that after reviewing your application and interview, we would like to offer you a position as a practitioner with <strong>${COMPANY_NAME}</strong>!</p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px; color: #92400e;">📄 Your Practitioner Agreement</h3>
      <p style="margin: 0 0 15px; color: #78350f;">Please review your practitioner agreement carefully. This outlines the terms and conditions of working with ${COMPANY_NAME}.</p>
      <a href="${contractUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        📥 View Contract (PDF) →
      </a>
    </div>
    
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #10b981;">
      <h3 style="margin: 0 0 15px; color: #059669;">Ready to Join Us?</h3>
      <p style="margin: 0 0 15px; color: #065f46;">Once you've reviewed the contract and you're ready to proceed, click the button below to accept your offer.</p>
      <a href="${offerUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        ✅ Accept Offer
      </a>
    </div>
    
    <p style="color: #666;">After accepting, our team will reach out with next steps to complete your onboarding and set up your practitioner profile.</p>
    
    <p style="color: #888; font-size: 14px;"><em>Have questions about the contract or the offer? Please don't hesitate to reach out to us at <a href="mailto:admin@life-psychology.com.au" style="color: #10b981;">admin@life-psychology.com.au</a>.</em></p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>Zoe & The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
🎉 You've Received an Offer!

Dear ${firstName},

We're excited to inform you that after reviewing your application and interview, we would like to offer you a position as a practitioner with ${COMPANY_NAME}!

YOUR PRACTITIONER AGREEMENT
---------------------------
Please review your practitioner agreement carefully. This outlines the terms and conditions of working with ${COMPANY_NAME}.

View Contract: ${contractUrl}

READY TO JOIN US?
-----------------
Once you've reviewed the contract and you're ready to proceed, click the link below to accept your offer:

${offerUrl}

After accepting, our team will reach out with next steps to complete your onboarding and set up your practitioner profile.

Have questions about the contract or the offer? Please don't hesitate to reach out to us at admin@life-psychology.com.au.

Warm regards,
Zoe & The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `🎉 You've Received an Offer from ${COMPANY_NAME}!`,
    htmlContent,
    plainTextContent,
    ADMIN_NOTIFICATION_EMAIL // CC admin on all offers
  );
}

// Export email service
export const emailService = {
  sendDenialEmail,
  sendWaitlistEmail,
  sendInterviewEmail,
  sendAcceptanceEmail,
  sendOfferEmail,
  sendClinicianBookingNotification,
  sendPatientBookingConfirmation,
};

export default emailService;
