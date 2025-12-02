# CI/CD Workflows

## Unified CI/CD Pipeline ⚡

The repository uses a **unified CI/CD pipeline** (`unified-cicd.yml`) that intelligently detects changes and only runs the necessary jobs based on what files were modified.

### How It Works

1. **Change Detection**: Uses path filters to detect which parts of the codebase changed
2. **Conditional Execution**: Only runs jobs for affected applications/packages
3. **Dependency Caching**: Caches dependencies and build artifacts for faster builds
4. **Environment-Based Deployment**: Automatically deploys to staging/production based on branch

### Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `unified-cicd.yml` | **Primary unified workflow** - All apps, APIs, and DB migrations | Push to main/staging/develop, PRs, Manual |
| `release-orchestration.yml` | **Release cycle management** - PR creation, auto-merge | Scheduled (Sunday 10pm AEST), Manual |
| `post-deployment-cascade.yml` | **Branch sync after production deploy** | After unified-cicd on main, Manual |
| `scheduled-production-release.yml` | **Production PR creation** | Scheduled (Saturday 12am AEST), Manual |
| `security.yml` | Security scanning | Push, PRs |
| `visual-regression.yml` | Visual regression tests | Manual |
| `rollback-production.yml` | Emergency production rollback | Manual |

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

### Workflow File Details

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

- **Trigger**: Runs after successful unified-cicd on `main` branch
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

### Change Detection Filters

| Filter | Paths Monitored | Triggers |
|--------|----------------|----------|
| `packages` | `packages/**`, workspace files | Package builds |
| `website` | `apps/website/src/**`, config files | Website deployment |
| `website-functions` | `apps/website/functions/**` | Functions deployment |
| `bloom` | `apps/bloom/src/**`, config files | Bloom app deployment |
| `bloom-api` | `apps/bloom/api/**`, shared types | Bloom API deployment |
| `migrations` | `migrations/**`, db-migrations package | Migration validation |
| `docs` | `docs/**`, `*.md` files | Documentation only |

### Jobs

#### 1. detect-changes
Analyzes changed files and sets outputs for conditional job execution.

#### 2. install-deps
Installs pnpm dependencies and caches them for other jobs.

#### 3. build-packages
Builds shared packages (`@shared/types`, `@shared/utils`, `db-migrations`).

#### 4. validate-migrations
Validates database migration checksums when migrations change.

#### 5. build-deploy-website
- **Runs when**: Website or website functions change
- **Deploys to**: Azure Static Web Apps
- **Environment**: Production (main) or Staging (staging)

#### 6. build-deploy-bloom
- **Runs when**: Bloom app code changes
- **Deploys to**: Azure Static Web Apps
- **Environment**: Production (main) or Staging (staging)

#### 7. build-deploy-bloom-api
- **Runs when**: Bloom API code changes
- **Deploys to**: Azure Functions
- **Environment**: Production (main) or Staging (staging)

#### 8. security-scan
Runs npm/pnpm audit on all application changes.

#### 9. deployment-summary
Generates a summary of what was detected and deployed.

### Branch Strategy

- **main**: Production deployments
- **staging**: Staging environment deployments
- **develop**: Development builds (no deployment)

### Example Scenarios

#### Scenario 1: Only Website Changed
```bash
# Changed files: apps/website/src/pages/Home.tsx
# Jobs executed:
✓ detect-changes
✓ install-deps
✗ build-packages (skipped - no package changes)
✓ build-deploy-website
✗ build-deploy-bloom (skipped)
✗ build-deploy-bloom-api (skipped)
✓ security-scan
✓ deployment-summary
```

#### Scenario 2: Shared Types Changed
```bash
# Changed files: packages/shared-types/src/database.ts
# Jobs executed:
✓ detect-changes
✓ install-deps
✓ build-packages
✓ build-deploy-website (packages affect website)
✓ build-deploy-bloom (packages affect bloom)
✓ build-deploy-bloom-api (shared-types affects API)
✓ security-scan
✓ deployment-summary
```

#### Scenario 3: Only Migrations Changed
```bash
# Changed files: migrations/sql/20251120T002000_new_table.ts
# Jobs executed:
✓ detect-changes
✓ install-deps
✓ build-packages (db-migrations package)
✓ validate-migrations
✗ build-deploy-* (all skipped - no app changes)
✓ deployment-summary
```

#### Scenario 4: Documentation Only
```bash
# Changed files: README.md, docs/architecture.md
# Jobs executed:
✓ detect-changes
✗ All build/deploy jobs skipped
```

### Secrets Required

#### Production (main branch)
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_PROD`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_PROD`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_BLOOM_PROD`
- `AZURE_CLIENT_ID_PROD`
- `BLOOM_API_BASE_URL_PROD`

#### Staging (staging branch)
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_STAGING`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_STAGING`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_BLOOM_STAGING`
- `AZURE_CLIENT_ID_STAGING`
- `BLOOM_API_BASE_URL_STAGING`

#### Shared
- `AZURE_TENANT_ID`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_GOOGLE_ADS_ID`
- `GITHUB_TOKEN` (automatic)

### Manual Deployment

Trigger manually via workflow_dispatch:
```bash
gh workflow run unified-cicd.yml --ref staging
```

### Monitoring

Check deployment status:
1. GitHub Actions tab
2. Deployment summary in job output
3. Environment deployments page

### Performance Optimizations

1. **Parallel execution**: Independent jobs run concurrently
2. **Smart caching**: Dependencies and build artifacts cached
3. **Conditional builds**: Only affected apps rebuild
4. **Skip options**: API builds skip when only frontend changes

---

## Legacy Workflows (Deprecated)

The following workflows are **deprecated** and should not be used:
- `bloom-deploy.yml` - Replaced by unified pipeline
- `bloom-api-deploy.yml` - Replaced by unified pipeline
- `website-deploy.yml` - Replaced by unified pipeline
- `website-api-deploy.yml` - Replaced by unified pipeline

These files are kept for reference but are disabled.

---

## Troubleshooting

### Problem: Job skipped unexpectedly
**Solution**: Check path filters in `detect-changes` job. Files might not match patterns.

### Problem: All jobs running despite small change
**Solution**: Changes to `packages/**` trigger all apps. This is expected behavior.

### Problem: Cache miss causing slow builds
**Solution**: Cache keys include `pnpm-lock.yaml` hash. Lock file changes invalidate cache.

### Problem: Migration validation failing
**Solution**: Validation requires database connection. Set up Azure SQL connection strings in secrets.
