"use strict";
/**
 * Halaxy Sync Timer
 *
 * Azure Function timer trigger for scheduled full sync.
 * Runs every 15 minutes as a safety net to catch any missed webhooks.
 *
 * Fetches practitioners directly from Halaxy API - no seeding required.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const sync_service_1 = require("../services/halaxy/sync-service");
const client_1 = require("../services/halaxy/client");
/**
 * Main timer handler - runs every 15 minutes
 */
async function halaxySyncTimerHandler(timer, context) {
    var _a, _b, _c, _d;
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
        const halaxyClient = (0, client_1.getHalaxyClient)();
        context.log('[HalaxySyncTimer] Fetching practitioners from Halaxy API...');
        const practitioners = await halaxyClient.getAllPractitioners();
        if (practitioners.length === 0) {
            context.log('[HalaxySyncTimer] No practitioners found in Halaxy');
            return;
        }
        context.log(`[HalaxySyncTimer] Found ${practitioners.length} practitioner(s) in Halaxy`);
        const syncService = (0, sync_service_1.getHalaxySyncService)();
        const results = [];
        for (const practitioner of practitioners) {
            try {
                const nameObj = (_a = practitioner.name) === null || _a === void 0 ? void 0 : _a[0];
                const name = nameObj
                    ? `${((_b = nameObj.given) === null || _b === void 0 ? void 0 : _b.join(' ')) || ''} ${nameObj.family || ''}`.trim()
                    : practitioner.id;
                const result = await syncService.fullSync(practitioner.id);
                results.push({
                    practitionerId: practitioner.id,
                    name,
                    success: result.success,
                });
                context.log(`[HalaxySyncTimer] Synced ${name}: ${result.recordsProcessed} records in ${result.duration}ms`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errNameObj = (_c = practitioner.name) === null || _c === void 0 ? void 0 : _c[0];
                const name = errNameObj ? `${((_d = errNameObj.given) === null || _d === void 0 ? void 0 : _d.join(' ')) || ''} ${errNameObj.family || ''}`.trim() : practitioner.id;
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