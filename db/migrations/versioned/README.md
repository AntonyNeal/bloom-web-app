# Versioned Migrations

This directory contains migrations managed by the Database Version Control (DBVC) system.

## Naming Convention

Migrations follow the format: `{timestamp}_{description}.sql`

Example: `20251127_143000_add_user_preferences.sql`

## Structure

Each migration file contains:
- Header comment with metadata
- UP migration script

The DOWN (rollback) script is stored separately in the migration registry and is not included in the file itself.

## Creating Migrations

Use the CLI tool to create properly formatted migrations:

```powershell
.\scripts\db-version-control\New-Migration.ps1 -Name "add_user_preferences" -Database "lpa-bloom-sql-dev"
```

Or via the API:

```bash
curl -X POST http://localhost:7071/api/dbvc/migrations \
  -H "Content-Type: application/json" \
  -d '{"name": "add_user_preferences", "databaseId": "lpa-bloom-sql-dev"}'
```

## Important Notes

1. **Never modify a migration after it has been applied** - this will cause checksum mismatches
2. **Always include a rollback script** when creating migrations
3. **Test migrations in dev/staging** before applying to production
4. **Migrations are immutable** - create a new migration to make changes
