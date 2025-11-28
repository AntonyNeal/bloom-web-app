/**
 * Service Bus Consumer Service
 * 
 * Consumes sync messages from Azure Service Bus queues for ordered,
 * reliable processing. Handles both scheduled syncs and real-time
 * webhook-triggered syncs.
 * 
 * Queue Structure:
 * - halaxy-sync: Background sync tasks (scheduled every 15 min)
 * - halaxy-realtime: Real-time webhook notifications from Halaxy
 */

import { ServiceBusClient, ServiceBusReceiver, ServiceBusReceivedMessage, ProcessErrorArgs } from '@azure/service-bus';
import { config } from '../config';

export interface SyncMessage {
  type: 'full-sync' | 'incremental' | 'webhook';
  timestamp: string;
  correlationId: string;
  payload?: {
    entityType?: 'appointment' | 'patient' | 'practitioner';
    entityId?: string;
    action?: 'created' | 'updated' | 'deleted';
  };
}

export interface ServiceBusConsumer {
  startProcessing(handler: (message: SyncMessage) => Promise<void>): Promise<void>;
  stopProcessing(): Promise<void>;
  isConnected(): boolean;
  close(): Promise<void>;
}

class AzureServiceBusConsumer implements ServiceBusConsumer {
  private client: ServiceBusClient | null = null;
  private syncReceiver: ServiceBusReceiver | null = null;
  private realtimeReceiver: ServiceBusReceiver | null = null;
  private isProcessing = false;
  private messageHandler: ((message: SyncMessage) => Promise<void>) | null = null;
  
  async connect(): Promise<void> {
    if (!config.serviceBusConnectionString) {
      console.warn('[ServiceBus] No connection string provided - queue processing disabled');
      return;
    }
    
    try {
      this.client = new ServiceBusClient(config.serviceBusConnectionString);
      console.log('[ServiceBus] Connected to Service Bus');
    } catch (error) {
      console.error('[ServiceBus] Failed to connect:', error);
      this.client = null;
    }
  }
  
  async startProcessing(handler: (message: SyncMessage) => Promise<void>): Promise<void> {
    if (!this.client) {
      console.warn('[ServiceBus] Not connected - cannot start processing');
      return;
    }
    
    this.messageHandler = handler;
    
    try {
      // Create receivers for both queues
      this.syncReceiver = this.client.createReceiver(config.serviceBusSyncQueueName, {
        receiveMode: 'peekLock',
      });
      
      this.realtimeReceiver = this.client.createReceiver(config.serviceBusRealtimeQueueName, {
        receiveMode: 'peekLock',
      });
      
      // Subscribe to sync queue
      this.syncReceiver.subscribe({
        processMessage: async (message: ServiceBusReceivedMessage) => {
          await this.processMessage(message, 'sync');
        },
        processError: async (args: ProcessErrorArgs) => {
          this.handleError(args, 'sync');
        },
      });
      
      // Subscribe to realtime queue with higher priority
      this.realtimeReceiver.subscribe({
        processMessage: async (message: ServiceBusReceivedMessage) => {
          await this.processMessage(message, 'realtime');
        },
        processError: async (args: ProcessErrorArgs) => {
          this.handleError(args, 'realtime');
        },
      });
      
      this.isProcessing = true;
      console.log('[ServiceBus] Started processing queues:', 
        config.serviceBusSyncQueueName, config.serviceBusRealtimeQueueName);
    } catch (error) {
      console.error('[ServiceBus] Failed to start processing:', error);
      this.isProcessing = false;
    }
  }
  
