"use strict";
/**
 * List Practitioners API
 *
 * Returns all synced practitioners with their Halaxy IDs and GUIDs.
 */
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
const getConfig = () => {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (connectionString)
        return connectionString;
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
async function listPractitionersHandler(req, context) {
    var _a, _b, _c, _d, _e;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };
    if (req.method === 'OPTIONS') {
        return { status: 204, headers };
    }
    let pool = null;
    try {
        context.log('Connecting to database...');
        const config = getConfig();
        pool = await sql.connect(config);
        context.log('Connected to database');
        context.log('Querying practitioners...');
        const result = await pool.request().query(`
      SELECT 
        id,
        halaxy_practitioner_id,
        display_name,
        email,
        status,
        last_synced_at
      FROM practitioners
      ORDER BY display_name
    `);
        context.log(`Found ${result.recordset.length} practitioners`);
        const practitioners = result.recordset.map(row => ({
            id: row.id,
            halaxyId: row.halaxy_practitioner_id,
            displayName: row.display_name,
            email: row.email,
            status: row.status,
            lastSynced: row.last_synced_at,
        }));
        // Get counts
        const countResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM practitioners) as practitionerCount,
        (SELECT COUNT(*) FROM clients) as clientCount,
        (SELECT COUNT(*) FROM sessions) as sessionCount,
        (SELECT COUNT(*) FROM availability_slots) as slotCount,
        (SELECT COUNT(*) FROM availability_slots WHERE status = 'free') as freeSlotCount
    `);
        const counts = {
            practitioners: ((_a = countResult.recordset[0]) === null || _a === void 0 ? void 0 : _a.practitionerCount) || 0,
            clients: ((_b = countResult.recordset[0]) === null || _b === void 0 ? void 0 : _b.clientCount) || 0,
            sessions: ((_c = countResult.recordset[0]) === null || _c === void 0 ? void 0 : _c.sessionCount) || 0,
            slots: ((_d = countResult.recordset[0]) === null || _d === void 0 ? void 0 : _d.slotCount) || 0,
            freeSlots: ((_e = countResult.recordset[0]) === null || _e === void 0 ? void 0 : _e.freeSlotCount) || 0,
        };
        return {
            status: 200,
            headers,
            jsonBody: {
                success: true,
                counts,
                practitioners,
            },
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        context.error('List practitioners error:', errorMessage, errorStack);
        return {
            status: 500,
            headers,
            jsonBody: {
                success: false,
                error: errorMessage,
                stack: errorStack,
            },
        };
    }
    finally {
        if (pool) {
            try {
                await pool.close();
            }
            catch (e) {
                // Ignore close errors
            }
        }
    }
}
functions_1.app.http('listPractitioners', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'practitioners',
    handler: listPractitionersHandler,
});
exports.default = listPractitionersHandler;
//# sourceMappingURL=list-practitioners.js.map