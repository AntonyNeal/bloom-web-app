# GitHub Secrets Configuration Guide

## Current Status ✅

Your setup is working, but can be improved for clarity and security.

---

## Current Configuration

**Repository Secret** (global, fallback):
- `AZURE_STATIC_WEB_APPS_API_TOKEN` → Used by staging (and development as fallback)

**Production Environment Secret**:
- `AZURE_STATIC_WEB_APPS_API_TOKEN` → Used by production deployments ✅

---

## Recommended: Separate Environments (Best Practice)

For better organization and security, create dedicated environments for each deployment:

### Step 1: Create Three Environments

Go to: https://github.com/AntonyNeal/bloom-web-app/settings/environments

Create these environments:
1. **`development`** (for develop branch)
2. **`staging`** (for staging branch)
3. **`production`** (already created ✅)

### Step 2: Add Environment-Specific Secrets

#### Development Environment

Navigate to the `development` environment and add:

```
AZURE_STATIC_WEB_APPS_API_TOKEN = <token from lpa-frontend-dev>
```

To get the dev token:
```powershell
az staticwebapp secrets list --name lpa-frontend-dev --resource-group rg-life-psychology --query "properties.apiKey" -o tsv
```

#### Staging Environment

Navigate to the `staging` environment and add:

```
AZURE_STATIC_WEB_APPS_API_TOKEN = <token from lpa-frontend-staging>
```

To get the staging token:
```powershell
az staticwebapp secrets list --name lpa-frontend-staging --resource-group rg-life-psychology --query "properties.apiKey" -o tsv
```

#### Production Environment

✅ Already configured with production token

### Step 3: Optional - Remove Repository Secret

Once environment secrets are set up, you can optionally remove the repository-level secret:

1. Go to: https://github.com/AntonyNeal/bloom-web-app/settings/secrets/actions
2. Delete `AZURE_STATIC_WEB_APPS_API_TOKEN` (the repository-level one)

This ensures each environment uses its own dedicated token.

---

## Current Setup Will Work ✅

**Your current configuration will work fine because:**

1. Production deployments use the `production` environment → will use production token ✅
2. Staging deployments use the `staging` environment → will fall back to repository secret ✅
3. Development deployments use the `development` environment → will fall back to repository secret ✅

**The workflow explicitly declares environment context:**
```yaml
environment: ${{ needs.determine-environment.outputs.environment }}
```

This means production will **always** use the production environment secret, not the repository secret.

---

## Do You Need to Change Anything? 

**For Production: NO ✅**
- Production is properly configured with its own environment secret
- It will NOT use the repository secret

**For Better Organization: OPTIONAL**
- Create `development` and `staging` environments
- Add their respective tokens
- Remove the repository-level secret
- This makes it clearer and more secure

---

## Quick Test

You can verify which secret is being used by checking the deployment logs:

1. Push to `main` to trigger production deployment
2. Check GitHub Actions logs
3. The workflow will show it's deploying to the `production` environment
4. It will use the production environment secret (not the repository secret)

---

## Summary

| Branch | Environment | Secret Source | Current Status |
|--------|-------------|---------------|----------------|
| develop | development | Repository secret (fallback) | ⚠️ Works but could be better |
| staging | staging | Repository secret (fallback) | ⚠️ Works but could be better |
| main | **production** | **Production environment secret** | ✅ **Perfect!** |

**Bottom Line**: Your production deployment will work correctly! The repository secret won't interfere because the workflow explicitly uses the `production` environment, which has its own secret.

**Optional Improvement**: Add environment secrets for dev and staging for better organization.

---

## Commands to Get All Tokens

If you want to set up all environments properly:

```powershell
# Development token
az staticwebapp secrets list --name lpa-frontend-dev --resource-group rg-life-psychology --query "properties.apiKey" -o tsv

# Staging token
az staticwebapp secrets list --name lpa-frontend-staging --resource-group rg-life-psychology --query "properties.apiKey" -o tsv

# Production token (you already have this)
az staticwebapp secrets list --name lpa-frontend-prod --resource-group rg-life-psychology --query "properties.apiKey" -o tsv
```

Then add each to its respective environment in GitHub.
