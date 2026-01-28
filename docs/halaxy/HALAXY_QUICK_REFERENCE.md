# ⚡ Halaxy Integration - Quick Reference

**For Admins:** How to enable the "Send Onboarding Tools" button  
**For Developers:** How to implement Halaxy gating

---

## 👨‍💼 Admin Quick Start

### The Issue
You approved an application, but the "Send Onboarding Tools" button is grayed out?

**Why:** The clinician hasn't been added to Halaxy yet.

### The Solution (3 Steps)

#### Step 1: Click "Manage in Halaxy Admin"
```
Go to Application Detail page
↓
Click button: "→ Manage in Halaxy Admin"
↓
New tab opens: Halaxy admin interface
```

#### Step 2: Add Clinician to Halaxy
```
In Halaxy Admin:
1. Click: "Add New Practitioner"
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Phone
   - AHPRA Number
   - Location
   - Qualifications (degree, institution, year)
3. Click: "Create Account"
```

#### Step 3: Wait for Validation
```
Halaxy will:
1. Validate AHPRA number (automatic)
2. Send validation confirmation
3. Mark as "Active"

Return to Bloom:
1. Refresh page (F5)
2. "Send Onboarding" button should now be GREEN ✓
3. Click it to send email
```

### Troubleshooting

**Q: Button still disabled after adding to Halaxy?**
- [ ] Wait 1-2 minutes (async processing)
- [ ] Refresh page (Ctrl+F5)
- [ ] Click "Check Halaxy Status" button
- [ ] Log out and back in

**Q: Halaxy validation keeps failing?**
- [ ] Verify AHPRA number is correct
- [ ] Check clinician's name matches AHPRA exactly
- [ ] Verify clinician's AHPRA status is "Active" (not expired)
- [ ] Try again with corrected details

**Q: Email still not sending after button is enabled?**
- [ ] Click "Send Onboarding Tools" again
- [ ] Check spam folder in clinician's email
- [ ] Contact technical support

---

## 👨‍💻 Developer Implementation

### Database Schema Update

```sql
-- Add Halaxy fields to Applications table
ALTER TABLE Applications ADD COLUMN 
  halaxy_account_id NVARCHAR(36) NULL;

ALTER TABLE Applications ADD COLUMN 
  halaxy_validated BIT DEFAULT 0;

ALTER TABLE Applications ADD COLUMN 
  halaxy_sync_date DATETIME NULL;

ALTER TABLE Applications ADD COLUMN 
  onboarding_email_sent DATETIME NULL;

CREATE INDEX idx_halaxy_validated ON Applications(halaxy_validated);
```

### API Endpoints Required

#### 1. Check Halaxy Status
```
GET /api/admin/applications/{applicationId}/halaxy-status

Response:
{
  "halaxyValidated": true,
  "halaxyAccountId": "hal-123456",
  "status": "active",
  "syncedAt": "2026-01-08T15:30:00Z"
}
```

#### 2. Sync to Halaxy
```
POST /api/admin/applications/{applicationId}/sync-halaxy

Response:
{
  "halaxyAccountId": "hal-123456",
  "status": "pending_validation",
  "message": "Account created in Halaxy. Waiting for validation..."
}
```

#### 3. Send Onboarding Email
```
POST /api/admin/applications/{applicationId}/send-onboarding

GUARDS:
- if (!application.halaxy_validated) return 403
- if (!application.halaxy_account_id) return 403

Response:
{
  "success": true,
  "emailSentAt": "2026-01-08T15:35:00Z",
  "clinicianEmail": "julian@example.com"
}
```

### Frontend Button Logic

```typescript
// Determine if "Send Onboarding" button should be enabled
const canSendOnboarding = () => {
  return (
    application.status === 'approved' &&
    application.halaxy_validated === true &&
    application.halaxy_account_id !== null &&
    !application.onboarding_email_sent
  );
};

// Button element
<button
  disabled={!canSendOnboarding()}
  onClick={handleSendOnboarding}
  className={`
    px-6 py-3 rounded-lg font-semibold
    ${canSendOnboarding()
      ? 'bg-sage-600 text-white hover:bg-sage-700'
      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
    }
  `}
  title={
    !canSendOnboarding()
      ? 'Clinician must be added to Halaxy first'
      : 'Ready to send onboarding email'
  }
>
  🎉 Send Onboarding Tools
</button>
```

### Webhook Handler (Halaxy → Bloom)

```typescript
// api/src/functions/webhookHalaxyValidation.ts

async function handleHalaxyValidationWebhook(
  req: HttpRequest
): Promise<HttpResponseInit> {
  const { halaxy_account_id, status, applicant_email } = await req.json();

  if (status === 'validated') {
    // Update Application in Bloom database
    await updateApplication({
      halaxy_account_id,
      halaxy_validated: true,
      halaxy_sync_date: new Date(),
    });

    // Optional: Send webhook to frontend to update UI
    // This triggers button enable without page refresh
    await notifyAdminUI({
      type: 'halaxy_validated',
      applicationId: halaxy_account_id,
    });

    return {
      status: 200,
      jsonBody: { success: true, message: 'Clinician validated' },
    };
  }

  if (status === 'failed') {
    // Log failure for admin review
    await logHalaxyError({
      halaxy_account_id,
      error: req.body.error,
      timestamp: new Date(),
    });

    return {
      status: 200,
      jsonBody: { success: false, message: 'Validation failed' },
    };
  }
}
```

### Component Logic

