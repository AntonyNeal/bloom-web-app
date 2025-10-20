# Azure Resources Audit Report
**Date:** October 20, 2025  
**Repository:** bloom-web-app  
**Auditor:** GitHub Copilot

---

## Executive Summary

This audit reviewed the Bloom web application codebase to identify which Azure resources are actively used and which can be safely decommissioned. The audit examined environment files, configuration files, GitHub Actions workflows, and deployment documentation.

### Key Findings
- ✅ **Active Function App:** `bloom-platform-functions-v2` (in use)
- ⚠️ **Legacy Function App:** `lpa-bloom-functions` (referenced in old docs only)
- ⚠️ **Prototype Static Web App:** `lpa-proto-bloom` (has active workflow but marked as old prototype)
- ✅ **Active Static Web App:** `lpa-bloom-staging` (Standard tier, actively deployed)
- ❌ **App Configuration:** No usage of `lpa-config` or `lpa-appconfig` detected

---

## Detailed Findings

### 1. Which Azure Function App does Bloom actively use?

**Answer:** `bloom-platform-functions-v2`

**Evidence:**
- ✅ `.env.production`: `VITE_AZURE_FUNCTIONS_URL=https://bloom-platform-functions-v2.azurewebsites.net`
- ✅ `.env.development`: `VITE_AZURE_FUNCTIONS_URL=https://bloom-platform-functions-v2.azurewebsites.net`
- ✅ `src/config/api.ts`: Points to `https://bloom-platform-functions-v2.azurewebsites.net/api` in production
- ✅ `vite.config.ts`: Proxy configuration uses `https://bloom-platform-functions-v2.azurewebsites.net`
- ✅ `index.html`: DNS prefetch and preconnect to `bloom-platform-functions-v2.azurewebsites.net`

**Legacy References Found:**
- ⚠️ `lpa-bloom-functions` appears in:
  - `DEPLOYMENT.md`
  - `DEPLOYMENT_CHECKLIST.md`
  - `QUICKSTART.md`
  - `IMPLEMENTATION_SUMMARY.md`
  - `APPLICATION_MANAGEMENT_README.md`
  - Commands like `func azure functionapp publish lpa-bloom-functions`

**Recommendation:**
- ✅ **KEEP:** `bloom-platform-functions-v2` (actively used in production)
- ⚠️ **INVESTIGATE:** Check if `lpa-bloom-functions` exists in Azure Portal
  - If it exists and receives no traffic → decommission after backup
  - If it doesn't exist → update/remove legacy documentation references
- 📝 **ACTION:** Update deployment docs to replace `lpa-bloom-functions` with `bloom-platform-functions-v2`

---

### 2. Is the Static Web App "lpa-proto-bloom" still needed?

**Answer:** Likely not needed; appears to be an old prototype with active deployment workflow

**Evidence:**
- ⚠️ Active GitHub workflow: `.github/workflows/proto-bloom-cicd.yml`
  - Deploys to `lpa-proto-bloom` on push to main/staging/develop
  - Uses secret: `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN`
- 📋 Documentation references:
  - `BLOOM_APPS_CREATED.md`: Lists `lpa-proto-bloom` as "Old Bloom prototype" with note "⚠️ Can be deleted or kept for reference"
  - `CRITICAL_FIX_REQUIRED.md`: References as "Bloom staging/testing"
  - `DEPLOY_NOW.md`: References `lpa-proto-bloom-staging`

**Current Usage:**
- The main CI/CD pipeline (`ci-cd-pipeline.yml`) deploys to `lpa-bloom-*` apps (dev/staging/prod)
- `proto-bloom-cicd.yml` is a separate, older workflow pattern
- No production dependencies found on `lpa-proto-bloom`

**Recommendation:**
- ⚠️ **DELETE (after verification):** `lpa-proto-bloom`
  
**Before Deletion Checklist:**
1. ✅ Verify no external links or bookmarks point to it
2. ✅ Confirm no team members are actively testing on it
3. ✅ Check Azure Portal for recent request metrics (past 30 days)
4. ✅ Export any data if needed for reference
5. ✅ Disable or delete `.github/workflows/proto-bloom-cicd.yml`
6. ✅ Remove or rotate `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN` secret
7. ✅ Delete the Static Web App from Azure Portal

