/**
 * Process Booking Notifications Queue Trigger
 * 
 * Azure Function that processes booking notification messages from the queue.
 * Handles two types of notifications:
 * 1. Clinician alerts - fetches contact from Halaxy, sends SMS/email
 * 2. Patient confirmations - sends booking confirmation email to client
 * 
 * Architecture:
 * - Triggered by messages in 'booking-notifications' Azure Storage Queue
 * - Notification failures are logged, not re-queued
 * - Logs all results to Application Insights
 */

import { app, InvocationContext } from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { sendClinicianBookingSms } from '../services/sms';
import { sendClinicianBookingNotification, sendPatientBookingConfirmation } from '../services/email';
import { parseQueueMessage } from '../services/notifications/queue';
import type { 
  BookingNotificationMessage, 
  NotificationProcessResult,
  PractitionerContact,
  ChannelResult 
} from '../services/notifications/types';

/**
 * Get practitioner contact info from Halaxy
 * 
 * Phone: From PractitionerRole.telecom
 * Email/Name: From Practitioner.telecom and Practitioner.name
 */
async function getPractitionerContact(
  practitionerId: string,
  context: InvocationContext
): Promise<PractitionerContact | null> {
  const halaxyClient = getHalaxyClient();
  
  try {
    let actualPractitionerId: string;
    
    // If already in PR-XXXXX format, use directly
    if (practitionerId.startsWith('PR-') || practitionerId.startsWith('EP-')) {
      actualPractitionerId = practitionerId;
    } else {
      // Otherwise it's a Halaxy Profile ID - need to search for the practitioner
      context.log(`[NotificationQueue] Searching for Practitioner by identifier ${practitionerId}...`);
      const practitioners = await halaxyClient.searchPractitionersByIdentifier(practitionerId);
      
      if (!practitioners || practitioners.length === 0) {
        context.warn(`[NotificationQueue] No practitioner found with identifier: ${practitionerId}`);
        return null;
      }
      
      actualPractitionerId = practitioners[0].id;
      context.log(`[NotificationQueue] Found Practitioner resource ID: ${actualPractitionerId}`);
    }
    
    // Fetch PractitionerRole to get phone number
    context.log(`[NotificationQueue] Fetching PractitionerRole for ${actualPractitionerId}...`);
    const roles = await halaxyClient.getPractitionerRolesByPractitioner(actualPractitionerId);
    
    let phone: string | undefined;
    if (roles && roles.length > 0) {
      for (const contact of roles[0].telecom || []) {
        if (contact.system === 'phone' || contact.system === 'sms') {
          phone = contact.value;
          context.log(`[NotificationQueue] Found phone on PractitionerRole`);
          break;
        }
      }
    }

    // Fetch Practitioner to get name and email
    context.log(`[NotificationQueue] Fetching Practitioner ${actualPractitionerId}...`);
    const practitioner = await halaxyClient.getPractitioner(actualPractitionerId);
    
    if (!practitioner) {
      context.warn(`[NotificationQueue] Practitioner not found: ${actualPractitionerId}`);
      return null;
    }

    // Extract name
    const name = practitioner.name?.[0];
    const firstName = name?.given?.[0] || 'Practitioner';

    // Extract email
    let email: string | undefined;
    for (const contact of practitioner.telecom || []) {
      if (contact.system === 'email') {
        email = contact.value;
        break;
      }
    }

    context.log(`[NotificationQueue] Contact: ${firstName}, email: ${email ? 'yes' : 'no'}, phone: ${phone ? 'yes' : 'no'}`);

    return {
      practitionerId: actualPractitionerId,
      firstName,
      email,
      phone,
    };
  } catch (error) {
    context.error('[NotificationQueue] Failed to get practitioner contact:', error);
    return null;
  }
}

/**
 * Send SMS notification
 */
