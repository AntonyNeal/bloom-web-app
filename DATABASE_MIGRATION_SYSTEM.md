# 🗄️ Database Version Control System - Complete Setup

## ✅ What Has Been Created

A production-ready database migration system using **Flyway** that integrates seamlessly with your existing Azure SQL infrastructure and GitHub Actions CI/CD pipeline.

## 📦 Files Created

### Core Migration System
```
db/
├── migrations/                          # Version-controlled SQL migrations
│   ├── V1__initial_schema.sql          # Applications table + indexes + triggers
│   ├── V2__add_ab_testing.sql          # A/B testing infrastructure  
│   └── V3__add_session_tracking.sql    # Session duration analytics
│
├── scripts/
│   └── migrate.js                       # Flyway migration runner (Node.js)
│
├── package.json                         # Dependencies (node-flywaydb, dotenv, cross-env)
├── .env.example                         # Credentials template
├── .gitignore                           # Protects secrets
├── README.md                            # Full documentation
└── QUICKSTART.md                        # 5-minute setup guide
```

### CI/CD Integration
```
.github/workflows/monorepo-deploy.yml
└── New job: migrate-database
    ├── Runs BEFORE API deployment
    ├── Environment-aware (dev/staging/prod)
    ├── Fails deployment if migration fails
    └── Full audit logging
```

## 🎯 Key Features

