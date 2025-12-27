"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const sql = __importStar(require("mssql"));
// SQL connection configuration
const getConfig = () => {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (connectionString) {
        return connectionString;
    }
    return {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true,
            trustServerCertificate: false,
        },
    };
};
async function trackABTestEventHandler(req, context) {
    var _a;
    const method = req.method;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    };
    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return { status: 204, headers };
    }
    let pool = null;
    try {
        const config = getConfig();
        pool = await sql.connect(config);
        if (method === 'POST') {
            context.log('Tracking A/B test event to SQL');
            const body = (await req.json());
            const { testName, variant, sessionId, userId, converted } = body;
            if (!testName || !variant || !sessionId) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'Missing required fields: testName, variant, sessionId' },
                };
            }
            // Insert into SQL
            const result = await pool.request()
                .input('testName', sql.NVarChar, testName)
                .input('variant', sql.NVarChar, variant)
                .input('sessionId', sql.NVarChar, sessionId)
                .input('userId', sql.NVarChar, userId || null)
                .input('converted', sql.Bit, converted ? 1 : 0)
                .query(`
          INSERT INTO ab_test_events (test_name, variant, session_id, user_id, converted)
          OUTPUT INSERTED.id
          VALUES (@testName, @variant, @sessionId, @userId, @converted)
        `);
            const eventId = (_a = result.recordset[0]) === null || _a === void 0 ? void 0 : _a.id;
            context.log(`Event tracked for test: ${testName}, variant: ${variant}, converted: ${converted}, id: ${eventId}`);
            return {
                status: 201,
                headers,
                jsonBody: { success: true, eventId },
            };
        }
        if (method === 'GET') {
            // Get test results from SQL
            const testName = req.query.get('testName');
            if (!testName) {
                return {
                    status: 400,
                    headers,
                    jsonBody: { error: 'testName query parameter is required' },
                };
            }
            const result = await pool.request()
                .input('testName', sql.NVarChar, testName)
                .query(`
          SELECT 
            variant,
            COUNT(*) as allocations,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions
          FROM ab_test_events 
          WHERE test_name = @testName
          GROUP BY variant
        `);
            const variants = result.recordset.map((row) => ({
                variant: row.variant,
                allocations: row.allocations,
                conversions: row.conversions,
                conversionRate: row.allocations > 0 ? row.conversions / row.allocations : 0,
            }));
            return {
                status: 200,
                headers,
                jsonBody: { testName, variants },
            };
        }
        return {
            status: 405,
            headers,
            jsonBody: { error: 'Method not allowed' },
        };
    }
    catch (error) {
        context.error('Error in track A/B test event handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return {
            status: 500,
            headers,
            jsonBody: { error: errorMessage },
        };
    }
    finally {
        if (pool) {
            await pool.close();
        }
    }
}
functions_1.app.http('track-ab-test', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'ab-test/track',
    handler: trackABTestEventHandler,
});
//# sourceMappingURL=track-ab-test.js.map