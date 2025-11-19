import { CosmosClient, Database, Container } from '@azure/cosmos';
import * as crypto from 'crypto';
import { Migration, MigrationConfig, MigrationExecutor, MigrationRecord } from './types';

export class CosmosMigrationExecutor implements MigrationExecutor {
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private changelogContainer: Container | null = null;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (!this.config.cosmos?.endpoint || !this.config.cosmos?.key) {
      throw new Error('Cosmos DB endpoint and key not provided');
    }

    this.client = new CosmosClient({
      endpoint: this.config.cosmos.endpoint,
      key: this.config.cosmos.key,
    });

    const dbName = this.config.cosmos.database || 'migrations';
    const { database } = await this.client.databases.createIfNotExists({ id: dbName });
    this.database = database;

    console.log('✅ Connected to Azure Cosmos DB');
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.database = null;
    this.changelogContainer = null;
    console.log('✅ Disconnected from Azure Cosmos DB');
  }

  async ensureChangelogTable(): Promise<void> {
    if (!this.database) throw new Error('Not connected to Cosmos DB');

    const containerName = 'migration-changelog';
    const { container } = await this.database.containers.createIfNotExists({
      id: containerName,
      partitionKey: { paths: ['/id'] },
    });

    this.changelogContainer = container;
    console.log(`✅ Changelog container [${containerName}] ensured`);
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    if (!this.changelogContainer) throw new Error('Changelog container not initialized');

    const { resources } = await this.changelogContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.status = @status ORDER BY c.executedAt',
        parameters: [{ name: '@status', value: 'success' }],
      })
      .fetchAll();

    return resources.map((r) => ({
      id: r.id,
      executedAt: new Date(r.executedAt),
      executionTime: r.executionTime,
      checksum: r.checksum,
      status: r.status,
      errorMessage: r.errorMessage,
    }));
  }

  async executeMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();

    try {
      await migration.up();
      const executionTime = Date.now() - startTime;
      await this.recordMigration(migration, 'success', executionTime);
      console.log(`✅ Migration ${migration.id} executed successfully (${executionTime}ms)`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.recordMigration(migration, 'failed', executionTime, errorMessage);
      throw new Error(`Migration ${migration.id} failed: ${errorMessage}`);
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.id} has no rollback defined`);
    }

    const startTime = Date.now();

    try {
      await migration.down();

      // Remove migration record
      if (this.changelogContainer) {
        await this.changelogContainer.item(migration.id, migration.id).delete();
      }

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
    if (!this.changelogContainer) throw new Error('Changelog container not initialized');

    const checksum = this.calculateChecksum(migration);

    await this.changelogContainer.items.create({
      id: migration.id,
      executedAt: new Date().toISOString(),
      executionTime,
      checksum,
      status,
      errorMessage: errorMessage || null,
      author: migration.author,
      description: migration.description,
    });
  }

  private calculateChecksum(migration: Migration): string {
    if (migration.checksum) return migration.checksum;

    const content = `${migration.id}:${migration.description}:${migration.up.toString()}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getClient(): CosmosClient {
    if (!this.client) throw new Error('Not connected to Cosmos DB');
    return this.client;
  }

  getDatabase(): Database {
    if (!this.database) throw new Error('Not connected to Cosmos DB');
    return this.database;
  }
}
