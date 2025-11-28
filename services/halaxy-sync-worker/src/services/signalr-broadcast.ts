/**
 * SignalR Broadcast Service
 * 
 * Pushes real-time updates to connected clients when sync completes.
 * Enables instant dashboard updates without polling.
 * Implements graceful degradation if SignalR is unavailable.
 */

import * as signalR from '@microsoft/signalr';
import { config } from '../config';

// Event types that can be broadcast to clients
export const BroadcastEvents = {
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED: 'sync:failed',
  APPOINTMENTS_UPDATED: 'appointments:updated',
  PATIENTS_UPDATED: 'patients:updated',
  PRACTITIONERS_UPDATED: 'practitioners:updated',
  DASHBOARD_REFRESH: 'dashboard:refresh',
} as const;

export type BroadcastEventType = typeof BroadcastEvents[keyof typeof BroadcastEvents];

export interface SyncCompletedPayload {
  syncId: string;
  timestamp: string;
  appointmentsSynced: number;
  patientsSynced: number;
  practitionersSynced: number;
  durationMs: number;
}

export interface SyncFailedPayload {
  syncId: string;
  timestamp: string;
  error: string;
  willRetry: boolean;
}

export interface BroadcastService {
  broadcast(event: BroadcastEventType, payload: unknown): Promise<void>;
  broadcastToGroup(groupName: string, event: BroadcastEventType, payload: unknown): Promise<void>;
  isConnected(): boolean;
  connect(): Promise<void>;
  close(): Promise<void>;
}

class SignalRBroadcastService implements BroadcastService {
  private connection: signalR.HubConnection | null = null;
  private isReady = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  async connect(): Promise<void> {
    if (!config.signalRConnectionString) {
      console.warn('[SignalR] No connection string provided - real-time push disabled');
      return;
    }
    
    try {
      // Parse connection string to get endpoint and access key
      const { endpoint, accessKey } = this.parseConnectionString(config.signalRConnectionString);
      
      const hubUrl = `${endpoint}/client/?hub=${config.signalRHubName}`;
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => this.generateAccessToken(endpoint, accessKey),
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null; // Stop reconnecting
            }
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();
      
      this.connection.onreconnecting((error?: Error) => {
        console.warn('[SignalR] Reconnecting...', error?.message);
        this.isReady = false;
      });
      
      this.connection.onreconnected((connectionId?: string) => {
        console.log('[SignalR] Reconnected with ID:', connectionId);
        this.isReady = true;
        this.reconnectAttempts = 0;
      });
      
      this.connection.onclose((error?: Error) => {
        console.log('[SignalR] Connection closed', error?.message);
        this.isReady = false;
      });
      
      await this.connection.start();
      this.isReady = true;
      console.log('[SignalR] Connected to hub:', config.signalRHubName);
    } catch (error) {
      console.error('[SignalR] Failed to connect:', error);
      this.isReady = false;
    }
  }
  
  private parseConnectionString(connectionString: string): { endpoint: string; accessKey: string } {
    const parts = connectionString.split(';').reduce((acc, part) => {
      const [key, ...valueParts] = part.split('=');
      acc[key.toLowerCase()] = valueParts.join('=');
      return acc;
    }, {} as Record<string, string>);
    
    return {
      endpoint: parts.endpoint || '',
      accessKey: parts.accesskey || '',
    };
  }
  
  private generateAccessToken(endpoint: string, accessKey: string): string {
    // For server-side broadcasting, we need to generate a JWT token
    // In production, this should use Azure.Messaging.SignalR SDK
    // For now, return empty string - the connection will use managed identity if available
    
    // Note: In production, use @azure/web-pubsub or SignalR REST API
    // This is a simplified implementation for the worker
    console.log('[SignalR] Using endpoint:', endpoint);
    return accessKey; // Simplified - would need proper JWT in production
  }
  
  async broadcast(event: BroadcastEventType, payload: unknown): Promise<void> {
    if (!this.isReady || !this.connection) {
      console.warn(`[SignalR] Not connected - cannot broadcast ${event}`);
      return;
    }
    
    try {
      await this.connection.invoke('Broadcast', event, JSON.stringify(payload));
      console.log(`[SignalR] Broadcast ${event} to all clients`);
    } catch (error) {
      console.error(`[SignalR] Failed to broadcast ${event}:`, error);
    }
  }
  
  async broadcastToGroup(groupName: string, event: BroadcastEventType, payload: unknown): Promise<void> {
    if (!this.isReady || !this.connection) {
      console.warn(`[SignalR] Not connected - cannot broadcast ${event} to group ${groupName}`);
      return;
    }
    
    try {
      await this.connection.invoke('BroadcastToGroup', groupName, event, JSON.stringify(payload));
      console.log(`[SignalR] Broadcast ${event} to group ${groupName}`);
    } catch (error) {
      console.error(`[SignalR] Failed to broadcast ${event} to group ${groupName}:`, error);
    }
  }
  
  isConnected(): boolean {
    return this.isReady;
  }
  
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.isReady = false;
      console.log('[SignalR] Connection closed');
    }
  }
}

/**
 * Null broadcast implementation for when SignalR is unavailable
 * All operations are no-ops, enabling graceful degradation
 */
class NullBroadcastService implements BroadcastService {
  async broadcast(event: BroadcastEventType): Promise<void> {
    console.log(`[SignalR] Null broadcast: ${event} (SignalR disabled)`);
  }
  
  async broadcastToGroup(groupName: string, event: BroadcastEventType): Promise<void> {
    console.log(`[SignalR] Null broadcast: ${event} to ${groupName} (SignalR disabled)`);
  }
  
  isConnected(): boolean {
    return false;
  }
  
  async connect(): Promise<void> {
    // No-op
  }
  
  async close(): Promise<void> {
    // No-op
  }
}

// Singleton instance
let broadcastInstance: BroadcastService | null = null;

/**
 * Get or create the broadcast service instance
 * Returns a NullBroadcastService if SignalR is not configured
 */
export async function getBroadcastService(): Promise<BroadcastService> {
  if (broadcastInstance) {
    return broadcastInstance;
  }
  
  if (!config.signalRConnectionString) {
    console.log('[SignalR] No connection string - using null broadcast');
    broadcastInstance = new NullBroadcastService();
    return broadcastInstance;
  }
  
  const service = new SignalRBroadcastService();
  await service.connect();
  broadcastInstance = service;
  return broadcastInstance;
}

/**
 * Close the broadcast service connection
 */
export async function closeBroadcastService(): Promise<void> {
  if (broadcastInstance) {
    await broadcastInstance.close();
    broadcastInstance = null;
  }
}

export default { getBroadcastService, closeBroadcastService, BroadcastEvents };
