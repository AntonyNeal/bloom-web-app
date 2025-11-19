import * as sql from 'mssql';
import * as crypto from 'crypto';
import { Migration, MigrationConfig, MigrationExecutor, MigrationRecord } from './types';

export class SqlMigrationExecutor implements MigrationExecutor {
  private pool: sql.ConnectionPool | null = null;
  private config: MigrationConfig;
  private changelogTable: string;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.changelogTable = config.changelogTable || 'DatabaseChangeLog';
  }

  async connect(): Promise<void> {
    if (!this.config.sql?.connectionString) {
      throw new Error('SQL connection string not provided');
    }

    this.pool = await sql.connect(this.config.sql.connectionString);
    console.log('✅ Connected to Azure SQL Database');
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('✅ Disconnected from Azure SQL Database');
    }
  }

  async ensureChangelogTable(): Promise<void> {
    if (!this.pool) throw new Error('Not connected to database');

    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${this.changelogTable}' AND xtype='U')
      BEGIN
        CREATE TABLE [${this.changelogTable}] (
          [Id] NVARCHAR(255) PRIMARY KEY,
          [ExecutedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          [ExecutionTime] INT NOT NULL,
          [Checksum] NVARCHAR(64) NOT NULL,
          [Status] NVARCHAR(20) NOT NULL,
          [ErrorMessage] NVARCHAR(MAX) NULL,
          [Author] NVARCHAR(100) NULL,
          [Description] NVARCHAR(500) NULL
        );
        
        CREATE INDEX IX_${this.changelogTable}_ExecutedAt ON [${this.changelogTable}] (ExecutedAt);
        CREATE INDEX IX_${this.changelogTable}_Status ON [${this.changelogTable}] (Status);
      END
    `;

    await this.pool.request().query(createTableQuery);
    console.log(`✅ Changelog table [${this.changelogTable}] ensured`);
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    if (!this.pool) throw new Error('Not connected to database');

    const result = await this.pool.request().query(`
      SELECT 
        [Id] as id,
        [ExecutedAt] as executedAt,
        [ExecutionTime] as executionTime,
        [Checksum] as checksum,
        [Status] as status,
        [ErrorMessage] as errorMessage
      FROM [${this.changelogTable}]
      WHERE [Status] = 'success'
      ORDER BY [ExecutedAt]
    `);

    return result.recordset;
  }

  async executeMigration(migration: Migration): Promise<void> {
    if (!this.pool) throw new Error('Not connected to database');

    const startTime = Date.now();
    
    try {
      // Start transaction
      const transaction = new sql.Transaction(this.pool);
      await transaction.begin();

      try {
        // Execute the migration
        await migration.up();
        
        const executionTime = Date.now() - startTime;
        
        // Record successful migration
        await this.recordMigrationInTransaction(transaction, migration, 'success', executionTime);
        
        await transaction.commit();
        console.log(`✅ Migration ${migration.id} executed successfully (${executionTime}ms)`);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Record failed migration (outside transaction)
      await this.recordMigration(migration, 'failed', executionTime, errorMessage);
      
      throw new Error(`Migration ${migration.id} failed: ${errorMessage}`);
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!this.pool) throw new Error('Not connected to database');
    if (!migration.down) {
      throw new Error(`Migration ${migration.id} has no rollback defined`);
    }

    const startTime = Date.now();
    
    try {
      await migration.down();
      
      // Remove migration record
      await this.pool.request()
        .input('id', sql.NVarChar(255), migration.id)
        .query(`DELETE FROM [${this.changelogTable}] WHERE [Id] = @id`);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration ${migration.id} rolled back successfully (${executionTime}ms)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Rollback of ${migration.id} failed: ${errorMessage}`);
    }
  }

  async recordMigration(
    migration: Migration,
    status: 'success' | 'failed',
    executionTime: number,
    errorMessage?: string
  ): Promise<void> {
    if (!this.pool) throw new Error('Not connected to database');

    const checksum = this.calculateChecksum(migration);

    await this.pool.request()
      .input('id', sql.NVarChar(255), migration.id)
      .input('executionTime', sql.Int, executionTime)
      .input('checksum', sql.NVarChar(64), checksum)
      .input('status', sql.NVarChar(20), status)
      .input('errorMessage', sql.NVarChar(sql.MAX), errorMessage || null)
      .input('author', sql.NVarChar(100), migration.author)
      .input('description', sql.NVarChar(500), migration.description)
      .query(`
        INSERT INTO [${this.changelogTable}] 
          ([Id], [ExecutionTime], [Checksum], [Status], [ErrorMessage], [Author], [Description])
        VALUES 
          (@id, @executionTime, @checksum, @status, @errorMessage, @author, @description)
      `);
  }

  private async recordMigrationInTransaction(
    transaction: sql.Transaction,
    migration: Migration,
    status: 'success' | 'failed',
    executionTime: number,
    errorMessage?: string
  ): Promise<void> {
    const checksum = this.calculateChecksum(migration);

    await new sql.Request(transaction)
      .input('id', sql.NVarChar(255), migration.id)
      .input('executionTime', sql.Int, executionTime)
      .input('checksum', sql.NVarChar(64), checksum)
      .input('status', sql.NVarChar(20), status)
      .input('errorMessage', sql.NVarChar(sql.MAX), errorMessage || null)
      .input('author', sql.NVarChar(100), migration.author)
      .input('description', sql.NVarChar(500), migration.description)
      .query(`
        INSERT INTO [${this.changelogTable}] 
          ([Id], [ExecutionTime], [Checksum], [Status], [ErrorMessage], [Author], [Description])
        VALUES 
          (@id, @executionTime, @checksum, @status, @errorMessage, @author, @description)
      `);
  }

  private calculateChecksum(migration: Migration): string {
    if (migration.checksum) return migration.checksum;
    
    const content = `${migration.id}:${migration.description}:${migration.up.toString()}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getPool(): sql.ConnectionPool {
    if (!this.pool) throw new Error('Not connected to database');
    return this.pool;
  }
}
