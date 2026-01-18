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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #fdf2f8 0%, #f0fdf4 50%, #ecfeff 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Email Card -->
    <div style="background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
      <!-- Header -->
      <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border-bottom: 2px solid #10b981;">
        <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600;">🌸 ${BLOOM_NAME}</h1>
        <p style="margin: 8px 0 0; color: #666; font-size: 14px;">${COMPANY_NAME}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 35px 30px;">
        ${content}
      </div>
      
      <!-- Footer -->
      <div style="background: #f9fafb; border-top: 1px solid #eee; padding: 20px; text-align: center; color: #888; font-size: 12px;">
        <p style="margin: 0;">This email was sent by ${COMPANY_NAME}</p>
        <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      </div>
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #fdf2f8 0%, #f0fdf4 50%, #ecfeff 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Email Card -->
    <div style="background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
      <!-- Header -->
      <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border-bottom: 2px solid #10b981;">
        <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: 600;">🌸 ${COMPANY_NAME}</h1>
        <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Telehealth Psychology Services</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 35px 30px;">
        ${content}
      </div>
      
      <!-- Footer -->
      <div style="background: #f9fafb; border-top: 1px solid #eee; padding: 20px; text-align: center; color: #888; font-size: 12px;">
        <p style="margin: 0;">This email was sent by ${COMPANY_NAME}</p>
        <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      </div>
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
 * Kind but honest - no false promises
 */
