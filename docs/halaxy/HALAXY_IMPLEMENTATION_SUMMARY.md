# 🔐 Halaxy Requirement - Complete Implementation Summary

**Date:** January 11, 2026  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Blocks Onboarding

---

## 📌 The Core Requirement

**CRITICAL BLOCKER:**
> The "🎉 Send Onboarding Tools" button must be DISABLED until the clinician is added to Halaxy and validated.

**Why:**
- Onboarding email includes Halaxy credentials
- Halaxy account must exist before email is sent
- Halaxy must validate the clinician's professional credentials
- This is the gate that ensures only qualified practitioners are activated

---

## 🔄 The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLETE APPLICATION FLOW                 │
└─────────────────────────────────────────────────────────────┘

1. PRACTITIONER APPLIES
   └─ Submits via Bloom portal
      └─ Name, email, phone, qualifications, practice details

2. ADMIN REVIEWS IN BLOOM
   └─ Checks qualifications
   └─ Approves or rejects

3. IF APPROVED → APPLICATION GOES TO HALAXY PHASE
   
   ❌ OLD WAY (WRONG):
   └─ Admin clicks "Send Onboarding"
   └─ Email sent immediately
   └─ Practitioner has no Halaxy account!
   
   ✅ NEW WAY (CORRECT):
   └─ Admin sees: "Send Onboarding" button is DISABLED
   └─ Tooltip says: "Add to Halaxy first"
   └─ Admin clicks: "Manage in Halaxy Admin"
   └─ Admin enters clinician details in Halaxy
   └─ Halaxy validates AHPRA number & credentials
   └─ Halaxy sends validation webhook to Bloom
   └─ Bloom updates: halaxy_validated = true
   └─ Button AUTO-ENABLES in Bloom UI
   └─ Admin clicks "Send Onboarding"
   └─ Email sent with Halaxy credentials
   └─ Practitioner receives email with dashboard access

4. PRACTITIONER ACTIVATES
   └─ Receives onboarding email
   └─ Has valid Halaxy credentials
   └─ Logs into dashboard
   └─ Sets up profile and availability
   └─ Ready to accept clients
```

---

## 📋 What Was Just Documented

### 1. **HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md** (40KB)
**For:** Complete implementation understanding

**Covers:**
- Why Halaxy is required
- Admin step-by-step workflow
- Data mapping (Bloom ↔ Halaxy)
- Backend API specifications
- Frontend UI updates
- Error handling
- Email template with credentials
- Troubleshooting guide

**Use this to:**
- Understand the requirement deeply
- Train team members
- Implement the feature
- Troubleshoot issues

---

### 2. **ADMIN_APPLICATION_MANAGEMENT_UI.md** (20KB)
**For:** Admin interface UI/UX

**Covers:**
- Admin application list view
- Application detail view
- Status badges and indicators
- Component code examples (React)
- Halaxy status display
- Button enable/disable logic
- Confirmation dialogs
- Implementation checklist

**Use this to:**
- Build admin dashboard components
- Implement button logic
- Design status indicators
- Test user interactions

---

### 3. **HALAXY_QUICK_REFERENCE.md** (15KB)
**For:** Quick implementation reference

**Covers:**
- Admin quick start (3 steps)
- Troubleshooting (common issues)
- Developer implementation (code snippets)
- Database schema changes
- API endpoints
- Frontend button logic
- Webhook handler
- State diagram

**Use this to:**
- Quick answers during development
- Copy/paste code snippets
- Check database schema
- Reference state transitions

---

## 🎯 Implementation Checklist

### Database Changes
```sql
ALTER TABLE Applications ADD COLUMN 
  halaxy_account_id NVARCHAR(36) NULL;
  
ALTER TABLE Applications ADD COLUMN 
  halaxy_validated BIT DEFAULT 0;
  
ALTER TABLE Applications ADD COLUMN 
  halaxy_sync_date DATETIME NULL;
  
ALTER TABLE Applications ADD COLUMN 
  onboarding_email_sent DATETIME NULL;
```

- [ ] Run migration in dev
- [ ] Run migration in staging
- [ ] Run migration in production

### Backend API

Required Endpoints:
- [ ] `GET /api/admin/applications/{id}/halaxy-status`
  - Check if validated
  
- [ ] `POST /api/admin/applications/{id}/sync-halaxy`
  - Add clinician to Halaxy
  
- [ ] `POST /api/admin/applications/{id}/send-onboarding`
  - Send onboarding email (WITH guards!)
  
- [ ] `POST /api/webhooks/halaxy-validation`
  - Receive validation from Halaxy
  - Update database
  - Notify frontend

Update Existing:
- [ ] `sendOnboardingEmail()` function
  - Add: `if (!halaxy_validated) return 403;`
  - Add: `if (!halaxy_account_id) return 403;`

### Frontend Admin UI

Components:
- [ ] ApplicationsList (list view)
- [ ] ApplicationDetail (detail view)
- [ ] HalaxyStatus badge
- [ ] StatusIndicator component
- [ ] OnboardingConfirmation dialog

Logic:
- [ ] Button disable when: `!halaxy_validated || status !== 'approved'`
- [ ] Show tooltip explaining why disabled
- [ ] Real-time status updates (polling or websocket)
- [ ] Loading states during sync
- [ ] Error messages with solutions

### Testing

Manual Tests:
- [ ] [ ] Add clinician to Halaxy, see button enable
- [ ] [ ] Try sending without Halaxy (should fail)
- [ ] [ ] Webhook updates database correctly
- [ ] [ ] Button enables automatically after webhook
- [ ] [ ] Page refresh maintains state
- [ ] [ ] Error cases handled gracefully

---

## 🚨 Critical Implementation Details

### Button Disable Guard (Most Important)

```typescript
// This logic MUST be in the button component
const isDisabled = !(
  application.status === 'approved' &&
  application.halaxy_validated === true
);

