-- ============================================================================
-- Migration: V100__version_control_schema.sql
-- Description: Database Version Control System - Core Tables
-- Author: LPA Development Team
-- Date: 2025-11-27
-- ============================================================================

-- ============================================================================
-- DATABASE INVENTORY TABLE
-- Tracks all managed databases across environments
-- ============================================================================
CREATE TABLE db_inventory (
    id INT PRIMARY KEY IDENTITY(1,1),
    database_id NVARCHAR(100) NOT NULL UNIQUE,
    database_name NVARCHAR(255) NOT NULL,
    database_type NVARCHAR(20) NOT NULL CHECK (database_type IN ('SQL', 'Cosmos')),
    connection_secret_name NVARCHAR(255) NOT NULL, -- Key Vault secret name, NOT actual connection string
    environment NVARCHAR(20) NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    current_version NVARCHAR(50) NULL,
    last_verified_at DATETIME2 NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    metadata NVARCHAR(MAX) NULL -- JSON for additional properties
);

CREATE INDEX idx_db_inventory_environment ON db_inventory(environment);
CREATE INDEX idx_db_inventory_type ON db_inventory(database_type);
CREATE INDEX idx_db_inventory_active ON db_inventory(is_active);

-- ============================================================================
-- MIGRATION REGISTRY TABLE
-- Stores all migration definitions with up/down scripts
-- ============================================================================
CREATE TABLE migration_registry (
    id INT PRIMARY KEY IDENTITY(1,1),
    migration_id NVARCHAR(100) NOT NULL, -- Format: 20251127_143000_description
    database_id NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NOT NULL,
    up_script NVARCHAR(MAX) NOT NULL,
    down_script NVARCHAR(MAX) NULL, -- Nullable for irreversible migrations
    checksum NVARCHAR(64) NOT NULL, -- SHA256 hash for integrity
    author NVARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    is_reversible BIT NOT NULL DEFAULT 1,
    depends_on NVARCHAR(MAX) NULL, -- JSON array of migration IDs this depends on
    tags NVARCHAR(MAX) NULL, -- JSON array of tags for categorization
    
    CONSTRAINT UQ_migration_registry_migration_id UNIQUE (migration_id, database_id),
    CONSTRAINT FK_migration_registry_database FOREIGN KEY (database_id) 
        REFERENCES db_inventory(database_id) ON DELETE NO ACTION
);

CREATE INDEX idx_migration_registry_database ON migration_registry(database_id);
CREATE INDEX idx_migration_registry_created ON migration_registry(created_at DESC);
CREATE INDEX idx_migration_registry_author ON migration_registry(author);

-- ============================================================================
-- MIGRATION EXECUTION HISTORY TABLE
-- Tracks execution of migrations per environment
-- ============================================================================
CREATE TABLE migration_execution_history (
    id INT PRIMARY KEY IDENTITY(1,1),
    migration_id NVARCHAR(100) NOT NULL,
    database_id NVARCHAR(100) NOT NULL,
    environment NVARCHAR(20) NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    status NVARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'rolled-back', 'skipped')),
    started_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at DATETIME2 NULL,
    duration_ms INT NULL,
    executor NVARCHAR(255) NOT NULL, -- User, service principal, or pipeline identity
    execution_mode NVARCHAR(20) NOT NULL DEFAULT 'forward' CHECK (execution_mode IN ('forward', 'rollback')),
    error_message NVARCHAR(MAX) NULL,
    error_stack NVARCHAR(MAX) NULL,
    affected_rows INT NULL,
    execution_context NVARCHAR(MAX) NULL, -- JSON with additional context (pipeline run ID, commit SHA, etc.)
    
    CONSTRAINT FK_execution_history_migration FOREIGN KEY (migration_id, database_id) 
        REFERENCES migration_registry(migration_id, database_id) ON DELETE NO ACTION,
    CONSTRAINT FK_execution_history_database FOREIGN KEY (database_id) 
        REFERENCES db_inventory(database_id) ON DELETE NO ACTION
);

CREATE INDEX idx_execution_history_migration ON migration_execution_history(migration_id, database_id);
CREATE INDEX idx_execution_history_environment ON migration_execution_history(environment);
CREATE INDEX idx_execution_history_status ON migration_execution_history(status);
CREATE INDEX idx_execution_history_started ON migration_execution_history(started_at DESC);
CREATE INDEX idx_execution_history_executor ON migration_execution_history(executor);

