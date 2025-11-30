# Proto-Bloom MVP Deployment Guide

## Overview
This guide walks through deploying the Proto-Bloom Application Management System to Azure, including SQL Database, Blob Storage, Azure Functions, and the Static Web App.

---

## Prerequisites

### 1. Install Required Tools (PowerShell)

```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Install Azure Functions Core Tools
winget install Microsoft.Azure.FunctionsCoreTools

# Install Node.js (if not already installed)
winget install OpenJS.NodeJS.LTS

# Verify installations
az --version
func --version
node --version
npm --version
```

### 2. Login to Azure

```powershell
# Login to your Azure account
az login

# Set your subscription (if you have multiple)
az account set --subscription "your-subscription-id"

# Verify you're logged in
az account show
```

---

## Part 1: Database Setup (20 minutes)

### Step 1: Run SQL Schema

```powershell
# Navigate to your project
cd "c:\Repos\bloom-web-app"

# Run the schema script
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user your_admin_username `
  --admin-password "YourSecurePassword123!" `
  --file schema.sql
```

### Step 2: Verify Tables Created

```powershell
# Check if the applications table exists
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user your_admin_username `
  --admin-password "YourSecurePassword123!" `
  --query "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'applications'"
```

---

## Part 2: Blob Storage Setup (10 minutes)

### Step 1: Create Storage Container

```powershell
# Set variables
$storageAccount = "lpaapplicationstorage"
$resourceGroup = "rg-lpa-unified"
$containerName = "applications"

# Get connection string
$connectionString = az storage account show-connection-string `
  --name $storageAccount `
  --resource-group $resourceGroup `
  --query connectionString `
  --output tsv

# Create container for applications
az storage container create `
  --name $containerName `
  --connection-string $connectionString `
  --public-access off

# Verify container created
az storage container list `
  --connection-string $connectionString `
  --output table
```

### Step 2: Save Connection String

```powershell
# Create .env.local file for local development
"AZURE_STORAGE_CONNECTION_STRING=$connectionString" | Out-File -FilePath ".env.local" -Encoding utf8

# Display (for copying to Azure Portal later)
Write-Host "Save this connection string for Azure Functions configuration:"
Write-Host $connectionString
```

---

## Part 3: Azure Functions API Setup (30 minutes)

### Step 1: Install Dependencies

```powershell
# Navigate to api folder
cd "c:\Repos\bloom-web-app\api"

# Install dependencies
npm install
```

### Step 2: Update local.settings.json

Edit `api/local.settings.json` with your actual credentials:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SQL_SERVER": "lpa-sql-server.database.windows.net",
    "SQL_DATABASE": "lpa-bloom-db",
    "SQL_USER": "your_admin_username",
    "SQL_PASSWORD": "YourSecurePassword123!",
    "AZURE_STORAGE_CONNECTION_STRING": "paste_connection_string_here"
  },
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

### Step 3: Test Functions Locally

```powershell
# Build TypeScript
npm run build

# Start Azure Functions locally
func start
```

You should see:
```
Functions:
  applications: [GET,POST,PUT] http://localhost:7071/api/applications/{id?}
  upload: [POST] http://localhost:7071/api/upload
```

Test in another PowerShell window:
```powershell
# Test GET (should return empty array initially)
curl http://localhost:7071/api/applications
```

### Step 4: Deploy to Azure

```powershell
# Create Function App (if not already created)
# Actual environment-specific names: bloom-functions-dev, bloom-functions-staging-new, bloom-platform-functions-v2 (prod)
$functionAppName = "bloom-functions-dev"

# Check if it exists
az functionapp show --name $functionAppName --resource-group $resourceGroup

# If not, create it:
az functionapp create `
  --resource-group $resourceGroup `
  --consumption-plan-location australiaeast `
  --runtime node `
  --runtime-version 18 `
  --functions-version 4 `
  --name $functionAppName `
  --storage-account $storageAccount

# Deploy functions
func azure functionapp publish $functionAppName
```

### Step 5: Configure Function App Settings

```powershell
# Add application settings
az functionapp config appsettings set `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --settings `
    "SQL_SERVER=lpa-sql-server.database.windows.net" `
    "SQL_DATABASE=lpa-bloom-db" `
    "SQL_USER=your_admin_username" `
    "SQL_PASSWORD=YourSecurePassword123!" `
    "AZURE_STORAGE_CONNECTION_STRING=$connectionString"

# Enable CORS for your domain
az functionapp cors add `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --allowed-origins "https://life-psychology.com.au" "http://localhost:5173"
```

### Step 6: Test Deployed Functions

```powershell
# Get function URL
$functionUrl = az functionapp show `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --query defaultHostName `
  --output tsv

