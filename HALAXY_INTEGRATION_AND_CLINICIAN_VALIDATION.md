# 🏥 Halaxy Integration & Clinician Onboarding Workflow

**Version:** 1.0  
**Date:** January 11, 2026  
**Purpose:** Document the Halaxy clinician registration requirement and how it gates the onboarding email

---

## 📋 Overview

The complete practitioner onboarding workflow has **two phases:**

1. **Application Phase** (Bloom Portal)
   - Practitioner submits application with qualifications
   - Admin reviews and approves/rejects

2. **Halaxy Activation Phase** (Required for Onboarding)
   - Admin adds approved clinician to Halaxy system
   - Clinician is validated in Halaxy
   - **Only then** can onboarding email be sent
   - Clinician gains access to full practitioner dashboard

---

## 🔐 Why Halaxy Registration is Required

**Halaxy** is the clinical practice management system that approved practitioners need to:
- Access their practitioner dashboard
- Manage client bookings and schedules
- Access clinical resources and tools
- Process payments and invoicing
- Submit session notes

**Onboarding cannot complete until Halaxy registration is done** because:
1. The onboarding email contains Halaxy login credentials
2. Practitioners need working Halaxy access from day one
3. Client scheduling depends on Halaxy availability
4. Clinical data flow requires Halaxy integration

---

## 📊 Application Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│          BLOOM APPLICATION MANAGEMENT WORKFLOW               │
└─────────────────────────────────────────────────────────────┘

APPLICATION RECEIVED
    ↓
UNDER REVIEW (Admin reviews qualifications)
    ↓
APPROVED ✓ (Decision made in Bloom)
    ├─ Status: "approved" in Bloom database
    ├─ Practitioner sees "We'll send onboarding soon"
    └─ Admin sees "Send Onboarding Tools" button
         ↓ (BUTTON DISABLED - WAITING FOR HALAXY)
         
HALAXY REGISTRATION REQUIRED
    ├─ Admin adds clinician to Halaxy system
    ├─ Halaxy validates clinician credentials
    ├─ Halaxy creates practitioner account
    └─ Halaxy returns "validated" status
         ↓
ONBOARDING EMAIL READY
    ├─ "Send Onboarding Tools" button ENABLES
    ├─ Admin clicks button
    ├─ System sends onboarding email with:
    │  ├─ Halaxy credentials
    │  ├─ Dashboard access info
    │  ├─ Getting started guide
    │  └─ Support contact
    └─ Practitioner receives email
         ↓
PRACTITIONER ACTIVATED
    ├─ Practitioner logs into Halaxy dashboard
    ├─ Completes profile setup
    ├─ Sets availability
    └─ Ready to accept clients
```

---

## 🛠️ Admin Workflow: Adding Clinician to Halaxy

### Step 1: Locate Halaxy Admin Interface

**URL:** `https://halaxy-admin.bloom.life-psychology.com.au` (or similar)

**Authentication:**
- Use Azure AD credentials (same as Bloom admin)
- You need "Clinician Manager" role in Halaxy

### Step 2: Find the Clinician in Halaxy

**Option A: Manual Search**
```
1. Navigate to: Practitioners → Add New
2. Search for clinician by:
   - Full name
   - AHPRA number
   - Email address
```

**Option B: Bulk Import from Bloom**
```
1. Navigate to: Integrations → Sync Approved Practitioners
2. Click "Sync from Bloom"
3. System pulls recently approved practitioners
4. Confirm details and create accounts in batch
```

### Step 3: Enter Clinician Details in Halaxy

**Required Information (from Bloom Application):**

```
Personal Details:
  ✓ First Name
  ✓ Last Name
  ✓ Email Address
  ✓ Phone Number
  ✓ Location/State

Professional Details:
  ✓ AHPRA Registration Number
  ✓ Primary Qualification (Degree)
  ✓ Qualifications (all)
  ✓ Specializations
  ✓ Modalities/Approaches
  
Practice Details:
  ✓ Services Offered
  ✓ Populations Served
  ✓ Availability (hours/week)
  ✓ Consultation Types (phone/video/in-person)
  ✓ Timezone
```

**Data Mapping from Bloom to Halaxy:**

| Bloom Field | Halaxy Field | Required? |
|-------------|--------------|-----------|
| firstName | First Name | ✓ |
| lastName | Last Name | ✓ |
| email | Email Address | ✓ |
| phone | Contact Phone | ✓ |
| location | Location/State | ✓ |
| qualifications[].licenseNumber | AHPRA/RANZCP Number | ✓ |
| practiceDetails.modalities | Clinical Modalities | ✓ |
| practiceDetails.services | Services Offered | ✓ |
| availability.hoursPerWeek | Hours Available/Week | ✓ |
| availability.daysAvailable | Available Days | ✓ |

