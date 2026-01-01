/**
 * Notification Service Types
 * 
 * Type definitions for the queue-based notification system.
 * 
 * Architecture:
 * 1. Booking creates appointment in Halaxy
 * 2. Queues notification messages (fire-and-forget)
 * 3. Returns success immediately
 * 4. Queue trigger processes: sends SMS/email notifications
 */

export type NotificationChannel = 'sms' | 'email';
export type NotificationStatus = 'queued' | 'processing' | 'sent' | 'failed';
export type NotificationType = 'clinician_booking_alert' | 'patient_booking_confirmation';

/**
 * Queue message for booking notifications
 * This is what gets sent to Azure Storage Queue
 */
export interface BookingNotificationMessage {
  /** Unique message ID for tracking */
  messageId: string;
  /** Type of notification */
  type: NotificationType;
  /** Practitioner ID to notify (Halaxy Profile ID or PR-XXXXX) - for clinician alerts */
  practitionerId?: string;
  /** Practitioner name for patient emails */
  practitionerName?: string;
  /** Booking details for notification content */
  booking: {
    appointmentId: string;
    patientFirstName: string;
    patientLastName: string;
    patientEmail: string;
    patientPhone?: string;
    appointmentDateTime: string; // ISO string
    appointmentType?: string;
  };
  /** Channels to send to (both will be attempted) */
  channels: NotificationChannel[];
  /** Timestamp when queued */
  queuedAt: string; // ISO string
  /** Number of retry attempts */
  retryCount?: number;
}

/**
 * Result from processing a notification
 */
export interface NotificationProcessResult {
  messageId: string;
  practitionerId: string;
  sms?: ChannelResult;
  email?: ChannelResult;
  processedAt: string;
}

export interface ChannelResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * Contact info fetched from Halaxy
 */
export interface PractitionerContact {
  practitionerId: string;
  firstName: string;
  email?: string;
  phone?: string;
}
