/**
 * Notification Queue Service
 * 
 * Handles queuing notifications to Azure Storage Queue.
 * Messages are processed asynchronously by the queue trigger function.
 */
import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
import { BookingNotificationMessage, NotificationChannel } from './types';

// Singleton queue client
let queueClient: QueueClient | null = null;

const QUEUE_NAME = 'booking-notifications';

/**
 * Get or create the queue client
 */
async function getQueueClient(): Promise<QueueClient | null> {
  if (queueClient) {
    return queueClient;
  }

  const connectionString = process.env.AzureWebJobsStorage;
  if (!connectionString) {
    console.error('[NotificationQueue] AzureWebJobsStorage connection string not configured');
    return null;
  }

  try {
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    queueClient = queueServiceClient.getQueueClient(QUEUE_NAME);
    
    // Create queue if it doesn't exist
    await queueClient.createIfNotExists();
    
    console.log(`[NotificationQueue] Queue client initialized for: ${QUEUE_NAME}`);
    return queueClient;
  } catch (error) {
    console.error('[NotificationQueue] Failed to initialize queue client:', error);
    return null;
  }
}

/**
 * Queue a booking notification for async processing
 * 
 * @param practitionerId - Halaxy practitioner ID (Profile ID or PR-XXXXX)
 * @param booking - Booking details for the notification content
 * @param channels - Channels to notify on (defaults to both SMS and email)
 * @returns Message ID if queued successfully, null otherwise
 */
export async function queueBookingNotification(
  practitionerId: string,
  booking: {
    appointmentId: string;
    patientFirstName: string;
    patientLastName: string;
    patientEmail: string;
    patientPhone?: string;
    appointmentDateTime: Date;
    appointmentType?: string;
  },
  channels: NotificationChannel[] = ['sms', 'email']
): Promise<string | null> {
  const client = await getQueueClient();
  
  if (!client) {
    console.error('[NotificationQueue] Queue not available - notification will not be sent');
    return null;
  }

  const messageId = crypto.randomUUID();
  
  const message: BookingNotificationMessage = {
    messageId,
    type: 'clinician_booking_alert',
    practitionerId,
    booking: {
      appointmentId: booking.appointmentId,
      patientFirstName: booking.patientFirstName,
      patientLastName: booking.patientLastName,
      patientEmail: booking.patientEmail,
      patientPhone: booking.patientPhone,
      appointmentDateTime: booking.appointmentDateTime.toISOString(),
      appointmentType: booking.appointmentType,
    },
    channels,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    // Encode message as base64 (required by Azure Storage Queue)
    const messageText = JSON.stringify(message);
    const base64Message = Buffer.from(messageText).toString('base64');
    
    const result = await client.sendMessage(base64Message);
    
    console.log(`[NotificationQueue] Message queued successfully`, {
      messageId,
      queueMessageId: result.messageId,
      practitionerId,
      appointmentId: booking.appointmentId,
      channels,
    });
    
    return messageId;
  } catch (error) {
    console.error('[NotificationQueue] Failed to queue message:', error);
    return null;
  }
}

/**
 * Parse a queue message back to BookingNotificationMessage
 * Azure Functions runtime may pass the message as:
 * - Already parsed object (when message is valid JSON)
 * - Base64 encoded string
 * - Plain JSON string
 */
export function parseQueueMessage(queueItem: unknown): BookingNotificationMessage | null {
  try {
    // If already an object (Azure Functions auto-parsed it), return directly
    if (typeof queueItem === 'object' && queueItem !== null) {
      return queueItem as BookingNotificationMessage;
    }
    
    // If it's a string, try to decode/parse
    if (typeof queueItem === 'string') {
      // Try to decode from base64 first
      let decodedText: string;
      try {
        decodedText = Buffer.from(queueItem, 'base64').toString('utf-8');
        // Check if it looks like valid JSON after decode
        if (!decodedText.startsWith('{')) {
          decodedText = queueItem;
        }
      } catch {
        // If base64 decode fails, assume it's plain JSON
        decodedText = queueItem;
      }
      
      return JSON.parse(decodedText) as BookingNotificationMessage;
    }
    
    console.error('[NotificationQueue] Unknown queue item type:', typeof queueItem);
    return null;
  } catch (error) {
    console.error('[NotificationQueue] Failed to parse queue message:', error);
    return null;
  }
}
