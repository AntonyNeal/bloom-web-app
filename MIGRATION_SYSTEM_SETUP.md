# Database Migration System Setup Guide

## Overview

This monorepo now includes a Liquibase-style database migration system in `packages/db-migrations/`. It manages schema changes for:

- **Azure SQL Database** - Application management, user data
- **Azure Cosmos DB** - A/B testing data, session storage

## Quick Start

### 1. Install Dependencies

```bash
# From monorepo root
pnpm install

# Build the migration package
pnpm --filter @life-psychology/db-migrations build
```

### 2. Configure Environment

Create `.env` file in `packages/db-migrations/`:

```env
# Azure SQL Database
SQL_CONNECTION_STRING=Server=lpa-sql-server.database.windows.net;Database=lpa-applications-db;User Id=lpaadmin;Password=YourPassword;Encrypt=true

# Azure Cosmos DB (optional)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE=lpa-ab-testing

# Settings
MIGRATIONS_PATH=../../migrations
CHANGELOG_TABLE=DatabaseChangeLog
```

### 3. Run Migrations

```bash
# Check status
pnpm migrate:status

# Run all pending migrations
pnpm migrate

# Rollback last migration
pnpm migrate:down
```

## Migration Structure

```
bloom-web-app/
├── packages/
│   └── db-migrations/          # Migration engine
│       ├── src/
│       │   ├── cli.ts          # CLI interface
│       │   ├── runner.ts       # Migration orchestration
│       │   ├── sql-executor.ts # Azure SQL executor
│       │   └── cosmos-executor.ts # Cosmos DB executor
│       └── package.json
├── migrations/                  # Migration files
│   ├── sql/                    # SQL migrations
│   │   ├── 20251120T000000_initial_schema.ts
│   │   └── 20251120T120000_add_preferences.ts
│   └── cosmos/                 # Cosmos DB migrations
│       └── 20251120T010000_create_containers.ts
└── .env                        # Database credentials
```

## Creating Migrations

### SQL Migration

```bash
pnpm migrate:create "add user preferences table" --type sql --author "your-name"
```

This generates: `migrations/sql/20251120T120000_add_user_preferences_table.ts`

Example:

```typescript
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T120000_add_user_preferences',
  description: 'Add user preferences table',
  timestamp: '2025-11-20T12:00:00.000Z',
  author: 'developer',
  database: 'sql',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      CREATE TABLE UserPreferences (
        UserId UNIQUEIDENTIFIER PRIMARY KEY,
        Theme NVARCHAR(50) DEFAULT 'light',
        Notifications BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
      );
    `);
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`DROP TABLE UserPreferences;`);
  }
};

export default migration;
```

### Cosmos DB Migration

```bash
pnpm migrate:create "create sessions container" --type cosmos --author "your-name"
```

Example:

```typescript
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T150000_create_sessions',
  description: 'Create user sessions container',
  timestamp: '2025-11-20T15:00:00.000Z',
  author: 'developer',
  database: 'cosmos',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    
    await database.containers.createIfNotExists({
      id: 'user-sessions',
      partitionKey: { paths: ['/userId'] },
      defaultTtl: 86400, // 24 hours
    });
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    await database.container('user-sessions').delete();
  }
};

export default migration;
```

## Commands Reference

```bash
# Status
pnpm migrate:status              # Show applied and pending migrations

# Apply
pnpm migrate                     # Run all pending migrations
pnpm migrate up                  # Same as above
pnpm migrate up --steps 1        # Run only 1 migration

# Rollback
pnpm migrate down                # Rollback last migration
pnpm migrate down --steps 3      # Rollback last 3 migrations

# Validation
pnpm migrate:validate            # Validate checksums of applied migrations

# Create
pnpm migrate:create "description" --type sql --author "name"
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/db-migrations.yml`:

```yaml
name: Database Migrations

