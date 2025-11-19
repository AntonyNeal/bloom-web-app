# CI/CD Workflows

## Unified CI/CD Pipeline ⚡

The repository uses a **unified CI/CD pipeline** (`unified-cicd.yml`) that intelligently detects changes and only runs the necessary jobs based on what files were modified.

### How It Works

1. **Change Detection**: Uses path filters to detect which parts of the codebase changed
2. **Conditional Execution**: Only runs jobs for affected applications/packages
3. **Dependency Caching**: Caches dependencies and build artifacts for faster builds
4. **Environment-Based Deployment**: Automatically deploys to staging/production based on branch

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
