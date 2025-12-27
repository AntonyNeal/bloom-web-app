"use strict";
/**
 * Database Version Control - Configuration
 *
 * Centralized configuration for the migration service.
 * Uses environment variables and Key Vault references.
 *
 * @author LPA Development Team
 * @date 2025-11-27
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
exports.SQL_TABLES = exports.COSMOS_CONTAINERS = exports.ENTITY_TYPES = exports.COSMOS_CONTAINER = exports.dbvcConfig = void 0;
exports.getCurrentEnvironment = getCurrentEnvironment;
exports.getSqlConfig = getSqlConfig;
exports.isCosmosConfigured = isCosmosConfigured;
exports.getCosmosConfig = getCosmosConfig;
exports.generateMigrationId = generateMigrationId;
exports.generateSnapshotId = generateSnapshotId;
exports.calculateChecksum = calculateChecksum;
exports.parseMigrationId = parseMigrationId;
exports.isValidMigrationId = isValidMigrationId;
// ============================================================================
// Environment Configuration
// ============================================================================
/**
 * Get current environment from DBVC_ENVIRONMENT or NODE_ENV
 */
function getCurrentEnvironment() {
    const env = process.env.DBVC_ENVIRONMENT || process.env.NODE_ENV || 'dev';
    // Simplified 2-environment model:
    // - 'staging' maps to 'dev' (second validation pass before prod)
    // - Only 'prod'/'production' goes to production DBs
    switch (env.toLowerCase()) {
        case 'production':
        case 'prod':
            return 'prod';
        case 'staging':
        case 'stage':
            // Staging uses dev databases for validation
            return 'dev';
        default:
            return 'dev';
    }
}
/**
 * Main DBVC configuration
 */
exports.dbvcConfig = {
    defaultDatabase: 'lpa-bloom-sql-dev',
    migrationsPath: './migrations/versioned',
    // Simplified 2-environment architecture:
    // - 4 databases total: 2 SQL (dev/prod) + 2 Cosmos (dev/prod)
    // - staging branch uses dev environment for second validation pass
    environments: {
        dev: {
            sqlConnectionSecretName: 'SQL-DEV-CONNECTION-STRING',
            cosmosConnectionSecretName: 'COSMOS-DEV-CONNECTION-STRING',
        },
        prod: {
            sqlConnectionSecretName: 'SQL-PROD-CONNECTION-STRING',
            cosmosConnectionSecretName: 'COSMOS-PROD-CONNECTION-STRING',
        },
    },
    naming: {
        migrationIdFormat: 'yyyyMMdd_HHmmss',
        schemaSnapshotIdFormat: 'snapshot_yyyyMMdd_HHmmss',
    },
    execution: {
        lockTimeoutMinutes: 30,
        transactionTimeoutSeconds: 300,
        retryAttempts: 3,
        retryDelayMs: 1000,
    },
};
// ============================================================================
// Connection String Management
// ============================================================================
/**
 * Get SQL connection configuration
 * Supports both connection string and individual credentials
 */
function getSqlConfig() {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (connectionString) {
        return connectionString;
    }
    // Fall back to individual credentials
    return {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true,
            trustServerCertificate: false,
            requestTimeout: exports.dbvcConfig.execution.transactionTimeoutSeconds * 1000,
        },
    };
}
/**
 * Check if Cosmos DB is available and properly configured
 */
function isCosmosConfigured() {
    const connectionString = process.env.DBVC_COSMOS_CONNECTION_STRING || process.env.COSMOS_DB_CONNECTION_STRING;
    // Check if connection string exists and is not a placeholder
    if (!connectionString)
        return false;
    if (connectionString.includes('placeholder'))
        return false;
    if (!connectionString.includes('AccountEndpoint='))
        return false;
    return true;
}
/**
 * Get Cosmos DB connection string for version control database
 * Returns null if Cosmos is not configured (SQL-only mode)
 */
function getCosmosConfig() {
    const connectionString = process.env.DBVC_COSMOS_CONNECTION_STRING || process.env.COSMOS_DB_CONNECTION_STRING;
    // Allow SQL-only mode if Cosmos is not configured or is a placeholder
    if (!connectionString || connectionString.includes('placeholder') || !connectionString.includes('AccountEndpoint=')) {
        console.log('⚠️  Cosmos DB not configured - running in SQL-only mode');
        return null;
    }
    const environment = getCurrentEnvironment();
    const database = process.env.DBVC_COSMOS_DATABASE || (environment === 'prod' ? 'lpa-dbvc-prod' : 'lpa-dbvc-dev');
    const container = process.env.DBVC_COSMOS_CONTAINER || 'version-control';
    return {
        connectionString,
        database,
        container,
    };
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Generate migration ID from current timestamp and name
 */
function generateMigrationId(name) {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\.\d+Z$/, '')
        .replace(/(\d{8})(\d{6})/, '$1_$2');
    // Sanitize name: lowercase, replace spaces with underscores, remove special chars
    const sanitizedName = name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 50);
    return `${timestamp}_${sanitizedName}`;
}
/**
 * Generate schema snapshot ID
 */
function generateSnapshotId(databaseId) {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\.\d+Z$/, '');
    return `snapshot_${databaseId}_${timestamp}`;
}
/**
 * Calculate SHA256 checksum of script content
 */
async function calculateChecksum(content) {
    const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}
/**
 * Parse migration ID into components
 */
function parseMigrationId(migrationId) {
    const match = migrationId.match(/^(\d{8})_(\d{6})_(.+)$/);
    if (!match) {
        return { timestamp: new Date(), name: '', isValid: false };
    }
    const [, dateStr, timeStr, name] = match;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(0, 2));
    const minute = parseInt(timeStr.substring(2, 4));
    const second = parseInt(timeStr.substring(4, 6));
    return {
        timestamp: new Date(year, month, day, hour, minute, second),
        name,
        isValid: true,
    };
}
/**
 * Validate migration ID format
 */
function isValidMigrationId(migrationId) {
    return /^\d{8}_\d{6}_[a-z0-9_]+$/.test(migrationId);
}
// ============================================================================
// Cosmos DB Container Configuration
// ============================================================================
/**
 * Single container approach with entityType partition key
 * Documents will have entityType field: 'migration', 'snapshot', or 'change-event'
 */
exports.COSMOS_CONTAINER = 'version-control';
exports.ENTITY_TYPES = {
    MIGRATION: 'migration',
    SCHEMA_SNAPSHOT: 'schema-snapshot',
    CHANGE_EVENT: 'change-event',
};
// ============================================================================
// Legacy container names (deprecated - using single container now)
// ============================================================================
exports.COSMOS_CONTAINERS = {
    CHANGE_EVENTS: 'change-events',
    SCHEMA_SNAPSHOTS: 'schema-snapshots',
    MIGRATIONS: 'migrations',
};
// ============================================================================
// SQL Table Names
// ============================================================================
exports.SQL_TABLES = {
    DB_INVENTORY: 'db_inventory',
    MIGRATION_REGISTRY: 'migration_registry',
    EXECUTION_HISTORY: 'migration_execution_history',
    APPLIED_STATUS: 'migration_applied_status',
    SCHEMA_SNAPSHOTS: 'schema_snapshots',
    MIGRATION_LOCKS: 'migration_locks',
};
//# sourceMappingURL=config.js.map