-- ============================================================================
-- MIGRATION APPLIED STATUS TABLE
-- Quick lookup for current migration state per database/environment
-- ============================================================================
CREATE TABLE migration_applied_status (
    id INT PRIMARY KEY IDENTITY(1,1),
    migration_id NVARCHAR(100) NOT NULL,
    database_id NVARCHAR(100) NOT NULL,
    environment NVARCHAR(20) NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    is_applied BIT NOT NULL DEFAULT 0,
    applied_at DATETIME2 NULL,
    applied_by NVARCHAR(255) NULL,
    last_execution_id INT NULL,
    
    CONSTRAINT UQ_migration_applied UNIQUE (migration_id, database_id, environment),
    CONSTRAINT FK_applied_status_migration FOREIGN KEY (migration_id, database_id) 
        REFERENCES migration_registry(migration_id, database_id) ON DELETE CASCADE,
    CONSTRAINT FK_applied_status_execution FOREIGN KEY (last_execution_id) 
        REFERENCES migration_execution_history(id) ON DELETE SET NULL
);

CREATE INDEX idx_applied_status_database_env ON migration_applied_status(database_id, environment);
CREATE INDEX idx_applied_status_applied ON migration_applied_status(is_applied);

-- ============================================================================
-- SCHEMA SNAPSHOT TABLE
-- Stores point-in-time schema captures (for SQL, references Cosmos for large schemas)
-- ============================================================================
CREATE TABLE schema_snapshots (
    id INT PRIMARY KEY IDENTITY(1,1),
    snapshot_id NVARCHAR(100) NOT NULL UNIQUE,
    database_id NVARCHAR(100) NOT NULL,
    environment NVARCHAR(20) NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    captured_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    triggering_migration_id NVARCHAR(100) NULL,
    capture_type NVARCHAR(20) NOT NULL DEFAULT 'auto' CHECK (capture_type IN ('auto', 'manual', 'baseline')),
    schema_hash NVARCHAR(64) NOT NULL, -- For quick comparison
    cosmos_document_id NVARCHAR(100) NULL, -- Reference to full schema in Cosmos DB
    table_count INT NULL,
    view_count INT NULL,
    index_count INT NULL,
    stored_procedure_count INT NULL,
    captured_by NVARCHAR(255) NOT NULL,
    metadata NVARCHAR(MAX) NULL, -- JSON for additional properties
    
    CONSTRAINT FK_schema_snapshots_database FOREIGN KEY (database_id) 
        REFERENCES db_inventory(database_id) ON DELETE NO ACTION
);

CREATE INDEX idx_schema_snapshots_database ON schema_snapshots(database_id);
CREATE INDEX idx_schema_snapshots_captured ON schema_snapshots(captured_at DESC);
CREATE INDEX idx_schema_snapshots_migration ON schema_snapshots(triggering_migration_id);