on:
  push:
    branches: [main, staging]
    paths:
      - 'packages/db-migrations/**'
      - 'migrations/**'
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build migration package
        run: pnpm --filter @life-psychology/db-migrations build
      
      - name: Validate migrations
        run: pnpm migrate:validate
        env:
          SQL_CONNECTION_STRING: ${{ secrets.SQL_CONNECTION_STRING }}
          COSMOS_ENDPOINT: ${{ secrets.COSMOS_ENDPOINT }}
          COSMOS_KEY: ${{ secrets.COSMOS_KEY }}
      
      - name: Run migrations
        run: pnpm migrate
        env:
          SQL_CONNECTION_STRING: ${{ secrets.SQL_CONNECTION_STRING }}
          COSMOS_ENDPOINT: ${{ secrets.COSMOS_ENDPOINT }}
          COSMOS_KEY: ${{ secrets.COSMOS_KEY }}
```

### Azure Function Integration

In your Azure Functions (e.g., `bloom-functions`):

```typescript
import { MigrationRunner, MigrationConfig } from '@life-psychology/db-migrations';

async function ensureDatabaseSchema() {
  const config: MigrationConfig = {
    sql: {
      connectionString: process.env.SQL_CONNECTION_STRING!,
      database: 'lpa-applications-db',
    },
    migrationsPath: './migrations',
  };

  const runner = new MigrationRunner(config);
  
  try {
    await runner.initialize();
    await runner.migrateUp();
    console.log('✅ Database schema up to date');
  } finally {
    await runner.cleanup();
  }
}

// Run on function app startup
ensureDatabaseSchema().catch(console.error);
```

## Best Practices

### ✅ DO

1. **Version Control Everything** - Commit all migrations to git
2. **Never Modify Applied Migrations** - Create new migrations instead
3. **Test Both Directions** - Test `up()` and `down()` in dev
4. **Use Transactions** - SQL migrations use transactions automatically
5. **Keep Migrations Small** - One logical change per migration
6. **Add Indexes** - Create indexes for foreign keys and frequently queried columns

### ❌ DON'T

1. **Don't Modify Applied Migrations** - Once in production, it's immutable
2. **Don't Skip Migrations** - Apply them in order
3. **Don't Delete Migrations** - They're part of your database history
4. **Don't Mix Schema and Data** - Separate when possible
5. **Don't Forget Rollbacks** - Always implement `down()` functions

## Troubleshooting

### Connection Issues

```bash
# Test SQL connection
sqlcmd -S lpa-sql-server.database.windows.net -U lpaadmin -P "password" -Q "SELECT 1"
```

### Check Changelog Table

```sql
-- View applied migrations
SELECT * FROM DatabaseChangeLog ORDER BY ExecutedAt DESC;

-- Check for failed migrations
SELECT * FROM DatabaseChangeLog WHERE Status = 'failed';
```

### Reset Failed Migration

```sql
-- If a migration is stuck in 'running' status
UPDATE DatabaseChangeLog 
SET Status = 'failed', 
    ErrorMessage = 'Manually reset' 
WHERE Id = 'stuck-migration-id';
```

### Checksum Mismatch

If you see checksum validation errors:

```bash
# Validate all migrations
pnpm migrate:validate

# Check which migrations have issues
SELECT Id, Checksum FROM DatabaseChangeLog;
```

**Note**: Checksum mismatches usually mean a migration file was modified after being applied. This is dangerous and should be avoided.

## Migration from Old System

If you have existing migrations in `apps/bloom/api/migrations/`:

1. **Review old migrations** - Check what was applied
2. **Create equivalent new migrations** - Use new format
3. **Mark as applied** - Insert records into `DatabaseChangeLog` table
4. **Remove old system** - Delete old migration files

Example marking migration as applied:

```sql
INSERT INTO DatabaseChangeLog 
  (Id, ExecutionTime, Checksum, Status, Author, Description)
VALUES 
  ('20251120T000000_initial_schema', 0, 'legacy', 'success', 'system', 'Legacy migration');
```

## Resources

- [Package README](./packages/db-migrations/README.md) - Detailed API documentation
- [Liquibase Concepts](https://www.liquibase.org/get-started/how-liquibase-works) - Similar patterns
- [Azure SQL Docs](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [Cosmos DB Docs](https://learn.microsoft.com/en-us/azure/cosmos-db/)

## Support

For questions or issues:
1. Check existing migrations in `migrations/` for examples
2. Review package README in `packages/db-migrations/README.md`
3. Test in development environment first
4. Ensure all environment variables are set correctly
