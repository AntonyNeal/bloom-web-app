# Database Version Control System

A comprehensive database migration and version control system for Life Psychology Australia (LPA), providing schema change tracking, rollback capability, and full audit trails.

## Overview

This system manages database schema changes across Azure SQL Database and Cosmos DB instances, enabling:

- **Reproducible Deployments**: All schema changes are versioned and tracked
- **Rollback Capability**: Migrations include down scripts for safe rollback
- **Audit Trail**: Full history of all changes stored in Cosmos DB
- **Schema Snapshots**: Point-in-time captures for drift detection
- **CI/CD Integration**: Automated migrations via GitHub Actions

## Database Architecture

**4 Databases Total (2 SQL + 2 Cosmos):**

| Type | Dev | Prod |
|------|-----|------|
| **SQL** | `lpa-bloom-db-dev` | `lpa-bloom-db-prod` |
| **Cosmos** | `lpa-dbvc-dev` (database) | `lpa-dbvc-prod` (database) |

**Branch → Database Mapping:**
- `develop` branch → Dev DBs (first deployment)
- `staging` branch → Dev DBs (second validation pass with extended tests)
- `main` branch → Prod DBs

> **Note:** Staging uses dev databases to run a second validation pass before production deployment. This ensures migrations are tested twice before going to prod.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Database Version Control System                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   PowerShell    │    │  Azure Functions │    │  GitHub Actions  │          │
│  │   CLI Tools     │───▶│  HTTP API        │◀───│   CI/CD Pipeline │          │
│  └─────────────────┘    └────────┬────────┘    └─────────────────┘          │
│                                  │                                            │
│                                  ▼                                            │
│                    ┌─────────────────────────┐                               │
│                    │   Migration Service     │                               │
│                    │   (TypeScript)          │                               │
│                    └─────────────┬───────────┘                               │
│                                  │                                            │
│              ┌───────────────────┼───────────────────┐                       │
│              ▼                   ▼                   ▼                       │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │  Azure SQL DB     │  │  Cosmos DB        │  │  Key Vault        │       │
│  │  ───────────────  │  │  ───────────────  │  │  ───────────────  │       │
│  │  • migration_     │  │  • change-events  │  │  • Connection     │       │
│  │    registry       │  │  • schema-        │  │    Strings        │       │
│  │  • execution_     │  │    snapshots      │  │  • Secrets        │       │
│  │    history        │  │  • migrations     │  │                   │       │
│  │  • applied_status │  │                   │  │                   │       │
│  │  • db_inventory   │  │                   │  │                   │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. SQL Database Schema (`db/migrations/V100__version_control_schema.sql`)

- **db_inventory**: Registers all managed databases
- **migration_registry**: Stores migration definitions (up/down scripts)
- **migration_execution_history**: Tracks each migration run
- **migration_applied_status**: Quick lookup for applied migrations
- **schema_snapshots**: References to point-in-time schema captures
- **migration_locks**: Prevents concurrent migrations

### 2. TypeScript Migration Service (`api/src/db-version-control/`)

- **types.ts**: TypeScript interfaces for all entities
- **config.ts**: Configuration and utility functions
- **migration-service.ts**: Core service with all migration operations

### 3. Azure Functions API (`api/src/functions/dbvc.ts`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dbvc/migrations` | POST | Create new migration |
| `/api/dbvc/migrations/run` | POST | Execute pending migrations |
| `/api/dbvc/migrations/rollback` | POST | Rollback a migration |
| `/api/dbvc/migrations/status` | GET | Get migration status |
| `/api/dbvc/snapshots` | POST | Capture schema snapshot |
| `/api/dbvc/integrity/verify` | POST | Verify system integrity |
| `/api/dbvc/health` | GET | Health check |

### 4. PowerShell CLI Tools (`scripts/db-version-control/`)

| Script | Purpose |
|--------|---------|
| `New-Migration.ps1` | Create a new migration |
| `Invoke-Migrations.ps1` | Run pending migrations |
| `Undo-Migration.ps1` | Rollback a migration |
| `Get-MigrationStatus.ps1` | Display migration status |
| `Export-SchemaSnapshot.ps1` | Capture schema snapshot |
| `Test-MigrationIntegrity.ps1` | Verify integrity |
| `Initialize-Infrastructure.ps1` | Setup Azure resources |

### 5. GitHub Actions Workflow (`.github/workflows/db-migrations.yml`)

Automated pipeline triggered on changes to `/db/migrations/**`:
1. Validates migration scripts
2. Runs migrations against target environment
3. Captures schema snapshot post-migration
4. Verifies integrity
5. Creates issue on failure (production)

## Quick Start

### 1. Setup Infrastructure

```powershell
# Initialize Azure resources for development
.\scripts\db-version-control\Initialize-Infrastructure.ps1 -Environment dev
```

### 2. Run SQL Migrations

