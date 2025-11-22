# CI/CD Configuration Complete

## Overview
Multi-environment CI/CD pipeline has been configured with proper security and environment isolation.

## ✅ Completed Tasks

### 1. CORS Configuration
Configured environment-specific CORS restrictions on all function apps:

#### Development (bloom-functions-dev)
- ✅ `https://lpa-bloom-dev.azurestaticapps.net`
- ✅ `http://localhost:5173` (for local development)

#### Staging (bloom-functions-staging-new)
- ✅ `https://lpa-bloom-staging.azurestaticapps.net`

#### Production (bloom-platform-functions-v2)
- ✅ `https://lpa-bloom-prod.azurestaticapps.net`
- ✅ `https://lifepsychology.com.au` (production domain)
- ✅ `https://bloom.life-psychology.com.au` (production domain)
- ✅ `http://localhost:5173` (for production testing)

### 2. GitHub Secrets Retrieved
All required deployment secrets have been retrieved from Azure:

#### Static Web App Deployment Tokens
- **BLOOM_DEV_DEPLOYMENT_TOKEN**: `c167fa13b1d7177669aa0d73580de0a53439dcd0d882362ee53c627a60ef7cf903-1498beb0-70bf-4849-bcc8-b606573b3661000031904222e200`
- **BLOOM_STAGING_DEPLOYMENT_TOKEN**: `6e37e20f31be88d76a297f5808cd9388b8f99669fc551a29f6a0094b4de76fed03-a982496d-acba-4e96-9e6f-e5efca14d0a00000421009caac00`
- **BLOOM_PROD_DEPLOYMENT_TOKEN**: `8208f9a121de125f40691815c97547e1887788b134d5751bac888eb2cfea765a03-6a659585-c89c-4505-8795-4f1b8cebaeeb00013090eb1c4000`

#### Function App Publish Profiles (XML format)

**BLOOM_DEV_API_PUBLISH_PROFILE**:
```xml
<publishData><publishProfile profileName="bloom-functions-dev - Web Deploy" publishMethod="MSDeploy" publishUrl="bloom-functions-dev.scm.azurewebsites.net:443" msdeploySite="bloom-functions-dev" userName="$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-dev - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-dev\$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-dev - Zip Deploy" publishMethod="ZipDeploy" publishUrl="bloom-functions-dev.scm.azurewebsites.net:443" userName="$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-dev - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-dev\$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>
```

**BLOOM_STAGING_API_PUBLISH_PROFILE**:
```xml
<publishData><publishProfile profileName="bloom-functions-staging-new - Web Deploy" publishMethod="MSDeploy" publishUrl="bloom-functions-staging-new.scm.azurewebsites.net:443" msdeploySite="bloom-functions-staging-new" userName="$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-staging-new - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-staging-new\$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-staging-new - Zip Deploy" publishMethod="ZipDeploy" publishUrl="bloom-functions-staging-new.scm.azurewebsites.net:443" userName="$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-staging-new - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-staging-new\$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>
```

### 3. Workflow Files
- ✅ Created `.github/workflows/bloom-cicd.yml` with multi-environment support
- ✅ Deleted old `.github/workflows/proto-bloom-cicd.yml`
- ✅ Committed workflow cleanup to repository

## 📋 Next Steps - Add GitHub Secrets

You need to add these 5 secrets to your GitHub repository:

### How to Add Secrets
1. Go to: https://github.com/[your-org]/[your-repo]/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret below:

### Secrets to Add

#### 1. BLOOM_DEV_DEPLOYMENT_TOKEN
```
c167fa13b1d7177669aa0d73580de0a53439dcd0d882362ee53c627a60ef7cf903-1498beb0-70bf-4849-bcc8-b606573b3661000031904222e200
```

#### 2. BLOOM_STAGING_DEPLOYMENT_TOKEN
```
6e37e20f31be88d76a297f5808cd9388b8f99669fc551a29f6a0094b4de76fed03-a982496d-acba-4e96-9e6f-e5efca14d0a00000421009caac00
```

#### 3. BLOOM_PROD_DEPLOYMENT_TOKEN
```
8208f9a121de125f40691815c97547e1887788b134d5751bac888eb2cfea765a03-6a659585-c89c-4505-8795-4f1b8cebaeeb00013090eb1c4000
```

#### 4. BLOOM_DEV_API_PUBLISH_PROFILE
Copy the entire XML block from the "BLOOM_DEV_API_PUBLISH_PROFILE" section above.

#### 5. BLOOM_STAGING_API_PUBLISH_PROFILE
Copy the entire XML block from the "BLOOM_STAGING_API_PUBLISH_PROFILE" section above.

**Note**: The production API publish profile (BLOOM_PROD_API_PUBLISH_PROFILE) already exists in GitHub secrets from the previous configuration.

## 🔒 Security Configuration Summary

### CORS Policy
Each environment's function app is now restricted to accept requests only from:
- Its corresponding frontend URL
- localhost:5173 (dev and prod only, for local testing)
- Production domains (prod only)

### Database Strategy
- **Development**: Uses shared `lpa-applications-db` on `lpa-sql-server`
- **Staging**: Uses shared `lpa-applications-db` on `lpa-sql-server`
- **Production**: Uses existing `lpa-applications-db` (recommend creating separate database in future)

### Storage Strategy
- All environments share storage account: `lpastorage13978`
- Files should be marked with source environment (future enhancement)
- Consider using blob metadata tags: `environment=dev/staging/prod`

## 🚀 Deployment Flow

### Branch to Environment Mapping
- `develop` branch → Development environment
- `staging` branch → Staging environment
- `main` branch → Production environment

### Automatic Deployments
Push to any of these branches will automatically:
1. Run quality checks (lint, type-check)
2. Detect changes (frontend/API/infrastructure)
3. Build only what changed
4. Deploy to corresponding environment
5. Report deployment summary

### Manual Deployments
Use GitHub Actions "Run workflow" button to manually deploy:
- Select branch to deploy
- Optionally specify target environment
- Workflow will deploy accordingly

## 📊 Environment URLs

### Development
- Frontend: https://lpa-bloom-dev.azurestaticapps.net
- API: https://bloom-functions-dev.azurewebsites.net

### Staging
- Frontend: https://lpa-bloom-staging.azurestaticapps.net
- API: https://bloom-functions-staging-new.azurewebsites.net

### Production
- Frontend: https://lpa-bloom-prod.azurestaticapps.net (also https://bloom.life-psychology.com.au)
- API: https://bloom-platform-functions-v2.azurewebsites.net

## ⚠️ Important Notes

1. **Secrets Security**: The secrets shown in this document should be added to GitHub immediately and then this document should be deleted or moved to a secure location.

2. **Database Isolation**: Consider creating a separate production database in the future for better isolation.

3. **Storage Marking**: Update the upload function (`api/src/functions/upload.ts`) to add environment metadata to uploaded files.

4. **Testing**: After adding secrets, test the workflow by making a small change to each branch.

5. **Monitoring**: Check Azure Application Insights for each environment after deployments.

## 📚 Additional Documentation
- [CI/CD Setup Guide](CICD_SETUP_GUIDE.md) - Comprehensive workflow documentation
- [Future Development Roadmap](FUTURE_DEVELOPMENT_ROADMAP.md) - Feature backlog

---
**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status**: Configuration Complete - Ready for Secret Addition
