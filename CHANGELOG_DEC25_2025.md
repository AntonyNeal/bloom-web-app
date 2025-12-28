# Bloom Production Release - December 25, 2025 🎄

**Production:** https://www.lpapsychology.com.au  
**Staging:** https://staging.lpapsychology.com.au  
**Branch:** `main` (commit `25d16e5`)

---

## 🎯 Release Summary

**Critical booking system hotfix** - Fixed multiple issues preventing successful Halaxy bookings, plus enabled real payment amounts for production.

---

## Changes in This Release

### 1. 🔧 Halaxy Booking Fixes (Critical)
- **Phone format fix**: Convert to international +61 format for Halaxy API
- **Date format fix**: Convert DD/MM/YYYY to YYYY-MM-DD for FHIR compliance
- **Timezone fix**: Use AEDT (+11:00) offset during daylight saving
- **Patient telecom fix**: Add missing 'use' field for phone numbers
- **Phone system type**: Use 'sms' for mobile numbers per Halaxy API docs
- **Patient ID validation**: Prevent 'warning' string from FHIR responses
- **PractitionerRole resolution**: Fetch and debug Zoe's specific role ID

### 2. 💳 Payment System Updates
- **Authorize → Book → Capture flow**: Payment only captured after successful booking
- **Real payment amounts enabled**:
  - Standard session: $250
  - Couples session: $300
  - NDIS sessions: Skip payment entirely (book directly)
- **Payment cancellation retry**: Added retry logic on booking failure
- **Manual capture support**: Handle `requires_capture` status correctly

### 3. 📧 Clinician Notifications
- New email notifications for clinicians when bookings are made

### 4. 🛠️ Infrastructure
- **Hotfix branch**: New `hotfix` branch deploys to staging for urgent fixes
- **Azure remote build**: Enabled to avoid ZIP deploy timeout
- **Cascade workflow removed**: Simplified post-deployment process
- **API consolidation**: Remove duplicate Website API, single function app

### 5. 🐛 Bug Fixes
- Fixed TypeScript errors in ApplicationDetail
- Fixed duplicate keys in ApplicationsList statusBadgeClasses
- Fixed hero photo aspect ratio
- Register capture-payment and cancel-payment functions in API entry point
- Remove duplicate `/api` prefix from payment API URLs

---

## Branch Status

| Branch | Status | Notes |
|--------|--------|-------|
| `main` | ✅ Production | Real payments enabled |
| `staging` | ✅ Synced | Merged from main |
| `develop` | ✅ Synced | Merged from main |
| `hotfix` | 🔄 Active | For urgent fixes |

---

## UAT Test Checklist

### 1. Complete Booking Flow (Standard Session)
- [ ] Go to homepage → Click "Book Now"
- [ ] Select "Individual Psychology Session"
- [ ] Choose a date and time slot
- [ ] Fill in client details (name, email, phone, DOB)
- [ ] Proceed to payment → Should show $250.00
- [ ] Complete payment with test card
- [ ] Verify booking confirmation email received
- [ ] Verify booking appears in Halaxy

### 2. NDIS Booking Flow (No Payment)
- [ ] Click "Book Now" → Select "NDIS Psychology Session"
- [ ] Choose date/time and fill in details
- [ ] Should skip payment step entirely
- [ ] Booking created directly in Halaxy
- [ ] Confirmation shows NDIS-specific message

### 3. Couples Session Booking
- [ ] Book a couples session
- [ ] Payment should show $300.00

### 4. Clinician Email Notification
- [ ] After successful booking, clinician receives email notification

---

## Known Issues

None currently.

---

## Rollback Plan

If issues arise:
```bash
git revert 25d16e5  # Revert real payment amounts
git push origin main
```

To revert to $1 test amount, change line in `BookingForm.tsx`:
```tsx
amount={1}  // Test amount
```

---

**Previous release:** Dec 21-22, 2025 | **This release:** Dec 25, 2025