// OR more explicitly:
const isDisabled = 
  application.status !== 'approved' ||
  !application.halaxy_validated;

// Tooltip should explain why:
const tooltipText = !application.halaxy_validated
  ? '🔒 Clinician must be added to Halaxy first'
  : '✓ Ready to send onboarding email';
```

### Email Send Guard (Critical)

```typescript
// In sendOnboardingEmail endpoint
async function sendOnboardingEmail(applicationId) {
  const app = await getApplication(applicationId);
  
  // CRITICAL: These checks must pass
  if (app.status !== 'approved') {
    return { status: 403, error: 'Not approved' };
  }
  
  if (!app.halaxy_validated) {
    return { status: 403, error: 'Not validated in Halaxy' };
  }
  
  if (!app.halaxy_account_id) {
    return { status: 403, error: 'No Halaxy account' };
  }
  
  // If all checks pass, send email
  // ...
}
```

### Webhook Handler (Updates Database)

```typescript
// Halaxy sends webhook when clinician validated
async function handleHalaxyWebhook(payload) {
  const { halaxy_account_id, status } = payload;
  
  if (status === 'validated') {
    // Update Bloom database
    await db.Applications.update(
      { halaxy_account_id },
      { 
        halaxy_validated: true,
        halaxy_sync_date: new Date()
      }
    );
    
    // This triggers UI update
    // Button should enable automatically
  }
}
```

---

## 📊 Timeline

### Week 1
- [ ] Database migration
- [ ] Backend API endpoints
- [ ] Webhook handler
- [ ] Email function guards

### Week 2
- [ ] Admin UI components
- [ ] Button disable logic
- [ ] Status indicators
- [ ] Integration testing

### Week 3
- [ ] End-to-end testing
- [ ] Error handling
- [ ] Admin training
- [ ] Documentation

### Week 4
- [ ] User acceptance testing
- [ ] Launch preparation
- [ ] Monitoring setup
- [ ] Go-live

---

## 🎓 Key Learning Points

### For Admins:
1. Approved application ≠ Ready for onboarding
2. Clinician must go through Halaxy validation first
3. "Send Onboarding" button disabling is a safety feature
4. Wait for Halaxy status check if button doesn't enable
5. Contact support if validation fails

### For Developers:
1. **Never** bypass the button disable logic
2. **Always** check `halaxy_validated` before sending email
3. **Always** handle webhook from Halaxy
4. **Always** provide clear error messages
5. **Test** all error scenarios

### For Product:
1. Halaxy integration is critical for compliance
2. This prevents sending credentials to non-activated accounts
3. Creates a compliance record (audit trail)
4. Ensures only validated practitioners are activated
5. Improves data quality and security

---

## 🔗 Related Documentation

**Read in this order:**

1. Start: `HALAXY_QUICK_REFERENCE.md` (quick overview)
2. Main: `HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md` (deep dive)
3. UI: `ADMIN_APPLICATION_MANAGEMENT_UI.md` (interface design)
4. Tasks: `IMPLEMENTATION_CHECKLIST.md` (detailed tasks)
5. Design: `APPLICATION_WORKFLOW_IMPLEMENTATION_GUIDE.md` (overall workflow)

---

## ✅ Success Criteria

### The button works correctly when:
- [ ] Disabled by default (no Halaxy account)
- [ ] Disabled when status ≠ "approved"
- [ ] Disabled when `halaxy_validated` = false
- [ ] Enabled only when approved AND halaxy_validated
- [ ] Shows clear tooltip explaining why
- [ ] Confirmation dialog before sending
- [ ] Email includes Halaxy credentials
- [ ] Database is updated after send
- [ ] Admins understand the process

### The workflow is complete when:
- [ ] Practitioners can submit applications ✓ (already done)
- [ ] Admins can review applications ✓ (already done)
- [ ] Admins can add to Halaxy 🔲 (NEW)
- [ ] Halaxy validates 🔲 (NEW)
- [ ] Button enables 🔲 (NEW)
- [ ] Email is sent 🔲 (NEW)
- [ ] Practitioners receive credentials 🔲 (NEW)
- [ ] Practitioners can activate dashboard 🔲 (future)

---

## 🚀 Next Steps

1. **Review** the three new Halaxy documents
2. **Understand** the button disable logic
3. **Create** Jira tickets from IMPLEMENTATION_CHECKLIST.md
4. **Implement** in order: Database → Backend → Frontend
5. **Test** all scenarios (happy path + errors)
6. **Train** admins on the workflow
7. **Launch** with confidence

---

**Status:** Ready for Implementation  
**Blocking:** Onboarding Workflow Completion  
**Priority:** CRITICAL

🎉 **You now have everything you need to implement the Halaxy requirement!**