### 1. Version Control for Database
- ✅ Every schema change tracked in Git
- ✅ Sequential versioning (V1, V2, V3...)
- ✅ Immutable history (can't modify applied migrations)
- ✅ Checksum validation prevents tampering

### 2. Environment Support
- ✅ Development (lpa-bloom-db-dev)
- ✅ Staging (lpa-bloom-db-staging)
- ✅ Production (lpa-bloom-db-prod)
- ✅ Separate credentials per environment

### 3. CI/CD Integration
- ✅ Automatic migration on deploy
- ✅ Runs before API deployment (ensures schema ready)
- ✅ Fails fast if migration error
- ✅ Full logging for audit trail

### 4. Safety Features
- ✅ Production clean disabled (prevents accidental data loss)
- ✅ Validation on migrate (catches checksum mismatches)
- ✅ Transaction support (all-or-nothing)
- ✅ Repair command for fixing issues

## 🚀 Quick Start (Local Development)

### Step 1: Install Dependencies
```powershell
cd db
npm install
```

### Step 2: Configure Credentials
```powershell
cp .env.example .env
notepad .env  # Add your DB_DEV_PASSWORD
```

### Step 3: Run Migrations
```powershell
npm run migrate:dev
```

Expected output:
```
🔧 Running Flyway command: migrate
🌍 Environment: development
🚀 Running migrations...
✅ Migrations completed successfully
✨ Done!
```

### Step 4: Verify
```powershell
npm run info  # Show migration status
```

## 📋 Current Migrations

### V1__initial_schema.sql
- Applications table with all columns
- Indexes on status, created_at, email
- Auto-update trigger for updated_at

### V2__add_ab_testing.sql  
- ab_test_metadata table (test definitions)
- ab_test_variants table (A/B variants)
- ab_test_events table (tracking events)
- Foreign key relationships
- Update triggers
- Pre-populated with 5 active tests

### V3__add_session_tracking.sql
- Session duration columns on applications
- Analytics view for session metrics
- Indexes for performance

## 🔐 GitHub Secrets Required

Add these to: **Repository → Settings → Secrets and variables → Actions**

| Secret Name | Description |
|-------------|-------------|
| `DB_DEV_PASSWORD` | Development database password |
| `DB_STAGING_PASSWORD` | Staging database password |
| `DB_PROD_PASSWORD` | Production database password |

## 🔄 Workflow Integration

The `monorepo-deploy.yml` workflow now includes:

```yaml
jobs:
  migrate-database:
    name: 🗄️ Run Database Migrations
    runs-on: ubuntu-latest
    steps:
      - Install dependencies
      - Run Flyway migrations
      - Log results
  
  deploy-bloom-api:
    needs: [migrate-database]  # ← Waits for DB migration
    # ... rest of API deployment
```

## 📝 Creating New Migrations

### Naming Convention
```
V{version}__{description}.sql
```

Examples:
- `V4__add_user_roles.sql`
- `V5__add_payment_tracking.sql`
- `V6__add_indexes_for_performance.sql`

### Step-by-Step

1. **Create file** in `db/migrations/`:
```powershell
cd db/migrations
ni V4__add_user_roles.sql
```

2. **Write SQL** with proper header:
```sql
-- ============================================================================
-- Migration: V4__add_user_roles.sql
-- Description: Add role-based access control
-- Author: Your Name
-- Date: 2025-11-27
-- ============================================================================

CREATE TABLE user_roles (
  id INT PRIMARY KEY IDENTITY(1,1),
  role_name NVARCHAR(50) NOT NULL UNIQUE,
  permissions NVARCHAR(MAX), -- JSON array
  created_at DATETIME2 DEFAULT GETDATE()
);
```

3. **Test locally**:
```powershell
npm run migrate:dev
npm run info  # Verify it applied
```

4. **Commit and push**:
```powershell
git add db/migrations/V4__add_user_roles.sql
git commit -m "Add user roles table"
git push
```

5. **Auto-deploys** via CI/CD when merged!

## 🛠️ Available Commands

```powershell
# Run migrations
npm run migrate:dev          # Development
npm run migrate:staging      # Staging  
npm run migrate:prod         # Production

# Info & validation
npm run info                 # Show migration status
npm run validate             # Verify checksums

# Maintenance
npm run baseline             # Set baseline for existing DB
npm run repair               # Fix schema history issues
npm run clean                # Drop all objects (dev/staging only)
```

## 📊 Flyway Schema History

Flyway tracks all migrations in `flyway_schema_history` table:

```sql
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
```

Columns:
- `installed_rank` - Execution order
- `version` - Migration version (1, 2, 3...)
- `description` - From filename
- `script` - Full filename
- `checksum` - File hash for validation
- `installed_on` - Timestamp
- `execution_time` - Duration in ms
- `success` - True/False

## ⚠️ Best Practices

### ✅ DO
- Increment versions sequentially (V1, V2, V3)
- Test in development first
- Use descriptive migration names
- Include rollback notes in comments
- Back up production before major changes
- Use transactions for multi-statement migrations

### ❌ DON'T
- Never modify applied migrations
- Never skip version numbers
- Never run migrations manually in production
- Never use DROP TABLE without backup
- Never commit passwords to Git
- Never use clean command in production

## 🆘 Troubleshooting

### Migration Failed Mid-Way
```powershell
npm run info      # See what failed
npm run repair    # Fix schema history
npm run migrate   # Try again
```

### Checksum Mismatch
```
Error: Checksum mismatch for migration V2
```

**Cause**: Migration file was modified after being applied

**Fix**: 
1. Revert file to original content
2. OR create new migration with fix (preferred)
3. OR run `npm run repair` if you're certain

### Need to Baseline Existing Database
If adding Flyway to database with existing schema:

```powershell
npm run baseline  # Mark current as V0
npm run migrate   # Apply new migrations
```

## 📚 Migration From Old System

You had migrations in `api/migrations/`. These have been:

1. **Consolidated** into Flyway migrations (V1, V2, V3)
2. **Enhanced** with proper versioning
3. **Integrated** with CI/CD pipeline

Old files in `api/migrations/` can now be **archived or deleted** - they're replaced by the new system.

## 🔗 Resources

- **Full docs**: See `db/README.md`
- **Quick start**: See `db/QUICKSTART.md`
- **Flyway docs**: https://flywaydb.org/documentation/
- **node-flywaydb**: https://www.npmjs.com/package/node-flywaydb

## ✨ Next Steps

1. **Install locally**: `cd db && npm install`
2. **Configure `.env`**: Add your dev database password
3. **Test migration**: `npm run migrate:dev`
4. **Add GitHub secrets**: DB_DEV_PASSWORD, DB_STAGING_PASSWORD, DB_PROD_PASSWORD
5. **Push changes**: Migrations will run automatically on deploy!

## 🎉 Summary

You now have:
- ✅ Database version control (like Git for your schema)
- ✅ Automated migrations in CI/CD  
- ✅ Environment-specific deployments
- ✅ Full audit trail
- ✅ Safety features (validation, checksums, transactions)
- ✅ Easy rollback strategy
- ✅ Production-ready setup

Every database change is now:
- Tracked in version control
- Tested before production
- Applied automatically
- Fully auditable
