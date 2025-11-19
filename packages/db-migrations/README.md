# Database Migrations Package

Liquibase-style database migration system for Azure SQL Database and Azure Cosmos DB.

## Features

- ✅ **Version Control for Database Schema** - Track all schema changes in code
- ✅ **Rollback Support** - Safely rollback migrations with `down()` functions
- ✅ **Checksum Validation** - Detect modified migrations automatically
- ✅ **Multi-Database Support** - Manage both SQL and Cosmos DB migrations
- ✅ **Transaction Safety** - SQL migrations run in transactions
- ✅ **CLI Interface** - Easy-to-use command-line tool
- ✅ **TypeScript First** - Full type safety and IntelliSense

## Installation

```bash
# From monorepo root
pnpm install

# Build the package
cd packages/db-migrations
pnpm build
```

## Configuration

Create a `.env` file in your project root or function app:

```env
# Azure SQL Database
SQL_CONNECTION_STRING=Server=lpa-sql-server.database.windows.net;Database=lpa-applications-db;User Id=lpaadmin;Password=YourPassword;Encrypt=true

# Azure Cosmos DB (optional)
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE=your-database
COSMOS_CONTAINER=your-container

# Migration settings
MIGRATIONS_PATH=./migrations
CHANGELOG_TABLE=DatabaseChangeLog
```

## Usage

### CLI Commands

```bash
# Show migration status
pnpm migrate:status

# Run all pending migrations
pnpm migrate

# Run specific number of migrations
pnpm migrate up --steps 1

# Rollback last migration
pnpm migrate down

# Rollback last 3 migrations
pnpm migrate down --steps 3

# Validate applied migrations
pnpm migrate:validate

# Create a new migration
pnpm migrate:create "add user preferences table" --type sql --author "your-name"
```

### Migration Structure

Migrations are organized by database type:

```
migrations/
├── sql/
│   ├── 20251120T000000_initial_schema.ts
│   ├── 20251120T120000_add_user_preferences.ts
│   └── 20251121T093000_add_audit_columns.ts
└── cosmos/
    ├── 20251120T000000_create_containers.ts
    └── 20251120T150000_add_indexes.ts
```

### Creating Migrations

#### SQL Migration Example

```typescript
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T120000_add_preferences',
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
        Language NVARCHAR(10) DEFAULT 'en',
        Notifications BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
      );
      
      CREATE INDEX IX_UserPreferences_UserId ON UserPreferences(UserId);
    `);
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      DROP TABLE UserPreferences;
    `);
  }
};

export default migration;
```

#### Cosmos DB Migration Example

```typescript
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T150000_create_user_sessions',
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

### Programmatic Usage

```typescript
import { MigrationRunner, MigrationConfig } from '@life-psychology/db-migrations';

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
  await runner.status();
} finally {
  await runner.cleanup();
}
```

## Migration Best Practices

### 1. **Never Modify Applied Migrations**
Once a migration is applied to production, never modify it. Create a new migration instead.

### 2. **Always Provide Rollback**
Implement the `down()` function for safe rollbacks during deployment issues.

### 3. **Test Migrations**
Test both `up()` and `down()` in a dev environment before deploying.

### 4. **Use Transactions**
SQL migrations automatically use transactions. Keep migrations atomic.

### 5. **Data Migrations**
Separate schema changes from data migrations when possible:

```typescript
// Good: Schema first
migrations/
  20251120_001_add_column.ts
  20251120_002_migrate_data.ts
  20251120_003_add_constraints.ts
```

### 6. **Naming Convention**
Use descriptive names: `YYYYMMDDTHHMMSS_descriptive_name.ts`

### 7. **Documentation**
Add comments explaining complex migrations:

```typescript
async up() {
  // Migrate existing NULL values to default before adding NOT NULL constraint
  await pool.request().query(`
    UPDATE Applications 
    SET PreferredName = CONCAT(FirstName, ' ', LastName)
    WHERE PreferredName IS NULL;
    
    ALTER TABLE Applications 
    ALTER COLUMN PreferredName NVARCHAR(100) NOT NULL;
  `);
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Database Migrations

on:
  push:
    branches: [main, staging]
    paths:
      - 'packages/db-migrations/**'
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
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
      
      - name: Build migrations package
        run: pnpm --filter @life-psychology/db-migrations build
      
      - name: Validate migrations
        run: pnpm migrate:validate
        env:
          SQL_CONNECTION_STRING: ${{ secrets.SQL_CONNECTION_STRING }}
      
      - name: Run migrations
        run: pnpm migrate
        env:
          SQL_CONNECTION_STRING: ${{ secrets.SQL_CONNECTION_STRING }}
```

## Troubleshooting

### Connection Issues

```bash
# Test SQL connection
sqlcmd -S lpa-sql-server.database.windows.net -U lpaadmin -P "password" -d lpa-applications-db -Q "SELECT 1"
```

### Migration Stuck

```bash
# Check changelog table
SELECT * FROM DatabaseChangeLog ORDER BY ExecutedAt DESC;

# Manually mark migration as failed if stuck in 'running' status
UPDATE DatabaseChangeLog SET Status = 'failed' WHERE Id = 'stuck-migration-id';
```

### Checksum Mismatch

```bash
# Validate all migrations
pnpm migrate:validate

# If you've intentionally modified a migration (not recommended):
# Update checksum manually in DatabaseChangeLog table
```

## Architecture

```
┌─────────────────────┐
│   CLI (cli.ts)      │
│   - Commands        │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ MigrationRunner     │
│ - Orchestration     │
│ - Status tracking   │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
      v         v
┌─────────┐ ┌──────────┐
│   SQL   │ │  Cosmos  │
│Executor │ │ Executor │
└─────────┘ └──────────┘
      │         │
      v         v
┌─────────┐ ┌──────────┐
│Azure SQL│ │ Cosmos DB│
└─────────┘ └──────────┘
```

## Related Documentation

- [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Liquibase Concepts](https://www.liquibase.org/get-started/how-liquibase-works)

## Support

For issues or questions, see the main [monorepo README](../../README.md).