**Alternative:** If you want to keep it temporarily, consider:
- Renaming to `lpa-bloom-archive` or `lpa-proto-archive`
- Downgrading to Free tier
- Disabling the GitHub workflow to prevent accidental deploys

---

### 3. Which App Configuration store does Bloom use?

**Answer:** **NONE** - Bloom does not use Azure App Configuration

**Evidence:**
- ❌ No code references to `lpa-config`
- ❌ No code references to `lpa-appconfig`
- ❌ No Azure App Configuration SDK imports or packages
- ❌ No `@azure/app-configuration` in `package.json`
- ❌ No `APP_CONFIG_CONNECTION_STRING` or similar environment variables
- ❌ No App Configuration endpoints in any configuration files

**Searched Locations:**
- All `.ts`, `.tsx`, `.js` files
- All `.env*` files
- All configuration files (`vite.config.ts`, `tsconfig.json`, etc.)
- All documentation files
- GitHub Actions workflows

**Recommendation:**
- ❌ **DELETE:** Both `lpa-config` and `lpa-appconfig` (if they exist in Azure)
  
**Before Deletion Checklist:**
1. ✅ Login to Azure Portal
2. ✅ Navigate to App Configuration resources
3. ✅ Check "Access Keys" usage metrics (recent connections)
4. ✅ Review "Configuration Explorer" for any keys/values
5. ✅ Export configuration as backup (JSON)
6. ✅ Verify no other services/apps reference these stores
7. ✅ Delete the resources

**Azure CLI Commands for Verification:**
```bash
# Check if resources exist
az appconfig list --query "[?name=='lpa-config' || name=='lpa-appconfig']" -o table

# Check recent access (if exists)
az monitor metrics list --resource <resource-id> --metric "HttpIncomingRequestCount" --start-time 2025-09-20T00:00:00Z

# Export configuration (backup before delete)
az appconfig kv export --name lpa-config --destination file --path lpa-config-backup.json --format json
az appconfig kv export --name lpa-appconfig --destination file --path lpa-appconfig-backup.json --format json

# Delete (after verification)
az appconfig delete --name lpa-config --yes
az appconfig delete --name lpa-appconfig --yes
```

---

### 4. Does lpa-bloom-staging need Standard tier, or could it use Free tier?

**Answer:** Standard tier is likely required; downgrade with caution

**Evidence:**
- 📋 `BLOOM_APPS_CREATED.md`: Documents `lpa-bloom-staging` as **Standard** tier
- ✅ Active deployment target in `ci-cd-pipeline.yml` for `staging` branch
- ✅ Used for Playwright E2E tests in CI/CD pipeline
- ✅ Deployed URL: `https://green-pond-009caac00.3.azurestaticapps.net`

**Standard Tier Features Used/Needed:**
- ✅ Custom domains (potentially configured)
- ✅ Staging environments for PR previews
- ✅ Enterprise authentication providers
- ✅ Higher bandwidth and request limits
- ✅ SLA guarantees for staging environment

**Free Tier Limitations:**
| Feature | Free | Standard | Staging Needs |
|---------|------|----------|---------------|
| Custom domains | ❌ No | ✅ Yes | Unknown |
| Staging environments | 1 | 10 | May need multiple |
| Bandwidth | 100 GB/mo | 100 GB/mo | Likely sufficient |
| SSL | Free | Free | ✅ |
| Auth providers | Limited | Enterprise | Unknown |
| SLA | No | 99.95% | Recommended |

**Recommendation:**
- ⚠️ **KEEP STANDARD** (safer option) unless cost is critical

**Cost Comparison:**
- Free tier: $0/month
- Standard tier: ~$9/month (base) + bandwidth overages

**If Considering Downgrade:**
1. ✅ Check Azure Portal → Static Web App → Custom domains
2. ✅ Check Configuration → Authentication (enterprise providers?)
3. ✅ Check Environments → Number of staging environments needed
4. ✅ Review past 30 days bandwidth usage
5. ✅ Consider whether 99.95% SLA is required for staging
6. ✅ Test downgrade in dev environment first

**Safe Approach:**
- Keep Standard tier unless monthly cost is a concern
- If cost is an issue, consider downgrading `lpa-bloom-dev` to Free instead (development likely has lower requirements)

