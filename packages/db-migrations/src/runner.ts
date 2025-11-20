import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { Migration, MigrationConfig, MigrationExecutor } from './types';
import { SqlMigrationExecutor } from './sql-executor';
import { CosmosMigrationExecutor } from './cosmos-executor';

/**
 * Migration Runner for SQL and Cosmos DB
 * 
 * Note: This module uses console.* statements with chalk for formatted CLI output.
 * This is intentional and appropriate for a command-line tool that requires:
 * - Colored terminal output for better UX
 * - Real-time progress feedback for long-running migrations
 * - Clear visual hierarchy (success/warning/error states)
 * 
 * The structured logger pattern used elsewhere in the application is not suitable
 * for CLI tools that need direct terminal formatting control.
 */

export class MigrationRunner {
  private sqlExecutor: SqlMigrationExecutor | null = null;
  private cosmosExecutor: CosmosMigrationExecutor | null = null;
  private migrations: Migration[] = [];
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;

    if (config.sql) {
      this.sqlExecutor = new SqlMigrationExecutor(config);
    }

    if (config.cosmos) {
      this.cosmosExecutor = new CosmosMigrationExecutor(config);
    }
  }

  async initialize(): Promise<void> {
    if (this.sqlExecutor) {
      await this.sqlExecutor.connect();
      await this.sqlExecutor.ensureChangelogTable();
    }

    if (this.cosmosExecutor) {
      await this.cosmosExecutor.connect();
      await this.cosmosExecutor.ensureChangelogTable();
    }

    await this.loadMigrations();
  }

  async cleanup(): Promise<void> {
    if (this.sqlExecutor) {
      await this.sqlExecutor.disconnect();
    }

    if (this.cosmosExecutor) {
      await this.cosmosExecutor.disconnect();
    }
  }

  private async loadMigrations(): Promise<void> {
    const migrationsPath = this.config.migrationsPath || './migrations';

    try {
      const files = await fs.readdir(migrationsPath);
      const migrationFiles = files
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
        .sort();

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const migration = await import(filePath);
        
        if (migration.default) {
          this.migrations.push(migration.default);
        }
      }

      console.log(chalk.blue(`📂 Loaded ${this.migrations.length} migration(s)`));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  No migrations found in ${migrationsPath}`));
    }
  }

  async migrateUp(steps?: number): Promise<void> {
    console.log(chalk.bold.cyan('\n🚀 Running migrations UP\n'));

    const sqlApplied = this.sqlExecutor
      ? await this.sqlExecutor.getAppliedMigrations()
      : [];
    const cosmosApplied = this.cosmosExecutor
      ? await this.cosmosExecutor.getAppliedMigrations()
      : [];

    const appliedIds = new Set([
      ...sqlApplied.map((m) => m.id),
      ...cosmosApplied.map((m) => m.id),
    ]);

    const pendingMigrations = this.migrations.filter((m) => !appliedIds.has(m.id));

    if (pendingMigrations.length === 0) {
      console.log(chalk.green('✅ All migrations are already applied'));
      return;
    }

    const toApply = steps ? pendingMigrations.slice(0, steps) : pendingMigrations;

    console.log(chalk.yellow(`📋 ${toApply.length} migration(s) to apply\n`));

    for (const migration of toApply) {
      const executor = this.getExecutorForMigration(migration);

      if (!executor) {
        console.log(
          chalk.yellow(`⚠️  Skipping ${migration.id}: No executor for ${migration.database}`)
        );
        continue;
      }

      try {
        console.log(chalk.blue(`▶️  Applying: ${migration.id} - ${migration.description}`));
        await executor.executeMigration(migration);
      } catch (error) {
        console.error(
          chalk.red(`❌ Migration ${migration.id} failed: ${error}`)
        );
        throw error;
      }
    }

    console.log(chalk.bold.green('\n✅ Migration completed successfully\n'));
  }

  async migrateDown(steps: number = 1): Promise<void> {
    console.log(chalk.bold.cyan('\n⬇️  Rolling back migrations\n'));

    const sqlApplied = this.sqlExecutor
      ? await this.sqlExecutor.getAppliedMigrations()
      : [];
    const cosmosApplied = this.cosmosExecutor
      ? await this.cosmosExecutor.getAppliedMigrations()
      : [];

    const allApplied = [...sqlApplied, ...cosmosApplied].sort(
      (a, b) => b.executedAt.getTime() - a.executedAt.getTime()
    );

    if (allApplied.length === 0) {
      console.log(chalk.yellow('⚠️  No migrations to roll back'));
      return;
    }

    const toRollback = allApplied.slice(0, steps);

    console.log(chalk.yellow(`📋 ${toRollback.length} migration(s) to roll back\n`));

    for (const record of toRollback) {
      const migration = this.migrations.find((m) => m.id === record.id);

      if (!migration) {
        console.log(chalk.yellow(`⚠️  Skipping ${record.id}: Migration file not found`));
        continue;
      }

      const executor = this.getExecutorForMigration(migration);

      if (!executor) {
        console.log(
          chalk.yellow(`⚠️  Skipping ${migration.id}: No executor for ${migration.database}`)
        );
        continue;
      }

      try {
        console.log(chalk.blue(`◀️  Rolling back: ${migration.id} - ${migration.description}`));
        await executor.rollbackMigration(migration);
      } catch (error) {
        console.error(
          chalk.red(`❌ Rollback of ${migration.id} failed: ${error}`)
        );
        throw error;
      }
    }

    console.log(chalk.bold.green('\n✅ Rollback completed successfully\n'));
  }

  async status(): Promise<void> {
    console.log(chalk.bold.cyan('\n📊 Migration Status\n'));

    const sqlApplied = this.sqlExecutor
      ? await this.sqlExecutor.getAppliedMigrations()
      : [];
    const cosmosApplied = this.cosmosExecutor
      ? await this.cosmosExecutor.getAppliedMigrations()
      : [];

    const appliedIds = new Set([
      ...sqlApplied.map((m) => m.id),
      ...cosmosApplied.map((m) => m.id),
    ]);

    console.log(chalk.bold('Applied Migrations:'));
    if (appliedIds.size === 0) {
      console.log(chalk.gray('  (none)'));
    } else {
      [...sqlApplied, ...cosmosApplied]
        .sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime())
        .forEach((m) => {
          console.log(
            chalk.green(`  ✓ ${m.id} (${m.executedAt.toISOString()})`)
          );
        });
    }

    const pending = this.migrations.filter((m) => !appliedIds.has(m.id));

    console.log(chalk.bold('\nPending Migrations:'));
    if (pending.length === 0) {
      console.log(chalk.gray('  (none)'));
    } else {
      pending.forEach((m) => {
        console.log(chalk.yellow(`  ○ ${m.id} - ${m.description}`));
      });
    }

    console.log();
  }

  async validate(): Promise<boolean> {
    console.log(chalk.bold.cyan('\n🔍 Validating migrations\n'));

    const sqlApplied = this.sqlExecutor
      ? await this.sqlExecutor.getAppliedMigrations()
      : [];
    const cosmosApplied = this.cosmosExecutor
      ? await this.cosmosExecutor.getAppliedMigrations()
      : [];

    const allApplied = [...sqlApplied, ...cosmosApplied];
    let isValid = true;

    for (const record of allApplied) {
      const migration = this.migrations.find((m) => m.id === record.id);

      if (!migration) {
        console.log(
          chalk.red(`❌ Migration ${record.id} is applied but file not found`)
        );
        isValid = false;
        continue;
      }

      const currentChecksum = this.calculateChecksum(migration);
      if (currentChecksum !== record.checksum) {
        console.log(
          chalk.red(
            `❌ Migration ${record.id} checksum mismatch (file may have been modified)`
          )
        );
        isValid = false;
      } else {
        console.log(chalk.green(`✓ ${migration.id}`));
      }
    }

    if (isValid) {
      console.log(chalk.bold.green('\n✅ All migrations are valid\n'));
    } else {
      console.log(chalk.bold.red('\n❌ Some migrations are invalid\n'));
    }

    return isValid;
  }

  private getExecutorForMigration(migration: Migration): MigrationExecutor | null {
    if (migration.database === 'sql' && this.sqlExecutor) {
      return this.sqlExecutor;
    }

    if (migration.database === 'cosmos' && this.cosmosExecutor) {
      return this.cosmosExecutor;
    }

    return null;
  }

  private calculateChecksum(migration: Migration): string {
    const crypto = require('crypto');
    if (migration.checksum) return migration.checksum;

    const content = `${migration.id}:${migration.description}:${migration.up.toString()}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getSqlExecutor(): SqlMigrationExecutor | null {
    return this.sqlExecutor;
  }

  getCosmosExecutor(): CosmosMigrationExecutor | null {
    return this.cosmosExecutor;
  }
}
