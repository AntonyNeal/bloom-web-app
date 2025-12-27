"use strict";
/**
 * Shared Database Connection Utility
 *
 * Provides connection pooling for SQL Server connections.
 * Used by Halaxy sync service and other API functions.
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
exports.getDbConfig = getDbConfig;
exports.getDbConnection = getDbConnection;
exports.closeDbConnection = closeDbConnection;
const sql = __importStar(require("mssql"));
// Connection pool singleton
let pool = null;
/**
 * Get database configuration from environment variables
 */
function getDbConfig() {
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
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
        },
    };
}
/**
 * Get a database connection pool
 * Creates a new pool if one doesn't exist, otherwise returns existing pool
 */
async function getDbConnection() {
    if (pool && pool.connected) {
        return pool;
    }
    const config = getDbConfig();
    pool = await sql.connect(config);
    pool.on('error', (err) => {
        console.error('[Database] Pool error:', err);
        pool = null;
    });
    return pool;
}
/**
 * Close the database connection pool
 */
async function closeDbConnection() {
    if (pool) {
        await pool.close();
        pool = null;
    }
}
//# sourceMappingURL=database.js.map