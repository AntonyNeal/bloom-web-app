/**
 * Database Version Control - Configuration
 * 
 * Centralized configuration for the migration service.
 * Uses environment variables and Key Vault references.
 * 
 * @author LPA Development Team
 * @date 2025-11-27
 */

import { DbvcConfig, Environment } from './types';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Get current environment from DBVC_ENVIRONMENT or NODE_ENV
 */
export function getCurrentEnvironment(): Environment {
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
export const dbvcConfig: DbvcConfig = {
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
export function getSqlConfig(): string | object {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  
  if (connectionString) {
    return connectionString;
  }
  
  // Fall back to individual credentials
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      requestTimeout: dbvcConfig.execution.transactionTimeoutSeconds * 1000,
    },
  };
}

/**
 * Check if Cosmos DB is available and properly configured
 */
export function isCosmosConfigured(): boolean {
  const connectionString = process.env.DBVC_COSMOS_CONNECTION_STRING || process.env.COSMOS_DB_CONNECTION_STRING;
  
  // Check if connection string exists and is not a placeholder
  if (!connectionString) return false;
  if (connectionString.includes('placeholder')) return false;
  if (!connectionString.includes('AccountEndpoint=')) return false;
  
  return true;
}

/**
 * Get Cosmos DB connection string for version control database
 * Returns null if Cosmos is not configured (SQL-only mode)
 */
export function getCosmosConfig(): { connectionString: string; database: string; container: string } | null {
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
export function generateMigrationId(name: string): string {
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
export function generateSnapshotId(databaseId: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:T]/g, '')
    .replace(/\.\d+Z$/, '');
  
  return `snapshot_${databaseId}_${timestamp}`;
}

/**
 * Calculate SHA256 checksum of script content
 */
export async function calculateChecksum(content: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Parse migration ID into components
 */
export function parseMigrationId(migrationId: string): {
  timestamp: Date;
  name: string;
  isValid: boolean;
} {
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
export function isValidMigrationId(migrationId: string): boolean {
  return /^\d{8}_\d{6}_[a-z0-9_]+$/.test(migrationId);
}

// ============================================================================
// Cosmos DB Container Configuration
// ============================================================================

/**
 * Single container approach with entityType partition key
 * Documents will have entityType field: 'migration', 'snapshot', or 'change-event'
 */
export const COSMOS_CONTAINER = 'version-control';

export const ENTITY_TYPES = {
  MIGRATION: 'migration',
  SCHEMA_SNAPSHOT: 'schema-snapshot',
  CHANGE_EVENT: 'change-event',
} as const;

// ============================================================================
// Legacy container names (deprecated - using single container now)
// ============================================================================

export const COSMOS_CONTAINERS = {
  CHANGE_EVENTS: 'change-events',
  SCHEMA_SNAPSHOTS: 'schema-snapshots',
  MIGRATIONS: 'migrations',
} as const;

// ============================================================================
// SQL Table Names
// ============================================================================

export const SQL_TABLES = {
  DB_INVENTORY: 'db_inventory',
  MIGRATION_REGISTRY: 'migration_registry',
  EXECUTION_HISTORY: 'migration_execution_history',
  APPLIED_STATUS: 'migration_applied_status',
  SCHEMA_SNAPSHOTS: 'schema_snapshots',
  MIGRATION_LOCKS: 'migration_locks',
} as const;
