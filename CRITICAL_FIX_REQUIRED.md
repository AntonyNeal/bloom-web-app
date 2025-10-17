# 🚨 CRITICAL: Infrastructure Fix Required

## What Went Wrong

The `lpa-frontend-prod` Static Web App was configured with custom domains:
- www.life-psychology.com.au
- life-psychology.com.au

When we deployed bloom-web-app to it, it overwrote the main Life Psychology website!

---

## IMMEDIATE FIXES REQUIRED

### Fix 1: Create Separate Static Web App for Bloom Production

We need a NEW Static Web App specifically for Bloom, separate from the main Life Psychology site.

#### Azure CLI Commands:

```powershell
# Create NEW Static Web App for Bloom Production
az staticwebapp create `
  --name lpa-bloom-prod `
  --resource-group rg-life-psychology `
  --location "eastasia" `
  --sku Standard

# Get the deployment token for the NEW app
az staticwebapp secrets list `
  --name lpa-bloom-prod `
  --resource-group rg-life-psychology `
  --query "properties.apiKey" `
  --output tsv
```

**Expected Output**: You'll get a new deployment token for `lpa-bloom-prod`

---

### Fix 2: Update GitHub Production Secret

1. Go to: https://github.com/AntonyNeal/bloom-web-app/settings/environments
2. Open the `production` environment
3. Update the secret `AZURE_STATIC_WEB_APPS_API_TOKEN` with the NEW token from `lpa-bloom-prod`
4. **Remove or update** the repository-level secret to prevent confusion

---

### Fix 3: Verify lpa-frontend-prod is Restored

After you rollback, verify `lpa-frontend-prod` settings:

```powershell
# Check what lpa-frontend-prod is pointing to
az staticwebapp show `
  --name lpa-frontend-prod `
  --resource-group rg-life-psychology `
  --query "{name:name, repositoryUrl:repositoryUrl, branch:branch, customDomains:customDomains}"
```

**Expected**: Should point to the ORIGINAL Life Psychology repository (NOT bloom-web-app)

If it's wrong, update it:

```powershell
# Point it back to the correct repository
az staticwebapp update `
  --name lpa-frontend-prod `
  --resource-group rg-life-psychology `
  --source https://github.com/AntonyNeal/life-psychology-frontend `
  --branch main
```

---

### Fix 4: Update CI/CD Workflow

The workflow needs to use the correct app name for Bloom production.

**File**: `ci-cd-pipeline.yml`

**Current (WRONG)**:
```yaml
"refs/heads/main")
  echo "app-name=lpa-frontend-prod" >> $GITHUB_OUTPUT
```

**Should be**:
```yaml
"refs/heads/main")
  echo "app-name=lpa-bloom-prod" >> $GITHUB_OUTPUT
```

---

## Summary of Required Changes

### Azure Resources Needed:
| App Name | Purpose | Custom Domains | Repository |
|----------|---------|----------------|------------|
| `lpa-frontend-prod` | Main Life Psychology site | life-psychology.com.au, www.life-psychology.com.au | life-psychology-frontend |
| `lpa-bloom-prod` | **NEW** - Bloom Production | bloom.life-psychology.com.au (future) | bloom-web-app |
| `lpa-frontend-staging` | Life Psychology staging | (staging URL) | life-psychology-frontend |
| `lpa-proto-bloom` | Bloom staging/testing | (staging URL) | bloom-web-app |

### GitHub Secrets Needed:
| Environment | Secret Name | Points To |
|-------------|-------------|-----------|
| `production` | `AZURE_STATIC_WEB_APPS_API_TOKEN` | `lpa-bloom-prod` (NEW token) |

---

## Workflow Fix Script

I'll create the workflow fix in the next step - DO NOT deploy until this is fixed!

---

## SAFETY CHECKLIST

Before next deployment:

- [ ] New `lpa-bloom-prod` Static Web App created
- [ ] New deployment token retrieved
- [ ] GitHub production secret updated with NEW token
- [ ] Workflow updated to use `lpa-bloom-prod` (not `lpa-frontend-prod`)
- [ ] `lpa-frontend-prod` verified to point to life-psychology-frontend
- [ ] Test deployment reviewed by you first
- [ ] Custom domains verified NOT on bloom app

---

**NEXT STEP**: I'll update the workflow file now with the correct app name.