  private async processMessage(message: ServiceBusReceivedMessage, queueType: 'sync' | 'realtime'): Promise<void> {
    const startTime = Date.now();
    const correlationId = message.correlationId || message.messageId || 'unknown';
    
    console.log(`[ServiceBus] Processing ${queueType} message ${correlationId}`);
    
    try {
      // Parse the message body
      const body = message.body as SyncMessage;
      
      if (!this.isValidSyncMessage(body)) {
        console.error(`[ServiceBus] Invalid message format:`, body);
        // Dead-letter invalid messages for inspection
        if (queueType === 'sync' && this.syncReceiver) {
          await this.syncReceiver.deadLetterMessage(message, {
            deadLetterReason: 'InvalidMessageFormat',
            deadLetterErrorDescription: 'Message does not match expected SyncMessage schema',
          });
        } else if (queueType === 'realtime' && this.realtimeReceiver) {
          await this.realtimeReceiver.deadLetterMessage(message, {
            deadLetterReason: 'InvalidMessageFormat',
            deadLetterErrorDescription: 'Message does not match expected SyncMessage schema',
          });
        }
        return;
      }
      
      // Process the message
      if (this.messageHandler) {
        await this.messageHandler(body);
      }
      
      // Complete the message on success
      if (queueType === 'sync' && this.syncReceiver) {
        await this.syncReceiver.completeMessage(message);
      } else if (queueType === 'realtime' && this.realtimeReceiver) {
        await this.realtimeReceiver.completeMessage(message);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[ServiceBus] Completed ${queueType} message ${correlationId} in ${duration}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ServiceBus] Error processing message ${correlationId}:`, errorMessage);
      
      // Check if we should dead-letter based on delivery count
      const deliveryCount = message.deliveryCount || 0;
      const maxDeliveries = 5;
      
      if (deliveryCount >= maxDeliveries) {
        console.error(`[ServiceBus] Max deliveries reached for ${correlationId}, dead-lettering`);
        if (queueType === 'sync' && this.syncReceiver) {
          await this.syncReceiver.deadLetterMessage(message, {
            deadLetterReason: 'MaxDeliveriesExceeded',
            deadLetterErrorDescription: errorMessage,
          });
        } else if (queueType === 'realtime' && this.realtimeReceiver) {
          await this.realtimeReceiver.deadLetterMessage(message, {
            deadLetterReason: 'MaxDeliveriesExceeded',
            deadLetterErrorDescription: errorMessage,
          });
        }
      } else {
        // Abandon to retry later
        if (queueType === 'sync' && this.syncReceiver) {
          await this.syncReceiver.abandonMessage(message);
        } else if (queueType === 'realtime' && this.realtimeReceiver) {
          await this.realtimeReceiver.abandonMessage(message);
        }
      }
    }
  }
  
  private isValidSyncMessage(body: unknown): body is SyncMessage {
    if (!body || typeof body !== 'object') return false;
    
    const msg = body as Record<string, unknown>;
    
    return (
      typeof msg.type === 'string' &&
      ['full-sync', 'incremental', 'webhook'].includes(msg.type) &&
      typeof msg.timestamp === 'string' &&
      typeof msg.correlationId === 'string'
    );
  }
  
  private handleError(args: ProcessErrorArgs, queueType: string): void {
    console.error(`[ServiceBus] Error in ${queueType} queue:`, {
      errorSource: args.errorSource,
      entityPath: args.entityPath,
      fullyQualifiedNamespace: args.fullyQualifiedNamespace,
      error: args.error.message,
    });
  }
  
  async stopProcessing(): Promise<void> {
    try {
      if (this.syncReceiver) {
        await this.syncReceiver.close();
        this.syncReceiver = null;
      }
      
      if (this.realtimeReceiver) {
        await this.realtimeReceiver.close();
        this.realtimeReceiver = null;
      }
      
      this.isProcessing = false;
      this.messageHandler = null;
      console.log('[ServiceBus] Stopped processing queues');
    } catch (error) {
      console.error('[ServiceBus] Error stopping processing:', error);
    }
  }
  
  isConnected(): boolean {
    return this.isProcessing;
  }
  
  async close(): Promise<void> {
    await this.stopProcessing();
    
    if (this.client) {
      await this.client.close();
      this.client = null;
      console.log('[ServiceBus] Connection closed');
    }
  }
}

/**
 * Null consumer implementation for when Service Bus is unavailable
 * All operations are no-ops, enabling graceful degradation
 */
class NullServiceBusConsumer implements ServiceBusConsumer {
  async startProcessing(): Promise<void> {
    console.log('[ServiceBus] Null consumer - queue processing disabled');
  }
  
  async stopProcessing(): Promise<void> {
    // No-op
  }
  
  isConnected(): boolean {
    return false;
  }
  
  async close(): Promise<void> {
    // No-op
  }
}

// Singleton instance
let consumerInstance: ServiceBusConsumer | null = null;
let azureConsumer: AzureServiceBusConsumer | null = null;

/**
 * Get or create the Service Bus consumer instance
 * Returns a NullServiceBusConsumer if Service Bus is not configured
 */
export async function getServiceBusConsumer(): Promise<ServiceBusConsumer> {
  if (consumerInstance) {
    return consumerInstance;
  }
  
  if (!config.serviceBusConnectionString) {
    console.log('[ServiceBus] No connection string - using null consumer');
    consumerInstance = new NullServiceBusConsumer();
    return consumerInstance;
  }
  
  azureConsumer = new AzureServiceBusConsumer();
  await azureConsumer.connect();
  consumerInstance = azureConsumer;
  return consumerInstance;
}

/**
 * Close the Service Bus consumer connection
 */
export async function closeServiceBusConsumer(): Promise<void> {
  if (consumerInstance) {
    await consumerInstance.close();
    consumerInstance = null;
    azureConsumer = null;
  }
}

/**
 * Send a message to the sync queue (utility for testing/manual triggers)
 */
export async function sendSyncMessage(message: SyncMessage): Promise<void> {
  if (!config.serviceBusConnectionString) {
    console.warn('[ServiceBus] Cannot send message - not configured');
    return;
  }
  
  const client = new ServiceBusClient(config.serviceBusConnectionString);
  const sender = client.createSender(config.serviceBusSyncQueueName);
  
  try {
    await sender.sendMessages({
      body: message,
      correlationId: message.correlationId,
      contentType: 'application/json',
    });
    console.log('[ServiceBus] Sent sync message:', message.correlationId);
  } finally {
    await sender.close();
    await client.close();
  }
}

export default { getServiceBusConsumer, closeServiceBusConsumer, sendSyncMessage };
