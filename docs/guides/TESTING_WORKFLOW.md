# 🌸 Bloom Onboarding Workflow - Testing Guide

## Overview
This document describes the complete onboarding workflow and how to test each stage. The workflow has multiple **safety gates** to ensure data integrity and proper Halaxy integration.

## Workflow Stages

### Stage 1: Admin Reviews Application
**Location:** Admin Dashboard → Application Management

1. Navigate to `https://localhost:3000/admin`
2. Application appears in "Reviewing" status
3. Admin can view:
   - Basic information (name, email, phone)
   - Qualifications (AHPRA registration, specializations)
   - Experience and photo

**Status:** ✅ Application visible in list

---

### Stage 2: Admin Approves & Generates Offer
**Location:** Admin Dashboard → Application Detail → "Accept Application" button

1. Click on the application to open detail view
2. Click **"Accept Application"** button
3. Application status changes to **"Accepted"**
4. Offer token is generated and stored in database
5. Application is ready for practitioner to review

**Expected Database State:**
```sql
SELECT 
  id, status, offer_token, offer_sent_at, 
  practitioner_id, halaxy_practitioner_verified
FROM applications 
WHERE id = @app_id

-- Should show:
-- status: 'accepted'
-- offer_token: [UUID]
-- offer_sent_at: [timestamp]
-- practitioner_id: NULL
-- halaxy_practitioner_verified: 0
```

**Status:** ✅ Application accepted, offer token generated

---

### Stage 3: Admin Verifies Practitioner in Halaxy
**Location:** Admin Dashboard → Application Detail → "Accepted" status section

⚠️ **CRITICAL GATE:** This must be done BEFORE the "Send Onboarding Invite" button will work.

1. In the "Accepted" applications section, find the application
2. You should see a **HalaxyClinicianSetup** component with instructions:
   ```
   Step 1: Add [Practitioner Name] to Halaxy
   Step 2: Note the Halaxy Practitioner ID  
   Step 3: Click "Verify in Halaxy" button
   ```
3. Copy practitioner ID from Halaxy
4. Click **"Verify in Halaxy"** button
5. Application status badge changes from **"⏳ Awaiting Halaxy"** to **"✅ Halaxy Ready"**

**Expected Database State After Verification:**
```sql
SELECT 
  id, practitioner_id, halaxy_practitioner_verified, 
  halaxy_verified_at, halaxy_account_id
FROM applications 
WHERE id = @app_id

-- Should show:
-- practitioner_id: [value]
-- halaxy_practitioner_verified: 1
-- halaxy_verified_at: [timestamp]
-- halaxy_account_id: [ID from Halaxy]
```

**Button State:**
- ❌ **Before:** "🔒 Send Onboarding Invite (Awaiting Halaxy)" - DISABLED
- ✅ **After:** "🚀 Send Onboarding Invite" - ENABLED

**Status:** ✅ Practitioner verified in Halaxy

---

### Stage 4: Practitioner Views & Downloads Offer
**Location:** Offer link sent to practitioner (in development, accessible via admin interface)

1. Practitioner opens offer link (format: `https://app.bloom.local/accept-offer/{token}`)
2. Page displays:
   - Welcome message
   - Practitioner information (verification)
   - **Download Contract** button
   - **Upload Signed Contract** section (initially shows upload button)
   - **Accept Offer** button (DISABLED until contract uploaded)

3. Practitioner clicks **"Download Contract (PDF)"**
4. PDF opens in new tab for review

**UI State:**
- Upload section shows: **"📄 Upload Signed Contract (PDF)"** button (blue, enabled)
- Accept button shows: **"⚠️ Please upload your signed contract above before accepting"** warning
- Accept button is **DISABLED** (grayed out)

**Status:** ✅ Offer downloaded for review

---

### Stage 5: Practitioner Uploads Signed Contract
**Location:** Accept Offer Page → "Upload Signed Contract" section

⚠️ **CRITICAL GATE:** Signed contract MUST be uploaded before acceptance.

1. Practitioner reviews PDF and signs it
2. Practitioner clicks **"📄 Upload Signed Contract (PDF)"** button
3. File picker opens (PDF only)
4. Select signed PDF file and upload
5. **Browser console will show:**
   ```
   📤 Starting contract upload: [filename]
   📤 Upload URL: /api/accept-offer/{token}/signed-contract
   📤 Upload response status: 200
   📤 Upload response data: { success: true, message: "Signed contract uploaded successfully" }
   ✅ Contract uploaded successfully
   ```
