# 🚀 Bloom CI/CD Setup Guide

## Overview

This guide explains the new multi-environment CI/CD workflow for the Bloom application, covering development, staging, and production environments.

---

## 🏗️ Infrastructure Architecture

### Environment Mapping

| Environment | Branch | Frontend App | API Function App | Purpose |
|------------|--------|-------------|------------------|---------|
| **Development** | `develop` | `lpa-bloom-dev` | `bloom-functions-dev` | Active development, frequent deployments |
| **Staging** | `staging` | `lpa-bloom-staging` | `bloom-functions-staging-new` | Pre-production testing, QA validation |
| **Production** | `main` | `lpa-bloom-prod` | `bloom-platform-functions-v2` | Live production environment |

### Resource Details

#### Frontend (Azure Static Web Apps)
- **Development**: `lpa-bloom-dev.azurestaticapps.net`
- **Staging**: `lpa-bloom-staging.azurestaticapps.net`
- **Production**: `lpa-bloom-prod.azurestaticapps.net`

#### API (Azure Functions)
- **Development**: `bloom-functions-dev.azurewebsites.net`
- **Staging**: `bloom-functions-staging-new.azurewebsites.net`
- **Production**: `bloom-platform-functions-v2.azurewebsites.net`

---

## 🔧 GitHub Secrets Required

You need to configure the following secrets in your GitHub repository settings:

### Frontend Deployment Tokens

Get these from Azure Portal → Static Web App → Settings → Configuration → Deployment token

```
BLOOM_DEV_DEPLOYMENT_TOKEN          # For lpa-bloom-dev
BLOOM_STAGING_DEPLOYMENT_TOKEN      # For lpa-bloom-staging
BLOOM_PROD_DEPLOYMENT_TOKEN         # For lpa-bloom-prod
```

**How to get deployment tokens:**
```powershell
# Get deployment token for each environment
az staticwebapp secrets list --name lpa-bloom-dev --query "properties.apiKey" -o tsv
az staticwebapp secrets list --name lpa-bloom-staging --query "properties.apiKey" -o tsv
az staticwebapp secrets list --name lpa-bloom-prod --query "properties.apiKey" -o tsv
```

### API Publish Profiles

Get these from Azure Portal → Function App → Deployment Center → Manage publish profile

```
BLOOM_DEV_API_PUBLISH_PROFILE       # For bloom-functions-dev
BLOOM_STAGING_API_PUBLISH_PROFILE   # For bloom-functions-staging-new
BLOOM_PROD_API_PUBLISH_PROFILE      # For bloom-platform-functions-v2
```

**How to get publish profiles:**
```powershell
# Get publish profile XML for each function app
az functionapp deployment list-publishing-profiles `
  --name bloom-functions-dev `
  --resource-group rg-lpa-unified `
  --xml

az functionapp deployment list-publishing-profiles `
  --name bloom-functions-staging-new `
  --resource-group rg-lpa-unified `
  --xml

az functionapp deployment list-publishing-profiles `
  --name bloom-platform-functions-v2 `
  --resource-group rg-lpa-unified `
  --xml
