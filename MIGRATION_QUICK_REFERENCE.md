# Database Migration Quick Reference

## Common Commands

```bash
# Check migration status
pnpm migrate:status

# Run all pending migrations
pnpm migrate

# Run specific number of migrations
pnpm migrate up --steps 1

# Rollback last migration
pnpm migrate:down

# Rollback multiple migrations
pnpm migrate down --steps 3

# Validate checksums
pnpm migrate:validate

# Create new SQL migration
pnpm migrate:create "description here" --type sql --author "your-name"

# Create new Cosmos migration
pnpm migrate:create "description here" --type cosmos --author "your-name"
```

## Migration File Template

### SQL Migration

```typescript
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T120000_add_feature',
  description: 'Add new feature table',
  timestamp: '2025-11-20T12:00:00.000Z',
  author: 'developer',
  database: 'sql',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`
      CREATE TABLE FeatureTable (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Name NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
      );
      
      CREATE INDEX IX_FeatureTable_Name ON FeatureTable(Name);
    `);
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const pool = executor.getPool();
    
    await pool.request().query(`DROP TABLE FeatureTable;`);
  }
};

export default migration;
```

### Cosmos DB Migration

```typescript
import { Migration } from '@life-psychology/db-migrations';

const migration: Migration = {
  id: '20251120T120000_create_container',
  description: 'Create new container',
  timestamp: '2025-11-20T12:00:00.000Z',
  author: 'developer',
  database: 'cosmos',
  
  async up() {
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    
    await database.containers.createIfNotExists({
      id: 'my-container',
      partitionKey: { paths: ['/userId'] },
      defaultTtl: 86400, // 24 hours
    });
  },
  
  async down() {
    const executor = (global as any).__migrationExecutor;
    const database = executor.getDatabase();
    await database.container('my-container').delete();
  }
};

export default migration;
```

## Environment Setup

Create `packages/db-migrations/.env`:

```env
SQL_CONNECTION_STRING=Server=lpa-sql-server.database.windows.net;Database=lpa-applications-db;User Id=admin;Password=PASS;Encrypt=true
COSMOS_ENDPOINT=https://account.documents.azure.com:443/
COSMOS_KEY=your-key-here
COSMOS_DATABASE=lpa-ab-testing
MIGRATIONS_PATH=../../migrations
CHANGELOG_TABLE=DatabaseChangeLog
```

## Troubleshooting

### Connection Failed
```bash
# Test SQL connection
sqlcmd -S lpa-sql-server.database.windows.net -U admin -P "password" -Q "SELECT 1"
```

### Check Applied Migrations
```sql
SELECT * FROM DatabaseChangeLog ORDER BY ExecutedAt DESC;
```

### Reset Failed Migration
```sql
UPDATE DatabaseChangeLog 
SET Status = 'failed' 
WHERE Id = 'migration-id-here';
```

### Checksum Mismatch
- **Never modify applied migrations**
- Create a new migration to fix issues
- Checksums prevent unauthorized changes

## Best Practices

✅ **DO**:
- Test migrations in development first
- Keep migrations small and focused
- Implement both `up()` and `down()`
- Use transactions (SQL automatically wraps)
- Add indexes for foreign keys
- Version control all migrations

❌ **DON'T**:
- Modify applied migrations
- Skip migrations
- Delete migration files
- Mix schema and data changes
- Forget to test rollbacks

## CI/CD Integration

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Run Migrations
  run: pnpm migrate
  env:
    SQL_CONNECTION_STRING: ${{ secrets.SQL_CONNECTION_STRING }}
    COSMOS_ENDPOINT: ${{ secrets.COSMOS_ENDPOINT }}
    COSMOS_KEY: ${{ secrets.COSMOS_KEY }}
```

## Files & Locations

```
packages/db-migrations/     # Package source
migrations/sql/             # SQL migrations
migrations/cosmos/          # Cosmos migrations
.env                        # Credentials (DO NOT COMMIT)
```

## Status Output Example

```
📊 Migration Status

Database: Azure SQL (lpa-applications-db)
Changelog Table: DatabaseChangeLog

✅ Applied Migrations (2):
  • 20251120T000000_initial_schema (0.5s) - Initial database schema
  • 20251120T010000_add_preferences (0.2s) - Add user preferences

⏳ Pending Migrations (1):
  • 20251120T020000_add_sessions - Add session tracking

Last Migration: 2025-11-20T01:00:00Z (2 hours ago)
```

## Quick Links

- [Full Setup Guide](./MIGRATION_SYSTEM_SETUP.md)
- [Package Documentation](./packages/db-migrations/README.md)
- [System Ready Report](./DB_MIGRATION_SYSTEM_READY.md)
