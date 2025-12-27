"use strict";
/**
 * Manual Halaxy Sync Trigger
 *
 * HTTP endpoint to manually trigger a full Halaxy sync.
 * Fetches practitioners directly from Halaxy API - no seeding required.
 *
 * POST /api/halaxy/sync
 */
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const sync_service_1 = require("../services/halaxy/sync-service");
const client_1 = require("../services/halaxy/client");
async function triggerHalaxySyncHandler(request, context) {
    var _a, _b, _c, _d;
    const startTime = Date.now();
    context.log('[TriggerSync] Manual sync triggered');
    // Check if Halaxy credentials are configured
    if (!process.env.HALAXY_CLIENT_ID || !process.env.HALAXY_CLIENT_SECRET) {
        return {
            status: 503,
            jsonBody: {
                error: 'Halaxy credentials not configured',
                configured: {
                    HALAXY_CLIENT_ID: !!process.env.HALAXY_CLIENT_ID,
                    HALAXY_CLIENT_SECRET: !!process.env.HALAXY_CLIENT_SECRET,
                }
            }
        };
    }
    try {
        // Fetch practitioners directly from Halaxy API - no seeding required
        const halaxyClient = (0, client_1.getHalaxyClient)();
        context.log('[TriggerSync] Fetching practitioners from Halaxy API...');
        const practitioners = await halaxyClient.getAllPractitioners();
        context.log(`[TriggerSync] Found ${practitioners.length} practitioner(s) in Halaxy`);
        if (practitioners.length === 0) {
            return {
                status: 200,
                jsonBody: {
                    message: 'No practitioners found in Halaxy',
                    practitioners: 0,
                    duration: Date.now() - startTime
                }
            };
        }
        const syncService = (0, sync_service_1.getHalaxySyncService)();
        const results = [];
        for (const practitioner of practitioners) {
            try {
                // Get practitioner display name
                const nameObj = (_a = practitioner.name) === null || _a === void 0 ? void 0 : _a[0];
                const name = nameObj
                    ? `${((_b = nameObj.given) === null || _b === void 0 ? void 0 : _b.join(' ')) || ''} ${nameObj.family || ''}`.trim()
                    : practitioner.id;
                context.log(`[TriggerSync] Syncing practitioner: ${name} (${practitioner.id})`);
                // Pass the practitioner data to avoid extra API call
                const result = await syncService.fullSync(practitioner.id, practitioner);
                results.push({
                    practitionerId: practitioner.id,
                    name,
                    success: result.success,
                    recordsProcessed: result.recordsProcessed,
                    duration: result.duration,
                    errors: result.errors.length > 0 ? result.errors.map(e => ({
                        entityType: e.entityType,
                        message: e.message,
                    })) : undefined,
                });
                context.log(`[TriggerSync] Synced ${name}: ${result.recordsProcessed} records in ${result.duration}ms`);
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
                context.error(`[TriggerSync] Failed to sync ${name}:`, error);
            }
        }
        const duration = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        return {
            status: 200,
            jsonBody: {
                message: `Sync completed: ${successCount}/${practitioners.length} successful`,
                totalDuration: duration,
                practitioners: results
            }
        };
    }
    catch (error) {
        context.error('[TriggerSync] Sync failed:', error);
        return {
            status: 500,
            jsonBody: {
                error: 'Sync failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}
// Register the Azure Function HTTP trigger
functions_1.app.http('triggerHalaxySync', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'halaxy/sync',
    handler: triggerHalaxySyncHandler,
});
exports.default = triggerHalaxySyncHandler;
//# sourceMappingURL=trigger-halaxy-sync.js.map