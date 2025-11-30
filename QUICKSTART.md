# Quick Start Guide - Proto-Bloom Application Management

This guide will get you up and running with the Proto-Bloom application management system in under 10 minutes.

## Prerequisites Check

Before starting, verify you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ Azure CLI installed (`az --version`)
- ✅ Azure Functions Core Tools (`func --version`)
- ✅ PowerShell (Windows default)

## Step 1: Install Dependencies (2 minutes)

### Frontend Dependencies
```powershell
cd "c:\Repos\bloom-web-app"
npm install
```

### Backend Dependencies
```powershell
cd "c:\Repos\bloom-web-app\api"
npm install
cd ..
```

Expected output: All packages installed successfully.

## Step 2: Configure Azure Resources (5 minutes)

### A. Database Setup

```powershell
# Login to Azure
az login

# Run database schema
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user YOUR_USERNAME `
  --admin-password "YOUR_PASSWORD" `
  --file schema.sql
```

### B. Blob Storage Setup

```powershell
# Get storage connection string
$connectionString = az storage account show-connection-string `
  --name lpaapplicationstorage `
  --resource-group rg-lpa-unified `
  --query connectionString `
  --output tsv

# Create applications container
az storage container create `
  --name applications `
  --connection-string $connectionString `
  --public-access off

# Display connection string for next step
Write-Host "Connection String: $connectionString"
```

### C. Update local.settings.json

Edit `api\local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SQL_SERVER": "lpa-sql-server.database.windows.net",
    "SQL_DATABASE": "lpa-bloom-db",
    "SQL_USER": "YOUR_USERNAME",
    "SQL_PASSWORD": "YOUR_PASSWORD",
    "AZURE_STORAGE_CONNECTION_STRING": "paste_connection_string_here"
  },
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

## Step 3: Add Firewall Rule (1 minute)

Allow your local IP to access Azure SQL:

```powershell
# Get your public IP
$myIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Add firewall rule
az sql server firewall-rule create `
  --server lpa-sql-server `
  --resource-group rg-lpa-unified `
  --name "DevelopmentMachine" `
  --start-ip-address $myIp `
  --end-ip-address $myIp
```

## Step 4: Start Development Servers (1 minute)

### Terminal 1: Backend API
```powershell
cd "c:\Repos\bloom-web-app\api"
func start
```

Expected output:
```
Functions:
  applications: [GET,POST,PUT] http://localhost:7071/api/applications/{id?}
  upload: [POST] http://localhost:7071/api/upload
  ab-test: [GET,POST] http://localhost:7071/api/ab-test
  health: [GET] http://localhost:7071/api/health
  ... (additional functions)
```

### Terminal 2: Frontend Dev Server
```powershell
cd "c:\Repos\bloom-web-app"
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms
➜ Local:   http://localhost:5173/
```

## Step 5: Test the Application (3 minutes)

### Test 1: Application Form

1. Open browser: `http://localhost:5173/join-us`
2. Fill in test data:
   - First Name: `Test`
   - Last Name: `Psychologist`
   - Email: `test@example.com`
   - Phone: `+61 400 000 000`
   - AHPRA: `PSY0001234567`
   - Experience: `5`
   - Cover Letter: `This is a test application for the Proto-Bloom system.`
3. Upload files:
   - CV: Any PDF file
   - Certificate: Any PDF/JPG file
   - Photo: (optional) Any JPG file
4. Click "Submit Application"
5. ✅ Success message should appear

### Test 2: Admin Portal

1. Open browser: `http://localhost:5173/admin` (requires Azure AD login)
2. ✅ You should see the test application in the list
3. Click on the application
4. ✅ Full details should appear on the right
5. Click "Mark as Reviewing"
6. ✅ Status badge should update to yellow "reviewing"
7. Click "Approve"
8. ✅ Status should change to green "approved"

### Test 3: API Directly

Test API endpoints with PowerShell:

