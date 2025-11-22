# API Deployment Troubleshooting Guide

## Current Issue: 401 Unauthorized on API Deployment

The workflow is failing because the Azure Functions publish profile secret is missing or invalid.

## Environment Secret Mapping

Based on your branch, the workflow uses these secrets:

| Branch    | Environment | Secret Name                          | Function App                    |
|-----------|-------------|--------------------------------------|---------------------------------|
| `develop` | development | `BLOOM_DEV_API_PUBLISH_PROFILE`      | bloom-functions-dev             |
| `staging` | staging     | `BLOOM_STAGING_API_PUBLISH_PROFILE`  | bloom-functions-staging-new     |
| `main`    | production  | `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`  | bloom-platform-functions-v2     |

## Quick Fix: Verify/Add Secret

### 1. Check if Secret Exists

Go to: https://github.com/AntonyNeal/bloom-web-app/settings/secrets/actions

Look for the secret name that matches your branch (see table above).

### 2. Add/Update the Secret

The secret values are in `CICD_CONFIGURATION_COMPLETE.md`:

**For Development (`BLOOM_DEV_API_PUBLISH_PROFILE`):**
```xml
<publishData><publishProfile profileName="bloom-functions-dev - Web Deploy" publishMethod="MSDeploy" publishUrl="bloom-functions-dev.scm.azurewebsites.net:443" msdeploySite="bloom-functions-dev" userName="$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-dev - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-dev\$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-dev - Zip Deploy" publishMethod="ZipDeploy" publishUrl="bloom-functions-dev.scm.azurewebsites.net:443" userName="$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-dev - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-dev\$bloom-functions-dev" userPWD="hqnHkLhkhlMtTQYtcF5FcYLg8TeAlQnDCpvaybKrgDdGvTtXQwBMH9CQoKT4" destinationAppUrl="http://bloom-functions-dev.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>
```

**For Staging (`BLOOM_STAGING_API_PUBLISH_PROFILE`):**
```xml
<publishData><publishProfile profileName="bloom-functions-staging-new - Web Deploy" publishMethod="MSDeploy" publishUrl="bloom-functions-staging-new.scm.azurewebsites.net:443" msdeploySite="bloom-functions-staging-new" userName="$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-staging-new - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-staging-new\$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-staging-new - Zip Deploy" publishMethod="ZipDeploy" publishUrl="bloom-functions-staging-new.scm.azurewebsites.net:443" userName="$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="bloom-functions-staging-new - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-017dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="bloom-functions-staging-new\$bloom-functions-staging-new" userPWD="a4XlgeSf9bbpwpv1FdjffpxkEsYQr0fGbjXlAzMiXnfwi30uzkzvAqwtugTq" destinationAppUrl="http://bloom-functions-staging-new.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>
```

### 3. Important: Copy the ENTIRE XML

- Include the `<publishData>` opening tag
- Include all `<publishProfile>` elements
- Include the closing `</publishData>` tag
- Do NOT add extra line breaks or spaces
- Do NOT trim or modify any content

### 4. Re-run the Workflow

After adding/updating the secret:
1. Go to Actions → Find the failed workflow
2. Click "Re-run all jobs"

Or push a new commit to trigger a fresh run.

## If Secret Regeneration Needed

If the publish profile has expired or is invalid, regenerate it:

```powershell
# For Development
az functionapp deployment list-publishing-profiles `
  --name bloom-functions-dev `
  --resource-group rg-lpa-unified `
  --xml

# For Staging
az functionapp deployment list-publishing-profiles `
  --name bloom-functions-staging-new `
  --resource-group rg-lpa-unified `
  --xml

# For Production
az functionapp deployment list-publishing-profiles `
  --name bloom-platform-functions-v2 `
  --resource-group rg-lpa-unified `
  --xml
```

Copy the entire XML output and paste it into the corresponding GitHub secret.

## Workflow Improvements Applied

The workflow now:
1. ✅ Checks if the publish profile secret exists before attempting deployment
2. ✅ Shows a clear skip message if the secret is missing (instead of failing)
3. ✅ Only fails if deployment actually fails (not just when secret is missing)
4. ✅ Provides instructions on how to add the missing secret

This means:
- Missing secrets = **skipped** (with helpful message)
- Invalid secrets or actual deployment failures = **failed** (with clear error)
