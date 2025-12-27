"use strict";
/**
 * Debug Slots Endpoint
 *
 * Directly test Halaxy slot API to debug sync issues.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const client_1 = require("../services/halaxy/client");
const token_manager_1 = require("../services/halaxy/token-manager");
async function debugSlotsHandler(_req, context) {
    var _a;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };
    try {
        const client = (0, client_1.getHalaxyClient)();
        const config = (0, token_manager_1.getHalaxyConfig)();
        const token = await (0, token_manager_1.getAccessToken)();
        context.log('Testing slot endpoints...');
        // First, make a direct fetch to see the raw FHIR response with pagination links
        const directUrl = `${config.apiBaseUrl}/Slot`;
        context.log(`Direct fetch to: ${directUrl}`);
        const directResponse = await fetch(directUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/fhir+json',
            },
        });
        const directJson = await directResponse.json();
        // Extract pagination info
        const paginationLinks = directJson.link || [];
        const nextLink = paginationLinks.find((l) => l.relation === 'next');
        const selfLink = paginationLinks.find((l) => l.relation === 'self');
        // Test 1: Get available appointments via $find operation
        let allSlots = [];
        let allSlotsError = null;
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 90);
            allSlots = await client.findAvailableAppointments(startDate, endDate, 60, // 60 minute duration
            'PR-1439411' // Zoe's practitioner ID
            );
            context.log(`findAvailableAppointments returned ${allSlots.length} slots`);
        }
        catch (e) {
            allSlotsError = e instanceof Error ? e.message : 'Unknown error';
            context.error('findAvailableAppointments failed:', e);
        }
        // Sample some slots for inspection
        const sampleSlots = allSlots.slice(0, 3).map(slot => ({
            id: slot.id,
            start: slot.start,
            end: slot.end,
            status: slot.status,
        }));
        return {
            status: 200,
            headers,
            jsonBody: {
                config: {
                    apiBaseUrl: config.apiBaseUrl,
                    directUrl,
                },
                directFetchResult: {
                    status: directResponse.status,
                    resourceType: directJson.resourceType,
                    total: directJson.total,
                    entryCount: ((_a = directJson.entry) === null || _a === void 0 ? void 0 : _a.length) || 0,
                },
                pagination: {
                    allLinks: paginationLinks,
                    selfLink: selfLink === null || selfLink === void 0 ? void 0 : selfLink.url,
                    nextLink: nextLink === null || nextLink === void 0 ? void 0 : nextLink.url,
                    hasNextPage: !!nextLink,
                },
                clientResult: {
                    allSlotsCount: allSlots.length,
                    allSlotsError,
                    freeSlots: allSlots.filter(s => s.status === 'free').length,
                    busySlots: allSlots.filter(s => s.status === 'busy').length,
                },
                sampleSlots,
            },
        };
    }
    catch (error) {
        context.error('Debug slots error:', error);
        return {
            status: 500,
            headers,
            jsonBody: {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            },
        };
    }
}
functions_1.app.http('debugSlots', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'halaxy/debug-slots',
    handler: debugSlotsHandler,
});
exports.default = debugSlotsHandler;
//# sourceMappingURL=debug-slots.js.map