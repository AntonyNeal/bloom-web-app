# 🌸 Bloom Onboarding - Quick Reference

## 🚀 Start Testing

```bash
# 1. Reset application for fresh test
cd api
node reset-application.js

# 2. Check current state
node check-application-detailed-state.js

# 3. View detailed workflow guide
# Open: TESTING_WORKFLOW.md
```

## 📊 Current Application State

```bash
node api/check-application-detailed-state.js
```

Shows:
- ✅ Workflow progress (1-8 stages)
- ✅ All 4 safety gates status
- ✅ Next recommended actions
- ✅ Database values at a glance

## 🔐 The 4 Safety Gates

| Gate | Blocks | Enforced |
|------|--------|----------|
| **Offer Token** | Access to offer link | Backend validates token |
| **Halaxy Verification** | Email send | Backend checks flag; UI disables button |
| **Signed Contract** | Offer acceptance | Backend validation + UI button disable |
| **Status Validation** | State transitions | Backend ensures correct status |

## 👨‍💼 Admin Workflow

1. **Accept Application**
   - Click "Accept Application" button
   - Creates offer_token
   - Status → "accepted"

2. **Verify in Halaxy** ⭐ REQUIRED
   - Add practitioner to Halaxy
   - Note practitioner ID
   - Click "Verify in Halaxy" button
   - Button becomes **ENABLED**

3. **Send Onboarding Invite** ⭐ AFTER CONTRACT UPLOAD
   - Only enabled when:
     - Halaxy verified ✅
     - Contract uploaded ✅
   - Click "🚀 Send Onboarding Invite"
   - Email sent to practitioner

## 👨‍⚕️ Practitioner Workflow

1. **Open Offer Link**
   - Receive link (or access in development)
   - Page loads with offer details

2. **Download Contract**
   - Click "📄 Download Contract (PDF)"
   - Review terms
   - Print and sign

3. **Upload Signed Contract** ⭐ REQUIRED
   - Click "📄 Upload Signed Contract (PDF)"
   - Select signed PDF
   - Wait for success message
   - Accept button becomes **ENABLED**

4. **Accept Offer**
   - Click "✅ Accept Offer & Join Bloom"
   - See success page
   - Await onboarding email

5. **Complete Onboarding**
   - Click link in email
   - Complete profile setup
   - Ready to practice

## 🐛 Debugging

### Upload Not Working?
```bash
# 1. Check browser console (F12)
#    Look for: "📤 Upload response status: 200"

# 2. Verify database
SELECT signed_contract_url FROM applications WHERE id = 1;
#    Should show: URL starting with "https://..."

# 3. If NULL, upload failed
#    - Check Azure Storage connection
#    - Verify "applications" container exists
```

### Accept Button Disabled?
```bash
# 1. Check console for upload success message
# 2. Verify signed_contract_url in database (see above)
# 3. Page may need refresh to update button state
```

### Email Not Received?
```bash
# 1. Check spam/junk folder
# 2. Verify halaxy_practitioner_verified = 1
SELECT halaxy_practitioner_verified FROM applications WHERE id = 1;

# 3. Verify signed_contract_url is NOT NULL
SELECT signed_contract_url FROM applications WHERE id = 1;

# 4. Check Azure Communication Services logs
```

## 📈 Database Quick Checks

```sql
-- Full application state
SELECT * FROM applications WHERE id = 1;

-- Just the gates
SELECT 
  CASE WHEN halaxy_practitioner_verified=1 THEN '✅' ELSE '❌' END 'Halaxy',
  CASE WHEN signed_contract_url IS NOT NULL THEN '✅' ELSE '❌' END 'Contract',
  CASE WHEN offer_accepted_at IS NOT NULL THEN '✅' ELSE '❌' END 'Accepted',
  status
FROM applications WHERE id = 1;

-- Practitioner created?
SELECT * FROM practitioners WHERE email = 'julian.dellabosca@gmail.com';
```

## 🎯 Testing Checklist

- [ ] Application created (status = "reviewing")
- [ ] Admin approved (offer_token generated)
- [ ] Halaxy verified (halaxy_practitioner_verified = 1)
- [ ] Contract uploaded (signed_contract_url populated)
- [ ] Offer accepted (offer_accepted_at set)
- [ ] Practitioner created (row in practitioners table)
- [ ] Email received (check inbox + spam)
- [ ] Onboarding link works (can access)
- [ ] Profile fields appear (name, email, etc.)
- [ ] Can complete onboarding

## 📝 Key Files

| File | Purpose |
|------|---------|
| `TESTING_WORKFLOW.md` | Detailed step-by-step guide |
| `IMPLEMENTATION_SUMMARY.md` | Technical architecture |
| `src/pages/AcceptOffer.tsx` | Practitioner offer page |
| `api/src/functions/accept-offer.ts` | Offer GET/POST endpoints |
| `api/src/functions/upload-signed-contract.ts` | Upload handler |
| `api/check-application-detailed-state.js` | State checker script |
| `api/reset-application.js` | Reset for re-testing |

## ⚡ One-Command Testing

```bash
# See everything at once
node api/check-application-detailed-state.js
```

Tells you:
- Current stage (1 of 8 completed)
- Which gates are blocked/passed
- Exact next action to take

## 🎓 Understanding the Gates

### Gate 1: Offer Token
- **What:** Valid link to view offer
- **Why:** Prevent unauthorized access
- **How:** Token in URL, validated on every request

### Gate 2: Halaxy Verification 🔒
- **What:** Practitioner exists in clinical system
- **Why:** Prevent sending credentials to non-existent account
- **How:** Admin verifies in Halaxy; flag set in database
- **Impact:** Email blocked until flag = 1

### Gate 3: Signed Contract 🔒
- **What:** Practitioner agreed to terms
- **Why:** Ensure legal compliance
- **How:** Must upload PDF before accepting
- **Impact:** Accept button disabled until uploaded

### Gate 4: Status Validation
- **What:** Application in correct workflow state
- **Why:** Prevent jumping steps or race conditions
- **How:** Backend validates status before actions
- **Impact:** Endpoints reject invalid state transitions

---

**All gates enforced at both frontend AND backend.**

No client-side bypasses possible.

---

## Quick Stats

- **Gates:** 4 (all enforced at frontend + backend)
- **Stages:** 7 major workflow stages
- **Tables:** applications, practitioners (practitioners table created from application)
- **Safety Checks:** 10+ validation points
- **Console Logs:** 8 debug points for troubleshooting
- **Documentation:** 2 guides (TESTING_WORKFLOW.md + IMPLEMENTATION_SUMMARY.md)
- **Scripts:** 4 utilities (reset, state checker, verify columns, migrations)

---

**Status: ✅ READY FOR TESTING**

See `TESTING_WORKFLOW.md` for detailed step-by-step guide.

Use `node api/check-application-detailed-state.js` to see progress.

Questions? Check `IMPLEMENTATION_SUMMARY.md` troubleshooting section.
