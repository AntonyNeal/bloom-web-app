#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { MigrationRunner } from './runner';
import { MigrationConfig } from './types';

dotenv.config();

const program = new Command();

program
  .name('db-migrate')
  .description('Database migration tool (Liquibase-style) for Azure SQL and Cosmos DB')
  .version('1.0.0');

program
  .command('migrate [direction]')
  .description('Run migrations (up/down)')
  .option('-s, --steps <number>', 'Number of migrations to apply/rollback', '0')
  .action(async (direction: string = 'up', options) => {
    const config = await loadConfig();
    const runner = new MigrationRunner(config);

    try {
      await runner.initialize();

      const steps = parseInt(options.steps) || undefined;

      if (direction === 'down') {
        await runner.migrateDown(steps || 1);
      } else {
        await runner.migrateUp(steps);
      }
    } catch (error) {
      console.error(chalk.red(`Migration failed: ${error}`));
      process.exit(1);
    } finally {
      await runner.cleanup();
    }
  });

program
  .command('status')
  .description('Show migration status')
  .action(async () => {
    const config = await loadConfig();
    const runner = new MigrationRunner(config);

    try {
      await runner.initialize();
      await runner.status();
    } catch (error) {
      console.error(chalk.red(`Failed to get status: ${error}`));
      process.exit(1);
    } finally {
      await runner.cleanup();
    }
  });

program
  .command('validate')
  .description('Validate applied migrations against current files')
  .action(async () => {
    const config = await loadConfig();
    const runner = new MigrationRunner(config);

    try {
      await runner.initialize();
      const isValid = await runner.validate();
      process.exit(isValid ? 0 : 1);
    } catch (error) {
      console.error(chalk.red(`Validation failed: ${error}`));
      process.exit(1);
    } finally {
      await runner.cleanup();
    }
  });

program
  .command('create <name>')
  .description('Create a new migration file')
  .option('-t, --type <type>', 'Database type (sql|cosmos)', 'sql')
  .option('-a, --author <author>', 'Migration author', 'system')
  .action(async (name: string, options) => {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.ts`;
      const migrationsPath = process.env.MIGRATIONS_PATH || './migrations';
      const filePath = path.join(migrationsPath, options.type, filename);

      const template = generateMigrationTemplate(
        `${timestamp}_${name}`,
        name,
        options.author,
        options.type
      );

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, template);

      console.log(chalk.green(`✅ Created migration: ${filePath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to create migration: ${error}`));
      process.exit(1);
    }
  });

async function loadConfig(): Promise<MigrationConfig> {
  const config: MigrationConfig = {
    migrationsPath: process.env.MIGRATIONS_PATH || './migrations',
    changelogTable: process.env.CHANGELOG_TABLE || 'DatabaseChangeLog',
  };

  if (process.env.SQL_CONNECTION_STRING) {
    config.sql = {
      connectionString: process.env.SQL_CONNECTION_STRING,
      database: process.env.SQL_DATABASE || '',
    };
  }

  if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
    config.cosmos = {
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY,
      database: process.env.COSMOS_DATABASE || 'migrations',
      container: process.env.COSMOS_CONTAINER || 'changelog',
    };
  }

  if (!config.sql && !config.cosmos) {
    throw new Error('No database configuration found. Set SQL_CONNECTION_STRING or COSMOS_* env vars');
  }

  return config;
}

function generateMigrationTemplate(
  id: string,
  description: string,
  author: string,
  database: 'sql' | 'cosmos'
): string {
  if (database === 'sql') {
    return `import { Migration } from '@life-psychology/db-migrations';
import * as sql from 'mssql';

const migration: Migration = {
  id: '${id}',
  description: '${description}',
  timestamp: '${new Date().toISOString()}',
  author: '${author}',
  database: 'sql',
  
  async up() {
    // Get SQL connection pool from executor
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    // Write your migration SQL here
    await pool.request().query(\`
      -- Your SQL migration code here
      -- Example:
      -- ALTER TABLE Applications ADD NewColumn NVARCHAR(100);
    \`);
  },
  
  async down() {
    // Get SQL connection pool from executor
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    // Write your rollback SQL here
    await pool.request().query(\`
      -- Your rollback SQL code here
      -- Example:
      -- ALTER TABLE Applications DROP COLUMN NewColumn;
    \`);
  }
};

export default migration;
`;
  } else {
    return `import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '${id}',
  description: '${description}',
  timestamp: '${new Date().toISOString()}',
  author: '${author}',
  database: 'cosmos',
  
  async up() {
    // Get Cosmos client from executor
    const executor = (global as any).__migrationExecutor;
    const client = executor.getClient();
    const database = executor.getDatabase();
    
    // Write your Cosmos DB migration code here
    // Example:
    // const { container } = await database.containers.createIfNotExists({
    //   id: 'your-container',
    //   partitionKey: { paths: ['/id'] }
    // });
  },
  
  async down() {
    // Get Cosmos client from executor
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    
    // Write your rollback code here
    // Example:
    // await database.container('your-container').delete();
  }
};

export default migration;
`;
  }
}

program.parse();