-- ============================================================================
-- LOCKS TABLE
-- Prevents concurrent migrations on same database
-- ============================================================================
CREATE TABLE migration_locks (
    database_id NVARCHAR(100) PRIMARY KEY,
    locked_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    locked_by NVARCHAR(255) NOT NULL,
    lock_reason NVARCHAR(500) NULL,
    expires_at DATETIME2 NOT NULL, -- Auto-release after timeout
    
    CONSTRAINT FK_migration_locks_database FOREIGN KEY (database_id) 
        REFERENCES db_inventory(database_id) ON DELETE CASCADE
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

GO

-- Auto-update updated_at for db_inventory
CREATE TRIGGER trg_db_inventory_updated_at
ON db_inventory
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE db_inventory
    SET updated_at = GETDATE()
    FROM db_inventory di
    INNER JOIN inserted i ON di.id = i.id;
END;

GO

-- Auto-calculate duration for migration executions
CREATE TRIGGER trg_execution_history_duration
ON migration_execution_history
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE migration_execution_history
    SET duration_ms = DATEDIFF(MILLISECOND, started_at, completed_at)
    FROM migration_execution_history meh
    INNER JOIN inserted i ON meh.id = i.id
    WHERE i.completed_at IS NOT NULL AND meh.started_at IS NOT NULL;
END;

GO

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Acquire migration lock with timeout
CREATE PROCEDURE sp_acquire_migration_lock
    @database_id NVARCHAR(100),
    @locked_by NVARCHAR(255),
    @lock_reason NVARCHAR(500) = NULL,
    @timeout_minutes INT = 30,
    @success BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @success = 0;
    
    BEGIN TRANSACTION;
    
    -- Clean up expired locks
    DELETE FROM migration_locks 
    WHERE expires_at < GETDATE();
    
    -- Try to acquire lock
    IF NOT EXISTS (SELECT 1 FROM migration_locks WHERE database_id = @database_id)
    BEGIN
        INSERT INTO migration_locks (database_id, locked_by, lock_reason, expires_at)
        VALUES (@database_id, @locked_by, @lock_reason, DATEADD(MINUTE, @timeout_minutes, GETDATE()));
        
        SET @success = 1;
    END
    
    COMMIT TRANSACTION;
END;

GO

-- Release migration lock
CREATE PROCEDURE sp_release_migration_lock
    @database_id NVARCHAR(100),
    @locked_by NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM migration_locks 
    WHERE database_id = @database_id 
    AND locked_by = @locked_by;
END;

GO

-- Get pending migrations for environment
CREATE PROCEDURE sp_get_pending_migrations
    @database_id NVARCHAR(100),
    @environment NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        mr.migration_id,
        mr.description,
        mr.author,
        mr.created_at,
        mr.is_reversible,
        mr.checksum,
        mr.depends_on,
        CASE 
            WHEN mas.is_applied = 1 THEN 'applied'
            WHEN meh.status = 'failed' THEN 'failed'
            ELSE 'pending'
        END AS current_status,
        meh.error_message AS last_error
    FROM migration_registry mr
    LEFT JOIN migration_applied_status mas 
        ON mr.migration_id = mas.migration_id 
        AND mr.database_id = mas.database_id 
        AND mas.environment = @environment
    LEFT JOIN migration_execution_history meh 
        ON mr.migration_id = meh.migration_id 
        AND mr.database_id = meh.database_id 
        AND meh.environment = @environment
        AND meh.id = (
            SELECT MAX(id) 
            FROM migration_execution_history 
            WHERE migration_id = mr.migration_id 
            AND database_id = mr.database_id 
            AND environment = @environment
        )
    WHERE mr.database_id = @database_id
    AND (mas.is_applied IS NULL OR mas.is_applied = 0)
    ORDER BY mr.migration_id ASC;
END;

GO

-- Get migration status overview
CREATE PROCEDURE sp_get_migration_status
    @database_id NVARCHAR(100) = NULL,
    @environment NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        di.database_id,
        di.database_name,
        di.database_type,
        di.environment,
        di.current_version,
        COUNT(DISTINCT mr.migration_id) AS total_migrations,
        COUNT(DISTINCT CASE WHEN mas.is_applied = 1 THEN mr.migration_id END) AS applied_migrations,
        COUNT(DISTINCT CASE WHEN mas.is_applied = 0 OR mas.is_applied IS NULL THEN mr.migration_id END) AS pending_migrations,
        MAX(meh.completed_at) AS last_migration_at,
        MAX(CASE WHEN meh.status = 'failed' THEN meh.migration_id END) AS last_failed_migration
    FROM db_inventory di
    LEFT JOIN migration_registry mr ON di.database_id = mr.database_id
    LEFT JOIN migration_applied_status mas 
        ON mr.migration_id = mas.migration_id 
        AND mr.database_id = mas.database_id
        AND (mas.environment = @environment OR @environment IS NULL)
    LEFT JOIN migration_execution_history meh 
        ON mr.migration_id = meh.migration_id 
        AND mr.database_id = meh.database_id
        AND (meh.environment = @environment OR @environment IS NULL)
    WHERE di.is_active = 1
    AND (@database_id IS NULL OR di.database_id = @database_id)
    AND (@environment IS NULL OR di.environment = @environment)
    GROUP BY di.database_id, di.database_name, di.database_type, di.environment, di.current_version
    ORDER BY di.database_name, di.environment;
END;

GO

-- ============================================================================
-- SEED DATA: Register existing databases
-- ============================================================================
-- Database Architecture: 4 databases total (2 SQL + 2 Cosmos)
--   - develop branch → dev DBs
--   - staging branch → dev DBs (second validation pass)
--   - main branch    → prod DBs
-- ============================================================================

INSERT INTO db_inventory (database_id, database_name, database_type, connection_secret_name, environment, current_version)
VALUES 
-- SQL Databases
('lpa-bloom-sql-dev', 'LPA Bloom Development SQL', 'SQL', 'SQL-DEV-CONNECTION-STRING', 'dev', 'V3'),
('lpa-bloom-sql-prod', 'LPA Bloom Production SQL', 'SQL', 'SQL-PROD-CONNECTION-STRING', 'prod', 'V3'),
-- Cosmos Databases (within same account, different databases)
('lpa-cosmos-dev', 'LPA Cosmos Development', 'Cosmos', 'COSMOS-DEV-CONNECTION-STRING', 'dev', NULL),
('lpa-cosmos-prod', 'LPA Cosmos Production', 'Cosmos', 'COSMOS-PROD-CONNECTION-STRING', 'prod', NULL);

GO

PRINT '✅ Database Version Control schema created successfully';
PRINT '📊 Registered 4 databases in db_inventory (2 SQL + 2 Cosmos)'
