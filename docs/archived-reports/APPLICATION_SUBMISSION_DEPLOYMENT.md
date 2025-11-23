# Application Submission Infrastructure - Deployment Summary

## ✅ COMPLETED TASKS

### 1. Backend API Functions - DEPLOYED
**Location**: `api/src/functions/`
- ✅ `applications.ts` - Handles GET/POST/PUT for applications
- ✅ `upload.ts` - Handles file uploads to Azure Blob Storage

**Deployment Status**: 
- Functions built successfully
- Deployed to `bloom-platform-functions-v2.azurewebsites.net`
- Endpoints:
  - `POST /api/applications` - Create new application
  - `GET /api/applications` - List all applications
  - `GET /api/applications/{id}` - Get specific application
  - `PUT /api/applications/{id}` - Update application status
  - `POST /api/upload?type={cv|certificate|photo}` - Upload files

### 2. Frontend Code - READY
**Location**: `src/pages/JoinUs.tsx` + `src/config/api.ts`
- ✅ Qualification check data passed to main form
- ✅ All form fields collected (including qualification_type, qualification_check)
- ✅ File upload integration ready
- ✅ API endpoints configured correctly

### 3. Azure Infrastructure - VERIFIED
- ✅ SQL Server: `lpa-sql-server.database.windows.net`
- ✅ Database: `lpa-applications-db` (Online, Basic tier)
- ✅ Storage Account: `lpastorage13978`
- ✅ Blob Container: `applications`
- ✅ Function App: `bloom-platform-functions-v2` (Running)
- ✅ Environment Variables:
  - `SQL_CONNECTION_STRING` ✓
  - `STORAGE_CONNECTION_STRING` ✓

---

## ⚠️ MANUAL STEPS REQUIRED

### Step 1: Run Database Migration
The database needs two new columns added to the `applications` table.

**Option A - Using Azure Portal**:
1. Go to https://portal.azure.com
2. Navigate to: SQL databases → lpa-applications-db → Query editor
3. Run this SQL:

```sql
-- Add qualification fields
ALTER TABLE applications 
ADD qualification_type NVARCHAR(50) NULL;

ALTER TABLE applications 
ADD qualification_check NVARCHAR(MAX) NULL;

-- Verify columns were added
SELECT TOP 1 * FROM applications;
```

**Option B - Using SQL Server Management Studio (SSMS)**:
1. Connect to `lpa-sql-server.database.windows.net`
2. Select database: `lpa-applications-db`
3. Run the SQL script from: `api/migrations/001_add_qualification_fields.sql`

### Step 2: Verify Function Deployment
Check that the new functions are live:

```powershell
# List all functions
az functionapp function list --name bloom-platform-functions-v2 --resource-group lpa-rg --query "[].name" -o table

# Expected output should include:
# - applications
# - upload
```

### Step 3: Test the Endpoints

**Test Applications Endpoint**:
```powershell
curl -X POST https://bloom-platform-functions-v2.azurewebsites.net/api/applications `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "ahpra_registration": "PSY1234567",
    "qualification_type": "clinical"
  }'
```

**Test Upload Endpoint**:
```powershell
curl -X POST "https://bloom-platform-functions-v2.azurewebsites.net/api/upload?type=cv" `
  -F "file=@path/to/test.pdf"
```

### Step 4: Frontend Build & Deploy
```powershell
cd c:\Life Psychology Australia\repos\bloom-web-app
npm run build
# Then deploy to Azure Static Web App
```

---

## 📋 VERIFICATION CHECKLIST

Before testing application submission:
- [ ] Database migration completed (qualification_type and qualification_check columns exist)
- [ ] Functions deployed and visible in Azure (`applications` and `upload`)
- [ ] Test POST to /api/applications returns 201 Created
- [ ] Test POST to /api/upload returns 200 with URL
- [ ] Frontend build successful
- [ ] Frontend deployed to Azure Static Web App

---

## 🔧 CONFIGURATION DETAILS

### Database Schema
```sql
CREATE TABLE applications (
  id INT PRIMARY KEY IDENTITY(1,1),
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(20),
  ahpra_registration NVARCHAR(50) NOT NULL,
  specializations NVARCHAR(MAX), -- JSON array
  experience_years INT,
  cv_url NVARCHAR(500),
  certificate_url NVARCHAR(500),
  photo_url NVARCHAR(500),
  cover_letter TEXT,
  qualification_type NVARCHAR(50), -- NEW: 'clinical', 'experienced', 'phd'
  qualification_check NVARCHAR(MAX), -- NEW: JSON of qualification check data
  status NVARCHAR(20) DEFAULT 'submitted',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  reviewed_by NVARCHAR(100),
  reviewed_at DATETIME2
);
```

### Function App Settings (Already Configured)
- `SQL_CONNECTION_STRING`: Connection to lpa-applications-db
- `STORAGE_CONNECTION_STRING`: Connection to lpastorage13978
- `FUNCTIONS_WORKER_RUNTIME`: node
- `FUNCTIONS_EXTENSION_VERSION`: ~4

### Blob Storage
- Container: `applications`
- Structure:
  - `cv/{timestamp}-{filename}`
  - `certificate/{timestamp}-{filename}`
  - `photo/{timestamp}-{filename}`

---

## 🎯 TESTING WORKFLOW

1. **Navigate to**: https://your-bloom-app.azurestaticapps.net/join-us
2. **Fill Qualification Check** (Page 1):
   - Select: "I am a Registered Clinical Psychologist" OR
   - Enter: 8+ years registered OR
   - Select: "I hold a PhD in Psychology"
   - Click: "Check Eligibility"
3. **Fill Application Form** (Page 2):
   - Personal info (auto-populated experience years if applicable)
   - AHPRA registration number
   - Upload CV, certificates, photo
   - Write cover letter
   - Click: "Submit Application"
4. **Verify Success**:
   - Success message appears
   - Check database for new record
   - Check blob storage for uploaded files

---

## 🐛 TROUBLESHOOTING

### Issue: "Missing required fields" error
- Check that first_name, last_name, email, ahpra_registration are filled
- Verify request body in Network tab

### Issue: "Storage connection string not configured"
- Verify `STORAGE_CONNECTION_STRING` in Function App settings
- Restart Function App after adding

### Issue: "Cannot connect to database"
- Verify `SQL_CONNECTION_STRING` in Function App settings
- Check SQL Server firewall allows Azure services
- Verify database is online

### Issue: Files not uploading
- Check CORS settings on storage account
- Verify `applications` container exists
- Check file size limits

---

## 📝 NEXT STEPS AFTER MANUAL TASKS

Once database migration is complete:
1. Test application submission from frontend
2. Verify data appears in database
3. Verify files appear in blob storage
4. Test admin dashboard can view applications
5. Monitor Application Insights for errors

---

**Created**: October 21, 2025
**Last Updated**: October 21, 2025
**Status**: Ready for database migration and final testing
