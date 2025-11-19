/**
 * Database Migration System (Liquibase-style)
 * 
 * Manages database schema changes across Azure SQL and Cosmos DB
 * Tracks applied migrations in a changelog table
 */

export interface Migration {
  id: string;
  description: string;
  timestamp: string;
  author: string;
  database: 'sql' | 'cosmos';
  up: () => Promise<void>;
  down?: () => Promise<void>;
  checksum?: string;
}

export interface MigrationRecord {
  id: string;
  executedAt: Date;
  executionTime: number;
  checksum: string;
  status: 'success' | 'failed' | 'running';
  errorMessage?: string;
}

export interface MigrationConfig {
  sql?: {
    connectionString: string;
    database: string;
  };
  cosmos?: {
    endpoint: string;
    key: string;
    database: string;
    container: string;
  };
  migrationsPath?: string;
  changelogTable?: string;
}

export interface MigrationExecutor {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  ensureChangelogTable(): Promise<void>;
  getAppliedMigrations(): Promise<MigrationRecord[]>;
  executeMigration(migration: Migration): Promise<void>;
  rollbackMigration(migration: Migration): Promise<void>;
  recordMigration(migration: Migration, status: 'success' | 'failed', executionTime: number, errorMessage?: string): Promise<void>;
}
