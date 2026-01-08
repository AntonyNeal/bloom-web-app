# Fresh Onboarding Test - Complete Cleanup Checklist

## Current Status
✅ Database is clean (no applications visible)
✅ Code is updated with Halaxy setup workflow

## Manual Steps for Complete Fresh Test:

### 1. Clean Azure AD Test User (if exists)
```powershell
# List test users
az ad user list --query "[].{Name:displayName, Email:mail, Id:id}" -o table

# Delete test user if needed
az ad user delete --id <USER_OBJECT_ID>
```

### 2. Test the Complete Workflow

#### Step 1: Submit Application
1. Go to: https://your-website.azurestaticapps.net/join-us
2. Fill out the application form with test data
3. Upload required documents
4. Submit

#### Step 2: Review Application (Admin)
1. Login to admin portal: /admin/applications
2. You should see the new application
3. Click on it to view details

#### Step 3: Accept Application
1. Click the "Accept" button
2. Fill in acceptance notes
3. Submit
4. **You'll now see the green "Add to Halaxy" notice box**

#### Step 4: Add to Halaxy
1. Click "📋 View Halaxy Setup Instructions"
2. Follow the 5-step process:
   - Log into Halaxy admin
   - Navigate to Practitioners
   - Add new practitioner (details shown in modal)
   - Copy the Practitioner ID (e.g., PR-1234567)
   - Return to Bloom admin

#### Step 5: Send Onboarding (Coming Soon)
- Once you have the Halaxy Practitioner ID
- You'll be able to send the onboarding link
- The system will verify the ID exists in Halaxy first

## What's New:
- ✅ Halaxy setup is now required before onboarding
- ✅ Clear visual instructions in admin UI
- ✅ Step-by-step modal with practitioner details
- ✅ System prevents skipping Halaxy setup

## Next Development Steps:
- [ ] Add "Send Onboarding" button/modal
- [ ] Validate Halaxy Practitioner ID exists
- [ ] Send onboarding email with token
- [ ] Create onboarding page for practitioners