# Test GET endpoint
curl "https://$functionUrl/api/applications"
```

---

## Part 4: Frontend Deployment (30 minutes)

### Step 1: Update Frontend API Configuration

Create `src/config/api.ts`:

```typescript
export const API_BASE_URL = 
  import.meta.env.MODE === 'production'
    ? 'https://bloom-platform-functions-v2.azurewebsites.net/api'  // or environment-specific URL
    : 'http://localhost:7071/api';
```

Update fetch calls in `JoinUs.tsx` and `ApplicationManagement.tsx`:

```typescript
import { API_BASE_URL } from '@/config/api';

// Replace:
fetch("/api/applications")
// With:
fetch(`${API_BASE_URL}/applications`)
```

### Step 2: Build Frontend

```powershell
# Navigate to project root
cd "c:\Repos\bloom-web-app"

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

### Step 3: Deploy to Azure Static Web Apps

```powershell
# Actual Static Web Apps: lpa-bloom-dev, lpa-bloom-staging, lpa-bloom-prod
$staticWebAppName = "lpa-bloom-dev"  # or lpa-bloom-staging, lpa-bloom-prod

az staticwebapp create `
  --name $staticWebAppName `
  --resource-group $resourceGroup `
  --location australiaeast `
  --source "https://github.com/AntonyNeal/bloom-web-app" `
  --branch develop `  # develop -> dev, staging -> staging, main -> prod
  --app-location "/" `
  --output-location "dist"
```

**Or use GitHub Actions (Recommended):**

Your existing `.github/workflows/ci-cd.yml` automatically deploys based on branch:
- `develop` branch → lpa-bloom-dev
- `staging` branch → lpa-bloom-staging  
- `main` branch → lpa-bloom-prod

### Step 4: Configure Custom Domain (if needed)

```powershell
# Add custom domain
az staticwebapp hostname set `
  --name $staticWebAppName `
  --resource-group $resourceGroup `
  --hostname "life-psychology.com.au"
```

---

## Part 5: Environment Variables & Secrets

### Option A: Using Azure Key Vault (Recommended)

```powershell
# Create Key Vault
$keyVaultName = "lpa-bloom-keyvault"

az keyvault create `
  --name $keyVaultName `
  --resource-group $resourceGroup `
  --location australiaeast

# Store secrets
az keyvault secret set --vault-name $keyVaultName --name "sql-password" --value "YourSecurePassword123!"
az keyvault secret set --vault-name $keyVaultName --name "storage-connection" --value $connectionString

# Grant Function App access
$functionAppIdentity = az functionapp identity assign `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --query principalId `
  --output tsv

az keyvault set-policy `
  --name $keyVaultName `
  --object-id $functionAppIdentity `
  --secret-permissions get list

# Update Function App to use Key Vault references
az functionapp config appsettings set `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --settings `
    "SQL_PASSWORD=@Microsoft.KeyVault(SecretUri=https://$keyVaultName.vault.azure.net/secrets/sql-password/)"
```

### Option B: Direct Environment Variables

Already configured in Part 3, Step 5.

---

## Part 6: Testing End-to-End

### Test Application Submission

1. Navigate to: `https://life-psychology.com.au/join-us` (or `http://localhost:5173/join-us` for local)
2. Fill out the form with test data:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Phone: +61 400 000 000
   - AHPRA: PSY0001234567
   - Experience: 5 years
   - Cover Letter: "This is a test application"
3. Upload dummy PDF files for CV and certificate
4. Click "Submit Application"
5. Verify success message appears

### Test Admin Portal

1. Navigate to: `https://life-psychology.com.au/admin`
2. **Note:** Admin routes are protected by Azure AD B2C authentication
2. Verify the test application appears in the list
3. Click on the application to view details
4. Test status changes:
   - Click "Mark as Reviewing" → status should update
   - Click "Approve" → status should change to approved
5. Verify documents can be downloaded

### Verify Database

```powershell
# Check applications in database
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user your_admin_username `
  --admin-password "YourSecurePassword123!" `
  --query "SELECT id, first_name, last_name, email, status, created_at FROM applications"
```

### Verify Blob Storage

```powershell
# List uploaded files
az storage blob list `
  --container-name applications `
  --connection-string $connectionString `
  --output table
```

---

## Part 7: Git & Deployment

### Commit Changes

```powershell
# Add all new files
git add .

# Commit
git commit -m "feat: Proto-Bloom application management system

- Database schema for applications table
- Azure Functions API (applications & upload endpoints)
- Application form with file uploads
- Admin review portal with status management
- Integration with Azure SQL and Blob Storage"

# Push to staging
git push origin staging
```

### Monitor Deployment

```powershell
# Watch GitHub Actions
# Go to: https://github.com/AntonyNeal/bloom-web-app/actions

# Or use Azure CLI to check deployment status
az staticwebapp show `
  --name $staticWebAppName `
  --resource-group $resourceGroup `
  --query "defaultHostname"
```

---

## Troubleshooting

### Issue: "Cannot connect to SQL Database"