```powershell
# Get all applications
Invoke-RestMethod -Uri "http://localhost:7071/api/applications" -Method GET

# Should return array with your test application
```

## Step 6: Verify Database

Check that data was saved correctly:

```powershell
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user YOUR_USERNAME `
  --admin-password "YOUR_PASSWORD" `
  --query "SELECT id, first_name, last_name, email, status FROM applications"
```

Expected output:
```
id  first_name  last_name     email                 status
1   Test        Psychologist  test@example.com      approved
```

## Step 7: Verify Blob Storage

Check uploaded files:

```powershell
az storage blob list `
  --container-name applications `
  --connection-string "YOUR_CONNECTION_STRING" `
  --output table
```

You should see 2-3 blobs (cv, certificate, and optionally photo).

---

## Common Issues

### ❌ "Cannot connect to SQL Database"

**Solution:**
```powershell
# Check and add firewall rule again
$myIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
az sql server firewall-rule create `
  --server lpa-sql-server `
  --resource-group rg-lpa-unified `
  --name "DevIP-$(Get-Date -Format 'yyyyMMdd')" `
  --start-ip-address $myIp `
  --end-ip-address $myIp
```

### ❌ "Upload failed"

**Solution:**
- Verify `AZURE_STORAGE_CONNECTION_STRING` is set correctly in `local.settings.json`
- Check container exists: `az storage container exists --name applications --connection-string "..."`

### ❌ "CORS error"

**Solution:**
- Ensure `Host.CORS` is set to `"*"` in `api/local.settings.json`
- Restart the Azure Functions backend

### ❌ Functions won't start

**Solution:**
```powershell
cd api
npm install  # Reinstall dependencies
npm run build  # Rebuild TypeScript
func start
```

---

## What's Next?

✅ **Local development working?** You're ready to deploy!

**Deploy to Azure:**
```powershell
# See DEPLOYMENT.md for full instructions

# Quick deploy backend (use environment-specific function app)
cd api
# Dev: func azure functionapp publish bloom-functions-dev
# Staging: func azure functionapp publish bloom-functions-staging-new
# Prod: func azure functionapp publish bloom-platform-functions-v2

# Quick deploy frontend (via GitHub)
git add .
git commit -m "feat: Proto-Bloom application management"
git push origin develop  # or staging/main
```

**Production URLs:**
- Application Form: `https://bloom.life-psychology.com.au/join-us`
- Admin Portal: `https://bloom.life-psychology.com.au/admin`
- Practitioner Dashboard: `https://bloom.life-psychology.com.au/bloom-home`

---

## Development Workflow

### Daily Development

1. **Start backend** (Terminal 1):
   ```powershell
   cd api ; func start
   ```

2. **Start frontend** (Terminal 2):
   ```powershell
   npm run dev
   ```

3. **Make changes** to files
4. **Test** at `http://localhost:5173`
5. **Commit** when ready

### Making Changes

**Frontend changes:**
- Edit files in `src/pages/` or `src/components/`
- Hot reload is automatic
- No restart needed

**Backend changes:**
- Edit files in `api/applications/` or `api/upload/`
- TypeScript auto-compiles (`npm run watch`)
- Restart `func start` if needed

### Testing Changes

**Test application form:**
```powershell
# Submit test application
$body = @{
  first_name = "Test"
  last_name = "User"
  email = "test-$(Get-Random)@example.com"
  ahpra_registration = "PSY$(Get-Random -Minimum 1000000 -Maximum 9999999)"
  experience_years = 5
  cover_letter = "Test application"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:7071/api/applications" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## Success! 🎉

You now have a fully functional application management system running locally. 

**Next Steps:**
1. Review the code in `src/pages/JoinUs.tsx` and `src/pages/admin/ApplicationManagement.tsx`
2. Customize styling/branding as needed
3. Deploy to production (see `DEPLOYMENT.md`)
4. Monitor with Application Insights

**Need help?** Check `APPLICATION_MANAGEMENT_README.md` for full documentation.