async function sendSmsNotification(
  contact: PractitionerContact,
  message: BookingNotificationMessage,
  context: InvocationContext
): Promise<ChannelResult> {
  if (!contact.phone) {
    return { success: false, error: 'No phone number available' };
  }

  try {
    const result = await sendClinicianBookingSms({
      clinicianPhone: contact.phone,
      clinicianFirstName: contact.firstName,
      patientFirstName: message.booking.patientFirstName,
      patientLastName: message.booking.patientLastName,
      appointmentDateTime: new Date(message.booking.appointmentDateTime),
      appointmentType: message.booking.appointmentType,
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: 'acs-sms',
    };
  } catch (error) {
    context.error('[NotificationQueue] SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  contact: PractitionerContact,
  message: BookingNotificationMessage,
  context: InvocationContext
): Promise<ChannelResult> {
  if (!contact.email) {
    return { success: false, error: 'No email address available' };
  }

  try {
    const result = await sendClinicianBookingNotification({
      practitionerEmail: contact.email,
      practitionerFirstName: contact.firstName,
      patientFirstName: message.booking.patientFirstName,
      patientLastName: message.booking.patientLastName,
      patientEmail: message.booking.patientEmail,
      patientPhone: message.booking.patientPhone,
      appointmentDateTime: new Date(message.booking.appointmentDateTime),
      appointmentType: message.booking.appointmentType,
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: 'acs-email',
    };
  } catch (error) {
    context.error('[NotificationQueue] Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send patient booking confirmation email
 */
async function sendPatientConfirmationEmail(
  message: BookingNotificationMessage,
  context: InvocationContext
): Promise<ChannelResult> {
  try {
    const result = await sendPatientBookingConfirmation({
      patientFirstName: message.booking.patientFirstName,
      patientLastName: message.booking.patientLastName,
      patientEmail: message.booking.patientEmail,
      practitionerName: message.practitionerName || 'Your Psychologist',
      appointmentDateTime: new Date(message.booking.appointmentDateTime),
      appointmentType: message.booking.appointmentType,
      appointmentId: message.booking.appointmentId,
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: 'acs-email',
    };
  } catch (error) {
    context.error('[NotificationQueue] Patient confirmation email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main queue trigger handler
 */
async function processBookingNotification(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const startTime = Date.now();
  
  context.log('[NotificationQueue] Processing message...');
  
  // Parse the queue message
  const message = parseQueueMessage(queueItem as string);
  
  if (!message) {
    context.error('[NotificationQueue] Failed to parse queue message');
    return; // Don't retry invalid messages
  }

  context.log(`[NotificationQueue] Processing notification`, {
    messageId: message.messageId,
    type: message.type,
    practitionerId: message.practitionerId,
    appointmentId: message.booking.appointmentId,
    channels: message.channels,
    retryCount: message.retryCount || 0,
  });

  // Handle patient booking confirmation
  if (message.type === 'patient_booking_confirmation') {
    context.log('[NotificationQueue] Sending patient booking confirmation...');
    
    const emailResult = await sendPatientConfirmationEmail(message, context);
    
    const duration = Date.now() - startTime;
    context.log('[NotificationQueue] Patient confirmation complete', {
      messageId: message.messageId,
      patientEmail: message.booking.patientEmail,
      appointmentId: message.booking.appointmentId,
      success: emailResult.success,
      error: emailResult.error,
      duration: `${duration}ms`,
    });
    return;
  }

  // Handle clinician booking alert (existing logic)
  if (!message.practitionerId) {
    context.error('[NotificationQueue] No practitioner ID for clinician alert');
    return;
  }

  // Initialize result
  const result: NotificationProcessResult = {
    messageId: message.messageId,
    practitionerId: message.practitionerId,
    processedAt: new Date().toISOString(),
  };

  // Fetch practitioner contact from Halaxy
  const contact = await getPractitionerContact(message.practitionerId, context);
  
  if (!contact) {
    context.error('[NotificationQueue] Could not get practitioner contact - notification not sent', {
      messageId: message.messageId,
      practitionerId: message.practitionerId,
    });
    return; // Can't notify without contact info
  }

  // Send SMS if requested
  if (message.channels.includes('sms')) {
    context.log('[NotificationQueue] Sending SMS notification...');
    result.sms = await sendSmsNotification(contact, message, context);
    
    if (result.sms.success) {
      context.log('[NotificationQueue] SMS sent successfully');
    } else {
      context.warn('[NotificationQueue] SMS failed:', result.sms.error);
    }
  }

  // Send email if requested
  if (message.channels.includes('email')) {
    context.log('[NotificationQueue] Sending email notification...');
    result.email = await sendEmailNotification(contact, message, context);
    
    if (result.email.success) {
      context.log('[NotificationQueue] Email sent successfully');
    } else {
      context.warn('[NotificationQueue] Email failed:', result.email.error);
    }
  }

  // Log final result to Application Insights
  const duration = Date.now() - startTime;
  context.log('[NotificationQueue] Processing complete', {
    messageId: message.messageId,
    practitionerId: message.practitionerId,
    appointmentId: message.booking.appointmentId,
    smsSuccess: result.sms?.success ?? 'not-requested',
    emailSuccess: result.email?.success ?? 'not-requested',
    duration: `${duration}ms`,
  });
}

// Register the queue trigger function
app.storageQueue('processBookingNotification', {
  queueName: 'booking-notifications',
  connection: 'AzureWebJobsStorage',
  handler: processBookingNotification,
});
