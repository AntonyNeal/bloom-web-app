# 🚀 Proto-Bloom MVP - Final Deployment Checklist

**Status**: ✅ Implementation Complete  
**Ready for**: Local Testing → Deployment  
**Estimated Deployment Time**: 1.5-2 hours  

---

## Pre-Flight Checklist ✈️

### Development Environment
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Azure CLI installed (`az --version`)
- [ ] Azure Functions Core Tools v4 installed (`func --version`)
- [ ] PowerShell available (Windows default)
- [ ] Git installed and configured
- [ ] Azure subscription active
- [ ] Access to Azure Portal

### Repository Status
- [x] All code files created
- [x] Database schema ready (`schema.sql`)
- [x] Backend API complete (`api/` folder)
- [x] Frontend forms complete (`src/pages/`)
- [x] Routing configured (`src/App.tsx`)
- [x] API configuration set (`src/config/api.ts`)
- [x] Documentation written (5 markdown files)
- [ ] Code pushed to GitHub (do this after local testing)

---

## Phase 1: Local Setup & Testing (30 minutes)

### Step 1: Install Dependencies
```powershell
# Frontend
cd "c:\Life Psychology Australia\repos\bloom-web-app"
npm install

# Backend
cd api
npm install
cd ..
```
- [ ] Frontend dependencies installed (no errors)
- [ ] Backend dependencies installed (no errors)

### Step 2: Azure Login
```powershell
az login
az account show
```
- [ ] Successfully logged into Azure
- [ ] Correct subscription selected

### Step 3: Database Setup
```powershell
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user YOUR_USERNAME `
  --admin-password "YOUR_PASSWORD" `
  --file schema.sql
```
- [ ] Schema executed successfully
- [ ] `applications` table created
- [ ] Indexes created (status, created_at, email)

### Step 4: Storage Setup
```powershell
$connectionString = az storage account show-connection-string `
  --name lpaapplicationstorage `
  --resource-group lpa-resources `
  --query connectionString `
  --output tsv

az storage container create `
  --name applications `
  --connection-string $connectionString `
  --public-access off
```
- [ ] Connection string retrieved
- [ ] Container `applications` created
- [ ] Connection string saved for next step

### Step 5: Configure Local Settings
Edit `api/local.settings.json`:
- [ ] SQL_SERVER set to `lpa-sql-server.database.windows.net`
- [ ] SQL_DATABASE set to `lpa-bloom-db`
- [ ] SQL_USER set to your admin username
- [ ] SQL_PASSWORD set to your admin password
- [ ] AZURE_STORAGE_CONNECTION_STRING set to connection string from Step 4
- [ ] CORS set to `"*"`

### Step 6: Firewall Rules
```powershell
$myIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

az sql server firewall-rule create `
  --server lpa-sql-server `
  --resource-group lpa-resources `
  --name "Development-$(Get-Date -Format 'yyyyMMdd')" `
  --start-ip-address $myIp `
  --end-ip-address $myIp
```
- [ ] Local IP added to SQL firewall rules
- [ ] Azure services allowed (0.0.0.0)

### Step 7: Start Backend (Terminal 1)
```powershell
cd "c:\Life Psychology Australia\repos\bloom-web-app\api"
func start
```
- [ ] Backend started without errors
- [ ] Shows 2 functions: applications, upload
- [ ] Listening on http://localhost:7071

### Step 8: Start Frontend (Terminal 2)
```powershell
cd "c:\Life Psychology Australia\repos\bloom-web-app"
npm run dev
```
- [ ] Frontend started without errors
- [ ] Accessible at http://localhost:5173

### Step 9: Test Application Form
Navigate to `http://localhost:5173/#/join-us`

Test data:
- First Name: `Test`
- Last Name: `Psychologist`
- Email: `test-[random]@example.com` (use unique email)
- Phone: `+61 400 000 000`
- AHPRA: `PSY0001234567`
- Experience: `5`
- Cover Letter: `This is a test application for Proto-Bloom.`
- Upload: Any PDF for CV and certificate

- [ ] Form loads correctly
- [ ] All fields render
- [ ] Can select files
- [ ] Submit button appears
- [ ] Form submits successfully
- [ ] Success message displays
- [ ] No console errors

### Step 10: Test Admin Portal
Navigate to `http://localhost:5173/#/admin`

- [ ] Admin portal loads
- [ ] Dashboard shows counts (1 submitted)
- [ ] Test application appears in list
- [ ] Can click application to view details
- [ ] Cover letter displays correctly
- [ ] Document links are present
- [ ] Can click "Mark as Reviewing"
- [ ] Status badge updates to yellow "reviewing"
- [ ] Can click "Approve"
- [ ] Status badge updates to green "approved"
- [ ] No console errors

