# Required GitHub Secrets

This document lists all GitHub Secrets that must be configured for the CI/CD pipeline to work correctly.

## 📍 How to Add Secrets

1. Go to your GitHub repository: https://github.com/AntonyNeal/bloom-web-app
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

---

## 🔐 Required Secrets

### Azure Authentication (for Azure CLI commands)

These are used to configure Azure resources during deployment:

- **`AZURE_CLIENT_ID`** - Azure Service Principal Client ID
- **`AZURE_TENANT_ID`** - Azure AD Tenant ID  
- **`AZURE_SUBSCRIPTION_ID`** - Azure Subscription ID

### Azure Function App Deployment

Different publish profiles for each environment:

- **`BLOOM_API_PUBLISH_PROFILE_DEV`** - Development environment
- **`BLOOM_API_PUBLISH_PROFILE_STAGING`** - Staging environment
- **`BLOOM_API_PUBLISH_PROFILE_PROD`** - Production environment

### Halaxy API Credentials

**⚠️ CRITICAL** - These must match the credentials from your Halaxy developer account:

- **`HALAXY_CLIENT_ID`** - OAuth Client ID from Halaxy Developer Portal
- **`HALAXY_CLIENT_SECRET`** - OAuth Client Secret from Halaxy Developer Portal
- **`HALAXY_ORGANIZATION_ID`** - Your Halaxy Organization ID (optional)
- **`HALAXY_FHIR_URL`** - Halaxy FHIR API URL (optional, defaults to https://au-api.halaxy.com/main)

**Where to find Halaxy credentials:**
1. Log in to Halaxy Developer Portal: https://developers.halaxy.com/
2. Go to **My Applications** or **API Credentials**
3. Copy the **Client ID** and **Client Secret**
4. Add them to GitHub Secrets exactly as shown

---

## 🔍 Current Local Development Values

Your `api/local.settings.json` contains:
```json
{
  "HALAXY_CLIENT_ID": "178524cd42179595d35f16476a8c7008",
  "HALAXY_CLIENT_SECRET": "6e9cb8baa649a26a52a7e05e92bca1e0d90e82a1cd0feb6a9ac8c99de07bfb3a"
}
```

**These same values should be added to GitHub Secrets if they're valid for production.**

---

## ✅ How to Verify Secrets Are Working

After adding the secrets:

1. **Push to develop branch** - triggers development deployment
2. **Check GitHub Actions**: https://github.com/AntonyNeal/bloom-web-app/actions
3. **Look for "Configure Halaxy App Settings"** step - should show ✅
4. **Test the endpoint**: 
   ```bash
   curl https://bloom-functions-dev.azurewebsites.net/api/health
   ```

---

## 🐛 Troubleshooting

### Error: "invalid_client" from Halaxy

This means `HALAXY_CLIENT_ID` or `HALAXY_CLIENT_SECRET` are:
- Not set in GitHub Secrets, OR
- Set to incorrect values

**Fix:**
1. Verify credentials in Halaxy Developer Portal
2. Update GitHub Secrets with correct values
3. Re-run the deployment workflow or push a new commit

### Error: Halaxy credentials not configured

The GitHub Secrets aren't being applied to Azure Function App.

**Fix:**
1. Check workflow logs for "Configure Halaxy App Settings" step
2. Verify Azure Service Principal has permissions
3. Check that secrets names match exactly (case-sensitive)

---

## 📝 Notes

- Secrets are **environment variables** in Azure Function App
- They're set during deployment via Azure CLI
- Local development uses `local.settings.json` (not committed to git)
- Production uses GitHub Secrets → Azure App Settings
