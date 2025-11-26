# Flyway + Cosmos DB Architecture

## Overview

This system uses **Flyway** for SQL migrations and a **simplified Cosmos DB structure** for audit trails and version control metadata.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Migration System                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Flyway     │────▶│  Azure SQL   │     │  Cosmos DB   │   │
│  │  (node-fly   │     │  Database    │◀────│  (Audit Log) │   │
│  │   waydb)     │     │              │     │              │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                     │                     │           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│  Migrations in        Migration Tables      Single Container   │
│  /db/migrations/      (Flyway tracking)     (version-control)  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cosmos DB Structure

### Two Databases
- **lpa-dbvc-dev**: Development/Staging environment
- **lpa-dbvc-prod**: Production environment

### Single Container Approach
Each database has **one container**: `version-control`

**Partition Key**: `/entityType`

**Entity Types**:
- `migration`: Migration metadata and scripts
- `schema-snapshot`: Point-in-time schema captures
- `change-event`: Audit trail events

### Document Structure

```json
// Migration document
{
  "id": "20251127_143000_add_user_prefs",
  "migrationId": "20251127_143000_add_user_prefs",
  "databaseId": "lpa-bloom-db-dev",
  "entityType": "migration",
  "description": "Add user preferences table",
  "upScript": "CREATE TABLE ...",
  "downScript": "DROP TABLE ...",
  "checksum": "abc123...",
  "author": "developer@example.com",
  "createdAt": "2025-11-27T14:30:00Z",
  "_partitionKey": "migration"
}

// Schema snapshot document
{
  "id": "snapshot_20251127_143500",
  "snapshotId": "snapshot_20251127_143500",
  "databaseId": "lpa-bloom-db-dev",
  "entityType": "schema-snapshot",
  "capturedAt": "2025-11-27T14:35:00Z",
  "schemaDefinition": { ... },
  "_partitionKey": "schema-snapshot"
}

// Change event document
{
  "id": "lpa-bloom-db-dev_20251127_143000_1732718700000",
  "migrationId": "20251127_143000_add_user_prefs",
  "databaseId": "lpa-bloom-db-dev",
  "entityType": "change-event",
  "eventType": "completed",
  "timestamp": "2025-11-27T14:45:00Z",
  "_partitionKey": "change-event"
}
```

## Configuration

### Development (local.settings.json)
```json
{
  "Values": {
    "SQL_SERVER": "lpa-sql-server.database.windows.net",
    "SQL_DATABASE": "lpa-bloom-db-dev",
    "SQL_USER": "lpaadmin",
    "SQL_PASSWORD": "***",
    "COSMOS_DB_CONNECTION_STRING": "AccountEndpoint=https://...",
    "COSMOS_DB_DATABASE": "conversion-analytics",
    "DBVC_COSMOS_CONNECTION_STRING": "AccountEndpoint=https://...",
    "DBVC_COSMOS_DATABASE": "lpa-dbvc-dev",
    "DBVC_COSMOS_CONTAINER": "version-control",
    "DBVC_ENVIRONMENT": "dev"
  }
}
```

### Production (Azure Function App Settings)
```bash
DBVC_COSMOS_DATABASE=lpa-dbvc-prod
DBVC_COSMOS_CONTAINER=version-control
DBVC_ENVIRONMENT=prod
```

## Benefits of This Approach

### 1. Cost-Effective
- Single container reduces RU consumption
- Serverless Cosmos DB billing
- Only pay for what you use

### 2. Simple & Maintainable
- One container per environment to manage
- Clear partition strategy by entity type
- Easy to query all migrations, snapshots, or events

### 3. Microsoft Best Practice
- Flyway is industry standard (used by thousands of companies)
- Temporal tables in SQL for history (if needed)
- Single container is recommended for small-to-medium workloads

### 4. Scalable
- Can add more entity types without creating containers
- Partition key ensures good performance
- Easy to expand to more environments

## Migration Workflow

### Using Flyway (Recommended for SQL)
```bash
cd db
npm run migrate:dev   # Development
npm run migrate:prod  # Production
```

### Using DBVC API (For Cosmos metadata)
```bash
# Create migration metadata
curl -X POST http://localhost:7071/api/dbvc/migrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "add_feature",
    "databaseId": "lpa-bloom-db-dev",
    "author": "dev@example.com"
  }'

# Capture schema snapshot
curl -X POST http://localhost:7071/api/dbvc/snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "databaseId": "lpa-bloom-db-dev",
    "environment": "dev",
    "capturedBy": "dev@example.com"
  }'
```

## Querying Cosmos DB

### Get all migrations
```sql
SELECT * FROM c WHERE c.entityType = 'migration'
```

### Get recent snapshots
```sql
SELECT * FROM c 
WHERE c.entityType = 'schema-snapshot'
ORDER BY c.capturedAt DESC
```

### Get change events for a database
```sql
SELECT * FROM c 
WHERE c.entityType = 'change-event' 
  AND c.databaseId = 'lpa-bloom-db-dev'
ORDER BY c.timestamp DESC
```

## Environment Mapping

| Branch | Environment Variable | SQL Database | Cosmos Database |
|--------|---------------------|--------------|-----------------|
| `develop` | `DBVC_ENVIRONMENT=dev` | `lpa-bloom-db-dev` | `lpa-dbvc-dev` |
| `staging` | `DBVC_ENVIRONMENT=dev` | `lpa-bloom-db-dev` | `lpa-dbvc-dev` |
| `main` | `DBVC_ENVIRONMENT=prod` | `lpa-bloom-db-prod` | `lpa-dbvc-prod` |

**Note**: Staging uses dev databases for second validation pass before production.

## Resources Created

### Cosmos DB Account: `cdbt42kldozqahcu`
- **Location**: Australia East
- **Resource Group**: rg-lpa-prod-opt
- **Capacity**: Serverless

### Databases
1. **conversion-analytics** (A/B testing data)
   - Container: `user-sessions`

2. **lpa-dbvc-dev** (Version control - dev)
   - Container: `version-control`

3. **lpa-dbvc-prod** (Version control - prod)
   - Container: `version-control`

## Next Steps

1. ✅ Cosmos DB dev database created
2. ✅ Cosmos DB prod database created  
3. ✅ Single container approach implemented
4. ✅ Configuration updated for both environments
5. ✅ TypeScript types updated with entityType
6. ⏭️ Test smoke tests pass with new configuration
7. ⏭️ Deploy to Azure with production settings
