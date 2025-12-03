"use strict";
/**
 * Halaxy Sync Timer
 *
 * Azure Function timer trigger for scheduled full sync.
 * Runs every 15 minutes as a safety net to catch any missed webhooks.
 *
 * This is a BACKUP mechanism - primary sync happens via webhooks in real-time.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const sync_service_1 = require("../services/halaxy/sync-service");
const database_1 = require("../services/database");
/**
 * Get all active practitioners that need syncing
 */
async function getActivePractitioners() {
    try {
        const pool = await (0, database_1.getDbConnection)();
        const result = await pool.request()
            .query(`
        SELECT id, halaxy_practitioner_id 
        FROM practitioners 
        WHERE is_active = 1
      `);
        return result.recordset;
    }
    catch (error) {
        // Table might not exist yet
        console.log('[HalaxySyncTimer] Could not fetch practitioners:', error);
        return [];
    }
}
/**
 * Main timer handler - runs every 15 minutes
 */
async function halaxySyncTimerHandler(timer, context) {
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
        const syncService = (0, sync_service_1.getHalaxySyncService)();
        const results = [];
        for (const practitioner of practitioners) {
            try {
                const result = await syncService.fullSync(practitioner.halaxy_practitioner_id);
                results.push({
                    practitionerId: practitioner.id,
                    success: result.success,
                });
                context.log(`[HalaxySyncTimer] Synced practitioner ${practitioner.id}: ` +
                    `${result.recordsProcessed} records in ${result.duration}ms`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({
                    practitionerId: practitioner.id,
                    success: false,
                    error: errorMessage,
                });
                context.error(`[HalaxySyncTimer] Failed to sync practitioner ${practitioner.id}:`, error);
            }
        }
        const duration = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        context.log(`[HalaxySyncTimer] Completed: ${successCount}/${practitioners.length} successful in ${duration}ms`);
    }
    catch (error) {
        context.error('[HalaxySyncTimer] Sync timer failed:', error);
        throw error;
    }
}
// Register the Azure Function timer
// Runs every 15 minutes: second 0, every 15 minutes, every hour, every day
functions_1.app.timer('halaxySyncTimer', {
    schedule: '0 */15 * * * *',
    handler: halaxySyncTimerHandler,
    runOnStartup: false, // Don't run immediately on function app start
});
exports.default = halaxySyncTimerHandler;
//# sourceMappingURL=halaxy-sync-timer.js.map