```powershell
# Apply the version control schema
cd db
npm run migrate:dev
```

### 3. Create a New Migration

```powershell
# Create a new migration
.\scripts\db-version-control\New-Migration.ps1 `
    -Name "add_user_preferences" `
    -Database "lpa-bloom-sql-dev" `
    -Author "Your Name"
```

### 4. Run Migrations

```powershell
# Run all pending migrations
.\scripts\db-version-control\Invoke-Migrations.ps1 `
    -Environment dev `
    -Database "lpa-bloom-sql-dev"

# Dry run (preview only)
.\scripts\db-version-control\Invoke-Migrations.ps1 `
    -Environment dev `
    -Database all `
    -DryRun
```

### 5. Check Status

```powershell
# View migration status
.\scripts\db-version-control\Get-MigrationStatus.ps1 -Environment dev -Detailed
```

### 6. Rollback if Needed

```powershell
# Rollback a specific migration
.\scripts\db-version-control\Undo-Migration.ps1 `
    -MigrationId "20251127_143000_add_user_preferences" `
    -Database "lpa-bloom-sql-dev" `
    -Environment dev
```

## Migration File Format

Migrations follow Flyway-compatible naming: `V{version}__{description}.sql`

```sql
-- V101__add_user_preferences.sql

-- UP Migration Script
CREATE TABLE user_preferences (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    preference_key NVARCHAR(100) NOT NULL,
    preference_value NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Note: Down script is stored separately via the API
```

## API Usage Examples

### Create Migration via API

```bash
curl -X POST http://localhost:7071/api/dbvc/migrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "add_user_preferences",
    "databaseId": "lpa-bloom-sql-dev",
    "author": "developer@lpa.com",
    "description": "Add user preferences table",
    "upScript": "CREATE TABLE user_preferences (...);",
    "downScript": "DROP TABLE user_preferences;"
  }'
```

### Run Migrations via API

```bash
curl -X POST http://localhost:7071/api/dbvc/migrations/run \
  -H "Content-Type: application/json" \
  -d '{
    "databaseId": "lpa-bloom-sql-dev",
    "environment": "dev",
    "executor": "developer@lpa.com"
  }'
```

### Get Status via API

```bash
curl "http://localhost:7071/api/dbvc/migrations/status?environment=dev"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SQL_CONNECTION_STRING` | SQL Database connection string |
| `SQL_SERVER` | SQL server hostname (fallback) |
| `SQL_DATABASE` | SQL database name (fallback) |
| `SQL_USER` | SQL username (fallback) |
| `SQL_PASSWORD` | SQL password (fallback) |
| `DBVC_COSMOS_CONNECTION_STRING` | Cosmos DB connection for DBVC |
| `DBVC_COSMOS_DATABASE` | Cosmos database name (default: `version-control`) |
| `DBVC_ENVIRONMENT` | Current environment (dev/prod) |

## Cosmos DB Collections

### change-events
Partition key: `/databaseId`

Stores audit trail of all migration events:
- `started`: Migration execution began
- `completed`: Migration succeeded
- `failed`: Migration failed
- `rolled-back`: Migration was rolled back

### schema-snapshots
Partition key: `/databaseId`

Stores point-in-time schema captures including:
- Table definitions
- View definitions
- Index definitions
- Stored procedures

### migrations
Partition key: `/databaseId`

Backup/sync of migration registry from SQL.

## Best Practices

1. **Always test migrations locally first**
   ```powershell
   .\Invoke-Migrations.ps1 -Environment dev -Database "lpa-bloom-sql-dev" -DryRun
   ```

2. **Include rollback scripts** for all migrations

3. **Use descriptive names** following the pattern: `action_entity_detail`
   - `add_user_preferences`
   - `alter_applications_add_status`
   - `create_audit_log_table`

4. **Capture baseline snapshot** before major changes
   ```powershell
   .\Export-SchemaSnapshot.ps1 -Database "lpa-bloom-sql-prod" -Environment prod -Type baseline
   ```

5. **Verify integrity** after deployments
   ```powershell
   .\Test-MigrationIntegrity.ps1 -Database "lpa-bloom-sql-prod" -Environment prod
   ```

## Troubleshooting

### Migration Stuck (Lock not released)

```powershell
# Verify integrity with auto-fix
.\Test-MigrationIntegrity.ps1 -Database "lpa-bloom-sql-dev" -Environment dev -Fix
```

### Checksum Mismatch

This indicates the migration script was modified after registration. Re-register the migration or investigate the change.

### Schema Drift Detected

The database schema has changed outside of migrations. Capture a new baseline snapshot and investigate manual changes.

## Security

- Connection strings are stored in Azure Key Vault
- Managed Identity is used for Azure resource access where possible
- All operations are logged to Cosmos DB for audit
- Production rollbacks require manual confirmation

## Support

For issues or questions, contact the LPA Development Team or create an issue in the repository.
