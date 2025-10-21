# 🚀 Application Submission - Quick Start Guide

## Status: READY FOR DATABASE MIGRATION

### ✅ COMPLETED
- Backend API functions deployed to Azure ✓
- Frontend code ready ✓
- Azure infrastructure verified ✓
- All code committed and pushed ✓

---

## 🎯 WHAT YOU NEED TO DO NOW

### **STEP 1: Run Database Migration (5 minutes)**

Go to: https://portal.azure.com → SQL databases → lpa-applications-db → Query editor

Run this SQL:
```sql
ALTER TABLE applications 
ADD qualification_type NVARCHAR(50) NULL;

ALTER TABLE applications 
ADD qualification_check NVARCHAR(MAX) NULL;
```

---

### **STEP 2: Verify Deployment (2 minutes)**

Check functions are live:
```powershell
az functionapp function list --name bloom-platform-functions-v2 --resource-group lpa-rg --query "[].name" -o table
```

Should see: `applications` and `upload` in the list.

---

### **STEP 3: Test Application Submission (10 minutes)**

1. Go to your Bloom app: `/join-us`
2. Fill qualification check (page 1)
3. Fill application form (page 2)
4. Submit and verify success

---

## 🔍 VERIFICATION COMMANDS

**Test Create Application**:
```powershell
$body = @{
    first_name = "Test"
    last_name = "User"
    email = "test@example.com"
    ahpra_registration = "PSY1234567"
    qualification_type = "clinical"
} | ConvertTo-Json

Invoke-WebRequest -Method POST `
  -Uri "https://bloom-platform-functions-v2.azurewebsites.net/api/applications" `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**Expected Response**: `201 Created` with application data

---

## 📚 Full Documentation

See `APPLICATION_SUBMISSION_DEPLOYMENT.md` for complete details.

---

## ⚡ Quick Troubleshooting

**Problem**: Database migration fails
- **Solution**: Check if columns already exist, skip if they do

**Problem**: Functions not showing up
- **Solution**: Wait 2-3 minutes for Azure to sync, then re-check

**Problem**: Application submission fails
- **Solution**: Check browser console, verify database migration completed

---

**Ready to go!** Just run the database migration and you can start accepting applications. 🌸