export async function sendDenialEmail(context: EmailContext) {
  const { firstName, email } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Thank You for Applying</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Thank you for taking the time to apply to ${COMPANY_NAME}. We genuinely appreciate your interest in joining our team.</p>
    
    <p>After reviewing your application, we've decided not to move forward at this time. We know this isn't the news you were hoping for, and we're grateful for the effort you put into applying.</p>
    
    <p>We wish you all the best in finding the right opportunity for you.</p>
    
    <p style="margin-top: 30px;">
      Take care,<br>
      <strong>The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Thank You for Applying

Dear ${firstName},

Thank you for taking the time to apply to ${COMPANY_NAME}. We genuinely appreciate your interest in joining our team.

After reviewing your application, we've decided not to move forward at this time. We know this isn't the news you were hoping for, and we're grateful for the effort you put into applying.

We wish you all the best in finding the right opportunity for you.

Take care,
The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Your Application to ${COMPANY_NAME}`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Waitlist Email Template (Practitioner Application)
 * Designed to keep applicants engaged and excited about future opportunities
 */
export async function sendWaitlistEmail(context: EmailContext) {
  const { firstName, email } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">✨ You Made a Great Impression, ${firstName}!</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Thank you for taking the time to apply to ${COMPANY_NAME}. We've reviewed your application and we're genuinely impressed by your background and experience.</p>
    
    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8b5cf6;">
      <h3 style="margin: 0 0 12px; color: #7c3aed;">🌟 You're on our Priority Waitlist</h3>
      <p style="margin: 0; color: #6b21a8; line-height: 1.6;">
        While we don't have an immediate opening that matches your expertise, we want to stay connected. 
        <strong>You'll be among the first we reach out to</strong> when the right opportunity arises.
      </p>
    </div>
    
    <p><strong>What this means:</strong></p>
    <ul style="color: #555; line-height: 1.8;">
      <li>🔔 We'll notify you as soon as a suitable position opens up</li>
      <li>⚡ Priority consideration — no need to reapply</li>
      <li>💜 Your profile stays active in our system</li>
    </ul>
    
    <p style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; color: #64748b; font-size: 14px;">
      <strong>In the meantime:</strong> Keep doing great work! We love seeing practitioners grow their practice and make an impact in their communities.
    </p>
    
    <p>Thank you for your interest in joining our team — we hope to work together soon! 💜</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>Zoe & The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
✨ You Made a Great Impression, ${firstName}!

Dear ${firstName},

Thank you for taking the time to apply to ${COMPANY_NAME}. We've reviewed your application and we're genuinely impressed by your background and experience.

🌟 YOU'RE ON OUR PRIORITY WAITLIST
----------------------------------
While we don't have an immediate opening that matches your expertise, we want to stay connected. You'll be among the first we reach out to when the right opportunity arises.

What this means:
• 🔔 We'll notify you as soon as a suitable position opens up
• ⚡ Priority consideration — no need to reapply
• 💜 Your profile stays active in our system

In the meantime: Keep doing great work! We love seeing practitioners grow their practice and make an impact in their communities.

Thank you for your interest in joining our team — we hope to work together soon!

Warm regards,
Zoe & The ${COMPANY_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `You're on our Priority List! ✨`,
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
// ADMIN BOOKING NOTIFICATION EMAIL
// Internal - simple summary for business owner (Julian)
// ============================================================================

interface AdminBookingNotificationContext {
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone?: string;
  practitionerName: string;
  appointmentDateTime: Date;
  appointmentType?: string;
}

/**
 * Send booking notification email to admin/business owner
 * Simple summary - no telehealth link needed
 */
export async function sendAdminBookingNotification(context: AdminBookingNotificationContext) {
  const {
    patientFirstName,
    patientLastName,
    patientEmail,
    patientPhone,
    practitionerName,
    appointmentDateTime,
    appointmentType,
  } = context;

  // Format the appointment date/time for Australian timezone
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

  const appointmentTypeDisplay = appointmentType === 'ndis-psychology-session' 
    ? 'NDIS Psychology Session'
    : 'Standard Psychology Session';

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">💰 New Booking!</h2>
    
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #a7f3d0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #047857; font-weight: 600; width: 120px;">Client:</td>
          <td style="padding: 8px 0; color: #065f46; font-weight: 600;">${patientFirstName} ${patientLastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #047857; font-weight: 600;">Practitioner:</td>
          <td style="padding: 8px 0; color: #065f46;">${practitionerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #047857; font-weight: 600;">When:</td>
          <td style="padding: 8px 0; color: #065f46;">${formattedDateTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #047857; font-weight: 600;">Type:</td>
          <td style="padding: 8px 0; color: #065f46;">${appointmentTypeDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #047857; font-weight: 600;">Email:</td>
          <td style="padding: 8px 0; color: #065f46;"><a href="mailto:${patientEmail}" style="color: #10b981;">${patientEmail}</a></td>
        </tr>
        ${patientPhone ? `
        <tr>
          <td style="padding: 8px 0; color: #047857; font-weight: 600;">Phone:</td>
          <td style="padding: 8px 0; color: #065f46;">${patientPhone}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      View in <a href="https://app.halaxy.com" style="color: #10b981;">Halaxy</a>
    </p>
  `);

  const plainTextContent = `
💰 New Booking!

Client: ${patientFirstName} ${patientLastName}
Practitioner: ${practitionerName}
When: ${formattedDateTime}
Type: ${appointmentTypeDisplay}
Email: ${patientEmail}
${patientPhone ? `Phone: ${patientPhone}` : ''}

View in Halaxy: https://app.halaxy.com
  `.trim();

  return sendEmail(
    ADMIN_NOTIFICATION_EMAIL,
    `💰 New Booking: ${patientFirstName} ${patientLastName} - ${practitionerName}`,
    htmlContent,
    plainTextContent
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
  /** Location type: telehealth, in-person, or phone */
  locationType?: 'telehealth' | 'in-person' | 'phone';
  /** Video link for telehealth, address for in-person */
  locationDetails?: string;
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
    locationType = 'telehealth',
    locationDetails,
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

  // Determine location format display and content
  const getLocationFormat = () => {
    switch (locationType) {
      case 'in-person':
        return 'In-Person';
      case 'phone':
        return 'Phone Call';
      case 'telehealth':
      default:
        return 'Telehealth (Video Call)';
    }
  };

  // Build the join session section based on location type
  const getJoinSessionSection = () => {
    if (locationType === 'telehealth' && locationDetails) {
      // Has a telehealth link - show prominent join button
      return `
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 24px; border-radius: 16px; margin: 24px 0; text-align: center;">
      <h3 style="margin: 0 0 12px 0; color: #fff; font-size: 18px;">📹 Join Your Video Session</h3>
      <p style="margin: 0 0 16px 0; color: #e0f2fe; font-size: 14px;">
        Click the button below at your appointment time to join your session
      </p>
      <a href="${locationDetails}" target="_blank" style="display: inline-block; background: #fff; color: #0284c7; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        🎥 Join Video Session
      </a>
      <p style="margin: 16px 0 0 0; color: #bae6fd; font-size: 12px;">
        Please join 5 minutes before your scheduled time
      </p>
    </div>`;
    } else if (locationType === 'telehealth') {
      // Telehealth but no link yet - show placeholder
      return `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📹 How to Join Your Session</h3>
      <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
        You'll receive a Telehealth link closer to your appointment time. 
        Please ensure you have a quiet, private space with a stable internet connection.
      </p>
    </div>`;
    } else if (locationType === 'in-person' && locationDetails) {
      // In-person with address
      return `
    <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #22c55e;">
      <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px;">📍 Appointment Location</h3>
      <p style="margin: 0; color: #15803d; font-size: 14px;">
        ${locationDetails}
      </p>
    </div>`;
    } else if (locationType === 'phone') {
      // Phone call
      return `
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📞 Phone Session</h3>
      <p style="margin: 0; color: #78350f; font-size: 14px;">
        Your practitioner will call you at your registered phone number at your appointment time.
        Please ensure you're in a quiet, private space and your phone is charged.
      </p>
    </div>`;
    }
    // Default fallback
    return `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📹 Session Details</h3>
      <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
        Further details about joining your session will be provided closer to your appointment time.
      </p>
    </div>`;
  };

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
          <td style="padding: 10px 0; color: #065f46;">${getLocationFormat()}</td>
        </tr>
      </table>
    </div>
    
    ${getJoinSessionSection()}
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📋 Before Your Appointment</h3>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
        <li style="margin-bottom: 8px;">Ensure you're in a private, comfortable space</li>
        ${locationType === 'telehealth' ? '<li style="margin-bottom: 8px;">Test your video and audio before the session</li>' : ''}
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
📹 Format: ${getLocationFormat()}

${locationType === 'telehealth' && locationDetails ? `JOIN YOUR VIDEO SESSION
-----------------------
🎥 Click here to join: ${locationDetails}
Please join 5 minutes before your scheduled time.
` : locationType === 'telehealth' ? `HOW TO JOIN YOUR SESSION
------------------------
You'll receive a Telehealth link closer to your appointment time.
Please ensure you have a quiet, private space with a stable internet connection.
` : locationType === 'in-person' && locationDetails ? `APPOINTMENT LOCATION
--------------------
📍 ${locationDetails}
` : locationType === 'phone' ? `PHONE SESSION
-------------
Your practitioner will call you at your registered phone number at your appointment time.
Please ensure you're in a quiet, private space and your phone is charged.
` : ''}
BEFORE YOUR APPOINTMENT
-----------------------
• Ensure you're in a private, comfortable space
${locationType === 'telehealth' ? '• Test your video and audio before the session\n' : ''}• Have a glass of water nearby
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

/**
 * Welcome Email - Sent after onboarding is completed
 * Includes their new company email and login instructions
 */
interface WelcomeEmailContext {
  firstName: string;
  personalEmail: string;
  companyEmail: string;
}

export async function sendWelcomeEmail(context: WelcomeEmailContext) {
  const { firstName, personalEmail, companyEmail } = context;
  
  const bloomUrl = 'https://bloom.life-psychology.com.au';
  const outlookUrl = 'https://outlook.office.com';

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">🌸 Welcome to Bloom, ${firstName}!</h2>
    
    <p>Your onboarding is complete and your accounts are ready to use.</p>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px; color: #1e40af;">📧 Your New Email Address</h3>
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e3a8a; font-family: monospace;">${companyEmail}</p>
      <p style="margin: 10px 0 0; color: #3b82f6; font-size: 14px;">Use this email and your new password to sign in to all Life Psychology services.</p>
    </div>
    
    <h3 style="color: #333; margin: 30px 0 15px;">Quick Links</h3>
    
    <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
      <tr>
        <td style="background: #ecfdf5; padding: 15px; border-radius: 8px;">
          <strong style="color: #059669;">🌸 Bloom Portal</strong>
          <p style="margin: 5px 0 10px; color: #666; font-size: 14px;">Access your dashboard, view your schedule, and connect with the team.</p>
          <a href="${bloomUrl}" style="display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Open Bloom →
          </a>
          <p style="margin: 10px 0 0; color: #888; font-size: 12px;">💡 Tip: Click the flower in the top-right corner of the homepage to log in.</p>
        </td>
      </tr>
      <tr>
        <td style="background: #fef3c7; padding: 15px; border-radius: 8px;">
          <strong style="color: #92400e;">📬 Outlook Email & Calendar</strong>
          <p style="margin: 5px 0 10px; color: #666; font-size: 14px;">Check your work email and manage your calendar.</p>
          <a href="${outlookUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Open Outlook →
          </a>
        </td>
      </tr>
    </table>
    
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; color: #666; font-size: 13px;">
        <strong>Remember:</strong> Your username is <strong>${companyEmail}</strong> and you set your password during onboarding. 
        If you forget your password, use the "Forgot password" link on the login page.
      </p>
    </div>
    
    <p>Welcome to the team! We're so glad to have you.</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>Zoe & The ${COMPANY_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
🌸 Welcome to Bloom, ${firstName}!

Your onboarding is complete and your accounts are ready to use.

YOUR NEW EMAIL ADDRESS
----------------------
${companyEmail}

Use this email and your new password to sign in to all Life Psychology services.

QUICK LINKS
-----------

🌸 Bloom Portal
Access your dashboard, view your schedule, and connect with the team.
${bloomUrl}
Tip: Click the flower in the top-right corner of the homepage to log in.

📬 Outlook Email & Calendar
Check your work email and manage your calendar.
${outlookUrl}

REMEMBER
--------
Your username is ${companyEmail} and you set your password during onboarding.
If you forget your password, use the "Forgot password" link on the login page.

Welcome to the team! We're so glad to have you.

Warm regards,
Zoe & The ${COMPANY_NAME} Team
  `.trim();

  // Send to their personal email (the one they applied with)
  return sendEmail(
    personalEmail,
    `🌸 Welcome to Life Psychology! Your account is ready`,
    htmlContent,
    plainTextContent
  );
}

// ============================================================================
// APPOINTMENT REMINDER EMAIL - PATIENT
// Client-facing - NO Bloom references, only Life Psychology Australia
// ============================================================================

interface PatientAppointmentReminderContext {
  patientEmail: string;
  patientFirstName: string;
  practitionerName: string;
  appointmentDateTime: Date;
  telehealthLink?: string;
}

/**
 * Send appointment reminder email to patient (24 hours before)
 */
export async function sendPatientAppointmentReminder(context: PatientAppointmentReminderContext) {
  const {
    patientEmail,
    patientFirstName,
    practitionerName,
    appointmentDateTime,
    telehealthLink,
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

  // Build join session section based on telehealth link availability
  const joinSessionSection = telehealthLink ? `
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 24px; border-radius: 16px; margin: 24px 0; text-align: center;">
      <h3 style="margin: 0 0 12px 0; color: #fff; font-size: 18px;">📹 Join Your Session</h3>
      <p style="margin: 0 0 16px 0; color: #e0f2fe; font-size: 14px;">
        Click the button below at your appointment time
      </p>
      <a href="${telehealthLink}" target="_blank" style="display: inline-block; background: #fff; color: #0284c7; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        🎥 Join Video Session
      </a>
      <p style="margin: 16px 0 0 0; color: #bae6fd; font-size: 12px;">
        Please join 5 minutes before your scheduled time
      </p>
    </div>` : `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📹 Your Session</h3>
      <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
        Please ensure you have a quiet, private space with a stable internet connection ready for your session.
      </p>
    </div>`;

  const htmlContent = wrapInClientTemplate(`
    <h2 style="color: #333; margin-top: 0;">⏰ Reminder: Your Appointment is Tomorrow!</h2>
    
    <p>Hi ${patientFirstName},</p>
    
    <p>This is a friendly reminder about your upcoming appointment with ${COMPANY_NAME}.</p>
    
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
          <td style="padding: 10px 0; color: #047857; font-weight: 600;">With:</td>
          <td style="padding: 10px 0; color: #065f46;">${practitionerName}</td>
        </tr>
      </table>
    </div>
    
    ${joinSessionSection}
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📋 Quick Checklist</h3>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
        <li style="margin-bottom: 8px;">Find a private, comfortable space</li>
        <li style="margin-bottom: 8px;">Test your video and audio</li>
        <li style="margin-bottom: 8px;">Have a glass of water nearby</li>
        <li style="margin-bottom: 0;">Note any topics you'd like to discuss</li>
      </ul>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 24px;">
      Need to reschedule? Please let us know as soon as possible by replying to this email or contacting us at 
      <a href="mailto:hello@life-psychology.com.au" style="color: #10b981;">hello@life-psychology.com.au</a>
    </p>
    
    <p style="margin-top: 30px;">
      We look forward to seeing you tomorrow!<br><br>
      <strong>Warm regards,</strong><br>
      <strong style="color: #10b981;">${practitionerName}</strong><br>
      <span style="color: #666;">${COMPANY_NAME}</span>
    </p>
  `);

  const plainTextContent = `
⏰ Reminder: Your Appointment is Tomorrow!

Hi ${patientFirstName},

This is a friendly reminder about your upcoming appointment with ${COMPANY_NAME}.

APPOINTMENT DETAILS
-------------------
📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
👩‍⚕️ With: ${practitionerName}
${telehealthLink ? `\n🎥 Join Link: ${telehealthLink}` : ''}

QUICK CHECKLIST
---------------
• Find a private, comfortable space
• Test your video and audio
• Have a glass of water nearby
• Note any topics you'd like to discuss

Need to reschedule? Please let us know as soon as possible by replying to this email or contacting us at hello@life-psychology.com.au

We look forward to seeing you tomorrow!

Warm regards,
${practitionerName}
${COMPANY_NAME}
  `.trim();

  return sendEmail(
    patientEmail,
    `⏰ Reminder: Appointment Tomorrow at ${formattedTime}`,
    htmlContent,
    plainTextContent
  );
}

// ============================================================================
// APPOINTMENT REMINDER EMAIL - CLINICIAN
// Internal - can mention Bloom as the practitioner portal
// ============================================================================

interface ClinicianAppointmentReminderContext {
  practitionerEmail: string;
  practitionerFirstName: string;
  patientName: string;
  appointmentDateTime: Date;
  isShortNotice?: boolean; // true for 1-hour reminder
}

/**
 * Send appointment reminder email to clinician
 * @param isShortNotice - If true, sends a "starting soon" reminder instead of "tomorrow"
 */
export async function sendClinicianAppointmentReminder(context: ClinicianAppointmentReminderContext) {
  const {
    practitionerEmail,
    practitionerFirstName,
    patientName,
    appointmentDateTime,
    isShortNotice = false,
  } = context;

  // Format the appointment date/time nicely for Australian timezone
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
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

  // Different content based on reminder type
  const heading = isShortNotice
    ? '🔔 Session Starting Soon!'
    : '⏰ Appointment Reminder - Tomorrow';
  
  const introText = isShortNotice
    ? `Your session with <strong>${patientName}</strong> is starting in about 1 hour.`
    : 'Just a friendly reminder about your upcoming session.';
  
  const subjectLine = isShortNotice
    ? `🔔 Starting in 1 hour: ${patientName} at ${formattedTime}`
    : `⏰ Tomorrow: ${patientName} at ${formattedTime}`;

  const bgGradient = isShortNotice
    ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
  
  const borderColor = isShortNotice ? '#fca5a5' : '#fcd34d';
  const textColor = isShortNotice ? '#991b1b' : '#92400e';
  const lightTextColor = isShortNotice ? '#7f1d1d' : '#78350f';

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">${heading}</h2>
    
    <p>Hi ${practitionerFirstName},</p>
    
    <p>${introText}</p>
    
    <div style="background: ${bgGradient}; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid ${borderColor};">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${textColor}; font-weight: 600; width: 80px;">📅</td>
          <td style="padding: 8px 0; color: ${lightTextColor};">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${textColor}; font-weight: 600;">⏰</td>
          <td style="padding: 8px 0; color: ${lightTextColor}; font-weight: 600;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${textColor}; font-weight: 600;">👤</td>
          <td style="padding: 8px 0; color: ${lightTextColor};">${patientName}</td>
        </tr>
      </table>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      View full details in <a href="https://app.halaxy.com" style="color: #10b981;">Halaxy</a> 
      or your <a href="https://bloom.life-psychology.com.au" style="color: #10b981;">Bloom dashboard</a>.
    </p>
    
    <p style="margin-top: 20px; color: #666;">
      - Life Psychology Notifications
    </p>
  `);

  const plainTextContent = `
${isShortNotice ? '🔔 Session Starting Soon!' : '⏰ Appointment Reminder - Tomorrow'}

Hi ${practitionerFirstName},

${isShortNotice ? `Your session with ${patientName} is starting in about 1 hour.` : 'Just a friendly reminder about your upcoming session.'}

📅 ${formattedDate}
⏰ ${formattedTime}
👤 ${patientName}

View full details in Halaxy or your Bloom dashboard.

- Life Psychology Notifications
  `.trim();

  return sendEmail(
    practitionerEmail,
    subjectLine,
    htmlContent,
    plainTextContent
  );
}

/**
 * Send admin 1-hour appointment reminder
 * Julian Della Bosca receives email 1 hour before every appointment
 */
export async function sendAdminAppointmentReminder(context: {
  patientName: string;
  practitionerName: string;
  appointmentDateTime: Date;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'julian.dellabosca@gmail.com';
  
  const { patientName, practitionerName, appointmentDateTime } = context;

  // Format time for Australian timezone
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Sydney',
  };
  const formattedTime = appointmentDateTime.toLocaleString('en-AU', timeOptions);

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">🔔 Session Starting in 1 Hour</h2>
    
    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #fca5a5;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #991b1b; font-weight: 600; width: 100px;">⏰ Time:</td>
          <td style="padding: 8px 0; color: #7f1d1d; font-weight: 600;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">👤 Client:</td>
          <td style="padding: 8px 0; color: #7f1d1d;">${patientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">👩‍⚕️ With:</td>
          <td style="padding: 8px 0; color: #7f1d1d;">${practitionerName}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-top: 20px; color: #666;">
      - Life Psychology Notifications
    </p>
  `);

  const plainTextContent = `
🔔 Session Starting in 1 Hour

⏰ Time: ${formattedTime}
👤 Client: ${patientName}
👩‍⚕️ With: ${practitionerName}

- Life Psychology Notifications
  `.trim();

  return sendEmail(
    adminEmail,
    `🔔 1hr: ${patientName} with ${practitionerName} at ${formattedTime}`,
    htmlContent,
    plainTextContent
  );
}

// Export email service
export const emailService = {
  sendDenialEmail,
  sendWaitlistEmail,
  sendInterviewEmail,
  sendAcceptanceEmail,
  sendOfferEmail,
  sendWelcomeEmail,
  sendClinicianBookingNotification,
  sendAdminBookingNotification,
  sendAdminAppointmentReminder,
  sendPatientBookingConfirmation,
  sendPatientAppointmentReminder,
  sendClinicianAppointmentReminder,
};

export default emailService;