### Step 4: Verify Credentials

**Halaxy automatically validates:**
- [ ] AHPRA number is valid and current
- [ ] Email is active and receivable
- [ ] Name matches registration records
- [ ] No duplicate accounts exist

**If validation fails:**
- [ ] Verify AHPRA number is correct
- [ ] Correct any spelling in name/email
- [ ] Contact clinician to update email if bouncing
- [ ] Mark as "Needs Review" in Bloom admin panel

### Step 5: Mark as "Validated" in Halaxy

Once all details verified:
```
Click: "Validate & Activate" button
Status changes to: "Active - Pending Onboarding"
```

### Step 6: Sync Status Back to Bloom

**Automatic (Recommended):**
```
Halaxy sends webhook to Bloom
Bloom database updates: halaxy_validated = true
Admin panel button automatically enables
```

**Manual (Fallback):**
```
1. In Bloom Admin, go to Application Detail
2. Click: "Check Halaxy Status"
3. If validated, button enables automatically
```

---

## 🎛️ Bloom Admin Interface Updates

### Application Detail View - Status Indicators

**Current Interface Should Show:**

```
┌─────────────────────────────────────────────────┐
│  APPLICATION STATUS                             │
├─────────────────────────────────────────────────┤
│  Bloom Status: ✓ APPROVED                       │
│  Submitted: 01/07/2026                          │
│  Reviewed: 01/08/2026                           │
├─────────────────────────────────────────────────┤
│  HALAXY STATUS (REQUIRED)                       │
│  ○ Not yet registered                           │
│  └─ Click "Add to Halaxy" below                 │
└─────────────────────────────────────────────────┘
```

**After Adding to Halaxy:**

```
┌─────────────────────────────────────────────────┐
│  APPLICATION STATUS                             │
├─────────────────────────────────────────────────┤
│  Bloom Status: ✓ APPROVED                       │
│  Submitted: 01/07/2026                          │
│  Reviewed: 01/08/2026                           │
├─────────────────────────────────────────────────┤
│  HALAXY STATUS (REQUIRED)                       │
│  ⏳ Pending Validation                          │
│  └─ In Halaxy admin, verifying credentials...   │
└─────────────────────────────────────────────────┘
```

**After Halaxy Validates:**

```
┌─────────────────────────────────────────────────┐
│  APPLICATION STATUS                             │
├─────────────────────────────────────────────────┤
│  Bloom Status: ✓ APPROVED                       │
│  Submitted: 01/07/2026                          │
│  Reviewed: 01/08/2026                           │
├─────────────────────────────────────────────────┤
│  HALAXY STATUS (REQUIRED)                       │
│  ✓ VALIDATED & ACTIVE                           │
│  └─ Ready to send onboarding email              │
├─────────────────────────────────────────────────┤
│  ACTIONS                                        │
│  [🎉 Send Onboarding Tools] ← ENABLED           │
└─────────────────────────────────────────────────┘
```

### Action Buttons - Conditional Visibility

```
Approved Button ("🎉 Send Onboarding Tools")
├─ DISABLED STATE (default)
│  └─ Reason: "Add clinician to Halaxy first"
│  └─ Show tooltip with instructions
│  └─ Button grayed out, not clickable
│
├─ ENABLED STATE (after Halaxy validation)
│  └─ Reason: "Ready to send onboarding email"
│  └─ Button bright green, clickable
│  └─ Show confirmation: "Send onboarding email to {email}?"
│
└─ SENT STATE (after email sent)
   └─ Show: "✓ Onboarding email sent {timestamp}"
   └─ Show: "Waiting for practitioner to activate..."
```

### Quick Link to Halaxy

```
┌─────────────────────────────────────────────────┐
│  HALAXY STATUS (REQUIRED)                       │
│  ⏳ Pending Validation                          │
│                                                 │
│  [→ Manage in Halaxy Admin] ← New button        │
│  Opens Halaxy admin in new tab, pre-filtered    │
│  to this clinician                              │
└─────────────────────────────────────────────────┘
```

---

## 📧 Onboarding Email - Only Sent After Halaxy Validation

### Email Trigger

