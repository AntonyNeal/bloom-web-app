"use strict";
/**
 * Database Version Control - Migration Service
 *
 * Core service for managing database migrations, providing:
 * - Migration creation and registration
 * - Forward and rollback execution
 * - Status tracking and reporting
 * - Schema snapshot capture
 * - Integrity verification
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
exports.migrationService = exports.MigrationService = void 0;
const sql = __importStar(require("mssql"));
const cosmos_1 = require("@azure/cosmos");
const config_1 = require("./config");
// ============================================================================
// Migration Service Class
// ============================================================================
class MigrationService {
    constructor() {
        this.sqlPool = null;
        this.cosmosClient = null;
        this.cosmosDb = null;
        this.cosmosContainer = null;
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Connection Management
    // ──────────────────────────────────────────────────────────────────────────
    /**
     * Initialize database connections
     */
    async connect() {
        // SQL Connection
        if (!this.sqlPool) {
            const config = (0, config_1.getSqlConfig)();
            this.sqlPool = await sql.connect(config);
        }
        // Cosmos DB Connection
        if (!this.cosmosClient) {
            const { connectionString, database, container } = (0, config_1.getCosmosConfig)();
            this.cosmosClient = new cosmos_1.CosmosClient(connectionString);
            this.cosmosDb = this.cosmosClient.database(database);
            this.cosmosContainer = this.cosmosDb.container(container);
        }
    }
    /**
     * Close all database connections
     */
    async disconnect() {
        if (this.sqlPool) {
            await this.sqlPool.close();
            this.sqlPool = null;
        }
        this.cosmosClient = null;
        this.cosmosDb = null;
        this.cosmosContainer = null;
    }
    /**
     * Get Cosmos container (single container for all entity types)
     */
    getContainer() {
        if (!this.cosmosContainer) {
            throw new Error('Cosmos DB not connected. Call connect() first.');
        }
        return this.cosmosContainer;
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Migration Creation
    // ──────────────────────────────────────────────────────────────────────────
    /**
     * Create a new migration with up/down templates
     */
    async createMigration(input) {
        await this.connect();
        const migrationId = (0, config_1.generateMigrationId)(input.name);
        const description = input.description || input.name;
        // Generate template scripts if not provided
        const upScript = input.upScript || this.generateUpTemplate(migrationId, description);
        const downScript = input.downScript || this.generateDownTemplate(migrationId, description);
        const checksum = await (0, config_1.calculateChecksum)(upScript);
        try {
            // Register in SQL
            const request = this.sqlPool.request();
            await request
                .input('migration_id', sql.NVarChar(100), migrationId)
                .input('database_id', sql.NVarChar(100), input.databaseId)
                .input('description', sql.NVarChar(500), description)
                .input('up_script', sql.NVarChar(sql.MAX), upScript)
                .input('down_script', sql.NVarChar(sql.MAX), downScript)
                .input('checksum', sql.NVarChar(64), checksum)
                .input('author', sql.NVarChar(100), input.author)
                .input('is_reversible', sql.Bit, downScript ? 1 : 0)
                .input('depends_on', sql.NVarChar(sql.MAX), input.dependsOn ? JSON.stringify(input.dependsOn) : null)
                .input('tags', sql.NVarChar(sql.MAX), input.tags ? JSON.stringify(input.tags) : null)
                .query(`
          INSERT INTO ${config_1.SQL_TABLES.MIGRATION_REGISTRY} 
          (migration_id, database_id, description, up_script, down_script, checksum, author, is_reversible, depends_on, tags)
          VALUES (@migration_id, @database_id, @description, @up_script, @down_script, @checksum, @author, @is_reversible, @depends_on, @tags)
        `);
            // Also store in Cosmos for backup/sync
            const migrationDoc = {
                id: `${input.databaseId}_${migrationId}`,
                migrationId,
                databaseId: input.databaseId,
                description,
                upScript,
                downScript,
                checksum,
                author: input.author,
                createdAt: new Date().toISOString(),
                isReversible: !!downScript,
                dependsOn: input.dependsOn || null,
                tags: input.tags || null,
                appliedEnvironments: {},
                entityType: config_1.ENTITY_TYPES.MIGRATION,
                _partitionKey: config_1.ENTITY_TYPES.MIGRATION,
            };
            await this.getContainer().items.create(migrationDoc);
            return {
                success: true,
                migrationId,
                filePath: `migrations/versioned/${migrationId}.sql`,
                message: `Migration ${migrationId} created successfully`,
            };
        }
        catch (error) {
            const err = error;
            throw new Error(`Failed to create migration: ${err.message}`);
        }
    }
    generateUpTemplate(migrationId, description) {
        return `-- ============================================================================
-- Migration: ${migrationId}
-- Description: ${description}
-- Author: (auto-generated)
-- Date: ${new Date().toISOString().split('T')[0]}
-- ============================================================================

-- UP Migration Script
-- Add your forward migration SQL here

-- Example: CREATE TABLE, ALTER TABLE, INSERT data, etc.

`;
    }
    generateDownTemplate(migrationId, description) {
        return `-- ============================================================================
-- Rollback: ${migrationId}
-- Description: Rollback for ${description}
-- ============================================================================

-- DOWN Migration Script
-- Add your rollback SQL here (reverse of UP script)

-- Example: DROP TABLE, ALTER TABLE DROP COLUMN, DELETE data, etc.

`;
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Migration Execution
    // ──────────────────────────────────────────────────────────────────────────
    /**
     * Run pending migrations for a database/environment
     */
    async runMigrations(input) {
        await this.connect();
        const startTime = Date.now();
        const executedMigrations = [];
        const skippedMigrations = [];
        let failedMigration;
        try {
            // Acquire lock
            const lockAcquired = await this.acquireLock(input.databaseId, input.executor);
            if (!lockAcquired) {
                throw new Error(`Could not acquire lock for database ${input.databaseId}. Another migration may be in progress.`);
            }
            // Get pending migrations
            const pendingMigrations = await this.getPendingMigrations(input.databaseId, input.environment);
            for (const migration of pendingMigrations) {
                // Check if we've reached target migration
                if (input.targetMigrationId && migration.migrationId > input.targetMigrationId) {
                    skippedMigrations.push(migration.migrationId);
                    continue;
                }
                // Check dependencies
                if (migration.dependsOn && migration.dependsOn.length > 0) {
                    const unmetDeps = await this.checkDependencies(migration.dependsOn, input.databaseId, input.environment);
                    if (unmetDeps.length > 0) {
                        skippedMigrations.push(migration.migrationId);
                        continue;
                    }
                }
                const migrationStart = Date.now();
                if (input.dryRun) {
                    executedMigrations.push({
                        migrationId: migration.migrationId,
                        status: 'skipped',
                        durationMs: 0,
                    });
                    continue;
                }
                try {
                    // Log start event
                    await this.logChangeEvent({
                        migrationId: migration.migrationId,
                        databaseId: input.databaseId,
                        eventType: 'started',
                        environment: input.environment,
                        executionContext: input.executionContext || {},
                    });
                    // Create execution record
                    const executionId = await this.createExecutionRecord(migration.migrationId, input.databaseId, input.environment, input.executor, 'forward', input.executionContext);
                    // Execute migration in transaction
                    const transaction = this.sqlPool.transaction();
                    await transaction.begin();
                    try {
                        await transaction.request().query(migration.upScript);
                        await transaction.commit();
                        const durationMs = Date.now() - migrationStart;
                        // Update execution record
                        await this.updateExecutionRecord(executionId, 'success', durationMs);
                        // Update applied status
                        await this.updateAppliedStatus(migration.migrationId, input.databaseId, input.environment, true, input.executor, executionId);
                        // Log completion event
                        await this.logChangeEvent({
                            migrationId: migration.migrationId,
                            databaseId: input.databaseId,
                            eventType: 'completed',
                            environment: input.environment,
                            executionContext: input.executionContext || {},
                        });
                        executedMigrations.push({
                            migrationId: migration.migrationId,
                            status: 'success',
                            durationMs,
                        });
                    }
                    catch (txError) {
                        await transaction.rollback();
                        throw txError;
                    }
                }
                catch (migrationError) {
                    const err = migrationError;
                    const durationMs = Date.now() - migrationStart;
                    // Log failure event
                    await this.logChangeEvent({
                        migrationId: migration.migrationId,
                        databaseId: input.databaseId,
                        eventType: 'failed',
                        environment: input.environment,
                        executionContext: {
                            ...input.executionContext,
                            error: err.message,
                        },
                    });
                    executedMigrations.push({
                        migrationId: migration.migrationId,
                        status: 'failed',
                        durationMs,
                        error: err.message,
                    });
                    failedMigration = migration.migrationId;
                    break; // Stop on first failure
                }
            }
            return {
                success: !failedMigration,
                executedMigrations,
                skippedMigrations,
                failedMigration,
                totalDurationMs: Date.now() - startTime,
            };
        }
        finally {
            // Always release lock
            await this.releaseLock(input.databaseId, input.executor);
        }
    }
    /**
     * Rollback a specific migration
     */
    async rollbackMigration(input) {
        await this.connect();
        const startTime = Date.now();
        try {
            // Acquire lock
            const lockAcquired = await this.acquireLock(input.databaseId, input.executor);
            if (!lockAcquired) {
                throw new Error(`Could not acquire lock for database ${input.databaseId}`);
            }
            // Get migration details
            const migration = await this.getMigration(input.migrationId, input.databaseId);
            if (!migration) {
                throw new Error(`Migration ${input.migrationId} not found`);
            }
            if (!migration.downScript) {
                throw new Error(`Migration ${input.migrationId} is not reversible (no down script)`);
            }
            // Check if migration is applied
            const isApplied = await this.isMigrationApplied(input.migrationId, input.databaseId, input.environment);
            if (!isApplied) {
                throw new Error(`Migration ${input.migrationId} is not applied in ${input.environment}`);
            }
            // Log start event
            await this.logChangeEvent({
                migrationId: input.migrationId,
                databaseId: input.databaseId,
                eventType: 'started',
                environment: input.environment,
                executionContext: { ...input.executionContext, mode: 'rollback' },
            });
            // Create execution record
            const executionId = await this.createExecutionRecord(input.migrationId, input.databaseId, input.environment, input.executor, 'rollback', input.executionContext);
            // Execute rollback
            const transaction = this.sqlPool.transaction();
            await transaction.begin();
            try {
                await transaction.request().query(migration.downScript);
                await transaction.commit();
                const durationMs = Date.now() - startTime;
                // Update execution record
                await this.updateExecutionRecord(executionId, 'success', durationMs);
                // Update applied status
                await this.updateAppliedStatus(input.migrationId, input.databaseId, input.environment, false, input.executor, executionId);
                // Log completion event
                await this.logChangeEvent({
                    migrationId: input.migrationId,
                    databaseId: input.databaseId,
                    eventType: 'rolled-back',
                    environment: input.environment,
                    executionContext: input.executionContext || {},
                });
                return {
                    success: true,
                    migrationId: input.migrationId,
                    durationMs,
                };
            }
            catch (txError) {
                await transaction.rollback();
                throw txError;
            }
        }
        catch (error) {
            const err = error;
            // Log failure event
            await this.logChangeEvent({
                migrationId: input.migrationId,
                databaseId: input.databaseId,
                eventType: 'failed',
                environment: input.environment,
                executionContext: {
                    ...input.executionContext,
                    error: err.message,
                    mode: 'rollback',
                },
            });
            return {
                success: false,
                migrationId: input.migrationId,
                durationMs: Date.now() - startTime,
                error: err.message,
            };
        }
        finally {
            await this.releaseLock(input.databaseId, input.executor);
        }
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Status & Reporting
    // ──────────────────────────────────────────────────────────────────────────
    /**
     * Get migration status for databases/environments
     */
    async getMigrationStatus(input) {
        var _a;
        await this.connect();
        const request = this.sqlPool.request();
        if (input.databaseId) {
            request.input('database_id', sql.NVarChar(100), input.databaseId);
        }
        if (input.environment) {
            request.input('environment', sql.NVarChar(20), input.environment);
        }
        // Get database summary
        const summaryResult = await request.query(`
      SELECT 
        di.database_id,
        di.database_name,
        di.database_type,
        di.current_version,
        COUNT(DISTINCT mr.migration_id) AS total_migrations,
        COUNT(DISTINCT CASE WHEN mas.is_applied = 1 THEN mr.migration_id END) AS applied_migrations,
        COUNT(DISTINCT CASE WHEN mas.is_applied = 0 OR mas.is_applied IS NULL THEN mr.migration_id END) AS pending_migrations,
        MAX(meh.completed_at) AS last_migration_at
      FROM ${config_1.SQL_TABLES.DB_INVENTORY} di
      LEFT JOIN ${config_1.SQL_TABLES.MIGRATION_REGISTRY} mr ON di.database_id = mr.database_id
      LEFT JOIN ${config_1.SQL_TABLES.APPLIED_STATUS} mas 
        ON mr.migration_id = mas.migration_id 
        AND mr.database_id = mas.database_id
        ${input.environment ? "AND mas.environment = @environment" : ""}
      LEFT JOIN ${config_1.SQL_TABLES.EXECUTION_HISTORY} meh 
        ON mr.migration_id = meh.migration_id 
        AND mr.database_id = meh.database_id
        ${input.environment ? "AND meh.environment = @environment" : ""}
        AND meh.status = 'success'
      WHERE di.is_active = 1
      ${input.databaseId ? "AND di.database_id = @database_id" : ""}
      GROUP BY di.database_id, di.database_name, di.database_type, di.current_version
    `);
        const databases = [];
        for (const db of summaryResult.recordset) {
            // Get migrations for this database
            const migrationsResult = await this.sqlPool.request()
                .input('db_id', sql.NVarChar(100), db.database_id)
                .query(`
          SELECT 
            mr.migration_id,
            mr.description,
            mr.author,
            mr.created_at,
            mr.is_reversible
          FROM ${config_1.SQL_TABLES.MIGRATION_REGISTRY} mr
          WHERE mr.database_id = @db_id
          ORDER BY mr.migration_id ASC
        `);
            const migrations = await Promise.all(migrationsResult.recordset.map(async (m) => {
                const statusResult = await this.sqlPool.request()
                    .input('migration_id', sql.NVarChar(100), m.migration_id)
                    .input('database_id', sql.NVarChar(100), db.database_id)
                    .query(`
              SELECT environment, is_applied
              FROM ${config_1.SQL_TABLES.APPLIED_STATUS}
              WHERE migration_id = @migration_id AND database_id = @database_id
            `);
                // Simplified 2-environment model (staging uses dev)
                const statusMap = {
                    dev: 'not-applied',
                    prod: 'not-applied',
                };
                for (const s of statusResult.recordset) {
                    // Map staging to dev if it appears in data
                    const env = s.environment === 'staging' ? 'dev' : s.environment;
                    if (env === 'dev' || env === 'prod') {
                        statusMap[env] = s.is_applied ? 'success' : 'not-applied';
                    }
                }
                return {
                    migrationId: m.migration_id,
                    databaseId: db.database_id,
                    description: m.description,
                    author: m.author,
                    createdAt: m.created_at.toISOString(),
                    isReversible: m.is_reversible,
                    status: statusMap,
                };
            }));
            databases.push({
                databaseId: db.database_id,
                databaseName: db.database_name,
                databaseType: db.database_type,
                currentVersion: db.current_version,
                totalMigrations: db.total_migrations || 0,
                appliedMigrations: db.applied_migrations || 0,
                pendingMigrations: db.pending_migrations || 0,
                lastMigrationAt: ((_a = db.last_migration_at) === null || _a === void 0 ? void 0 : _a.toISOString()) || null,
                migrations,
            });
        }
        return { databases };
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Schema Snapshots
    // ──────────────────────────────────────────────────────────────────────────
    /**
     * Capture current schema state
     */
    async captureSchemaSnapshot(input) {
        await this.connect();
        const snapshotId = (0, config_1.generateSnapshotId)(input.databaseId);
        const capturedAt = new Date().toISOString();
        // Capture SQL schema
        const schemaDefinition = await this.captureSqlSchema();
        const schemaHash = await (0, config_1.calculateChecksum)(JSON.stringify(schemaDefinition));
        // Store in Cosmos DB
        const snapshotDoc = {
            id: snapshotId,
            databaseId: input.databaseId,
            snapshotId,
            capturedAt,
            schemaDefinition,
            triggeringMigrationId: input.triggeringMigrationId || '',
            environment: input.environment,
            captureType: input.captureType || 'auto',
            capturedBy: input.capturedBy,
            entityType: config_1.ENTITY_TYPES.SCHEMA_SNAPSHOT,
            _partitionKey: config_1.ENTITY_TYPES.SCHEMA_SNAPSHOT,
        };
        const { resource } = await this.getContainer()
            .items.create(snapshotDoc);
        // Also record in SQL for quick lookup
        await this.sqlPool.request()
            .input('snapshot_id', sql.NVarChar(100), snapshotId)
            .input('database_id', sql.NVarChar(100), input.databaseId)
            .input('environment', sql.NVarChar(20), input.environment)
            .input('triggering_migration_id', sql.NVarChar(100), input.triggeringMigrationId || null)
            .input('capture_type', sql.NVarChar(20), input.captureType || 'auto')
            .input('schema_hash', sql.NVarChar(64), schemaHash)
            .input('cosmos_document_id', sql.NVarChar(100), resource === null || resource === void 0 ? void 0 : resource.id)
            .input('table_count', sql.Int, schemaDefinition.tables.length)
            .input('view_count', sql.Int, schemaDefinition.views.length)
            .input('index_count', sql.Int, schemaDefinition.indexes.length)
            .input('stored_procedure_count', sql.Int, schemaDefinition.storedProcedures.length)
            .input('captured_by', sql.NVarChar(255), input.capturedBy)
            .query(`
        INSERT INTO ${config_1.SQL_TABLES.SCHEMA_SNAPSHOTS}
        (snapshot_id, database_id, environment, triggering_migration_id, capture_type, schema_hash, cosmos_document_id, table_count, view_count, index_count, stored_procedure_count, captured_by)
        VALUES (@snapshot_id, @database_id, @environment, @triggering_migration_id, @capture_type, @schema_hash, @cosmos_document_id, @table_count, @view_count, @index_count, @stored_procedure_count, @captured_by)
      `);
        return {
            success: true,
            snapshotId,
            schemaHash,
            tableCount: schemaDefinition.tables.length,
            cosmosDocumentId: (resource === null || resource === void 0 ? void 0 : resource.id) || snapshotId,
        };
    }
    async captureSqlSchema() {
        // Capture tables
        const tablesResult = await this.sqlPool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        c.name AS column_name,
        ty.name AS data_type,
        c.is_nullable,
        dc.definition AS default_value,
        CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key,
        c.is_identity
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.columns c ON t.object_id = c.object_id
      INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
      LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
      ) pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id
      ORDER BY s.name, t.name, c.column_id
    `);
        const tablesMap = new Map();
        for (const row of tablesResult.recordset) {
            const key = `${row.schema_name}.${row.table_name}`;
            if (!tablesMap.has(key)) {
                tablesMap.set(key, { schema: row.schema_name, name: row.table_name, columns: [] });
            }
            tablesMap.get(key).columns.push({
                name: row.column_name,
                dataType: row.data_type,
                isNullable: row.is_nullable,
                defaultValue: row.default_value,
                isPrimaryKey: row.is_primary_key === 1,
                isIdentity: row.is_identity,
            });
        }
        // Capture views
        const viewsResult = await this.sqlPool.request().query(`
      SELECT s.name AS schema_name, v.name AS view_name, m.definition
      FROM sys.views v
      INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
      LEFT JOIN sys.sql_modules m ON v.object_id = m.object_id
    `);
        // Capture indexes
        const indexesResult = await this.sqlPool.request().query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name,
        i.name AS index_name,
        STRING_AGG(c.name, ', ') AS columns,
        i.is_unique,
        i.type_desc
      FROM sys.indexes i
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.name IS NOT NULL
      GROUP BY s.name, t.name, i.name, i.is_unique, i.type_desc
    `);
        // Capture stored procedures
        const procsResult = await this.sqlPool.request().query(`
      SELECT s.name AS schema_name, p.name AS proc_name, m.definition
      FROM sys.procedures p
      INNER JOIN sys.schemas s ON p.schema_id = s.schema_id
      LEFT JOIN sys.sql_modules m ON p.object_id = m.object_id
    `);
        return {
            type: 'SQL',
            tables: Array.from(tablesMap.values()),
            views: viewsResult.recordset.map((v) => ({
                schema: v.schema_name,
                name: v.view_name,
                definition: v.definition || '',
            })),
            indexes: indexesResult.recordset.map((i) => {
                var _a;
                return ({
                    schema: i.schema_name,
                    tableName: i.table_name,
                    indexName: i.index_name,
                    columns: ((_a = i.columns) === null || _a === void 0 ? void 0 : _a.split(', ')) || [],
                    isUnique: i.is_unique,
                    isClustered: i.type_desc === 'CLUSTERED',
                });
            }),
            storedProcedures: procsResult.recordset.map((p) => ({
                schema: p.schema_name,
                name: p.proc_name,
                definition: p.definition || '',
            })),
            triggers: [],
            foreignKeys: [],
        };
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Integrity Verification
    // ──────────────────────────────────────────────────────────────────────────
    /**
     * Verify migration integrity and detect schema drift
     */
    async verifyIntegrity(input) {
        await this.connect();
        const issues = [];
        const checksumMismatches = [];
        // Check migration checksums
        const migrationsResult = await this.sqlPool.request()
            .input('database_id', sql.NVarChar(100), input.databaseId)
            .query(`
        SELECT migration_id, up_script, checksum
        FROM ${config_1.SQL_TABLES.MIGRATION_REGISTRY}
        WHERE database_id = @database_id
      `);
        for (const migration of migrationsResult.recordset) {
            const calculatedChecksum = await (0, config_1.calculateChecksum)(migration.up_script);
            if (calculatedChecksum !== migration.checksum) {
                checksumMismatches.push({
                    migrationId: migration.migration_id,
                    registeredChecksum: migration.checksum,
                    calculatedChecksum,
                });
                issues.push({
                    type: 'checksum_mismatch',
                    severity: 'error',
                    migrationId: migration.migration_id,
                    description: `Checksum mismatch for migration ${migration.migration_id}`,
                    recommendation: 'Re-register migration or investigate script tampering',
                });
            }
        }
        // Check for expired locks
        const locksResult = await this.sqlPool.request().query(`
      SELECT database_id, locked_by, expires_at
      FROM ${config_1.SQL_TABLES.MIGRATION_LOCKS}
      WHERE expires_at < GETDATE()
    `);
        for (const lock of locksResult.recordset) {
            issues.push({
                type: 'lock_expired',
                severity: 'warning',
                description: `Expired lock found for database ${lock.database_id} (locked by ${lock.locked_by})`,
                recommendation: 'Release the expired lock',
            });
            if (input.fixDrift) {
                await this.sqlPool.request()
                    .input('database_id', sql.NVarChar(100), lock.database_id)
                    .query(`DELETE FROM ${config_1.SQL_TABLES.MIGRATION_LOCKS} WHERE database_id = @database_id`);
            }
        }
        // Check schema drift (compare current schema to last snapshot)
        const lastSnapshotResult = await this.sqlPool.request()
            .input('database_id', sql.NVarChar(100), input.databaseId)
            .input('environment', sql.NVarChar(20), input.environment)
            .query(`
        SELECT TOP 1 snapshot_id, schema_hash
        FROM ${config_1.SQL_TABLES.SCHEMA_SNAPSHOTS}
        WHERE database_id = @database_id AND environment = @environment
        ORDER BY captured_at DESC
      `);
        let schemaDrift;
        if (lastSnapshotResult.recordset.length > 0) {
            const lastSnapshot = lastSnapshotResult.recordset[0];
            const currentSchema = await this.captureSqlSchema();
            const currentSchemaHash = await (0, config_1.calculateChecksum)(JSON.stringify(currentSchema));
            if (currentSchemaHash !== lastSnapshot.schema_hash) {
                schemaDrift = {
                    detected: true,
                    details: 'Schema has changed since last snapshot',
                    lastSnapshotId: lastSnapshot.snapshot_id,
                    currentSchemaHash,
                    snapshotSchemaHash: lastSnapshot.schema_hash,
                };
                issues.push({
                    type: 'schema_drift',
                    severity: 'warning',
                    description: 'Schema has drifted from last snapshot',
                    recommendation: 'Capture a new snapshot or investigate manual schema changes',
                });
            }
        }
        return {
            isValid: issues.filter((i) => i.severity === 'error').length === 0,
            issues,
            checksumMismatches,
            schemaDrift,
        };
    }
    // ──────────────────────────────────────────────────────────────────────────
    // Private Helper Methods
    // ──────────────────────────────────────────────────────────────────────────
    async acquireLock(databaseId, lockedBy) {
        const result = await this.sqlPool.request()
            .input('database_id', sql.NVarChar(100), databaseId)
            .input('locked_by', sql.NVarChar(255), lockedBy)
            .input('timeout_minutes', sql.Int, config_1.dbvcConfig.execution.lockTimeoutMinutes)
            .output('success', sql.Bit)
            .execute('sp_acquire_migration_lock');
        return result.output.success === true;
    }
    async releaseLock(databaseId, lockedBy) {
        await this.sqlPool.request()
            .input('database_id', sql.NVarChar(100), databaseId)
            .input('locked_by', sql.NVarChar(255), lockedBy)
            .execute('sp_release_migration_lock');
    }
    async getPendingMigrations(databaseId, environment) {
        const result = await this.sqlPool.request()
            .input('database_id', sql.NVarChar(100), databaseId)
            .input('environment', sql.NVarChar(20), environment)
            .query(`
        SELECT mr.*
        FROM ${config_1.SQL_TABLES.MIGRATION_REGISTRY} mr
        LEFT JOIN ${config_1.SQL_TABLES.APPLIED_STATUS} mas 
          ON mr.migration_id = mas.migration_id 
          AND mr.database_id = mas.database_id 
          AND mas.environment = @environment
        WHERE mr.database_id = @database_id
        AND (mas.is_applied IS NULL OR mas.is_applied = 0)
        ORDER BY mr.migration_id ASC
      `);
        return result.recordset.map((r) => ({
            id: r.id,
            migrationId: r.migration_id,
            databaseId: r.database_id,
            description: r.description,
            upScript: r.up_script,
            downScript: r.down_script,
            checksum: r.checksum,
            author: r.author,
            createdAt: r.created_at,
            isReversible: r.is_reversible,
            dependsOn: r.depends_on ? JSON.parse(r.depends_on) : null,
            tags: r.tags ? JSON.parse(r.tags) : null,
        }));
    }
    async getMigration(migrationId, databaseId) {
        const result = await this.sqlPool.request()
            .input('migration_id', sql.NVarChar(100), migrationId)
            .input('database_id', sql.NVarChar(100), databaseId)
            .query(`
        SELECT * FROM ${config_1.SQL_TABLES.MIGRATION_REGISTRY}
        WHERE migration_id = @migration_id AND database_id = @database_id
      `);
        if (result.recordset.length === 0)
            return null;
        const r = result.recordset[0];
        return {
            id: r.id,
            migrationId: r.migration_id,
            databaseId: r.database_id,
            description: r.description,
            upScript: r.up_script,
            downScript: r.down_script,
            checksum: r.checksum,
            author: r.author,
            createdAt: r.created_at,
            isReversible: r.is_reversible,
            dependsOn: r.depends_on ? JSON.parse(r.depends_on) : null,
            tags: r.tags ? JSON.parse(r.tags) : null,
        };
    }
    async isMigrationApplied(migrationId, databaseId, environment) {
        const result = await this.sqlPool.request()
            .input('migration_id', sql.NVarChar(100), migrationId)
            .input('database_id', sql.NVarChar(100), databaseId)
            .input('environment', sql.NVarChar(20), environment)
            .query(`
        SELECT is_applied FROM ${config_1.SQL_TABLES.APPLIED_STATUS}
        WHERE migration_id = @migration_id 
        AND database_id = @database_id 
        AND environment = @environment
      `);
        return result.recordset.length > 0 && result.recordset[0].is_applied === true;
    }
    async checkDependencies(dependsOn, databaseId, environment) {
        const unmetDeps = [];
        for (const dep of dependsOn) {
            const isApplied = await this.isMigrationApplied(dep, databaseId, environment);
            if (!isApplied) {
                unmetDeps.push(dep);
            }
        }
        return unmetDeps;
    }
    async createExecutionRecord(migrationId, databaseId, environment, executor, mode, context) {
        const result = await this.sqlPool.request()
            .input('migration_id', sql.NVarChar(100), migrationId)
            .input('database_id', sql.NVarChar(100), databaseId)
            .input('environment', sql.NVarChar(20), environment)
            .input('executor', sql.NVarChar(255), executor)
            .input('execution_mode', sql.NVarChar(20), mode)
            .input('execution_context', sql.NVarChar(sql.MAX), context ? JSON.stringify(context) : null)
            .query(`
        INSERT INTO ${config_1.SQL_TABLES.EXECUTION_HISTORY}
        (migration_id, database_id, environment, status, executor, execution_mode, execution_context)
        OUTPUT INSERTED.id
        VALUES (@migration_id, @database_id, @environment, 'running', @executor, @execution_mode, @execution_context)
      `);
        return result.recordset[0].id;
    }
    async updateExecutionRecord(executionId, status, durationMs, error) {
        await this.sqlPool.request()
            .input('id', sql.Int, executionId)
            .input('status', sql.NVarChar(20), status)
            .input('completed_at', sql.DateTime2, new Date())
            .input('duration_ms', sql.Int, durationMs || null)
            .input('error_message', sql.NVarChar(sql.MAX), error || null)
            .query(`
        UPDATE ${config_1.SQL_TABLES.EXECUTION_HISTORY}
        SET status = @status, completed_at = @completed_at, duration_ms = @duration_ms, error_message = @error_message
        WHERE id = @id
      `);
    }
    async updateAppliedStatus(migrationId, databaseId, environment, isApplied, appliedBy, executionId) {
        await this.sqlPool.request()
            .input('migration_id', sql.NVarChar(100), migrationId)
            .input('database_id', sql.NVarChar(100), databaseId)
            .input('environment', sql.NVarChar(20), environment)
            .input('is_applied', sql.Bit, isApplied ? 1 : 0)
            .input('applied_at', sql.DateTime2, isApplied ? new Date() : null)
            .input('applied_by', sql.NVarChar(255), appliedBy)
            .input('last_execution_id', sql.Int, executionId)
            .query(`
        MERGE ${config_1.SQL_TABLES.APPLIED_STATUS} AS target
        USING (SELECT @migration_id AS migration_id, @database_id AS database_id, @environment AS environment) AS source
        ON target.migration_id = source.migration_id 
          AND target.database_id = source.database_id 
          AND target.environment = source.environment
        WHEN MATCHED THEN
          UPDATE SET is_applied = @is_applied, applied_at = @applied_at, applied_by = @applied_by, last_execution_id = @last_execution_id
        WHEN NOT MATCHED THEN
          INSERT (migration_id, database_id, environment, is_applied, applied_at, applied_by, last_execution_id)
          VALUES (@migration_id, @database_id, @environment, @is_applied, @applied_at, @applied_by, @last_execution_id);
      `);
    }
    async logChangeEvent(event) {
        const doc = {
            id: `${event.databaseId}_${event.migrationId}_${Date.now()}`,
            ...event,
            timestamp: new Date().toISOString(),
            entityType: config_1.ENTITY_TYPES.CHANGE_EVENT,
            _partitionKey: config_1.ENTITY_TYPES.CHANGE_EVENT,
        };
        await this.getContainer().items.create(doc);
    }
}
exports.MigrationService = MigrationService;
// Export singleton instance
exports.migrationService = new MigrationService();
//# sourceMappingURL=migration-service.js.map