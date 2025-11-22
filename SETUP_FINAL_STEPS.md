# Final Setup Steps - Action Required

## ✅ Completed
1. ✅ Created multi-environment CI/CD workflow (`.github/workflows/bloom-cicd.yml`)
2. ✅ Configured environment-specific CORS on all Azure Function Apps
3. ✅ Retrieved all deployment secrets from Azure
4. ✅ Removed old proto-bloom references and workflow
5. ✅ Updated README.md with new deployment information
6. ✅ Pushed all changes to GitHub

## 🔴 Action Required - Add GitHub Secrets

You must add **2 new secrets** to your GitHub repository before the workflow can deploy API changes.

### ✅ Secrets Already Configured
These secrets are already in your GitHub repository:
- ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_DEV` (dev frontend)
- ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_STAGING` (staging frontend)
- ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN_BLOOM_PROD` (production frontend)
- ✅ `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` (production API)

### How to Add New Secrets
1. Go to: https://github.com/AntonyNeal/bloom-web-app/settings/secrets/actions
2. Click "New repository secret" for each secret below
3. Copy the exact XML value (entire block, including all characters)

### Secrets to Add

Open `CICD_CONFIGURATION_COMPLETE.md` and copy the XML values for these 2 secrets:

1. **BLOOM_DEV_API_PUBLISH_PROFILE**
   - Used to deploy backend API to dev environment
   - Copy the entire XML block from CICD_CONFIGURATION_COMPLETE.md section "BLOOM_DEV_API_PUBLISH_PROFILE"

2. **BLOOM_STAGING_API_PUBLISH_PROFILE**
   - Used to deploy backend API to staging environment
   - Copy the entire XML block from CICD_CONFIGURATION_COMPLETE.md section "BLOOM_STAGING_API_PUBLISH_PROFILE"

## 🧪 Testing After Setup

Once secrets are added, test the deployment:

### Test Development Environment
```bash
# Make a small change to trigger deployment
git checkout develop
git pull origin develop

# Create a test change
echo "\n// Test change" >> src/main.tsx

# Commit and push
git add .
git commit -m "Test: Verify dev deployment"
git push origin develop
```

### Monitor Deployment
1. Go to: https://github.com/AntonyNeal/bloom-web-app/actions
2. Click on the "Bloom CI/CD" workflow run
3. Watch the deployment progress
4. Check deployment summary at the end

### Verify Deployment
- Dev Frontend: https://lpa-bloom-dev.azurestaticapps.net
- Dev API: https://bloom-functions-dev.azurewebsites.net/api/health

## 🔒 Security Reminder

After adding secrets to GitHub:
1. **Delete** or **secure** `CICD_CONFIGURATION_COMPLETE.md` (contains sensitive data)
2. Consider moving it to a password manager or secure vault
3. Do NOT commit this file to git if it contains the actual secret values

## 📋 Optional Enhancements

### 1. Separate Production Database (Recommended)
Currently dev/staging share `lpa-applications-db`. Consider creating a separate prod database:

```bash
az sql db create \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-applications-db-prod \
  --service-objective S0
```

Then update `bloom-platform-functions-v2` connection string.

### 2. Storage Environment Marking
Update `api/src/functions/upload.ts` to add environment metadata to uploaded blobs:

```typescript
await blockBlobClient.upload(buffer, buffer.length, {
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    uploadedAt: new Date().toISOString()
  }
});
```

### 3. Application Insights
Configure Application Insights for each environment to monitor:
- API performance
- Error rates
- Deployment health
- User analytics

## 🎯 Next Actions Checklist

- [ ] Add 2 GitHub secrets: `BLOOM_DEV_API_PUBLISH_PROFILE` and `BLOOM_STAGING_API_PUBLISH_PROFILE`
- [ ] Test dev deployment (push to develop branch)
- [ ] Test staging deployment (push to staging branch)
- [ ] Verify production workflow works (check main branch)
- [ ] Secure/delete CICD_CONFIGURATION_COMPLETE.md
- [ ] Optional: Create separate production database
- [ ] Optional: Implement storage environment marking
- [ ] Optional: Configure Application Insights monitoring

## 📞 Support

If you encounter issues:
1. Check [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md) for troubleshooting
2. Review workflow logs in GitHub Actions
3. Verify secrets are correctly added (no extra spaces/newlines)
4. Check Azure Function App logs in Azure Portal

---
**Status**: Ready for final secret configuration
**Priority**: P0 - Required before next deployment
