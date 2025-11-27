/**
 * Halaxy Sync Timer
 * 
 * Azure Function timer trigger for scheduled full sync.
 * Runs every 15 minutes as a safety net to catch any missed webhooks.
 * 
 * This is a BACKUP mechanism - primary sync happens via webhooks in real-time.
 */

import { app, Timer, InvocationContext } from '@azure/functions';
import { getHalaxySyncService } from '../services/halaxy/sync-service';
import { getDbConnection } from '../services/database';

/**
 * Get all active practitioners that need syncing
 */
async function getActivePractitioners(): Promise<Array<{ id: string; halaxy_practitioner_id: string }>> {
  try {
    const pool = await getDbConnection();
    
    const result = await pool.request()
      .query<{ id: string; halaxy_practitioner_id: string }>(`
        SELECT id, halaxy_practitioner_id 
        FROM practitioners 
        WHERE is_active = 1
      `);

    return result.recordset;
  } catch (error) {
    // Table might not exist yet
    console.log('[HalaxySyncTimer] Could not fetch practitioners:', error);
    return [];
  }
}

/**
 * Main timer handler - runs every 15 minutes
 */
async function halaxySyncTimerHandler(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  const startTime = Date.now();
  
  context.log('[HalaxySyncTimer] Starting scheduled sync');
  
  if (timer.isPastDue) {
    context.log('[HalaxySyncTimer] Timer is running late');
  }

  // Check if Halaxy credentials are configured
  if (!process.env.HALAXY_CLIENT_ID || !process.env.HALAXY_CLIENT_SECRET) {
    context.log('[HalaxySyncTimer] Halaxy credentials not configured, skipping sync');
    return;
  }

  try {
    const practitioners = await getActivePractitioners();
    
    if (practitioners.length === 0) {
      context.log('[HalaxySyncTimer] No active practitioners found');
      return;
    }

    context.log(`[HalaxySyncTimer] Syncing ${practitioners.length} practitioner(s)`);

    const syncService = getHalaxySyncService();
    const results: Array<{ practitionerId: string; success: boolean; error?: string }> = [];

    for (const practitioner of practitioners) {
      try {
        const result = await syncService.fullSync(practitioner.halaxy_practitioner_id);
        
        results.push({
          practitionerId: practitioner.id,
          success: result.success,
        });

        context.log(
          `[HalaxySyncTimer] Synced practitioner ${practitioner.id}: ` +
          `${result.recordsProcessed} records in ${result.duration}ms`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          practitionerId: practitioner.id,
          success: false,
          error: errorMessage,
        });

        context.error(
          `[HalaxySyncTimer] Failed to sync practitioner ${practitioner.id}:`,
          error
        );
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    context.log(
      `[HalaxySyncTimer] Completed: ${successCount}/${practitioners.length} successful in ${duration}ms`
    );

  } catch (error) {
    context.error('[HalaxySyncTimer] Sync timer failed:', error);
    throw error;
  }
}

// Register the Azure Function timer
// Runs every 15 minutes: second 0, every 15 minutes, every hour, every day
app.timer('halaxySyncTimer', {
  schedule: '0 */15 * * * *',
  handler: halaxySyncTimerHandler,
  runOnStartup: false, // Don't run immediately on function app start
});

export default halaxySyncTimerHandler;