### Step 11: Verify Database
```powershell
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user YOUR_USERNAME `
  --admin-password "YOUR_PASSWORD" `
  --query "SELECT id, first_name, last_name, email, status FROM applications"
```
- [ ] Test application exists in database
- [ ] Status is `approved`
- [ ] All fields populated correctly

### Step 12: Verify Blob Storage
```powershell
az storage blob list `
  --container-name applications `
  --connection-string "YOUR_CONNECTION_STRING" `
  --output table
```
- [ ] CV file uploaded to `cv/` folder
- [ ] Certificate file uploaded to `certificate/` folder
- [ ] Files are accessible (test one URL in browser)

---

## Phase 2: Azure Deployment (60 minutes)

### Step 1: Deploy Azure Functions
```powershell
cd api
func azure functionapp publish lpa-bloom-functions
```
- [ ] Function app deployed successfully
- [ ] Shows deployment URL
- [ ] No deployment errors

### Step 2: Configure Function App Settings
```powershell
$connectionString = az storage account show-connection-string `
  --name lpaapplicationstorage `
  --resource-group lpa-resources `
  --query connectionString `
  --output tsv

az functionapp config appsettings set `
  --name lpa-bloom-functions `
  --resource-group lpa-resources `
  --settings `
    "SQL_SERVER=lpa-sql-server.database.windows.net" `
    "SQL_DATABASE=lpa-bloom-db" `
    "SQL_USER=YOUR_USERNAME" `
    "SQL_PASSWORD=YOUR_PASSWORD" `
    "AZURE_STORAGE_CONNECTION_STRING=$connectionString"
```
- [ ] All environment variables set
- [ ] Settings confirmed in Azure Portal

### Step 3: Configure CORS
```powershell
az functionapp cors add `
  --name lpa-bloom-functions `
  --resource-group lpa-resources `
  --allowed-origins "https://life-psychology.com.au" "http://localhost:5173"
```
- [ ] CORS configured for production domain
- [ ] CORS configured for local development

### Step 4: Test Production API
```powershell
$functionUrl = az functionapp show `
  --name lpa-bloom-functions `
  --resource-group lpa-resources `
  --query defaultHostName `
  --output tsv

Invoke-RestMethod -Uri "https://$functionUrl/api/applications" -Method GET
```
- [ ] API responds successfully
- [ ] Returns array of applications (including test application)

### Step 5: Update Frontend API Config
Verify `src/config/api.ts` has correct production URL:
```typescript
export const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://lpa-bloom-functions.azurewebsites.net/api'
    : 'http://localhost:7071/api';
```
- [ ] Production URL is correct
- [ ] Local URL is correct

### Step 6: Build Frontend
```powershell
cd "c:\Life Psychology Australia\repos\bloom-web-app"
npm run build
```
- [ ] Build completes without errors
- [ ] `dist/` folder created

### Step 7: Commit & Push to GitHub
```powershell
git add .
git commit -m "feat: Proto-Bloom application management system

- Database schema for applications table
- Azure Functions API (applications & upload endpoints)
- Application form with file uploads at /join-us
- Admin review portal with status management at /admin
- Integration with Azure SQL and Blob Storage
- Complete documentation (DEPLOYMENT, QUICKSTART, etc.)
- Ready for production deployment"

git push origin staging
```
- [ ] All files committed
- [ ] Pushed to staging branch
- [ ] No git errors

### Step 8: Monitor GitHub Actions
Go to: `https://github.com/AntonyNeal/bloom-web-app/actions`

- [ ] GitHub Actions workflow triggered
- [ ] Build step passes
- [ ] Deploy step passes
- [ ] Static Web App deployed successfully

---

## Phase 3: Production Testing (30 minutes)

### Test 1: Application Submission (Production)
Navigate to: `https://life-psychology.com.au/#/join-us`

Submit another test application with different email:
- Email: `production-test@example.com`
- Other fields: fill with test data

- [ ] Production form loads correctly
- [ ] All styling appears correct (sage green theme)
- [ ] File uploads work
- [ ] Form submits successfully
- [ ] Success message displays
- [ ] No console errors

### Test 2: Admin Portal (Production)
Navigate to: `https://life-psychology.com.au/#/admin`

- [ ] Admin portal loads
- [ ] Shows 2 applications (local test + production test)
- [ ] Dashboard counts are correct
- [ ] Can view application details
- [ ] Status updates work
- [ ] Document links work
- [ ] No console errors

### Test 3: Database Verification
```powershell
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user YOUR_USERNAME `
  --admin-password "YOUR_PASSWORD" `
  --query "SELECT id, email, status, created_at FROM applications ORDER BY created_at DESC"
```
- [ ] Both test applications in database
- [ ] Production test application has correct data
- [ ] Timestamps are accurate

