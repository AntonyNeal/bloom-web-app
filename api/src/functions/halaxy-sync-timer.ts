/**
 * Halaxy Sync Timer
 * 
 * Azure Function timer trigger for scheduled full sync.
 * Runs every 15 minutes as a safety net to catch any missed webhooks.
 * 
 * Fetches practitioners directly from Halaxy API - no seeding required.
 */

import { app, Timer, InvocationContext } from '@azure/functions';
import { getHalaxySyncService } from '../services/halaxy/sync-service';
import { getHalaxyClient } from '../services/halaxy/client';

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
    // Fetch practitioners directly from Halaxy API - no seeding required
    const halaxyClient = getHalaxyClient();
    context.log('[HalaxySyncTimer] Fetching practitioners from Halaxy API...');
    
    const practitioners = await halaxyClient.getAllPractitioners();
    
    if (practitioners.length === 0) {
      context.log('[HalaxySyncTimer] No practitioners found in Halaxy');
      return;
    }

    context.log(`[HalaxySyncTimer] Found ${practitioners.length} practitioner(s) in Halaxy`);

    const syncService = getHalaxySyncService();
    const results: Array<{ practitionerId: string; name: string; success: boolean; error?: string }> = [];

    for (const practitioner of practitioners) {
      try {
        const name = practitioner.name?.[0]?.text || 
                     `${practitioner.name?.[0]?.given?.join(' ') || ''} ${practitioner.name?.[0]?.family || ''}`.trim() ||
                     practitioner.id;

        const result = await syncService.fullSync(practitioner.id);
        
        results.push({
          practitionerId: practitioner.id,
          name,
          success: result.success,
        });

        context.log(
          `[HalaxySyncTimer] Synced ${name}: ${result.recordsProcessed} records in ${result.duration}ms`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const name = practitioner.name?.[0]?.text || practitioner.id;
        
        results.push({
          practitionerId: practitioner.id,
          name,
          success: false,
          error: errorMessage,
        });

        context.error(`[HalaxySyncTimer] Failed to sync ${name}:`, error);
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
