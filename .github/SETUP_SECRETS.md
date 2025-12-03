# GitHub Secrets Setup

## Required Secret: AZURE_FUNCTIONAPP_PUBLISH_PROFILE

To enable automated Azure Functions deployment, add this secret to your GitHub repository:

### Steps:
1. Go to your GitHub repository: https://github.com/AntonyNeal/bloom-web-app
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
5. Value: Copy the entire publish profile XML below

### Publish Profile XML:
```xml
<publishData><publishProfile profileName="fnt42kldozqahcu - Web Deploy" publishMethod="MSDeploy" publishUrl="fnt42kldozqahcu.scm.azurewebsites.net:443" msdeploySite="fnt42kldozqahcu" userName="$fnt42kldozqahcu" userPWD="ab3Nl14sT98pfHXitG1pnkChmMQrmei7KkfMdYoyAbwN5w0Leim4X4mLQ4TE" destinationAppUrl="https://fnt42kldozqahcu.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="fnt42kldozqahcu - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sy3-099.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="fnt42kldozqahcu\$fnt42kldozqahcu" userPWD="ab3Nl14sT98pfHXitG1pnkChmMQrmei7KkfMdYoyAbwN5w0Leim4X4mLQ4TE" destinationAppUrl="https://fnt42kldozqahcu.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="fnt42kldozqahcu - Zip Deploy" publishMethod="ZipDeploy" publishUrl="fnt42kldozqahcu.scm.azurewebsites.net:443" userName="$fnt42kldozqahcu" userPWD="ab3Nl14sT98pfHXitG1pnkChmMQrmei7KkfMdYoyAbwN5w0Leim4X4mLQ4TE" destinationAppUrl="https://fnt42kldozqahcu.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>
```

### Verify Setup:
Once the secret is added, any push to the `main` branch will trigger:
1. Frontend build and deploy to Azure Static Web Apps
2. **NEW:** API build and deploy to Azure Functions

### Security Note:
- This file contains sensitive credentials
- **DO NOT commit this file to git**
- It's already in .gitignore
- You can delete it after adding the secret to GitHub

### Testing:
After adding the secret, push to main and check:
- GitHub Actions: https://github.com/AntonyNeal/bloom-web-app/actions
- API endpoint: https://fnt42kldozqahcu.azurewebsites.net/api/health
