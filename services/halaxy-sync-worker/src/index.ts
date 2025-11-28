/**
 * Halaxy Sync Worker - Main Entry Point
 * 
 * Azure Container Apps worker for real-time database synchronization
 * between Halaxy Practice Management System and Bloom platform.
 * 
 * Features:
 * - Scheduled full sync every 15 minutes
 * - Real-time updates via SignalR
 * - Redis cache invalidation for instant UI updates
 * - Service Bus queue processing for ordered sync
 * - No timeout limitations (unlike Azure Functions)
 * - Graceful shutdown handling
 * - Health check endpoint
 * - Application Insights telemetry
 */

import * as cron from 'node-cron';
import * as http from 'http';
import { HalaxySyncService } from './services/sync-service';
import { DatabaseService } from './services/database';
import { setupTelemetry, trackEvent, trackMetric, trackException, flush } from './telemetry';
import { config, validateConfig } from './config';
import { getCacheService, closeCacheService, CacheKeys, CacheService } from './services/redis-cache';
import { getBroadcastService, closeBroadcastService, BroadcastEvents, BroadcastService, SyncCompletedPayload, SyncFailedPayload } from './services/signalr-broadcast';
import { getServiceBusConsumer, closeServiceBusConsumer, ServiceBusConsumer, SyncMessage } from './services/service-bus-consumer';

// ============================================================================
// Global State
// ============================================================================

let isShuttingDown = false;
let isSyncing = false;
let lastSyncTime: Date | null = null;
let lastSyncStatus: 'success' | 'failure' | 'never' = 'never';
let syncCount = 0;
let errorCount = 0;

// Services (initialized in main)
let cacheService: CacheService | null = null;
let broadcastService: BroadcastService | null = null;
let serviceBusConsumer: ServiceBusConsumer | null = null;

// ============================================================================
// Health Check Server
// ============================================================================

function startHealthServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/healthz') {
      const health = {
        status: isShuttingDown ? 'shutting_down' : 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        lastSync: lastSyncTime?.toISOString() || null,
        lastSyncStatus,
        syncCount,
        errorCount,
        isSyncing,
        environment: config.environment,
        services: {
          redis: cacheService?.isConnected() || false,
          signalR: broadcastService?.isConnected() || false,
          serviceBus: serviceBusConsumer?.isConnected() || false,
        },
      };

      res.writeHead(isShuttingDown ? 503 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
    } else if (req.url === '/ready') {
      // Readiness probe - are we ready to accept work?
      const isReady = !isShuttingDown && !isSyncing;
      res.writeHead(isReady ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: isReady }));
    } else if (req.url === '/metrics') {
      // Prometheus-style metrics
      const metrics = [
        `# HELP halaxy_sync_total Total number of sync operations`,
        `# TYPE halaxy_sync_total counter`,
        `halaxy_sync_total ${syncCount}`,
        ``,
        `# HELP halaxy_sync_errors_total Total number of sync errors`,
        `# TYPE halaxy_sync_errors_total counter`,
        `halaxy_sync_errors_total ${errorCount}`,
        ``,
        `# HELP halaxy_sync_in_progress Whether a sync is currently in progress`,
        `# TYPE halaxy_sync_in_progress gauge`,
        `halaxy_sync_in_progress ${isSyncing ? 1 : 0}`,
        ``,
        `# HELP halaxy_worker_uptime_seconds Worker uptime in seconds`,
        `# TYPE halaxy_worker_uptime_seconds gauge`,
        `halaxy_worker_uptime_seconds ${process.uptime()}`,
      ].join('\n');

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(metrics);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(config.healthPort, () => {
    console.log(`[Worker] Health server listening on port ${config.healthPort}`);
  });

  return server;
}

// ============================================================================
// Sync Logic
// ============================================================================

