# ✅ WORKFLOW FIXED - Bloom-Specific SWAs Only

## Changes Made

The workflow has been completely fixed to use **Bloom-specific Static Web Apps** only.

---

## Updated Deployment Targets

| Branch | Environment | SWA Name | Status |
|--------|-------------|----------|--------|
| `develop` | development | **`lpa-bloom-dev`** | ✅ Changed from lpa-frontend-dev |
| `staging` | staging | **`lpa-bloom-staging`** | ✅ Changed from lpa-frontend-staging |
| `main` | production | **`lpa-bloom-prod`** | ✅ Changed from lpa-frontend-prod |

---

## Safety Protections Added

### Two-Layer Safety Check:

1. **Block ALL lpa-frontend-* apps**
   - Prevents deployment to ANY Life Psychology main site app
   - Checks: lpa-frontend-dev, lpa-frontend-staging, lpa-frontend-prod
   
2. **Enforce lpa-bloom-* pattern**
   - Ensures deployment ONLY to Bloom-specific apps
   - Valid: lpa-bloom-dev, lpa-bloom-staging, lpa-bloom-prod

### What Happens if Safety Check Fails:
```
❌ CRITICAL ERROR: Attempted to deploy to lpa-frontend-XXX!
❌ All lpa-frontend-* apps are for the main Life Psychology website!
❌ Bloom should ONLY deploy to lpa-bloom-* apps!
❌ DEPLOYMENT ABORTED FOR SAFETY
```

The workflow will **immediately abort** before any deployment happens.

---

## Azure Resources Needed

You now need to create THREE separate Bloom Static Web Apps:

### Commands to Run:

```powershell
# 1. Development
az staticwebapp create `
  --name lpa-bloom-dev `
  --resource-group rg-life-psychology `
  --location "eastasia" `
  --sku Free

# 2. Staging
az staticwebapp create `
  --name lpa-bloom-staging `
  --resource-group rg-life-psychology `
  --location "eastasia" `
  --sku Standard

# 3. Production
az staticwebapp create `
  --name lpa-bloom-prod `
  --resource-group rg-life-psychology `
  --location "eastasia" `
  --sku Standard
```

---

## Get Deployment Tokens

After creating the SWAs, get their tokens:

```powershell
# Development token
az staticwebapp secrets list `
  --name lpa-bloom-dev `
  --resource-group rg-life-psychology `
  --query "properties.apiKey" `
  --output tsv

# Staging token
az staticwebapp secrets list `
  --name lpa-bloom-staging `
  --resource-group rg-life-psychology `
  --query "properties.apiKey" `
  --output tsv

# Production token
az staticwebapp secrets list `
  --name lpa-bloom-prod `
  --resource-group rg-life-psychology `
  --query "properties.apiKey" `
  --output tsv
```

---

## Update GitHub Secrets

### Option 1: Repository Secret (Simple)
1. Go to: https://github.com/AntonyNeal/bloom-web-app/settings/secrets/actions
2. Update `AZURE_STATIC_WEB_APPS_API_TOKEN` with one of the tokens (staging recommended)
3. All environments will use this token

### Option 2: Environment Secrets (Recommended)
1. Go to: https://github.com/AntonyNeal/bloom-web-app/settings/environments
2. For each environment (development, staging, production):
   - Add secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Use the corresponding token from above

---

## Infrastructure Summary

### BEFORE (WRONG):
```
Bloom Workflow → lpa-frontend-* → MAIN LIFE PSYCHOLOGY SITE ❌
```

### AFTER (CORRECT):
```
Bloom Workflow → lpa-bloom-* → BLOOM-SPECIFIC APPS ✅
Life Psychology Workflow → lpa-frontend-* → MAIN SITE ✅
```

Complete separation between Bloom and Life Psychology deployments!

---

## Complete Resource List

| Resource | Purpose | Repository | Custom Domain |
|----------|---------|------------|---------------|
| **BLOOM APPS (bloom-web-app)** |
| `lpa-bloom-dev` | Bloom development | bloom-web-app | (none) |
| `lpa-bloom-staging` | Bloom staging | bloom-web-app | (none) |
| `lpa-bloom-prod` | Bloom production | bloom-web-app | bloom.life-psychology.com.au (future) |
| **LIFE PSYCHOLOGY APPS (life-psychology-frontend)** |
| `lpa-frontend-dev` | LPA development | life-psychology-frontend | (none) |
| `lpa-frontend-staging` | LPA staging | life-psychology-frontend | (none) |
| `lpa-frontend-prod` | LPA production | life-psychology-frontend | www.life-psychology.com.au<br>life-psychology.com.au |

---

## Verification Checklist

Before next deployment:

- [ ] All three `lpa-bloom-*` SWAs created in Azure
- [ ] Deployment tokens retrieved
- [ ] GitHub secrets updated
- [ ] Workflow changes committed to repository
- [ ] `lpa-frontend-prod` verified to point to life-psychology-frontend
- [ ] Test deployment on `develop` or `staging` branch first
- [ ] Review deployment logs to confirm correct app name

---

## Next Steps

1. **DO NOT DEPLOY YET** - Create the Azure resources first
2. **Run the Azure CLI commands** above to create lpa-bloom-dev, lpa-bloom-staging, lpa-bloom-prod
3. **Get and save** the three deployment tokens
4. **Update GitHub secrets** with the appropriate tokens
5. **Commit the workflow changes** to staging branch first
6. **Test deploy** to staging before touching main/production

---

## Safety Guarantee

With these changes:
- ✅ Bloom can **NEVER** deploy to Life Psychology apps
- ✅ Workflow will **abort** if it tries
- ✅ Complete separation between projects
- ✅ No risk of overwriting main site

---

**Status**: Workflow fixed, awaiting Azure resource creation
**Risk**: ZERO - Safety checks will prevent deployment until correct SWAs exist
