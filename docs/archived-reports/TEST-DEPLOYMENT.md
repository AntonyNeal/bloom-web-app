# Test Deployment Guide

After adding all GitHub secrets, follow these steps to test the deployment.

## Prerequisites Checklist

✅ **All 18 GitHub Secrets Added:**
- 6 Static Web App tokens (WEBSITE_DEV/STAGING/PROD, BLOOM_DEV/STAGING/PROD)
- 6 Function App publish profiles (WEBSITE_DEV/STAGING/PROD, BLOOM_DEV/STAGING/PROD)
- 4 Azure AD configs (CLIENT_ID_STAGING/PROD, TENANT_ID, BLOOM_API_BASE_URL_STAGING/PROD)
- 2 Additional (if needed)

## Test 1: Website Frontend Deployment

```bash
# Make a small change to trigger website deployment
cd c:\Repos\life-psychology-frontend
echo "// Test deployment" >> apps/website/src/App.tsx
git add apps/website/src/App.tsx
git commit -m "test: trigger website deployment"
git push origin staging
```

**Expected Result:**
- Only `website-deploy.yml` workflow runs
- Deploys to `lpa-frontend-staging` Static Web App
- Bloom workflows should NOT trigger

## Test 2: Website API Deployment

```bash
# Make a change to website functions
echo "// API test" >> apps/website/functions/src/index.ts
git add apps/website/functions/
git commit -m "test: trigger website API deployment"
git push origin staging
```

**Expected Result:**
- Only `website-api-deploy.yml` workflow runs
- Deploys to `lpa-functions-staging` Function App

## Test 3: Bloom Frontend Deployment

```bash
# Make a change to Bloom app
echo "// Bloom test" >> apps/bloom/src/App.tsx
git add apps/bloom/src/App.tsx
git commit -m "test: trigger bloom deployment"
git push origin staging
```

**Expected Result:**
- Only `bloom-deploy.yml` workflow runs
- Deploys to `lpa-bloom-staging` Static Web App
- Website workflows should NOT trigger

## Test 4: Bloom API Deployment

```bash
# Make a change to Bloom API
echo "// Bloom API test" >> apps/bloom/api/src/functions/health.ts
git add apps/bloom/api/
git commit -m "test: trigger bloom API deployment"
git push origin staging
```

**Expected Result:**
- Only `bloom-api-deploy.yml` workflow runs
- Deploys to `bloom-functions-staging-new` Function App

## Test 5: Shared Package Changes

```bash
# Change a shared package
echo "// Shared update" >> packages/shared-utils/src/index.ts
git add packages/
git commit -m "test: trigger all frontend deployments"
git push origin staging
```

**Expected Result:**
- Both `website-deploy.yml` AND `bloom-deploy.yml` workflows run
- API workflows should NOT trigger
- Both frontends get updated with new shared code

## Monitoring Deployments

1. **GitHub Actions**: https://github.com/AntonyNeal/life-psychology-frontend/actions
2. **Azure Portal - Static Web Apps**:
   - lpa-frontend-staging
   - lpa-bloom-staging
3. **Azure Portal - Function Apps**:
   - lpa-functions-staging
   - bloom-functions-staging-new

## Verification

After each deployment:

### Website
- Visit: https://lpa-frontend-staging.azurewebsites.net (or your actual URL)
- Check browser console for errors
- Test navigation

### Bloom
- Visit: https://lpa-bloom-staging.azurewebsites.net (or your actual URL)
- Test Azure AD login
- Check API connectivity

### APIs
- Test website API: `curl https://lpa-functions-staging.azurewebsites.net/api/health`
- Test Bloom API: `curl https://bloom-functions-staging-new.azurewebsites.net/api/health`

## Troubleshooting

### Workflow Fails with "Secret not found"
- Double-check secret name matches exactly (case-sensitive)
- Verify you added it to repository secrets, not environment secrets

### Deployment succeeds but app doesn't work
- Check Application Insights logs in Azure Portal
- Verify environment variables are set correctly in Azure Portal
- Check Static Web App configuration for API location

### API returns 404
- Verify Function App has functions deployed
- Check function host status in Azure Portal
- Review Function App logs

## Clean Up Old Function Apps

After all tests pass successfully:

```bash
# Delete redundant Function Apps
az functionapp delete --name bloom-functions-new --resource-group lpa-rg
az functionapp delete --name bloom-platform-functions-v2 --resource-group rg-lpa-unified
az functionapp delete --name fnt42kldozqahcu --resource-group rg-lpa-prod-opt
az functionapp delete --name lpa-application-functions --resource-group rg-lpa-unified
az functionapp delete --name lpa-runtime-config-fn --resource-group rg-lpa-unified
```

This completes the architecture consolidation!