async function runFullSync(): Promise<void> {
  if (isShuttingDown) {
    console.log('[Worker] Skipping sync - shutting down');
    return;
  }

  if (isSyncing) {
    console.log('[Worker] Skipping sync - already in progress');
    return;
  }

  isSyncing = true;
  const startTime = Date.now();
  const syncId = crypto.randomUUID();

  console.log('[Worker] ═══════════════════════════════════════════════════════════');
  console.log('[Worker] Starting scheduled full sync');
  console.log(`[Worker] Sync ID: ${syncId}`);
  console.log(`[Worker] Time: ${new Date().toISOString()}`);
  console.log('[Worker] ═══════════════════════════════════════════════════════════');

  // Broadcast sync started
  if (broadcastService) {
    await broadcastService.broadcast(BroadcastEvents.SYNC_STARTED, {
      syncId,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const db = DatabaseService.getInstance();
    const syncService = new HalaxySyncService();

    // Get all active practitioners
    const practitioners = await db.getActivePractitioners();
    console.log(`[Worker] Found ${practitioners.length} active practitioners to sync`);

    let totalRecords = 0;
    let totalErrors = 0;
    let appointmentsSynced = 0;
    let patientsSynced = 0;
    let practitionersSynced = practitioners.length;

    for (const practitioner of practitioners) {
      if (isShuttingDown) {
        console.log('[Worker] Shutdown requested - stopping sync');
        break;
      }

      try {
        console.log(`[Worker] Syncing practitioner: ${practitioner.id} (Halaxy: ${practitioner.halaxyPractitionerId})`);
        
        const result = await syncService.fullSync(practitioner.halaxyPractitionerId);
        
        totalRecords += result.recordsUpdated + result.recordsCreated;
        totalErrors += result.errors.length;
        appointmentsSynced += result.appointmentsSynced || 0;
        patientsSynced += result.patientsSynced || 0;

        console.log(`[Worker]   ✓ Synced: ${result.recordsUpdated} updated, ${result.recordsCreated} created`);
        
        if (result.errors.length > 0) {
          console.log(`[Worker]   ⚠ ${result.errors.length} errors occurred`);
        }

        trackMetric('halaxy_practitioner_sync_duration_ms', result.durationMs, {
          practitionerId: practitioner.id,
        });

      } catch (error) {
        totalErrors++;
        console.error(`[Worker]   ✗ Error syncing practitioner ${practitioner.id}:`, error);
        trackException(error as Error, { practitionerId: practitioner.id });
      }
    }

    const duration = Date.now() - startTime;
    lastSyncTime = new Date();
    lastSyncStatus = totalErrors === 0 ? 'success' : 'failure';
    syncCount++;

    if (totalErrors > 0) {
      errorCount++;
    }

    // Invalidate Redis cache - force clients to fetch fresh data
    if (cacheService && cacheService.isConnected()) {
      console.log('[Worker] Invalidating Redis cache...');
      await Promise.all([
        cacheService.invalidatePattern(`${CacheKeys.DASHBOARD_METRICS}*`),
        cacheService.invalidatePattern(`${CacheKeys.APPOINTMENTS}*`),
        cacheService.invalidatePattern(`${CacheKeys.PATIENTS}*`),
        cacheService.invalidatePattern(`${CacheKeys.PRACTITIONERS}*`),
      ]);
      // Update sync state in cache
      await cacheService.set(CacheKeys.SYNC_LAST_RUN, {
        syncId,
        timestamp: new Date().toISOString(),
        duration,
        recordsProcessed: totalRecords,
        status: lastSyncStatus,
      });
      console.log('[Worker] ✓ Cache invalidated');
    }

    // Broadcast sync completed - clients will refresh their data
    if (broadcastService) {
      const payload: SyncCompletedPayload = {
        syncId,
        timestamp: new Date().toISOString(),
        appointmentsSynced,
        patientsSynced,
        practitionersSynced,
        durationMs: duration,
      };
      await broadcastService.broadcast(BroadcastEvents.SYNC_COMPLETED, payload);
      await broadcastService.broadcast(BroadcastEvents.DASHBOARD_REFRESH, { syncId });
      console.log('[Worker] ✓ Real-time update broadcast');
    }

    console.log('[Worker] ───────────────────────────────────────────────────────────');
    console.log(`[Worker] Sync completed in ${duration}ms`);
    console.log(`[Worker] Total records processed: ${totalRecords}`);
    console.log(`[Worker] Total errors: ${totalErrors}`);
    console.log('[Worker] ═══════════════════════════════════════════════════════════');

    trackEvent('halaxy_full_sync_completed', {
      duration,
      totalRecords,
      totalErrors,
      practitionerCount: practitioners.length,
    });

    trackMetric('halaxy_sync_duration_ms', duration);
    trackMetric('halaxy_sync_records_processed', totalRecords);

  } catch (error) {
    errorCount++;
    lastSyncStatus = 'failure';
    console.error('[Worker] ✗ Full sync failed:', error);
    trackException(error as Error, { operation: 'full_sync' });
    
    // Broadcast sync failure
    if (broadcastService) {
      const payload: SyncFailedPayload = {
        syncId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        willRetry: true,
      };
      await broadcastService.broadcast(BroadcastEvents.SYNC_FAILED, payload);
    }
  } finally {
    isSyncing = false;
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

function setupGracefulShutdown(healthServer: http.Server, cronJob: cron.ScheduledTask): void {
  const shutdown = async (signal: string) => {
    console.log(`[Worker] Received ${signal} - starting graceful shutdown`);
    isShuttingDown = true;

    // Stop accepting new work
    cronJob.stop();
    console.log('[Worker] Cron job stopped');

    // Stop Service Bus consumer
    if (serviceBusConsumer) {
      await closeServiceBusConsumer();
      console.log('[Worker] Service Bus consumer stopped');
    }

    // Wait for current sync to complete (with timeout)
    const maxWaitTime = 60000; // 60 seconds
    const startWait = Date.now();

    while (isSyncing && Date.now() - startWait < maxWaitTime) {
      console.log('[Worker] Waiting for current sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (isSyncing) {
      console.log('[Worker] Sync did not complete in time - forcing shutdown');
    }

    // Flush telemetry
    await flush();

    // Close SignalR connection
    if (broadcastService) {
      await closeBroadcastService();
      console.log('[Worker] SignalR connection closed');
    }

    // Close Redis connection
    if (cacheService) {
      await closeCacheService();
      console.log('[Worker] Redis connection closed');
    }

    // Close health server
    healthServer.close(() => {
      console.log('[Worker] Health server closed');
    });

    // Close database connections
    await DatabaseService.getInstance().close();
    console.log('[Worker] Database connections closed');

    console.log('[Worker] Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  console.log('[Worker] ╔═══════════════════════════════════════════════════════════╗');
  console.log('[Worker] ║     HALAXY SYNC WORKER - Azure Container Apps            ║');
  console.log('[Worker] ╚═══════════════════════════════════════════════════════════╝');
  console.log(`[Worker] Environment: ${config.environment}`);
  console.log(`[Worker] Version: ${process.env.npm_package_version || '1.0.0'}`);
  console.log(`[Worker] Node: ${process.version}`);
  console.log(`[Worker] Sync Schedule: ${config.syncSchedule}`);

  // Validate configuration
  try {
    validateConfig();
    console.log('[Worker] ✓ Configuration validated');
  } catch (error) {
    console.error('[Worker] ✗ Configuration error:', error);
    process.exit(1);
  }

  // Setup Application Insights
  setupTelemetry();
  console.log('[Worker] ✓ Telemetry initialized');

  // Test database connection
  try {
    await DatabaseService.getInstance().testConnection();
    console.log('[Worker] ✓ Database connection established');
  } catch (error) {
    console.error('[Worker] ✗ Database connection failed:', error);
    process.exit(1);
  }

  // Initialize Redis cache service (graceful degradation if unavailable)
  try {
    cacheService = await getCacheService();
    if (cacheService.isConnected()) {
      console.log('[Worker] ✓ Redis cache connected');
    } else {
      console.log('[Worker] ⚠ Redis cache not available - caching disabled');
    }
  } catch (error) {
    console.warn('[Worker] ⚠ Redis cache initialization failed:', error);
  }

  // Initialize SignalR broadcast service (graceful degradation if unavailable)
  try {
    broadcastService = await getBroadcastService();
    if (broadcastService.isConnected()) {
      console.log('[Worker] ✓ SignalR broadcast connected');
    } else {
      console.log('[Worker] ⚠ SignalR not available - real-time push disabled');
    }
  } catch (error) {
    console.warn('[Worker] ⚠ SignalR initialization failed:', error);
  }

  // Initialize Service Bus consumer (graceful degradation if unavailable)
  try {
    serviceBusConsumer = await getServiceBusConsumer();
    if (serviceBusConsumer.isConnected()) {
      console.log('[Worker] ✓ Service Bus consumer connected');
    } else {
      // Start processing queue messages
      await serviceBusConsumer.startProcessing(async (message: SyncMessage) => {
        console.log(`[Worker] Received queue message: ${message.type} (${message.correlationId})`);
        
        if (message.type === 'full-sync') {
          await runFullSync();
        } else if (message.type === 'webhook' && message.payload) {
          // Handle webhook-triggered incremental sync
          console.log(`[Worker] Webhook: ${message.payload.action} ${message.payload.entityType} ${message.payload.entityId}`);
          // TODO: Implement incremental sync for specific entities
          await runFullSync(); // For now, run full sync
        }
      });
      console.log('[Worker] ⚠ Service Bus not available - queue processing disabled');
    }
  } catch (error) {
    console.warn('[Worker] ⚠ Service Bus initialization failed:', error);
  }

  // Start health check server
  const healthServer = startHealthServer();
  console.log('[Worker] ✓ Health server started');

  // Schedule sync job (default: every 15 minutes)
  const cronJob = cron.schedule(config.syncSchedule, async () => {
    await runFullSync();
  }, {
    scheduled: true,
    timezone: config.timezone,
  });

  console.log('[Worker] ✓ Sync job scheduled');

  // Setup graceful shutdown
  setupGracefulShutdown(healthServer, cronJob);

  // Run initial sync on startup (after 10 second delay to allow system to stabilize)
  if (config.runOnStartup) {
    console.log('[Worker] Running initial sync in 10 seconds...');
    setTimeout(async () => {
      await runFullSync();
    }, 10000);
  }

  console.log('[Worker] ─────────────────────────────────────────────────────────────');
  console.log('[Worker] Worker started successfully. Waiting for scheduled syncs...');
  console.log('[Worker] ─────────────────────────────────────────────────────────────');

  trackEvent('halaxy_worker_started', {
    environment: config.environment,
    schedule: config.syncSchedule,
    redisConnected: cacheService?.isConnected() || false,
    signalRConnected: broadcastService?.isConnected() || false,
    serviceBusConnected: serviceBusConsumer?.isConnected() || false,
  });
}

// Run!
main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