6. Upload section updates to show:
   ```
   ✅ Signed contract uploaded successfully!
   [Link to re-upload a different file]
   ```

**Expected Database State:**
```sql
SELECT 
  id, signed_contract_url, offer_accepted_at
FROM applications 
WHERE id = @app_id

-- Should show:
-- signed_contract_url: 'https://...blob.core.windows.net/applications/...'
-- offer_accepted_at: NULL (not yet accepted)
```

**UI State After Upload:**
- Upload section turns **green** with checkmark
- Accept button becomes **ENABLED** (green, clickable)
- Warning message disappears

**Debugging if Upload Fails:**
- Check **Browser Console** (F12) for error messages
- Look for network tab errors showing upload response
- Verify Azure Blob Storage is configured
- Check Azure Storage connection string in function app settings

**Status:** ✅ Signed contract uploaded and stored in Azure Blob

---

### Stage 6: Practitioner Accepts Offer
**Location:** Accept Offer Page → "Accept Offer & Join Bloom" button

⚠️ **CRITICAL GATE:** Button disabled until signed contract is uploaded.

1. Practitioner has uploaded signed contract (see Stage 5)
2. Accept button is now **ENABLED** and shows: **"✅ Accept Offer & Join Bloom"**
3. Practitioner clicks button
4. **Browser console will show:**
   ```
   ✅ Accepting offer for token: {token}
   ✅ Accept response status: 200
   ✅ Accept response data: { 
     success: true, 
     message: "Congratulations! You have accepted the offer..."
   }
   ```
5. Page transitions to success screen:
   ```
   🎉 Welcome to Bloom!
   Congratulations [Practitioner Name]! You've accepted the offer...
   ```

**Expected Database State:**
```sql
SELECT 
  id, status, offer_accepted_at, accepted_at
FROM applications 
WHERE id = @app_id

-- Should show:
-- status: 'accepted'
-- offer_accepted_at: [timestamp]
-- accepted_at: [timestamp]
```

**Possible Errors:**
- **400: "Cannot accept offer without uploading a signed contract"**
  - Solution: Ensure signed_contract_url is NOT NULL in database
  - Troubleshoot: Check upload in previous stage

**Status:** ✅ Offer accepted by practitioner

---

### Stage 7: Admin Sends Onboarding Email
**Location:** Admin Dashboard → Application Management → "Accepted" section

⚠️ **CRITICAL GATE:** Email only sends if BOTH conditions met:
1. Practitioner has uploaded signed contract (`signed_contract_url` NOT NULL)
2. Practitioner is verified in Halaxy (`halaxy_practitioner_verified` = 1)

1. Admin returns to Application Management
2. Application shows in "Accepted" section
3. Admin verifies:
   - Status badge shows: **"✅ Halaxy Ready"**
   - "🚀 Send Onboarding Invite" button is **ENABLED**
4. Admin clicks **"🚀 Send Onboarding Invite"** button
5. API calls `/api/accept-application/{id}`
6. Response shows email status:
   ```json
   {
     "success": true,
     "message": "Practitioner created and onboarding email sent",
     "emailSent": true,
     "halaxyVerified": true
   }
   ```

**Expected Database State:**
- New row created in `practitioners` table
- Email should be sent to practitioner email address
- Onboarding token generated and stored

**Email Should Include:**
- Subject: "🌸 Welcome to Bloom! Your Onboarding Awaits"
- Practitioner's onboarding link
- Next steps instructions
- Contract link for reference

**Debugging Email Issues:**

If email not received:
1. Check spam/junk folder
2. Verify sender email: `donotreply@life-psychology.com.au`
3. Check Azure Communication Services (ACS) logs for failures
4. Verify ACS resource is configured with correct sender domain
5. Check function app logs for email send errors

**Status:** ✅ Email sent (if ACS configured correctly)

---

## Testing Workflow Cycle

### Complete Test Flow (Start to Finish)

```
1. RESET: node api/reset-application.js
   ✅ Application: "reviewing"
   ✅ Offer fields: cleared

2. ADMIN APPROVES: Click "Accept Application"
   ✅ Status: "accepted"
   ✅ Offer token: generated

3. ADMIN VERIFIES HALAXY: Click "Verify in Halaxy"
   ✅ halaxy_practitioner_verified: 1
   ✅ Send button: ENABLED

4. PRACTITIONER DOWNLOADS: Open offer link
   ✅ Page loads with contract
   ✅ Upload button visible

5. PRACTITIONER UPLOADS: Click upload button
   ✅ signed_contract_url: populated
   ✅ Accept button: ENABLED

6. PRACTITIONER ACCEPTS: Click accept button
   ✅ offer_accepted_at: set
   ✅ Success page shown

7. ADMIN SENDS EMAIL: Click "Send Onboarding Invite"
   ✅ Practitioner created
   ✅ Email sent
   ✅ Onboarding link generated
```

