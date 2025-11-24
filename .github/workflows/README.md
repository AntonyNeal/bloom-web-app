# GitHub Actions Workflows

## Overview

This directory contains CI/CD workflows for the Life Psychology monorepo.

## Workflows

### 🚀 `monorepo-deploy.yml` - Main Deployment Pipeline

**Purpose**: Deploy all applications and APIs across environments

**Deployments**:
1. **Bloom Portal** (`apps/bloom`) → Azure Static Web Apps
2. **Bloom API** (`apps/bloom/api`) → Azure Functions
3. **Website** (`apps/website`) → Azure Static Web Apps
4. **Website API** (`apps/website/functions`) → Azure Functions

**Triggers**:
- Auto-deploy on push to `main`, `staging`, `develop`
- Pull requests to above branches
- Manual via workflow_dispatch

**Environments**:
- `main` → **Production**
- `staging` → **Staging**
- `develop` → **Development**

## Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

### Bloom Portal Secrets

| Secret Name | Environment | Purpose |
|------------|-------------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_PROD` | Production | Bloom frontend deploy token |
| `BLOOM_PROD_API_PUBLISH_PROFILE` | Production | Bloom API publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_STAGING` | Staging | Bloom frontend deploy token |
| `BLOOM_STAGING_API_PUBLISH_PROFILE` | Staging | Bloom API publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_DEV` | Development | Bloom frontend deploy token |
| `BLOOM_DEV_API_PUBLISH_PROFILE` | Development | Bloom API publish profile |

### Website Secrets

| Secret Name | Environment | Purpose |
|------------|-------------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_PROD` | Production | Website frontend deploy token |
| `WEBSITE_PROD_API_PUBLISH_PROFILE` | Production | Website API publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_STAGING` | Staging | Website frontend deploy token |
| `WEBSITE_STAGING_API_PUBLISH_PROFILE` | Staging | Website API publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEBSITE_DEV` | Development | Website frontend deploy token |
| `WEBSITE_DEV_API_PUBLISH_PROFILE` | Development | Website API publish profile |

## How to Get Secrets

### Azure Static Web Apps Deployment Token

1. Go to Azure Portal → Your Static Web App
2. Navigate to **Settings → API tokens**
3. Copy the deployment token
4. Add to GitHub Secrets

### Azure Functions Publish Profile

```bash
# For each Function App
az functionapp deployment list-publishing-profiles \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --xml
```

Copy the entire XML output and add to GitHub Secrets.

## Smart Change Detection

The workflow intelligently detects changes and only deploys affected applications:

- **Bloom Frontend**: Triggers on changes to `apps/bloom/src/**`
- **Bloom API**: Triggers on changes to `apps/bloom/api/**`
- **Website Frontend**: Triggers on changes to `apps/website/src/**`
- **Website API**: Triggers on changes to `apps/website/functions/**`
- **Shared Packages**: Triggers rebuild of all apps that depend on shared code

## Manual Deployment

Trigger manual deployment via GitHub UI:

1. Go to **Actions** tab
2. Select **Monorepo Deploy** workflow
3. Click **Run workflow**
4. Choose:
   - Environment (development/staging/production)
   - Which apps to deploy (checkboxes)

## Environment Variables

Environment-specific variables are set in Azure:

### Bloom Portal
- **Development**: `lpa-bloom-dev` (Static Web App)
- **Staging**: `lpa-bloom-staging` (Static Web App)
- **Production**: `lpa-bloom-prod` (Static Web App)

### Bloom API
- **Development**: `bloom-functions-dev` (Function App)
- **Staging**: `bloom-functions-staging-new` (Function App)
- **Production**: `bloom-platform-functions-v2` (Function App)

### Website
- **Development**: `lpa-frontend-dev` (Static Web App)
- **Staging**: `lpa-frontend-staging` (Static Web App)
- **Production**: `lpa-frontend-prod` (Static Web App)

### Website API
- **All Environments**: Deployed as **managed functions** with Azure Static Web Apps
- No standalone Function Apps - API code is bundled with frontend deployment
- API endpoint: `https://<swa-hostname>/api/*`

## Deployment Flow

```
┌─────────────────┐
│  Code Change    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Detect Changes  │◄───── Smart path filtering
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Quality Checks  │◄───── Lint + Type Check
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build (Parallel)│
│ • Bloom Frontend│
│ • Bloom API     │
│ • Website       │
│ • Website API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Deploy (Parallel)│
│ • Azure SWA     │
│ • Azure Func    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Summary       │
└─────────────────┘
```

## Legacy Workflows

- `bloom-cicd.yml` - Original Bloom-only workflow (deprecated)

Consider archiving or removing once the new monorepo workflow is confirmed working.

## Troubleshooting

### Deployment fails with "Secret not found"
- Verify secret name matches exactly (case-sensitive)
- Check secret is configured in correct environment

### Build fails with "pnpm not found"
- Workflow should auto-install pnpm via `pnpm/action-setup@v3`
- Check pnpm version is compatible

### API deployment skipped
- Check if publish profile secret is configured
- Deployment will skip gracefully if secret missing

### No changes detected
- Verify path filters in `detect-changes` job
- Check if changes are in tracked paths

## Support

For issues or questions:
1. Check workflow run logs in **Actions** tab
2. Review this README
3. Contact DevOps team