```

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

---

## 🔄 Workflow Triggers

### Automatic Deployments

The workflow automatically triggers on:

1. **Push to branches:**
   - `main` → Deploys to **Production**
   - `staging` → Deploys to **Staging**
   - `develop` → Deploys to **Development**

2. **Pull Requests:**
   - To `main` or `staging` → Runs tests but doesn't deploy
   - Validates code quality before merge

### Manual Deployments

You can manually trigger deployments:

1. Go to **Actions** tab in GitHub
2. Select **Bloom CI/CD** workflow
3. Click **Run workflow**
4. Choose environment: `development`, `staging`, or `production`
5. Click **Run workflow**

---

## 🎯 Smart Change Detection

The workflow intelligently detects what has changed and only builds/deploys affected components:

### Frontend Changes
Triggers when these files are modified:
- `src/**` - React components, pages, styles
- `public/**` - Static assets
- `index.html` - HTML entry point
- `vite.config.ts` - Build configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration

**Result:** Frontend build + deployment only

### API Changes
Triggers when these files are modified:
- `api/**` - All API code and configuration

**Result:** API build + deployment only

### Infrastructure Changes
Triggers when these files are modified:
- `.github/workflows/**` - Workflow definitions

**Result:** Both frontend and API are rebuilt and deployed

---

## 📊 Workflow Stages

### Stage 1: Code Quality & Detection
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Lint      │  │ Type Check  │  │   Detect    │  │ Determine   │
│   Code      │  │   Files     │  │   Changes   │  │ Environment │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
      ║                 ║                 ║                 ║
      ╚═════════════════╩═════════════════╩═════════════════╝
                              ▼
                    ✅ Quality Gates Passed
```

### Stage 2: Build Artifacts
```
┌──────────────────────┐          ┌──────────────────────┐
│  Build Frontend      │          │  Build API           │
│  (if changed)        │          │  (if changed)        │
│                      │          │                      │
│  React + Vite        │          │  Azure Functions     │
│  TypeScript          │          │  TypeScript          │
│  → dist/             │          │  → deploy-package/   │
└──────────────────────┘          └──────────────────────┘
          │                                  │
          ▼                                  ▼
    Upload Artifact                   Upload Artifact
```

### Stage 3: Deploy to Azure
```
┌──────────────────────┐          ┌──────────────────────┐
│  Deploy Frontend     │          │  Deploy API          │
│                      │          │                      │
│  Azure Static Web    │          │  Azure Functions     │
│  Apps                │          │                      │
│                      │          │                      │
│  ✅ lpa-bloom-xxx    │          │  ✅ bloom-xxx        │
└──────────────────────┘          └──────────────────────┘
```

### Stage 4: Summary
```
┌─────────────────────────────────────────┐
│       📊 Deployment Summary             │
│                                         │
│  🌍 Environment: production             │
│  🎨 Frontend: ✅ success                │
│  🔌 API: ✅ success                     │
│  🔗 URLs displayed                      │
└─────────────────────────────────────────┘
```

---

## 🌿 Branch Strategy

### Development (`develop`)
- **Purpose**: Active development
- **Frequency**: Multiple times per day
- **Testing**: Automated tests + manual QA
- **Rollback**: Fast, low risk

### Staging (`staging`)
- **Purpose**: Pre-production validation
- **Frequency**: Daily or per feature
- **Testing**: Full QA cycle, user acceptance testing
- **Rollback**: Medium risk, requires coordination

### Production (`main`)
- **Purpose**: Live customer-facing application
- **Frequency**: Weekly or per release
- **Testing**: All tests passed in staging
- **Rollback**: High priority, documented process

---

## 📝 Git Workflow

### Feature Development
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR to develop
git push origin feature/your-feature-name
# Create PR on GitHub: feature/your-feature-name → develop
```

### Promoting to Staging
```bash
# 1. Merge develop to staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. Automatic deployment to staging environment
# 3. Perform QA testing
```

### Promoting to Production
```bash
# 1. Merge staging to main
git checkout main
git pull origin main
git merge staging
git push origin main

# 2. Automatic deployment to production
# 3. Monitor deployment
```

---

## 🔍 Monitoring Deployments

### GitHub Actions UI

1. Go to **Actions** tab
2. Click on the latest workflow run
3. Expand job steps to see detailed logs

### Key Indicators

**Quality Gates:**
- ✅ Lint passed
- ✅ Type check passed

**Change Detection:**
- 🎨 Frontend changed: `true` or `false`
- 🔌 API changed: `true` or `false`

**Deployment Status:**
- ✅ Success - Deployment completed
- ❌ Failure - Check logs for errors
- ⏭️ Skipped - No changes detected

### Log Sections to Check

1. **Environment Configuration**
   ```
   ═══════════════════════════════════════════════════════
   ✅ ENVIRONMENT CONFIGURATION
   ═══════════════════════════════════════════════════════
   🌍 Environment:    production
   🎨 Frontend App:   lpa-bloom-prod
   🔌 API App:        bloom-platform-functions-v2
   ```

2. **Build Output**
   - Frontend: Check for Vite build success
   - API: Check for TypeScript compilation errors

3. **Deployment Summary**
   ```
   ╔═══════════════════════════════════════════════════════════════╗
   ║           🌸 BLOOM DEPLOYMENT SUMMARY 🌸                      ║
   ╚═══════════════════════════════════════════════════════════════╝
   ```

---

## 🐛 Troubleshooting

### Secret Not Found

**Error:**
```
Error: Secret BLOOM_PROD_DEPLOYMENT_TOKEN not found
```

**Solution:**
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is added to repository (not environment)
3. Regenerate token from Azure if expired

### Deployment Failed

**Error:**
```
❌ Deployment failed
```

**Steps:**
1. Check Azure resource exists and is running
2. Verify publish profile/token is valid
3. Check Azure Portal for resource-level errors
4. Review workflow logs for specific error messages

### Changes Not Detected

**Symptom:** Workflow runs but skips deployment

**Solution:**
1. Check `detect-changes` job output
2. Verify files modified are in the filter paths
3. Manually trigger workflow with `workflow_dispatch`

### Build Fails

**Common Issues:**
- TypeScript errors → Fix code, run `npm run type-check` locally
- Linting errors → Run `npm run lint` locally
- Missing dependencies → Check `package.json` and `package-lock.json` are committed

---

## ⚙️ Environment Variables

### Frontend Environment Variables

Set in Vite build process:

```bash
# Set automatically by workflow
VITE_ENVIRONMENT=production|staging|development
VITE_API_URL=https://<api-function-app>.azurewebsites.net/api
```

### API Environment Variables

Configure in Azure Function App → Configuration → Application Settings:

**Development:**
```
AZURE_SQL_CONNECTION_STRING=<dev-database>
AZURE_STORAGE_CONNECTION_STRING=<dev-storage>
CORS_ORIGINS=https://lpa-bloom-dev.azurestaticapps.net
```

**Staging:**
```
AZURE_SQL_CONNECTION_STRING=<staging-database>
AZURE_STORAGE_CONNECTION_STRING=<staging-storage>
CORS_ORIGINS=https://lpa-bloom-staging.azurestaticapps.net
```

**Production:**
```
AZURE_SQL_CONNECTION_STRING=<prod-database>
AZURE_STORAGE_CONNECTION_STRING=<prod-storage>
CORS_ORIGINS=https://lpa-bloom-prod.azurestaticapps.net
```

---

## 🎯 Best Practices

### 1. Test Before Merging
- Always create PR to `develop` first
- Wait for CI checks to pass
- Review changes thoroughly

### 2. Staging Validation
- Deploy to staging before production
- Run full test suite
- Perform manual testing of critical paths

### 3. Production Deployments
- Schedule during low-traffic periods
- Have rollback plan ready
- Monitor for 15-30 minutes post-deployment

### 4. Commit Messages
Use conventional commits:
```
feat: add user authentication
fix: resolve upload bug
docs: update API documentation
chore: upgrade dependencies
```

### 5. Branch Naming
```
feature/feature-name    # New features
fix/bug-description     # Bug fixes
hotfix/urgent-fix       # Production hotfixes
docs/doc-update         # Documentation
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Functions Docs](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Vite Documentation](https://vitejs.dev/)

---

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check workflow logs in GitHub Actions
2. Review Azure Portal for resource-level issues
3. Consult Azure Application Insights for runtime errors
4. Contact the development team

---

**Last Updated:** November 22, 2025  
**Workflow Version:** 2.0  
**Maintained By:** Bloom Development Team