---

## Database Verification Queries

### Check Application State
```sql
SELECT 
  id,
  first_name,
  email,
  status,
  offer_token,
  offer_sent_at,
  offer_accepted_at,
  accepted_at,
  signed_contract_url,
  practitioner_id,
  halaxy_practitioner_verified,
  halaxy_verified_at,
  halaxy_account_id
FROM applications 
ORDER BY created_at DESC;
```

### Check Upload Completion
```sql
SELECT 
  id,
  email,
  signed_contract_url,
  offer_accepted_at
FROM applications 
WHERE signed_contract_url IS NOT NULL;
```

### Check Halaxy Verification
```sql
SELECT 
  id,
  email,
  halaxy_practitioner_verified,
  halaxy_verified_at,
  halaxy_account_id
FROM applications 
WHERE halaxy_practitioner_verified = 1;
```

---

## Troubleshooting

### Issue: Upload Button Not Visible
**Diagnosis:**
- Check browser console for errors
- Verify CSS not hiding input
- Look for file upload input with id="signed-contract-upload"

**Solution:**
- Clear browser cache
- Check `AcceptOffer.tsx` for hidden input display logic
- Ensure `className="hidden"` is being used correctly

### Issue: Upload Succeeds but Button Still Disabled
**Diagnosis:**
- State not updating after upload
- Response not parsed correctly
- Error in upload handler

**Solution:**
- Check browser console logs
- Verify upload endpoint returns `{ success: true }`
- Check network tab for actual response
- Ensure FormData is being sent correctly

### Issue: Accept Button Shows "Awaiting Halaxy"
**Diagnosis:**
- `halaxy_practitioner_verified` flag not set to 1
- Verification didn't save to database

**Solution:**
- Re-run "Verify in Halaxy" from admin panel
- Check database for flag value
- Verify practitioner ID was entered correctly

### Issue: Email Not Received
**Diagnosis:**
1. Check email not marked as spam
2. Verify sender email in settings
3. Check ACS logs

**Solution:**
- Check Azure Communication Services resource configuration
- Verify sender domain is authenticated
- Check function app settings for COMMUNICATION_SERVICES_CONNECTION_STRING
- Review function logs for send errors

---

## Reset Process

To reset an application and test again:

```bash
cd api
node reset-application.js
```

This will:
- ✅ Reset status to "reviewing"
- ✅ Clear offer_token, offer_sent_at, offer_accepted_at
- ✅ Clear accepted_at, signed_contract_url, practitioner_id
- ✅ Clear halaxy_practitioner_verified, halaxy_verified_at, halaxy_account_id

---

## Safety Gates Summary

| Gate | Stage | Enforced By | Purpose |
|------|-------|-------------|---------|
| **Halaxy Verification** | Before email send | Backend + UI button disable | Ensures clinician exists in Halaxy before credentials sent |
| **Signed Contract** | Before acceptance | Backend validation + UI button disable | Ensures contract terms agreed to |
| **Offer Token** | All practitioner actions | Token validation in endpoint | Ensures valid practitioner link |
| **Status Validation** | Before acceptance | Endpoint checks status | Ensures application in correct state |

---

## Key Files

- **Frontend:** `src/pages/AcceptOffer.tsx` - Practitioner offer page
- **Frontend:** `src/pages/admin/ApplicationManagement.tsx` - Admin controls
- **Backend:** `api/src/functions/accept-offer.ts` - Offer GET/POST handling
- **Backend:** `api/src/functions/upload-signed-contract.ts` - Upload endpoint
- **Backend:** `api/src/functions/accept-application.ts` - Email send gate
- **Database:** Migrations in `api/migrations/` - Schema updates
- **Script:** `api/reset-application.js` - Testing utility

---

## Success Criteria

✅ **Workflow Complete When:**
1. Application accepted by admin
2. Practitioner verified in Halaxy
3. Signed contract uploaded
4. Offer accepted by practitioner
5. Onboarding email received
6. Practitioner can access onboarding page

All gates enforced at both frontend and backend levels.