---

### 5. Are there any GitHub Actions workflows that deploy to these resources?

**Answer:** Yes - two workflows deploy Static Web Apps; no automated Function App deployments

### Static Web Apps (Automated via GitHub Actions)

#### Workflow 1: Main CI/CD Pipeline
- **File:** `ci-cd-pipeline.yml`
- **Triggers:** Push to `main`, `staging`, `develop`, feature branches
- **Deployment Targets:**
  - `main` branch → `lpa-bloom-prod` (production environment)
  - `staging` branch → `lpa-bloom-staging` (staging environment)
  - `develop` branch → `lpa-bloom-dev` (development environment)
- **Secret Used:** `AZURE_STATIC_WEB_APPS_API_TOKEN` (environment-scoped)
- **Status:** ✅ Active and current

**Workflow Steps:**
1. Quality checks (lint, type-check, security scan)
2. Run Playwright E2E tests (staging/production only)
3. Build application with environment-specific configs
4. Inject runtime environment variables into built artifacts
5. Deploy to Azure Static Web Apps
6. Post-deployment verification

#### Workflow 2: Proto-Bloom CI/CD
- **File:** `.github/workflows/proto-bloom-cicd.yml`
- **Triggers:** Push to `main`, `staging`, `develop`
- **Deployment Target:** `lpa-proto-bloom`
- **Secret Used:** `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Status:** ⚠️ Active but legacy (prototype app)

**Workflow Steps:**
1. Quality checks (lint, type-check)
2. Build application
3. Deploy to `lpa-proto-bloom`

### Azure Functions (Manual Deployment Only)

**Evidence:**
- ❌ No GitHub Actions workflow found that deploys Azure Functions
- ❌ No `Azure/functions-action` or similar deployment actions
- ❌ No automated `func azure functionapp publish` commands

**Deployment Method:**
- Manual deployment via Azure Functions Core Tools
- Commands documented in:
  - `DEPLOYMENT.md`
  - `DEPLOYMENT_CHECKLIST.md`
  - `QUICKSTART.md`

**Example Deployment Command:**
```bash
func azure functionapp publish lpa-bloom-functions
# or
func azure functionapp publish bloom-platform-functions-v2
```

**Recommendation:**
- ⚠️ **Consider automating** Function App deployments via GitHub Actions
- Benefits: Consistency, CI/CD integration, automated testing
- Can add workflow to deploy Functions when `api/` directory changes

### Secrets Audit

| Secret Name | Used By | Purpose | Status |
|-------------|---------|---------|--------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | `ci-cd-pipeline.yml` | Deploy to lpa-bloom-* apps | ✅ Required |
| `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN` | `proto-bloom-cicd.yml` | Deploy to lpa-proto-bloom | ⚠️ Remove if deleting proto |
| `VITE_GTM_ID` | Build process | Google Tag Manager | ✅ Optional |
| `VITE_OPENAI_API_KEY` | Build process | OpenAI integration | ✅ Optional |
| `VITE_GA_MEASUREMENT_ID` | Build process | Google Analytics | ✅ Optional |

**Recommendation:**
- If deleting `lpa-proto-bloom`, remove/rotate `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN`
- Consider environment-specific secrets for better security:
  - Development environment: separate secrets
  - Staging environment: separate secrets
  - Production environment: separate secrets

---

## Cost Optimization Recommendations

### Immediate Savings Opportunities

| Resource | Current State | Recommendation | Est. Monthly Savings |
|----------|---------------|----------------|---------------------|
| `lpa-config` | Unknown | Delete if exists | ~$1.20 |
| `lpa-appconfig` | Unknown | Delete if exists | ~$1.20 |
| `lpa-proto-bloom` | Standard (assumed) | Delete | ~$9.00 |
| `lpa-bloom-functions` (v1) | Unknown | Investigate & possibly delete | ~$0-10 |
| **Total Potential Savings** | | | **~$11.40-$21.40/month** |

### Medium-Term Optimizations

1. **Function Apps**
   - Current: Likely Consumption Plan
   - Consider: Ensure right-sized, not over-provisioned
   - Review cold start tolerance vs. Premium Plan need

2. **Static Web Apps**
   - Current: Standard tier for staging
   - Consider: Free tier for `lpa-bloom-dev` if not using enterprise features
   - Savings: ~$9/month for dev environment

3. **Blob Storage**
   - Not audited in this review
   - Recommend: Review lifecycle policies for old uploads

---

## Action Plan

### Phase 1: Investigation (Do First)
- [ ] Login to Azure Portal
- [ ] List all Static Web Apps in resource group
- [ ] List all Function Apps in resource group
- [ ] List all App Configuration stores
- [ ] Check metrics/logs for each resource (past 30 days)
- [ ] Screenshot current configurations for backup

### Phase 2: Cleanup (After Verification)
- [ ] Export App Configuration data (if stores exist)
- [ ] Delete `lpa-config` (if exists and unused)
- [ ] Delete `lpa-appconfig` (if exists and unused)
- [ ] Disable `.github/workflows/proto-bloom-cicd.yml`
- [ ] Delete `lpa-proto-bloom` Static Web App
- [ ] Remove `BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN` secret
- [ ] Verify `lpa-bloom-functions` status and delete if legacy

### Phase 3: Documentation Updates
- [ ] Update `DEPLOYMENT.md` to use `bloom-platform-functions-v2`
- [ ] Update `DEPLOYMENT_CHECKLIST.md` with current Function App name
- [ ] Remove references to `lpa-proto-bloom` from docs
- [ ] Update `BLOOM_APPS_CREATED.md` to reflect deleted resources
- [ ] Create architecture diagram showing current Azure resources

### Phase 4: Optimization (Optional)
- [ ] Consider downgrading `lpa-bloom-dev` to Free tier
- [ ] Add GitHub Actions workflow for Function App deployments
- [ ] Implement environment-specific secrets strategy
- [ ] Set up cost alerts in Azure

---

## Azure CLI Quick Reference

### List All Resources
```bash
# Login
az login

