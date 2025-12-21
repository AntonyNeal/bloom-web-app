/**
 * Email Service for Application Workflow
 * 
 * Uses Azure Communication Services Email to send notifications
 * for application status changes (deny, waitlist, interview, accept).
 */

import { EmailClient, EmailMessage } from '@azure/communication-email';

// Email configuration
const FROM_EMAIL = process.env.ACS_EMAIL_FROM || 'noreply@lifepsychologyaustralia.com.au';
const COMPANY_NAME = 'Life Psychology Australia';
const BLOOM_NAME = 'Bloom';

interface EmailContext {
  firstName: string;
  lastName: string;
  email: string;
  interviewDate?: Date;
  interviewNotes?: string;
  decisionReason?: string;
}

/**
 * Get the Azure Communication Services Email client
 */
function getEmailClient(): EmailClient | null {
  const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
  
  if (!connectionString) {
    console.warn('Azure Communication Services not configured for email');
    return null;
  }
  
  return new EmailClient(connectionString);
}

/**
 * Send an email using Azure Communication Services
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  plainTextContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getEmailClient();
  
  if (!client) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const message: EmailMessage = {
      senderAddress: FROM_EMAIL,
      recipients: {
        to: [{ address: to }],
      },
      content: {
        subject,
        html: htmlContent,
        plainText: plainTextContent,
      },
    };

    const poller = await client.beginSend(message);
    const result = await poller.pollUntilDone();

    return { 
      success: result.status === 'Succeeded', 
      messageId: result.id 
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Base email template wrapper
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

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Denial Email Template
 */
export async function sendDenialEmail(context: EmailContext) {
  const { firstName, email } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Your ${BLOOM_NAME} Application</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Thank you for your interest in joining ${BLOOM_NAME} and ${COMPANY_NAME}.</p>
    
    <p>After careful consideration of your application, we regret to inform you that we are unable to proceed at this time.</p>
    
    <p>We appreciate the time and effort you put into your application, and we wish you all the best in your professional journey.</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>The ${BLOOM_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Your ${BLOOM_NAME} Application

Dear ${firstName},

Thank you for your interest in joining ${BLOOM_NAME} and ${COMPANY_NAME}.

After careful consideration of your application, we regret to inform you that we are unable to proceed at this time.

We appreciate the time and effort you put into your application, and we wish you all the best in your professional journey.

Warm regards,
The ${BLOOM_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Your ${BLOOM_NAME} Application`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Waitlist Email Template
 */
export async function sendWaitlistEmail(context: EmailContext) {
  const { firstName, email } = context;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Your ${BLOOM_NAME} Application - Waitlist</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Thank you for your application to join ${BLOOM_NAME}.</p>
    
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
      <strong>The ${BLOOM_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Your ${BLOOM_NAME} Application - Waitlist

Dear ${firstName},

Thank you for your application to join ${BLOOM_NAME}.

We were impressed with your credentials and experience. However, we don't currently have positions available that match your profile.

You've been added to our waitlist. We'll reach out when opportunities arise that match your expertise.

We appreciate your patience and interest in working with us.

Warm regards,
The ${BLOOM_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Your ${BLOOM_NAME} Application - On Waitlist`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Interview Invitation Email Template
 */
export async function sendInterviewEmail(context: EmailContext) {
  const { firstName, email, interviewDate, interviewNotes } = context;

  if (!interviewDate) {
    throw new Error('Interview date is required');
  }

  const formattedDate = interviewDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = interviewDate.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">Interview Invitation - ${BLOOM_NAME}</h2>
    
    <p>Dear ${firstName},</p>
    
    <p>Great news! We'd love to learn more about you and discuss your application to join ${BLOOM_NAME}.</p>
    
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 15px; color: #059669;">📅 Interview Details</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime} (Australian Eastern Time)</p>
      ${interviewNotes ? `<p style="margin: 15px 0 0; color: #666;"><strong>Notes:</strong> ${interviewNotes}</p>` : ''}
    </div>
    
    <p>Please confirm your availability by replying to this email. If you need to reschedule, let us know and we'll find an alternative time.</p>
    
    <p>We look forward to speaking with you!</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>The ${BLOOM_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
Interview Invitation - ${BLOOM_NAME}

Dear ${firstName},

Great news! We'd love to learn more about you and discuss your application to join ${BLOOM_NAME}.

INTERVIEW DETAILS
-----------------
Date: ${formattedDate}
Time: ${formattedTime} (Australian Eastern Time)
${interviewNotes ? `Notes: ${interviewNotes}` : ''}

Please confirm your availability by replying to this email. If you need to reschedule, let us know and we'll find an alternative time.

We look forward to speaking with you!

Warm regards,
The ${BLOOM_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `${BLOOM_NAME} Application - Interview Invitation`,
    htmlContent,
    plainTextContent
  );
}

/**
 * Acceptance/Onboarding Email Template
 */
export async function sendAcceptanceEmail(context: EmailContext) {
  const { firstName, email } = context;

  // TODO: Generate onboarding token and link when onboarding system is built
  const onboardingLink = `https://bloom.lifepsychologyaustralia.com.au/onboarding`;

  const htmlContent = wrapInTemplate(`
    <h2 style="color: #333; margin-top: 0;">🎉 Welcome to ${BLOOM_NAME}!</h2>
    
    <p>Dear ${firstName},</p>
    
    <p><strong>Congratulations!</strong> We're thrilled to let you know that your application to join ${BLOOM_NAME} has been accepted.</p>
    
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 15px; color: #059669;">Get Started with Onboarding</h3>
      <p style="margin: 0 0 15px;">Complete your profile and set up your account:</p>
      <a href="${onboardingLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Start Onboarding →
      </a>
    </div>
    
    <p>During onboarding, you'll:</p>
    <ul style="color: #666;">
      <li>Create your login credentials</li>
      <li>Set up your professional profile</li>
      <li>Take a quick tour of the platform</li>
    </ul>
    
    <p style="color: #888; font-size: 14px;"><em>Note: The onboarding link will expire in 7 days.</em></p>
    
    <p>We're excited to have you join us!</p>
    
    <p style="margin-top: 30px;">
      Warm regards,<br>
      <strong>The ${BLOOM_NAME} Team</strong>
    </p>
  `);

  const plainTextContent = `
🎉 Welcome to ${BLOOM_NAME}!

Dear ${firstName},

Congratulations! We're thrilled to let you know that your application to join ${BLOOM_NAME} has been accepted.

GET STARTED WITH ONBOARDING
---------------------------
Complete your profile and set up your account:
${onboardingLink}

During onboarding, you'll:
- Create your login credentials
- Set up your professional profile
- Take a quick tour of the platform

Note: The onboarding link will expire in 7 days.

We're excited to have you join us!

Warm regards,
The ${BLOOM_NAME} Team
  `.trim();

  return sendEmail(
    email,
    `Welcome to ${BLOOM_NAME}! 🎉`,
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
};

export default emailService;