```typescript
// src/components/admin/ApplicationDetail.tsx

export const ApplicationDetail: React.FC<Props> = (props) => {
  const { application } = props;

  // Check Halaxy status on component load
  useEffect(() => {
    checkHalaxyStatus(application.id);
  }, [application.id]);

  // Button disabled state
  const isButtonDisabled = !(
    application.status === 'approved' &&
    application.halaxy_validated
  );

  // Button tooltip
  const buttonTooltip = isButtonDisabled
    ? application.status !== 'approved'
      ? 'Application must be approved first'
      : 'Clinician must be added to Halaxy first'
    : 'Ready to send onboarding email';

  // On click handler
  const handleSendOnboarding = async () => {
    try {
      const response = await fetch(
        `/api/admin/applications/${application.id}/send-onboarding`,
        { method: 'POST' }
      );

      if (response.ok) {
        // Show success message
        setSuccessMessage('Onboarding email sent!');
        // Refresh application data
        refetchApplication();
      } else if (response.status === 403) {
        // Show error: still waiting for Halaxy
        setError('Clinician not yet validated in Halaxy');
      }
    } catch (error) {
      setError('Failed to send onboarding email');
    }
  };

  return (
    <>
      {/* Halaxy Status Display */}
      <div className="p-4 bg-info-bg rounded-lg">
        <h3 className="font-semibold text-text-primary mb-2">
          Halaxy Status
        </h3>
        <p className="text-body-sm text-text-secondary">
          {application.halaxy_validated
            ? '✓ Validated & Active'
            : '⏳ Pending Validation'}
        </p>
        {!application.halaxy_validated && (
          <button className="mt-2 text-sage-600 font-semibold">
            → Manage in Halaxy Admin
          </button>
        )}
      </div>

      {/* Send Onboarding Button */}
      <button
        disabled={isButtonDisabled}
        onClick={handleSendOnboarding}
        title={buttonTooltip}
        className={`
          px-6 py-3 rounded-lg font-semibold
          ${isButtonDisabled
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-sage-600 text-white hover:bg-sage-700'
          }
        `}
      >
        🎉 Send Onboarding Tools
      </button>
    </>
  );
};
```

---

## 📊 State Diagram

```
Application Approved
        ↓
    ┌─────────────────────────────────┐
    │ Button DISABLED                 │
    │ "Add to Halaxy first"           │
    └─────────────────────────────────┘
        ↓
Admin clicks "Manage in Halaxy Admin"
        ↓
    ┌─────────────────────────────────┐
    │ Opens Halaxy admin interface    │
    │ Admin enters clinician details  │
    └─────────────────────────────────┘
        ↓
Halaxy validates credentials
        ↓
    ┌─────────────────────────────────┐
    │ Halaxy sends webhook to Bloom   │
    │ Updates: halaxy_validated=true  │
    └─────────────────────────────────┘
        ↓
    ┌─────────────────────────────────┐
    │ Button ENABLED                  │
    │ "Ready to send onboarding"      │
    └─────────────────────────────────┘
        ↓
Admin clicks "Send Onboarding Tools"
        ↓
    ┌─────────────────────────────────┐
    │ System sends onboarding email   │
    │ with Halaxy credentials         │
    └─────────────────────────────────┘
        ↓
    ┌─────────────────────────────────┐
    │ Button DISABLED (email sent)    │
    │ "Email sent on {date}"          │
    └─────────────────────────────────┘
```

---

## ✅ Checklist: Halaxy Integration Complete

### Database
- [ ] Added `halaxy_account_id` column
- [ ] Added `halaxy_validated` column
- [ ] Added `halaxy_sync_date` column
- [ ] Added `onboarding_email_sent` column
- [ ] Added indexes

### API
- [ ] GET `/api/admin/applications/{id}/halaxy-status` endpoint
- [ ] POST `/api/admin/applications/{id}/sync-halaxy` endpoint
- [ ] POST `/api/admin/applications/{id}/send-onboarding` endpoint
- [ ] POST `/api/webhooks/halaxy-validation` webhook handler
- [ ] All endpoints have proper validation

### Frontend
- [ ] Halaxy status display component
- [ ] "Manage in Halaxy Admin" button
- [ ] "Send Onboarding" button with disable logic
- [ ] Status badges (Not Registered, Pending, Validated)
- [ ] Confirmation dialog for sending email
- [ ] Error handling & retry

### Testing
- [ ] Manual: Add clinician to Halaxy, see button enable
- [ ] Manual: Try sending email without Halaxy validation (should fail)
- [ ] Manual: Check webhook updates Bloom database
- [ ] Integration: End-to-end flow with test Halaxy account
- [ ] Error: Test Halaxy validation failure scenarios

---

## 📞 Support

**Question:** Where's the button?
**Answer:** It's disabled until Halaxy validation. See above.

**Question:** Button still disabled after adding to Halaxy?
**Answer:** Wait 1-2 minutes, then refresh page. If still issues, contact support.

**Question:** Can I force-enable the button?
**Answer:** No. It's a safety feature. Go through the Halaxy process.

**Question:** What data goes to Halaxy?
**Answer:** Name, email, phone, AHPRA number, qualifications, practice details.

---

**See Also:**
- Full docs: `HALAXY_INTEGRATION_AND_CLINICIAN_VALIDATION.md`
- UI spec: `ADMIN_APPLICATION_MANAGEMENT_UI.md`
- Implementation: `IMPLEMENTATION_CHECKLIST.md`
