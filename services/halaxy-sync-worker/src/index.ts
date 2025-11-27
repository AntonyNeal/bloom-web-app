/**
 * Halaxy Sync Worker - Main Entry Point
 * 
 * Azure Container Apps worker for real-time database synchronization
 * between Halaxy Practice Management System and Bloom platform.
 * 
 * Features:
 * - Scheduled full sync every 15 minutes
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

// ============================================================================
// Global State
// ============================================================================

let isShuttingDown = false;
let isSyncing = false;
let lastSyncTime: Date | null = null;
let lastSyncStatus: 'success' | 'failure' | 'never' = 'never';
let syncCount = 0;
let errorCount = 0;

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

  console.log('[Worker] ═══════════════════════════════════════════════════════════');
  console.log('[Worker] Starting scheduled full sync');
  console.log(`[Worker] Time: ${new Date().toISOString()}`);
  console.log('[Worker] ═══════════════════════════════════════════════════════════');

  try {
    const db = DatabaseService.getInstance();
    const syncService = new HalaxySyncService();

    // Get all active practitioners
    const practitioners = await db.getActivePractitioners();
    console.log(`[Worker] Found ${practitioners.length} active practitioners to sync`);

    let totalRecords = 0;
    let totalErrors = 0;

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
  });
}

// Run!
main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