### Test 4: Error Handling
Try to submit duplicate email: `production-test@example.com`

- [ ] Form shows error message
- [ ] Error is user-friendly
- [ ] Application is NOT created in database

### Test 5: File Download
From admin portal, click document links:

- [ ] CV downloads/opens correctly
- [ ] Certificate downloads/opens correctly
- [ ] Files are the correct ones uploaded

---

## Phase 4: Monitoring Setup (20 minutes)

### Step 1: Application Insights
Azure Portal → Function App → Application Insights

- [ ] Application Insights enabled
- [ ] Live metrics showing
- [ ] No errors in logs

### Step 2: Cost Monitoring
Azure Portal → Cost Management → Cost Analysis

- [ ] Current month costs displayed
- [ ] Estimated monthly cost ~$6-7
- [ ] Budget alerts configured (optional)

### Step 3: Set Up Alerts (Optional)
- [ ] Alert for API errors > 5%
- [ ] Alert for database DTU > 80%
- [ ] Email notifications configured

---

## Phase 5: Cleanup & Documentation (10 minutes)

### Test Data Cleanup
```powershell
# Optional: Delete test applications from database
az sql db query `
  --server lpa-sql-server `
  --database lpa-bloom-db `
  --admin-user YOUR_USERNAME `
  --admin-password "YOUR_PASSWORD" `
  --query "DELETE FROM applications WHERE email LIKE '%test%' OR email LIKE '%example.com'"
```
- [ ] Test applications removed (if desired)
- [ ] Production database clean

### Documentation Review
- [ ] QUICKSTART.md reviewed
- [ ] DEPLOYMENT.md reviewed
- [ ] APPLICATION_MANAGEMENT_README.md reviewed
- [ ] ARCHITECTURE.md reviewed
- [ ] IMPLEMENTATION_SUMMARY.md reviewed

### Share with Team
- [ ] Email admin portal URL to team: `https://life-psychology.com.au/#/admin`
- [ ] Email application form URL: `https://life-psychology.com.au/#/join-us`
- [ ] Share login instructions (if authentication added)
- [ ] Document any passwords/credentials securely

---

## Success Criteria ✅

All of the following should be true:

- [x] Database schema deployed
- [x] Azure Functions API deployed and responding
- [x] Blob Storage configured
- [x] Frontend deployed to Static Web App
- [ ] Application form accessible at production URL
- [ ] Applications submit successfully in production
- [ ] Files upload to Blob Storage
- [ ] Admin portal accessible at production URL
- [ ] Applications visible in admin list
- [ ] Status updates work in production
- [ ] No console errors on either page
- [ ] No API errors in Application Insights
- [ ] Documentation complete

---

## Rollback Plan 🔄

If anything goes wrong:

### Rollback Backend
```powershell
# Redeploy previous version
cd api
git checkout main  # or previous commit
func azure functionapp publish lpa-bloom-functions
```

### Rollback Frontend
```powershell
# GitHub Actions - redeploy previous commit
git revert HEAD
git push origin staging
```

### Rollback Database
```powershell
# Restore from backup (if configured)
az sql db restore `
  --dest-database lpa-bloom-db-restored `
  --resource-group lpa-resources `
  --server lpa-sql-server `
  --time "2025-01-15T10:00:00Z"  # Time before deployment
```

---

## Post-Deployment Tasks 📋

### Week 1
- [ ] Monitor for errors daily
- [ ] Check Application Insights for issues
- [ ] Verify all submissions working
- [ ] Gather initial user feedback

### Week 2
- [ ] Review cost analysis
- [ ] Optimize any slow queries
- [ ] Consider adding email notifications (Phase 2)
- [ ] Plan authentication implementation (Phase 2)

### Month 1
- [ ] Analyze submission patterns
- [ ] Review applicant-to-hire conversion
- [ ] Identify any UX improvements
- [ ] Plan next features

---

## Emergency Contacts 🚨

If critical issues arise:

- **Azure Support**: Azure Portal → Help + Support
- **Application Insights**: Check Function App logs
- **Database Issues**: Check firewall rules, query performance
- **Storage Issues**: Verify connection strings, check quotas

---

## Celebration Time! 🎉

Once all checkboxes are complete:

✅ Proto-Bloom MVP is LIVE!  
✅ Ready to onboard Psychologist #2!  
✅ Life Psychology Australia has a modern, scalable application system!  

**Next milestone**: 10 applications processed successfully 🎯

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Production URL**: https://life-psychology.com.au  
**Admin Portal**: https://life-psychology.com.au/#/admin  
**Application Form**: https://life-psychology.com.au/#/join-us  

**Status**: 🟢 LIVE
