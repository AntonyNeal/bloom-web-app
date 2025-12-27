"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Force rebuild - 2025-11-24
const functions_1 = require("@azure/functions");
async function healthHandler(req, _context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
    if (req.method === 'OPTIONS') {
        return { status: 204, headers };
    }
    return {
        status: 200,
        headers,
        jsonBody: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            message: 'Bloom API is running',
        },
    };
}
functions_1.app.http('health', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'health',
    handler: healthHandler,
});
//# sourceMappingURL=health.js.map