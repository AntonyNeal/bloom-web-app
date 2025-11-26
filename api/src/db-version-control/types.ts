/**
 * Database Version Control System - TypeScript Types
 * 
 * Shared interfaces for the migration service, CLI tools, and Azure Functions.
 * 
 * @author LPA Development Team
 * @date 2025-11-27
 */

// ============================================================================
// Core Types
// ============================================================================

// Simplified 2-environment model:
// - 'dev' for development and staging validation
// - 'prod' for production only
export type Environment = 'dev' | 'prod';
export type DatabaseType = 'SQL' | 'Cosmos';
export type MigrationStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled-back' | 'skipped';
export type ExecutionMode = 'forward' | 'rollback';
export type CaptureType = 'auto' | 'manual' | 'baseline';
export type ChangeEventType = 'started' | 'completed' | 'failed' | 'rolled-back';

// ============================================================================
// SQL Database Entities
// ============================================================================

export interface DatabaseInventory {
  id: number;
  databaseId: string;
  databaseName: string;
  databaseType: DatabaseType;
  connectionSecretName: string;
  environment: Environment;
  currentVersion: string | null;
  lastVerifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface MigrationRegistry {
  id: number;
  migrationId: string; // Format: 20251127_143000_description
  databaseId: string;
  description: string;
  upScript: string;
  downScript: string | null;
  checksum: string;
  author: string;
  createdAt: Date;
  isReversible: boolean;
  dependsOn: string[] | null;
  tags: string[] | null;
}

export interface MigrationExecutionHistory {
  id: number;
  migrationId: string;
  databaseId: string;
  environment: Environment;
  status: MigrationStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  executor: string;
  executionMode: ExecutionMode;
  errorMessage: string | null;
  errorStack: string | null;
  affectedRows: number | null;
  executionContext: ExecutionContext | null;
}

export interface MigrationAppliedStatus {
  id: number;
  migrationId: string;
  databaseId: string;
  environment: Environment;
  isApplied: boolean;
  appliedAt: Date | null;
  appliedBy: string | null;
  lastExecutionId: number | null;
}

export interface SchemaSnapshotRecord {
  id: number;
  snapshotId: string;
  databaseId: string;
  environment: Environment;
  capturedAt: Date;
  triggeringMigrationId: string | null;
  captureType: CaptureType;
  schemaHash: string;
  cosmosDocumentId: string | null;
  tableCount: number | null;
  viewCount: number | null;
  indexCount: number | null;
  storedProcedureCount: number | null;
  capturedBy: string;
  metadata?: Record<string, unknown>;
}

export interface MigrationLock {
  databaseId: string;
  lockedAt: Date;
  lockedBy: string;
  lockReason: string | null;
  expiresAt: Date;
}

// ============================================================================
// Cosmos DB Documents
// ============================================================================

/**
 * Change event document stored in Cosmos DB for audit trail
 */
export interface ChangeEvent {
  id: string;
  migrationId: string;
  databaseId: string;
  eventType: ChangeEventType;
  timestamp: string; // ISO 8601
  environment: Environment;
  executionContext: ExecutionContext;
  stateSnapshot?: unknown; // Optional before/after for critical changes
  entityType?: string; // 'change-event' for single container partition
  _partitionKey?: string; // Cosmos partition key
}

/**
 * Schema snapshot document stored in Cosmos DB
 */
export interface SchemaSnapshot {
  id: string;
  databaseId: string;
  snapshotId: string;
  capturedAt: string; // ISO 8601
  schemaDefinition: SqlSchemaDefinition | CosmosSchemaDefinition;
  triggeringMigrationId: string;
  environment: Environment;
  captureType: CaptureType;
  capturedBy: string;
  entityType?: string; // 'schema-snapshot' for single container partition
  _partitionKey?: string; // Cosmos partition key
}

/**
 * Migration document stored in Cosmos DB (backup/sync with SQL)
 */
export interface MigrationDocument {
  id: string;
  migrationId: string;
  databaseId: string;
  description: string;
  upScript: string;
  downScript: string | null;
  checksum: string;
  author: string;
  createdAt: string;
  isReversible: boolean;
  dependsOn: string[] | null;
  tags: string[] | null;
  appliedEnvironments: {
    [env in Environment]?: {
      appliedAt: string;
      appliedBy: string;
    };
  };
  entityType?: string; // 'migration' for single container partition
  _partitionKey?: string;
}

// ============================================================================
// Schema Definitions
// ============================================================================

export interface SqlSchemaDefinition {
  type: 'SQL';
  tables: SqlTableDefinition[];
  views: SqlViewDefinition[];
  indexes: SqlIndexDefinition[];
  storedProcedures: SqlStoredProcedure[];
  triggers: SqlTriggerDefinition[];
  foreignKeys: SqlForeignKeyDefinition[];
}

export interface SqlTableDefinition {
  schema: string;
  name: string;
  columns: {
    name: string;
    dataType: string;
    isNullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
    isIdentity: boolean;
  }[];
}

export interface SqlViewDefinition {
  schema: string;
  name: string;
  definition: string;
}

export interface SqlIndexDefinition {
  schema: string;
  tableName: string;
  indexName: string;
  columns: string[];
  isUnique: boolean;
  isClustered: boolean;
}

export interface SqlStoredProcedure {
  schema: string;
  name: string;
  definition: string;
}

export interface SqlTriggerDefinition {
  schema: string;
  tableName: string;
  triggerName: string;
  definition: string;
}

export interface SqlForeignKeyDefinition {
  schema: string;
  tableName: string;
  constraintName: string;
  columnName: string;
  referencedSchema: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface CosmosSchemaDefinition {
  type: 'Cosmos';
  databases: CosmosDatabase[];
}

export interface CosmosDatabase {
  name: string;
  containers: CosmosContainer[];
}

export interface CosmosContainer {
  name: string;
  partitionKey: string;
  indexingPolicy: unknown;
  uniqueKeyPolicy: unknown;
}

// ============================================================================
// Execution Context
// ============================================================================

export interface ExecutionContext {
  pipelineRunId?: string;
  commitSha?: string;
  branch?: string;
  triggeredBy?: string;
  workflowName?: string;
  clientIp?: string;
  userAgent?: string;
  customData?: Record<string, unknown>;
  // Allow additional dynamic properties
  [key: string]: unknown;
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface CreateMigrationInput {
  name: string;
  databaseId: string;
  author: string;
  description?: string;
  upScript?: string;
  downScript?: string;
  tags?: string[];
  dependsOn?: string[];
}

export interface CreateMigrationOutput {
  success: boolean;
  migrationId: string;
  filePath: string;
  message: string;
}

export interface RunMigrationsInput {
  databaseId: string;
  environment: Environment;
  targetMigrationId?: string; // If specified, run up to this migration
  dryRun?: boolean;
  executor: string;
  executionContext?: ExecutionContext;
}

export interface RunMigrationsOutput {
  success: boolean;
  executedMigrations: {
    migrationId: string;
    status: MigrationStatus;
    durationMs: number;
    error?: string;
  }[];
  skippedMigrations: string[];
  failedMigration?: string;
  totalDurationMs: number;
}

export interface RollbackMigrationInput {
  migrationId: string;
  databaseId: string;
  environment: Environment;
  executor: string;
  executionContext?: ExecutionContext;
}

export interface RollbackMigrationOutput {
  success: boolean;
  migrationId: string;
  durationMs: number;
  error?: string;
}

export interface GetMigrationStatusInput {
  databaseId?: string;
  environment?: Environment;
}

export interface MigrationStatusItem {
  migrationId: string;
  databaseId: string;
  description: string;
  author: string;
  createdAt: string;
  isReversible: boolean;
  status: {
    dev: MigrationStatus | 'not-applied';
    prod: MigrationStatus | 'not-applied';
  };
  lastExecution?: {
    environment: Environment;
    status: MigrationStatus;
    executedAt: string;
    executor: string;
  };
}

export interface GetMigrationStatusOutput {
  databases: {
    databaseId: string;
    databaseName: string;
    databaseType: DatabaseType;
    currentVersion: string | null;
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: number;
    lastMigrationAt: string | null;
    migrations: MigrationStatusItem[];
  }[];
}

export interface CaptureSchemaSnapshotInput {
  databaseId: string;
  environment: Environment;
  captureType?: CaptureType;
  triggeringMigrationId?: string;
  capturedBy: string;
}

export interface CaptureSchemaSnapshotOutput {
  success: boolean;
  snapshotId: string;
  schemaHash: string;
  tableCount: number;
  cosmosDocumentId: string;
}

export interface VerifyIntegrityInput {
  databaseId: string;
  environment: Environment;
  fixDrift?: boolean;
}

export interface VerifyIntegrityOutput {
  isValid: boolean;
  issues: IntegrityIssue[];
  checksumMismatches: {
    migrationId: string;
    registeredChecksum: string;
    calculatedChecksum: string;
  }[];
  schemaDrift?: {
    detected: boolean;
    details: string;
    lastSnapshotId: string;
    currentSchemaHash: string;
    snapshotSchemaHash: string;
  };
}

export interface IntegrityIssue {
  type: 'checksum_mismatch' | 'missing_migration' | 'schema_drift' | 'orphaned_record' | 'lock_expired';
  severity: 'error' | 'warning' | 'info';
  migrationId?: string;
  description: string;
  recommendation: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface DbvcConfig {
  defaultDatabase?: string;
  migrationsPath: string;
  // Simplified 2-environment architecture (staging uses dev DBs)
  environments: {
    dev: {
      sqlConnectionSecretName: string;
      cosmosConnectionSecretName: string;
    };
    prod: {
      sqlConnectionSecretName: string;
      cosmosConnectionSecretName: string;
    };
  };
  naming: {
    migrationIdFormat: string; // e.g., "yyyyMMdd_HHmmss"
    schemaSnapshotIdFormat: string;
  };
  execution: {
    lockTimeoutMinutes: number;
    transactionTimeoutSeconds: number;
    retryAttempts: number;
    retryDelayMs: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}
