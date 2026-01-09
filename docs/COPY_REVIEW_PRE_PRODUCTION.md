# Copy Review - Pre-Production Release

**Date:** 2026-01-09  
**Release Target:** Production (main branch)  
**Reviewer:** _____________________

## 🎯 New Features in This Release

1. **Halaxy Integration Requirement** - Forces admin to add practitioner to Halaxy before onboarding
2. **Analytics Tracking Fixes** - Corrected GA4 and Google Ads IDs
3. **Database Migration Improvements** - Automatic migrations on deployment

---

## 📝 Copy to Review

### 1. Halaxy Setup Notice (Accepted Applications)

**Location:** Admin > Application Detail (when status = "Accepted")

#### Notice Box Text:
```
✅ Application Accepted - Next Step: Add to Halaxy

This practitioner has been accepted and is ready for onboarding. Before you can send the onboarding link, they must be added to Halaxy as a practitioner.

[📋 View Halaxy Setup Instructions]
```

**Review Checklist:**
- [ ] Clear and actionable
- [ ] Tone is professional but friendly
- [ ] No grammar/spelling errors
- [ ] Emoji usage appropriate

**Suggested Edits:**
_____________________________________________
_____________________________________________

---

### 2. Halaxy Setup Instructions Modal

**Location:** Admin > Application Detail > "View Halaxy Setup Instructions" button

#### Modal Title:
```
📋 Add Practitioner to Halaxy
```

#### Content:
```
Before sending the onboarding link, you must add this practitioner to Halaxy.

Step-by-Step Instructions:

1. Log into Halaxy Admin
   Go to halaxy.com and sign in with your admin account

2. Navigate to Practitioners
   Settings → Practice → Practitioners

3. Add New Practitioner
   Click "Add Practitioner" and fill in their details:
   • Name: {FirstName} {LastName}
   • Email: {Email}
   • AHPRA: {Registration}
   • Specializations: {List}

4. Copy the Practitioner ID
   After saving, Halaxy will assign a Practitioner ID (e.g., PR-1234567)
   ⚠️ You'll need this ID to send the onboarding link!

5. Send Onboarding
   Return here and click "Send Onboarding" (button will appear once they're in Halaxy)

Note: The Bloom system will verify the Practitioner ID exists in Halaxy before sending the onboarding email.
```

**Review Checklist:**
- [ ] Steps are clear and sequential
- [ ] Technical terms explained adequately
- [ ] Warning about Practitioner ID is prominent
- [ ] Tone matches Life Psychology brand
- [ ] No grammar/spelling errors

**Suggested Edits:**
_____________________________________________
_____________________________________________
_____________________________________________

---

### 3. Accept Application Modal

**Location:** Admin > Application Detail > "Accept" button

#### Content:
```
🎉 Accepting [Name] will:
• Send a welcome/onboarding email
• Mark the application as accepted
• Prepare them for practitioner onboarding

Acceptance Notes
[Textarea: e.g., Strong experience in CBT, excellent references...]

Internal Notes (optional)
[Textarea: Notes for internal reference only...]
```

**Review Checklist:**
- [ ] Clear expectations set
- [ ] Placeholder text helpful
- [ ] Emoji usage appropriate
- [ ] No grammar/spelling errors

**Suggested Edits:**
_____________________________________________
_____________________________________________

---

## 🔧 Technical Copy

### Migration Messages

#### V016 Migration (favorite_flower column):
```
✅ Added favorite_flower column to applications table
ℹ️  Column favorite_flower already exists in applications table
```

**Review Checklist:**
- [ ] Messages are informative for logs
- [ ] Emoji usage consistent
- [ ] No grammar/spelling errors

---

## 🎨 Accessibility Review

**Color Contrast:**
- [ ] Emerald notice box (text on emerald-50 background)
- [ ] Warning text (amber-600 on amber-50)
- [ ] Success messages (green-800 on green-50)

**Screen Reader:**
- [ ] Button labels are descriptive
- [ ] Icon-only buttons have aria-labels
- [ ] Modal has proper focus management

---

## ✅ Final Approval

**Grammar & Spelling:** [ ] PASS [ ] NEEDS REVISION  
**Tone & Voice:** [ ] PASS [ ] NEEDS REVISION  
**Clarity:** [ ] PASS [ ] NEEDS REVISION  
**Accessibility:** [ ] PASS [ ] NEEDS REVISION  

**Overall Status:** [ ] APPROVED FOR PRODUCTION [ ] NEEDS CHANGES

**Reviewer Signature:** _____________________  
**Date:** _____________________

---

## 📊 Next Steps

After copy approval:
1. [ ] Run Lighthouse audit
2. [ ] Test critical user flows
3. [ ] Merge develop → staging
4. [ ] Validate on staging
5. [ ] Merge staging → main
6. [ ] Monitor production deployment
