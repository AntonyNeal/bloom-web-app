# Bloom Database Migrations

Database version control and migration management using Flyway for Azure SQL Database.

## 📁 Structure

```
db/
├── migrations/           # Versioned SQL migration files
│   ├── V1__initial_schema.sql
│   ├── V2__add_ab_testing.sql
│   └── V3__add_session_tracking.sql
├── scripts/             # Migration scripts
│   └── migrate.js       # Main migration runner
├── .env                 # Database credentials (gitignored)
├── .env.example         # Template for credentials
└── package.json         # Dependencies and scripts
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd db
npm install
```

### 2. Configure Database Credentials

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run Migrations

```bash
# Development
npm run migrate:dev

# Staging
npm run migrate:staging

# Production
npm run migrate:prod
```

## 📝 Migration Naming Convention

Flyway uses a strict naming convention for migration files:

```
V{version}__{description}.sql
```

Examples:
- `V1__initial_schema.sql` - Initial database schema
- `V2__add_ab_testing.sql` - Add A/B testing tables
- `V3__add_session_tracking.sql` - Add session duration tracking
- `V4__add_user_roles.sql` - Add user roles and permissions

**Rules:**
- Version numbers must be unique and sequential
- Use double underscores `__` as separator
- Use descriptive names in snake_case
- Never modify an applied migration (create a new one instead)

## 🛠️ Available Commands

### Migration Commands

```bash
# Run pending migrations
npm run migrate:dev
npm run migrate:staging
npm run migrate:prod

# Show migration status
npm run info

# Validate applied migrations
npm run validate

# Baseline existing database
npm run baseline

# Repair schema history
npm run repair

# Clean database (dev/staging only)
npm run clean
```

## 🔄 CI/CD Integration

The migration system is integrated with GitHub Actions workflow:

```yaml
- name: Run Database Migrations
  working-directory: ./db
  run: |
    npm install
    npm run migrate:${{ env.ENVIRONMENT }}
  env:
    DB_DEV_PASSWORD: ${{ secrets.DB_DEV_PASSWORD }}
    DB_STAGING_PASSWORD: ${{ secrets.DB_STAGING_PASSWORD }}
    DB_PROD_PASSWORD: ${{ secrets.DB_PROD_PASSWORD }}
```

### Required GitHub Secrets

Add these secrets to your repository:
- `DB_DEV_PASSWORD` - Development database password
- `DB_STAGING_PASSWORD` - Staging database password
- `DB_PROD_PASSWORD` - Production database password

## 📋 Creating New Migrations

### Step 1: Create Migration File

```bash
# Create a new migration file with the next version number
cd db/migrations
touch V4__your_migration_description.sql
```

### Step 2: Write SQL

```sql
-- ============================================================================
-- Migration: V4__your_migration_description.sql
-- Description: Brief description of what this migration does
-- Author: Your Name
-- Date: YYYY-MM-DD
-- ============================================================================

-- Your SQL DDL statements here
CREATE TABLE your_table (
  id INT PRIMARY KEY IDENTITY(1,1),
  name NVARCHAR(100) NOT NULL
);
```

### Step 3: Test Locally

```bash
# Always test in development first
npm run migrate:dev

# Verify the migration
npm run info
```

### Step 4: Commit and Deploy

```bash
git add db/migrations/V4__your_migration_description.sql
git commit -m "Add migration: your description"
git push
```

The CI/CD pipeline will automatically run the migration on deploy.

## 🔍 Flyway Schema History

Flyway tracks applied migrations in the `flyway_schema_history` table:

```sql
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
```

Columns:
- `installed_rank` - Order of execution
- `version` - Migration version
- `description` - Migration description
- `type` - Migration type (SQL, JDBC)
- `script` - Migration filename
- `checksum` - File checksum for validation
- `installed_on` - When migration was applied
- `execution_time` - How long it took
- `success` - Whether it succeeded

## ⚠️ Best Practices

### DO ✅

- Always increment version numbers sequentially
- Test migrations in development first
- Make migrations idempotent when possible
- Include rollback strategy in migration comments
- Use transactions for multi-statement migrations
- Back up production before major migrations

### DON'T ❌

- Never modify an applied migration
- Never skip version numbers
- Never run migrations manually in production
- Never use `DROP TABLE` without backup
- Never commit database passwords to git

## 🆘 Troubleshooting

### Migration Failed Mid-Way

```bash
# Check what went wrong
npm run info

# Fix the issue and repair
npm run repair

# Try again
npm run migrate
```

### Need to Baseline Existing Database

If you're adding Flyway to an existing database:

```bash
# Mark current state as baseline
npm run baseline

# Future migrations will apply on top
npm run migrate
```

### Checksum Mismatch

If a migration file was modified after being applied:

```bash
# Fix the migration file to match what was applied
# Or repair the history if you're certain it's safe
npm run repair
```

## 🔐 Security

- Database credentials are stored in `.env` (gitignored)
- Use GitHub Secrets for CI/CD credentials
- Production clean is disabled by default
- Always use encrypted connections (Encrypt=true)
- Use least-privilege database accounts for migrations

## 📚 Resources

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [node-flywaydb on npm](https://www.npmjs.com/package/node-flywaydb)
- [Azure SQL Database Best Practices](https://docs.microsoft.com/en-us/azure/sql-database/sql-database-best-practices)
