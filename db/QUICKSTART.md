# Database Migration Setup - Quick Start

## ✅ What We've Created

A complete database version control system using Flyway that integrates with your CI/CD pipeline.

### Structure Created:
```
db/
├── migrations/           # Your SQL migration files
│   ├── V1__initial_schema.sql
│   ├── V2__add_ab_testing.sql
│   └── V3__add_session_tracking.sql
├── scripts/
│   └── migrate.js       # Migration runner
├── package.json         # Dependencies
├── .env.example         # Template
└── README.md            # Full documentation
```

## 🚀 Local Setup (5 Minutes)

### 1. Install Dependencies
```powershell
cd db
npm install
```

### 2. Configure Database Credentials
```powershell
# Copy the template
cp .env.example .env

# Edit .env and add your password
notepad .env
```

Add your password to the file:
```
DB_DEV_PASSWORD=your_actual_password_here
```

### 3. Run Migrations
```powershell
# This will apply all pending migrations
npm run migrate:dev
```

You should see:
```
🔧 Running Flyway command: migrate
🌍 Environment: development
🚀 Running migrations...
✅ Migrations completed successfully
✨ Done!
```

### 4. Verify
```powershell
npm run info
```

This shows all applied migrations and their status.

## 🔐 GitHub Secrets Setup

For CI/CD to work, add these secrets to your GitHub repository:

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `DB_DEV_PASSWORD` - Your development database password
   - `DB_STAGING_PASSWORD` - Your staging database password  
   - `DB_PROD_PASSWORD` - Your production database password

## 📝 Creating Your First Migration

When you need to change the database schema:

```powershell
# 1. Create new migration file
cd db/migrations
ni V4__add_your_feature.sql

# 2. Edit the file with your SQL
notepad V4__add_your_feature.sql
```

Example content:
```sql
-- V4__add_user_roles.sql
CREATE TABLE user_roles (
  id INT PRIMARY KEY IDENTITY(1,1),
  role_name NVARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME2 DEFAULT GETDATE()
);
```

```powershell
# 3. Test locally
npm run migrate:dev

# 4. Commit and push
git add migrations/V4__add_your_feature.sql
git commit -m "Add user roles table"
git push
```

The migration will run automatically during deployment!

## 🎯 Common Commands

```powershell
# Run migrations
npm run migrate:dev       # Development
npm run migrate:staging   # Staging
npm run migrate:prod      # Production

# Check status
npm run info             # Show all migrations and status

# Validate
npm run validate         # Verify checksums match

# Repair (if needed)
npm run repair          # Fix schema history issues
```

## ✅ CI/CD Integration

Already configured! The workflow now:

1. **Detects changes** in db/migrations/
2. **Runs migrations** before API deployment
3. **Fails deployment** if migration fails
4. **Logs everything** for audit trail

See `.github/workflows/monorepo-deploy.yml` - the `migrate-database` job runs automatically.

## 📚 Full Documentation

See `db/README.md` for complete documentation including:
- Detailed naming conventions
- Best practices
- Troubleshooting guide
- Security guidelines
- Flyway reference

## 🆘 Troubleshooting

### "Missing database configuration"
→ Check your `.env` file has the password set

### "Migration failed"
→ Run `npm run info` to see which migration failed
→ Fix the SQL and run `npm run repair` then `npm run migrate`

### "Checksum mismatch"
→ Never modify applied migrations - create a new one instead
→ If you must fix: `npm run repair`

## 🎉 You're Done!

Your database now has version control like your code. Every schema change is:
- ✅ Tracked in git
- ✅ Tested before production
- ✅ Applied automatically on deploy
- ✅ Auditable with full history
