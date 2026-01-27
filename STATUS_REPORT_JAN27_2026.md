# 🌸 Bloom Development Status Report
**Date:** January 27, 2026  
**Branch:** `develop`  
**Environment:** Local Development (Azure subscription disabled)

---

## 🚨 CRITICAL: Azure Subscription Disabled

**Issue:** Auto-pay failed on invoice G134107019 (A$1,591.14)
- Subscription `47b5552f-0eb8-4462-97e7-cd67e8e660b8` is read-only
- All Azure resources returning "Site Disabled" / 403 Forbidden
- **Resolution:** Pay invoice via Azure Portal → re-enables tomorrow

**Impact:**
- ❌ Cannot deploy to Azure
- ❌ All production/staging/dev environments down
- ✅ Local development working (func host running on localhost:7071)

---

## 💰 Azure Cost Audit Completed

### Bill Increase Analysis: A$879 → A$1,591 (+A$712)

**Primary Culprit:** Premium Azure Front Door (~A$500-600/month)
- Resource: `fdt42kldozqahcu` (Premium_AzureFrontDoor)
- Likely created in Nov/Dec 2025

### Resources Audit Summary

| Resource Group | Resources | Decision |
|----------------|-----------|----------|
| rg-lpa-unified | 39 | ✅ Keep (Bloom core) |
| lpa-rg | 17 | ✅ Keep (legacy, migrate) |
| osullivanfarms-rg | 8 | ✅ Keep (priority project) |
| buildhub-rg | 1 | 🗑️ DELETE |
| rg-phase-guide | 1 | 🗑️ DELETE |
| NetworkWatcherRG | 2 | ⚠️ Review |
| DefaultResourceGroup-* | 2 | ⚠️ Review |

### Justified Premium Resources (KEEP)

| Resource | Monthly Cost | Justification |
|----------|--------------|---------------|
| Premium Front Door | ~A$500-600 | Client performance for life-psychology.com.au |
| EP1 Function Plan | ~A$200 | No cold starts for booking availability |
| 6 Standard SWAs | ~A$270 | 2 apps × 3 envs (frontend + bloom) |

### Resources to Delete

| Resource | Est. Savings |
|----------|--------------|
| buildhub-rg | A$0 |
| rg-phase-guide | A$0 |
| lpa-cae-staging + container app | ~A$75/month |
| lpa-appconfig (downgrade to Free) | ~A$35/month |

**Total Potential Savings:** ~A$110/month

---

## ✅ Completed Since Last Report (Jan 26 → Jan 27)

### 1. Twilio SMS Integration ✅
**Commit:** `feat: integrate Twilio for SMS notifications`
- Replaced Infobip with Twilio SDK
- Added phone number formatting (+61 normalization)
- Deployed to Azure (before subscription disabled)
- **Working:** SMS delivery confirmed

### 2. Session URL Fix ✅
**Commit:** `fix: use BLOOM_APP_URL for session links`
- Fixed SMS links pointing to wrong domain
- Now correctly uses `dev.bloom.life-psychology.com.au`

### 3. Patient Name Lookup ✅
**Commit:** `fix: fetch patient name from Halaxy when not included in appointment`
- Dashboard was showing "Unknown" for client names
- Added fallback lookup to Halaxy contacts API
- Deployed (needs Azure to verify)

### 4. Weather API with Reverse Geocoding ✅
**Commit:** `fix: add reverse geocoding for weather location`
- Weather now shows actual suburb name (e.g., "Newcastle")
- Previously hardcoded "Sydney"
- Uses OpenStreetMap Nominatim API
- **Tested locally:** Working ✅

### 5. UI Simplifications ✅
- Removed "Regenerate" and "AI Enhance" buttons from PrepNotesModal
- Renamed "Generate Notes" to "Ask Bloom"
- Notes button now opens prep modal (doesn't navigate away)

---

## 🧪 Local Development Status

**Functions Host:** ✅ Running on localhost:7071

| Endpoint | Status |
|----------|--------|
| `/api/health` | ✅ Working |
| `/api/weather?lat=-32.92&lon=151.78` | ✅ Working (returns "Newcastle") |
| `/api/clinician-dashboard` | ⚠️ Needs DB (Azure SQL down) |

---

## 📋 MVP Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Clinician Dashboard | ✅ Done | Real Halaxy data + day nav |
| Session Page (Clinician) | ✅ Done | Video + notes + AI |
| Patient Join Page | ✅ Done | Token-based entry |
| AI Pre-Session Brief | ✅ Done | GPT-4 preparation |
| Video Recording | ✅ Done | Consent + blob storage |
| Clinical Notes AI | ✅ Done | Real-time generation |
| SMS Notifications | ✅ Done | Twilio integrated |
| Email Notifications | ✅ Done | Via ACS Email |
| Weather Widget | ✅ Done | With reverse geocoding |
| Patient Name Display | ✅ Done | Halaxy lookup fallback |

---

## 🎯 Next Steps (When Azure Re-enabled)

### Immediate (Tomorrow)
1. ☐ Pay Azure invoice to re-enable subscription
2. ☐ Verify weather API works in production
3. ☐ Verify patient name lookup works
4. ☐ Test full end-to-end booking → SMS → session flow

### Cleanup (Cost Savings)
5. ☐ Delete `buildhub-rg` resource group
6. ☐ Delete `rg-phase-guide` resource group
7. ☐ Delete `lpa-cae-staging` container app environment
8. ☐ Downgrade `lpa-appconfig` to Free tier
9. ☐ Verify Front Door is actually routing traffic

### Development
10. ☐ Continue with any blocked features
11. ☐ Real-world testing with Zoe's appointment

---

## 📂 Recent Commits

```
3030cbc fix: add reverse geocoding for weather location
5e39657 fix: fetch patient name from Halaxy when not included in appointment
cb8bf7f fix: Notes button opens prep modal instead of navigating away
75fdcf3 refactor: simplify PrepNotesModal - remove Regenerate/AI Enhance
76fc1c6 fix: use BLOOM_APP_URL for session links
```

---

## 🏗️ Architecture Notes

### Two Production Apps
| Domain | SWA | Purpose |
|--------|-----|---------|
| life-psychology.com.au | lpa-frontend-* | Public booking site |
| bloom.life-psychology.com.au | lpa-bloom-* | Clinician dashboard |

### Environments
- **dev:** Local + bloom-functions-dev
- **staging:** bloom-functions-staging-new
- **prod:** bloom-functions-prod (EP1 plan for performance)

---

*Report updated January 27, 2026 - Local development session*
