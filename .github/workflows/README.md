# GitHub Actions Workflows

## Overview

This directory contains the CI/CD workflows for the Life Psychology Bloom monorepo.
All workflows use a single source of truth approach - one workflow handles all CI/CD based on which branch is pushed and which folders have changes.

## Workflows

| File | Purpose | Trigger |
|------|---------|---------|
| `ci-cd.yml` | **Primary unified workflow** - All apps, APIs, and DB migrations | Push to main/staging/develop, PRs, Manual |
| `db-migrations.yml` | Isolated database operations (manual/PR only) | PR to main/staging/develop, Manual |
| `manual-full-deploy.yml` | Force deploy all apps (no change detection) | Manual only |
| `release-orchestration.yml` | **Release cycle management** - PR creation, auto-merge | Scheduled (Sunday 10pm AEST), Manual |
| `post-deployment-cascade.yml` | **Branch sync after production deploy** | After CI/CD on main, Manual |
| `scheduled-production-release.yml` | **Production PR creation** | Scheduled (Saturday 12am AEST), Manual |

---

## 🔄 Release Orchestration System

The Life Psychology release cycle uses a 2-week cadence with automated workflows to manage the flow of code from development through staging to production.

### Branch Protection Rules (Configure in GitHub Settings)

| Branch | Protection | Merge Requirements |
|--------|------------|-------------------|
| `main` | Protected | PR from `staging` only, requires approval |
| `staging` | Semi-protected | PR from `develop` (squash) OR direct commits during UAT |
| `develop` | Feature branch | Standard development workflow |

### 2-Week Release Cycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2-WEEK RELEASE CYCLE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WEEK 1                                                                     │
│  ───────                                                                    │
│  Day 1 (Sat 1am)  → Production deployment from staging                     │
│                   → Post-deployment cascade: main → staging → develop       │
│  Day 1-2 (Weekend) → Stability monitoring, hotfix patches if needed        │
│  Day 2 (Sun)       → Open PR: develop → staging                            │
│  Day 3 (Mon)       → Begin new feature development in develop              │
│                                                                             │
│  WEEK 2                                                                     │
│  ───────                                                                    │
│  Day 9 (Sun 10pm)  → Auto-merge develop → staging (squash)                 │
│  Day 9-14          → UAT testing on staging by Zoe                         │
│                   → Bug fixes made directly in staging branch              │
│  Day 13 (Fri)      → Production PR created: staging → main                 │
│  Day 14 (Sat 1am)  → Production deployment (requires approval)             │
│                   → Cycle repeats...                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Files

#### `release-orchestration.yml`

Manages the PR lifecycle for the release cycle:

| Action | Description | Trigger |
|--------|-------------|---------|
| `create-staging-pr` | Creates PR from develop → staging | Manual |
| `auto-merge-staging-pr` | Force merge develop → staging PR | Manual |
| `create-production-pr` | Creates PR from staging → main | Manual |
| `cascade-main-to-branches` | Merge main to staging and develop | Manual |
| `check-cycle-status` | Show current release cycle status | Manual |
| *Scheduled* | Auto-merge develop → staging | Sunday 10pm AEST |

#### `post-deployment-cascade.yml`

Automatically syncs branches after production deployment:

```
main deployed → merge main → staging → merge main → develop
```

- **Trigger**: Runs after successful CI/CD on `main` branch
- **Purpose**: Ensures all branches start fresh after each production release

#### `scheduled-production-release.yml`

Creates the production release PR on schedule:

- **Trigger**: Friday 1pm UTC (Saturday 12am AEST)
- **Creates**: PR from `staging` → `main` with release notes
- **Requires**: Manual approval before merge

### Manual Workflow Triggers

**Create Release PR (develop → staging):**
1. Go to **Actions** → **Release Orchestration**
2. Click **Run workflow**
3. Select action: `create-staging-pr`

**Force Auto-Merge Staging PR:**
1. Go to **Actions** → **Release Orchestration**
2. Click **Run workflow**
3. Select action: `auto-merge-staging-pr`
4. Check `force` if needed to bypass checks

**Create Production PR (staging → main):**
1. Go to **Actions** → **Release Orchestration**
2. Click **Run workflow**
3. Select action: `create-production-pr`

**Trigger Post-Deployment Cascade:**
1. Go to **Actions** → **Post-Deployment Cascade**
2. Click **Run workflow**
3. Optionally enable `dry_run` to preview changes

### Setting Up Branch Protection Rules

In GitHub **Settings → Branches → Add rule**:

**For `main` branch:**
```
Branch name pattern: main
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
☑ Require status checks to pass before merging
☑ Require branches to be up to date before merging
☑ Do not allow bypassing the above settings
```

**For `staging` branch:**
```
Branch name pattern: staging
☑ Require a pull request before merging
  ☐ Require approvals (unchecked - allows direct commits during UAT)
☑ Require status checks to pass before merging
☐ Do not allow bypassing (unchecked - allows direct commits)
```

Note: `staging` allows direct commits for UAT bug fixes while still requiring PRs from other branches to be squash-merged.

---

## 🚀 `ci-cd.yml` - Primary CI/CD Pipeline

**The single source of truth for all automated deployments.**

### What It Does

1. **Detects changes** in each project folder
2. **Runs quality checks** (lint, type-check)
3. **Runs database migrations** (if db/migrations changed)
4. **Builds** only affected applications
5. **Deploys** to the appropriate environment

### Triggers

| Branch | Environment | Database |
|--------|-------------|----------|
| `main` | Production | prod |
| `staging` | Staging | dev (second validation pass) |
| `develop` | Development | dev |
| PRs | Preview (no deploy) | dev (dry run) |

### Change Detection

The workflow intelligently deploys only what changed:

| Path | Deploys |
|------|---------|
| `src/**`, `apps/bloom/**` | Bloom Frontend |
| `api/**` | Bloom API (incl. Halaxy Sync) |
| `apps/website/src/**` | Website Frontend |
| `apps/website/functions/**` | Website API |
| `db/migrations/**`, `api/src/db-version-control/**` | Database Migrations |
| `services/halaxy-sync-worker/**` | Halaxy Sync Worker (Container Apps) |
| `packages/**` | All dependent apps |
| `.github/workflows/**` | All apps |

### Manual Override

Run manually with full control:

1. Go to **Actions** → **CI/CD Pipeline**
2. Click **Run workflow**
3. Select:
   - Environment (development/staging/production)
   - Deploy Bloom Portal (yes/no)
   - Deploy Website (yes/no)
   - Deploy APIs (yes/no)
   - Run Migrations (yes/no)
   - Deploy Halaxy Sync (yes/no)
   - Dry Run Migrations (preview only)

---

## 🗄️ `db-migrations.yml` - Database Migrations (Manual)

**For isolated database operations only.** Push-triggered migrations are handled by `ci-cd.yml`.

### Use Cases

- Test migrations in isolation via PR
- Run migrations without deploying apps
- Force-run migrations manually

### Environments

| Input | Target DB |
|-------|-----------|
| `dev` | lpa-bloom-db-dev |
| `prod` | lpa-bloom-db-prod |

> **Note**: Staging branch runs against dev DBs with extended validation (second pass before prod).

---

## 🔧 `manual-full-deploy.yml` - Force Deploy All

**Deploys ALL applications regardless of changes.**

### Use Cases

- Test deployment pipeline
- Force deploy after infrastructure changes
- Recover from failed deployments
- Sync all apps to a specific environment

---

## Azure Resources

### Static Web Apps (Frontend)

| Environment | Bloom Portal | Website |
|-------------|--------------|---------|
| Development | `lpa-bloom-dev` | `lpa-frontend-dev` |
| Staging | `lpa-bloom-staging` | `lpa-frontend-staging` |
| Production | `lpa-bloom-prod` | `lpa-frontend-prod` |

### Function Apps (Backend API)

| Environment | Bloom API |
|-------------|-----------|
| Development | `bloom-functions-dev` |
| Staging | `bloom-functions-staging-new` |
| Production | `bloom-platform-functions-v2` |

> **Website API**: Deployed as managed functions with Static Web Apps (no standalone Function App)

---

## Required Secrets

Configure in **Settings → Secrets and variables → Actions**:

### Azure Identity (for Azure Login)

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | Service Principal App ID |
| `AZURE_TENANT_ID` | Azure AD Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID |

### Bloom Portal

| Secret | Environment | Purpose |
|--------|-------------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_DEV` | Dev | Frontend deploy token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_STAGING` | Staging | Frontend deploy token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_PROD` | Prod | Frontend deploy token |
| `BLOOM_DEV_API_PUBLISH_PROFILE` | Dev | API publish profile |
| `BLOOM_STAGING_API_PUBLISH_PROFILE` | Staging | API publish profile |
| `BLOOM_PROD_API_PUBLISH_PROFILE` | Prod | API publish profile |

### Website

| Secret | Environment | Purpose |
|--------|-------------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_DEV` | Dev | Frontend deploy token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_STAGING` | Staging | Frontend deploy token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_PROD` | Prod | Frontend deploy token |

### Database

| Secret | Purpose |
|--------|---------|
| `SQL_CONNECTION_STRING` | Fallback SQL connection |
| `COSMOS_DB_CONNECTION_STRING` | Fallback Cosmos connection |

> **Primary**: Secrets are retrieved from Azure Key Vault during workflow runs.

---

## How to Get Secrets

### Static Web Apps Deployment Token

```bash
# Azure Portal
Portal → Static Web App → Settings → API tokens → Copy
```

### Function App Publish Profile

```bash
az functionapp deployment list-publishing-profiles \
  --name <function-app-name> \
  --resource-group rg-lpa-unified \
  --xml
```

### Azure Service Principal

```bash
# Create Service Principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-bloom" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/rg-lpa-unified \
  --sdk-auth
```

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Push / PR                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  🔎 Detect Changes                                          │
│  • bloom-frontend, bloom-api, website, db, halaxy-worker    │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  🔍 Lint        │ │  🔍 Type Check  │ │  🌍 Environment │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         └───────────────────┴───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  🗄️ Database Migrations (if db/ changed)                    │
│  • Validate scripts → Run migrations → Capture snapshot     │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  🌸 Build Bloom │ │  🌐 Build Web   │ │  🔌 Build APIs  │
│     Frontend    │ │     Frontend    │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  🚀 Deploy      │ │  🚀 Deploy      │ │  🚀 Deploy      │
│     Bloom SWA   │ │     Website SWA │ │     Functions   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         └───────────────────┴───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  📊 Deployment Summary                                      │
│  • URLs, status, changes detected                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Secret not found" error
- Verify secret name matches exactly (case-sensitive)
- Check secret is configured for the correct environment

### Build fails
- Check Node version (20 for frontend, 18 for API)
- Verify package-lock.json is committed

### Deployment skipped
- Check change detection paths
- Verify deployment secrets are configured

### Database migration fails
- Check Key Vault access
- Verify SQL/Cosmos connection strings
- Review migration script syntax

### No changes detected but need to deploy
- Use `manual-full-deploy.yml` to force deploy
- Or use `workflow_dispatch` with manual overrides

---

## Support

1. Check workflow run logs in **Actions** tab
2. Review error messages in failed steps
3. Verify secrets are configured
4. Check Azure resource status in Portal