# List all Static Web Apps
az staticwebapp list --query "[].{Name:name, ResourceGroup:resourceGroup, Location:location, Sku:sku.tier}" -o table

# List all Function Apps
az functionapp list --query "[].{Name:name, ResourceGroup:resourceGroup, Runtime:kind, Sku:sku}" -o table

# List all App Configuration stores
az appconfig list --query "[].{Name:name, ResourceGroup:resourceGroup, Location:location, Sku:sku.name}" -o table
```

### Check Resource Usage
```bash
# Static Web App metrics (requests)
az monitor metrics list \
  --resource "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Web/staticSites/<app-name>" \
  --metric "Requests" \
  --start-time 2025-09-20T00:00:00Z \
  --interval PT1H \
  -o table

# Function App invocations
az monitor metrics list \
  --resource "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Web/sites/<function-app-name>" \
  --metric "FunctionExecutionCount" \
  --start-time 2025-09-20T00:00:00Z \
  --interval PT1H \
  -o table
```

### Delete Resources (After Backup)
```bash
# Delete Static Web App
az staticwebapp delete --name lpa-proto-bloom --yes

# Delete App Configuration
az appconfig delete --name lpa-config --yes

# Delete Function App (if needed)
az functionapp delete --name lpa-bloom-functions --resource-group <rg-name>
```

---

## Questions to Answer Before Deletion

### For `lpa-proto-bloom`:
- [ ] Is anyone actively testing on this URL?
- [ ] Are there external demos or links pointing to it?
- [ ] Has it received any traffic in the last 30 days?

### For App Configuration (`lpa-config`, `lpa-appconfig`):
- [ ] Do these resources exist in Azure?
- [ ] Do they contain any configuration keys/values?
- [ ] Are other services/apps accessing them?

### For `lpa-bloom-functions` (v1):
- [ ] Does this Function App exist in Azure?
- [ ] What version/runtime is it running?
- [ ] Has it received any invocations recently?
- [ ] Are there any app settings that need to be preserved?

---

## Contact for Questions

If you need clarification on any findings or recommendations, please:
1. Review the evidence sections above
2. Check the Azure Portal for current resource states
3. Verify metrics before making deletion decisions
4. Test in development environment first

---

**Report Generated:** October 20, 2025  
**Next Review:** Recommended after Phase 2 completion