```typescript
// api/src/functions/sendOnboardingEmail.ts

async function sendOnboardingEmail(
  req: HttpRequest
): Promise<HttpResponseInit> {
  const { applicationId } = await req.json();

  // 1. Get application from Bloom database
  const application = await getApplication(applicationId);
  
  if (application.status !== 'approved') {
    return { status: 400, body: "Application not approved" };
  }

  // 2. CHECK: Halaxy validation required
  if (!application.halaxy_validated) {
    return {
      status: 403,
      body: "Clinician must be validated in Halaxy first"
    };
  }

  // 3. CHECK: Halaxy account created
  if (!application.halaxy_account_id) {
    return {
      status: 403,
      body: "Halaxy account not created yet"
    };
  }

  // 4. GET: Halaxy credentials (if needed for email)
  const halaxyAccount = await getHalaxyAccount(
    application.halaxy_account_id
  );

  // 5. SEND: Onboarding email with Halaxy credentials
  const emailContent = buildOnboardingEmail({
    practitioner: application,
    halaxyAccount: halaxyAccount,
  });

  await sendEmail({
    to: application.email,
    subject: "Welcome to Bloom! 🌸 Your Dashboard Access",
    html: emailContent,
  });

  // 6. UPDATE: Mark email as sent
  await updateApplication(applicationId, {
    onboarding_email_sent: new Date(),
    status: 'onboarding_sent',
  });

  return { status: 200, body: "Onboarding email sent" };
}
```

---

## 🔄 Data Flow: Bloom ↔ Halaxy

### Option 1: Manual Process (Current)

```
1. Admin approves in Bloom
2. Admin goes to Halaxy admin separately
3. Admin manually enters clinician details
4. Halaxy validates
5. Admin returns to Bloom
6. Admin clicks "Send Onboarding"
7. Email is sent
```

**Pros:** Simple, no new integrations needed
**Cons:** Manual steps, error-prone

### Option 2: Semi-Automated (Recommended)

```
1. Admin approves in Bloom
2. Admin clicks "Add to Halaxy" button
3. Bloom creates account in Halaxy via API
4. Halaxy validates automatically
5. Halaxy sends webhook confirmation to Bloom
6. Bloom enables "Send Onboarding" button
7. Admin clicks button
8. Email is sent
```

**Pros:** Fewer manual steps, less error-prone
**Cons:** Requires Halaxy API integration

### Option 3: Fully Automated

```
1. Admin approves in Bloom
2. Background job automatically:
   - Creates account in Halaxy
   - Waits for Halaxy validation
   - Sends onboarding email
3. Practitioner receives email
```

**Pros:** Most efficient, zero manual work
**Cons:** Requires complex background jobs, webhook handling

---

## 📝 Admin Instructions (For UI Tooltip)

### "Send Onboarding Tools" Button - Disabled State

**Tooltip Text:**

```
🔒 Before sending onboarding email:

1. Clinician must be added to Halaxy
2. Halaxy must validate their credentials
3. Halaxy account must be active

How to add to Halaxy:

1. Click: "Manage in Halaxy Admin" ↓
2. Enter clinician details from application
3. Halaxy will validate AHPRA number
4. Once validated, return here and refresh
5. This button will enable automatically

Need help?
→ See Halaxy Integration Guide
→ Email: admin-support@bloom.life-psychology.com.au
```

### "Manage in Halaxy Admin" Button

**Action:**
```
Opens: https://halaxy-admin.bloom.life-psychology.com.au
Pre-filters: Shows this clinician's record (if exists)
Target: New tab (target="_blank")
```

### "Check Halaxy Status" Button

**Action:**
```
1. Query Bloom database for halaxy_validated flag
2. If false, query Halaxy API for account status
3. If Halaxy says "validated", update Bloom
4. Refresh page
5. "Send Onboarding" button should now enable
```

---

## 🚨 Error States & Troubleshooting

### Problem: "Halaxy validation failed"

**Causes:**
- [ ] AHPRA number is invalid or inactive
- [ ] Name doesn't match AHPRA records
- [ ] Email is bouncing
- [ ] Duplicate account already exists in Halaxy

**Solutions:**
```
1. Verify AHPRA number in Bloom application
2. Ask clinician to confirm:
   - Full legal name (exact match to AHPRA)
   - Current email address
   - Current AHPRA status (must be active)
3. Update application details if needed
4. In Halaxy, manually correct information
5. Retry validation
```

### Problem: "Account created but not validating"

**Causes:**
- [ ] Webhook didn't fire from Halaxy to Bloom
- [ ] Network connectivity issue
- [ ] Halaxy processing delay

**Solutions:**
```
1. Wait 5 minutes for async processing
2. Click "Check Halaxy Status" button
3. If still not working:
   - Go to Halaxy admin directly
   - Check account status there
   - If "Active", click "Sync to Bloom"
4. Return to Bloom and refresh
```

### Problem: "Button still disabled after Halaxy validation"

**Causes:**
- [ ] Bloom database not updated
- [ ] Cache not cleared
- [ ] Webhook not received