```powershell
# Check firewall rules - add your IP
$myIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

az sql server firewall-rule create `
  --server lpa-sql-server `
  --resource-group $resourceGroup `
  --name "MyLocalIP" `
  --start-ip-address $myIp `
  --end-ip-address $myIp

# Allow Azure services
az sql server firewall-rule create `
  --server lpa-sql-server `
  --resource-group $resourceGroup `
  --name "AllowAzureServices" `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

### Issue: "CORS error when calling API"

```powershell
# Check CORS settings
az functionapp cors show `
  --name $functionAppName `
  --resource-group $resourceGroup

# Add missing origins
az functionapp cors add `
  --name $functionAppName `
  --resource-group $resourceGroup `
  --allowed-origins "https://life-psychology.com.au"
```

### Issue: "File upload fails"

```powershell
# Verify storage account connection
az storage account show-connection-string `
  --name $storageAccount `
  --resource-group $resourceGroup

# Check container permissions
az storage container show-permission `
  --name applications `
  --connection-string $connectionString
```

### Issue: "Functions not running"

```powershell
# Check function logs
az functionapp log tail `
  --name $functionAppName `
  --resource-group $resourceGroup

# Restart function app
az functionapp restart `
  --name $functionAppName `
  --resource-group $resourceGroup
```

---

## Monitoring & Maintenance

### View Application Insights

```powershell
# Get Application Insights resource
az monitor app-insights component show `
  --app lpa-bloom-functions `
  --resource-group $resourceGroup

# Query recent requests
az monitor app-insights metrics show `
  --app lpa-bloom-functions `
  --resource-group $resourceGroup `
  --metric requests/count
```

### Check Costs

```powershell
# View current month costs
az consumption usage list `
  --start-date (Get-Date -Format "yyyy-MM-01") `
  --end-date (Get-Date -Format "yyyy-MM-dd") `
  --query "[?contains(instanceName, 'lpa')].{Name:instanceName, Cost:pretaxCost}" `
  --output table
```

### Backup Database

```powershell
# Create database backup
az sql db export `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user your_admin_username `
  --admin-password "YourSecurePassword123!" `
  --storage-key-type StorageAccessKey `
  --storage-key "your_storage_key" `
  --storage-uri "https://$storageAccount.blob.core.windows.net/backups/bloom-backup-$(Get-Date -Format 'yyyyMMdd').bacpac"
```

---

## Success Criteria Checklist

✅ SQL Database schema created with `applications` table  
✅ Blob Storage container `applications` created  
✅ Azure Functions deployed and responding  
✅ Application form accessible at `/join-us`  
✅ File uploads working (CV, certificate, photo)  
✅ Applications saved to database  
✅ Admin portal accessible at `/admin`  
✅ Admin can view all applications  
✅ Admin can change application status  
✅ Status updates persist to database  
✅ Documents downloadable from Blob Storage  
✅ Azure AD B2C authentication implemented  
✅ GitHub Actions deploying automatically  

---

## Next Steps (Phase 2)

**Not in scope for Proto-Bloom MVP:**
- Email notifications
- AHPRA verification API integration
- Multi-step form wizard
- Analytics dashboard
- Automated testing

**Already Implemented:**
✅ Azure AD B2C for admin authentication (using MSAL + ProtectedRoute)

**Future enhancements:**
1. Implement SendGrid for email notifications
2. Add Logic Apps for AHPRA verification workflow
3. Create Power BI dashboard for application metrics

---

## Quick Reference

### Resource Names
- **Resource Group:** `rg-lpa-unified`
- **SQL Server:** `lpa-sql-server.database.windows.net`
- **Database:** `lpa-bloom-db`
- **Storage Account:** `lpaapplicationstorage`
- **Function Apps:**
  - Dev: `bloom-functions-dev`
  - Staging: `bloom-functions-staging-new`
  - Prod: `bloom-platform-functions-v2`
- **Static Web Apps:**
  - Dev: `lpa-bloom-dev`
  - Staging: `lpa-bloom-staging`
  - Prod: `lpa-bloom-prod`

### URLs
- **Website:** https://life-psychology.com.au
- **Application Form:** https://life-psychology.com.au/join-us
- **Admin Portal:** https://life-psychology.com.au/admin (protected)
- **API Base (Prod):** https://bloom-platform-functions-v2.azurewebsites.net/api
- **API Base (Dev):** https://bloom-functions-dev.azurewebsites.net/api

### Local Development
```powershell
# Frontend
npm run dev
# -> http://localhost:5173

# Backend (in api/ folder)
func start
# -> http://localhost:7071
```

---

## Support

For issues or questions:
1. Check Azure Portal logs
2. Review Application Insights
3. Test locally with `func start`
4. Verify environment variables
5. Check firewall rules

**Deployment Time Estimate:** 1.5 - 2 hours total

Good luck! 🚀