**Solutions:**
```
1. Click "Check Halaxy Status" button (forces refresh)
2. Refresh page (Ctrl+F5 to clear cache)
3. Log out and log back in
4. If still issues:
   - Contact technical support
   - Provide application ID and clinician name
```

---

## 📋 Implementation Checklist

### Backend API Updates

- [ ] Create endpoint: `GET /api/admin/applications/{id}/halaxy-status`
  - Checks if clinician is validated in Halaxy
  - Returns status for button enabling

- [ ] Create endpoint: `POST /api/admin/applications/{id}/add-to-halaxy`
  - Calls Halaxy API to create account
  - Waits for validation webhook

- [ ] Add field to Application table: `halaxy_validated` (boolean)
- [ ] Add field to Application table: `halaxy_account_id` (string)
- [ ] Add field to Application table: `halaxy_sync_date` (timestamp)

- [ ] Create webhook receiver: `POST /api/webhooks/halaxy-validation`
  - Receives "clinician validated" event from Halaxy
  - Updates Bloom database
  - Triggers button enable UI update

- [ ] Update `sendOnboardingEmail` function:
  - Add check: `if (!halaxy_validated) return 403`
  - Add check: `if (!halaxy_account_id) return 403`

### Frontend Admin UI Updates

- [ ] Add Halaxy Status section to Application Detail page
  - Shows: Not Registered / Pending / Validated / Error

- [ ] Add "Manage in Halaxy Admin" button
  - Opens Halaxy admin in new tab
  - Pre-filters to this clinician

- [ ] Add "Check Halaxy Status" button
  - Calls status endpoint
  - Shows loading spinner
  - Refreshes page on success

- [ ] Update "Send Onboarding Tools" button
  - DISABLED by default
  - Show tooltip explaining why when disabled
  - ENABLED only if `halaxy_validated === true`
  - Show confirmation dialog before sending

- [ ] Add status badges
  - ○ Not Registered (gray)
  - ⏳ Pending (yellow)
  - ✓ Validated (green)
  - ✗ Error (red)

### Documentation & Training

- [ ] Document Halaxy admin process (see above)
- [ ] Create video tutorial for admins
- [ ] Add FAQ about Halaxy delays
- [ ] Create troubleshooting guide
- [ ] Train admin team on new workflow

---

## 📧 Email Content: Onboarding

**Subject:** Welcome to Bloom! 🌸 Your Dashboard Access

**Body:**

```
Hello [Clinician Name],

Welcome to the Bloom network! We're delighted to have you on our team 
of compassionate practitioners.

Your practitioner dashboard is now ready. Here's how to get started:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 YOUR LOGIN DETAILS

Dashboard URL: https://bloom-practitioner.life-psychology.com.au
Email: [clinician email]
Temporary Password: [generated password]

→ Click here to log in and set your permanent password
https://bloom-practitioner.life-psychology.com.au/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 NEXT STEPS

1. Log in and set your permanent password
2. Complete your profile (photo, bio, qualifications)
3. Set your availability calendar
4. Review and accept the practitioner agreement
5. Start accepting client bookings!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎓 RESOURCES

• Getting Started Guide: [link]
• Dashboard Tutorial: [link]
• Clinical Resources: [link]
• Billing & Payments: [link]
• Support Documentation: [link]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ QUESTIONS?

We're here to help! Reply to this email or contact:

Email: support@bloom.life-psychology.com.au
Phone: [support number]
Help Portal: https://support.bloom.life-psychology.com.au

Welcome to Bloom! 🌸

The Bloom Team
Life Psychology Australia
```

---

## 🔗 Related Documentation

- **Admin Application Workflow:** See APPLICATION_WORKFLOW_IMPLEMENTATION_GUIDE.md
- **Halaxy API Documentation:** [Link to internal wiki]
- **Practitioner Dashboard Setup:** See PRACTITIONER_DASHBOARD_SETUP.md
- **Troubleshooting Guide:** See ADMIN_TROUBLESHOOTING.md

---

## 📞 Support & Questions

**Q: What if Halaxy validation takes a long time?**
A: Halaxy typically validates within minutes. If > 5 minutes, check AHPRA number accuracy. Contact support if > 30 minutes.

**Q: Can I send onboarding email before Halaxy validation?**
A: No. The button will be disabled. Halaxy account must exist and be validated first.

**Q: What if clinician doesn't have active AHPRA?**
A: Halaxy validation will fail. Clinician must update their registration status first.

**Q: Can I manually enable the button?**
A: Not recommended. The button disabling is a safety feature. Follow the process above.

**Q: What data goes to Halaxy?**
A: Only what's necessary for account setup: name, email, phone, AHPRA number, qualifications, practice details.

---

**Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Ready for Implementation
