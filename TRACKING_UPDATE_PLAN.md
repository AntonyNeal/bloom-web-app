# Tracking System Update Plan

**Target Date:** Friday, December 20, 2025  
**Prepared:** December 16, 2025  
**Status:** DRAFT - Review before implementation  
**Last Audit:** December 16, 2025

---

## Executive Summary

This plan addresses the dual tracking system (GTM + direct gtag.js) and ensures all conversions are properly configured for Google Ads optimization.

---

## Code Audit Results ✅

### Audit Summary: SUITABLE FOR GOALS ✓

The codebase is **well-structured and consistent** with the tracking goals. Key findings:

| Area | Status | Notes |
|------|--------|-------|
| Conversion Labels | ✅ Consistent | All files use same labels |
| Google Ads ID | ✅ Consistent | AW-11563740075 everywhere |
| GA4 Setup | ✅ Correct | Environment-based ID detection working |
| Booking Flow | ✅ Complete | Full funnel tracking implemented |
| Micro-conversions | ⚠️ Duplicate | Same values in 2 files (safe but inefficient) |
| GTM vs Code | ⚠️ Overlap | Both GTM triggers AND code fire events |

### Files Audited

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | GA4/Ads initialization | ✅ Correct setup |
| `utils/trackingEvents.ts` | Primary tracking API | ✅ Main source of truth |
| `utils/UnifiedTracker.ts` | Orchestration layer | ✅ Delegates correctly |
| `utils/trackingCore.ts` | Low-level gtag wrapper | ✅ Clean implementation |
| `utils/conversionTracking.ts` | Booking conversion | ✅ Correct label |
| `utils/microConversions.ts` | **DUPLICATE** micro-conv | ⚠️ Same as trackingEvents.ts |
| `tracking/ConversionManager.ts` | New unified system | ✅ Correct setup |
| `tracking/events/booking.ts` | Booking funnel | ✅ Correct label |
| `pages/BookingSuccess.tsx` | Conversion firing | ✅ Fires both systems |

### Conversion Label Verification ✓

All conversion labels are **consistent across all files**:

| Conversion | Label | Found In |
|------------|-------|----------|
| Booking Complete | `FqhOCKymqUbEKvXgoor` | conversionTracking.ts, booking.ts |
| Service Page | `HzXKCMGAw6UbEKvXgoor` | trackingEvents.ts, microConversions.ts |
| About Page | `IvW6CPqnw6UbEKvXgoor` | trackingEvents.ts, microConversions.ts |
| Pricing Page | `ECh0CIzJv6UbEKvXgoor` | trackingEvents.ts, microConversions.ts |
| High Intent | `ppNdCIyCwKUbEKvXgoor` | trackingEvents.ts, microConversions.ts |

### GA4 Environment Detection ✓

The `index.html` correctly handles environment detection:
- **Production** (`life-psychology.com.au`): G-XGGBRLPBKK
- **Staging** (`azurestaticapps.net`): G-MVE59VPCQH  
- **Local** (`localhost`): G-MVE59VPCQH

### Page Tracking Implementation ✓

All key pages correctly import and use tracking:
- About, Services, Pricing → `UnifiedTracker.tracker`
- Individual service pages → `UnifiedTracker.tracker`
- Booking flow → `tracking/` module

### Tracking Flow Diagram

```
User visits page
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  index.html                                                  │
│  ├─ Loads gtag.js (GA4 Measurement ID based on environment) │
│  ├─ Configures GA4 (G-XGGBRLPBKK or G-MVE59VPCQH)           │
│  └─ Configures Google Ads (AW-11563740075)                   │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Page Component (e.g., About.tsx)                            │
│  └─ useEffect(() => tracker.trackAboutPage())                │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  UnifiedTracker.ts (Singleton)                               │
│  └─ trackAboutPage() → fireAboutPageConversion()             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  trackingEvents.ts                                           │
│  └─ fireMicroConversion('about_page', {...})                 │
│     └─ Checks hasConverted() (session-based dedup)           │
│     └─ fireGtagEvent('conversion', {send_to, value, ...})    │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  trackingCore.ts                                             │
│  └─ callGtag('event', 'conversion', {...})                   │
│     └─ window.gtag('event', 'conversion', {...})             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
   Google Ads receives conversion
```

---

## Current Architecture

### Google Tag Manager (GTM)
- **Container ID:** GTM-THWLBTNX
- **Triggers configured:**
  | Trigger Name | Event Type | Filter |
  |--------------|------------|--------|
  | About Zoe View | Page View | URL contains `/about` |
  | Halaxy Booking Event | Custom Event | - |
  | High Intent Visitor | Timer | - |
  | Page View | Page View | All pages |
  | Pricing View | Page View | URL contains `/pricing` |
  | Service Page View | Page View | URL contains `/services` |

### Direct gtag.js Implementation (in code)
- **Google Ads ID:** AW-11563740075
- **GA4 Production:** G-XGGBRLPBKK
- **GA4 Staging:** G-MVE59VPCQH

### Conversion Labels (in code)
| Conversion | Label | Value |
|------------|-------|-------|
| Booking Complete | FqhOCKymqUbEKvXgoor | $250-300 |
| Service Page | HzXKCMGAw6UbEKvXgoor | $2 |
| About Page | IvW6CPqnw6UbEKvXgoor | $3 |
| Pricing Page | ECh0CIzJv6UbEKvXgoor | $5 |
| High Intent | ppNdCIyCwKUbEKvXgoor | $10 |

---

## Identified Issues

### 1. ~~Potential Duplicate Tracking~~ → DECISION: Use Code Only
- GTM triggers AND code both fire for the same page views
- **Resolution:** Remove redundant GTM triggers, keep code-based tracking
- Code has session-based deduplication that GTM lacks

### 2. ~~Duplicate MICRO_CONVERSIONS Definition~~ → PARTIALLY RESOLVED
- Defined in both `trackingEvents.ts` and `microConversions.ts`
- **Status:** `microConversions.ts` is still used for `initHighIntentTimer` export
- **Safe cleanup done:** Removed duplicate `initHighIntentTimer()` call from App.tsx
- **Future:** Can delete `microConversions.ts` once UnifiedTracker fully replaces it

### 3. Inactive Conversions in Google Ads
- "Booking Completed - Halaxy" = INACTIVE (0 conversions)
- "About Zoe View" = INACTIVE (0 conversions)
- May need verification/reactivation in Google Ads

---

## Consolidation Decision: CODE-BASED TRACKING

### Why Code Over GTM for This SPA:
| Factor | GTM | Code | Winner |
|--------|-----|------|--------|
| SPA route changes | ❌ Misses them | ✅ React useEffect | **Code** |
| Deduplication | ❌ None | ✅ hasConverted() | **Code** |
| Version control | ❌ Separate | ✅ In Git | **Code** |
| Debug ease | ⚠️ Preview mode | ✅ Console | **Code** |

### GTM Cleanup (Friday - 5 minutes):
Remove these redundant triggers/tags from GTM:
- [ ] "About Zoe View" (code handles via `fireAboutPageConversion`)
- [ ] "Pricing View" (code handles via `firePricingPageConversion`)
- [ ] "Service Page View" (code handles via `fireServicePageConversion`)
- [ ] "High Intent Visitor" (code handles via `fireHighIntentConversion`)
- [ ] "Page View" generic (code handles via `trackPageView`)

### Keep in GTM:
- ✅ "Halaxy Booking Event" - external webhook integration
- ✅ GTM container loading (for future flexibility)

---

## Implementation Plan

### Phase 1: Pre-Flight Checks (Thursday PM or Friday AM)
**Duration:** 30 minutes  
**Risk:** None

- [ ] **1.1** Open GTM Preview mode on staging.lifepsychology.com.au
- [ ] **1.2** Navigate through all key pages and document what fires:
  - Home page
  - /about
  - /services
  - /pricing
  - Booking modal open
- [ ] **1.3** Check GA4 DebugView (Admin → DebugView) for events
- [ ] **1.4** Document findings - are we seeing duplicates?

### Phase 2: Google Ads Verification (Friday)
**Duration:** 15 minutes  
**Risk:** None

- [ ] **2.1** Log into Google Ads → Goals → Conversions
- [ ] **2.2** Check status of each conversion action:
  - [ ] Booking Completed - Halaxy (currently INACTIVE)
  - [ ] About Zoe View (currently INACTIVE)
  - [ ] Pricing View
  - [ ] Service Page
  - [ ] High Intent
  - [ ] book_now_click
- [ ] **2.3** For inactive conversions, check:
  - Is the conversion label correct?
  - When was the last conversion recorded?
  - Is the tag installed correctly? (use Tag Assistant)

### Phase 3: Decide on Single Source of Truth (Friday)
**Duration:** 15 minutes  
**Risk:** None (decision only)

Choose ONE approach for micro-conversions:

#### Option A: GTM-Managed (Recommended)
**Pros:**
- No code deployments needed for tracking changes
- Visual interface for non-developers
- Built-in preview/debug mode
- Version control with rollback

**Cons:**
- Requires GTM access
- Slightly more latency

**Action Required:**
- Remove micro-conversion firing from code
- Ensure GTM tags have correct conversion labels
- Keep only booking completion in code (for reliability)

#### Option B: Code-Managed
**Pros:**
- Full control in codebase
- No external dependencies
- Faster execution

**Cons:**
- Requires code deployment for any changes
- No visual debugging

**Action Required:**
- Remove GTM triggers for micro-conversions
- Keep GTM only for container/config loading
- All conversion firing stays in code

### Phase 4: Code Consolidation (Friday - if needed)
**Duration:** 30 minutes  
**Risk:** Low (staging only first)

- [ ] **4.1** Consolidate MICRO_CONVERSIONS to single definition
  - Keep in `trackingEvents.ts` (primary location)
  - Import in `conversionTracking.ts` if needed there
  
- [ ] **4.2** Test on staging:
  ```
  1. Clear browser cache + service worker
  2. Navigate to /about, /pricing, /services
  3. Check Network tab for googleadservices.com requests
  4. Verify correct conversion labels in requests
  ```

- [ ] **4.3** Deploy to staging and verify

### Phase 5: GTM Configuration Updates (Friday - if Option A chosen)
**Duration:** 30 minutes  
**Risk:** Medium (affects tracking)

- [ ] **5.1** In GTM, verify each tag has correct settings:

  | Tag Name | Conversion ID | Conversion Label | Value |
  |----------|---------------|------------------|-------|
  | About Page Conversion | AW-11563740075 | IvW6CPqnw6UbEKvXgoor | 3 |
  | Pricing Page Conversion | AW-11563740075 | ECh0CIzJv6UbEKvXgoor | 5 |
  | Service Page Conversion | AW-11563740075 | HzXKCMGAw6UbEKvXgoor | 2 |
  | High Intent Conversion | AW-11563740075 | ppNdCIyCwKUbEKvXgoor | 10 |

- [ ] **5.2** Check trigger assignments are correct
- [ ] **5.3** Use GTM Preview to test each conversion fires once (not twice)
- [ ] **5.4** Submit GTM changes (creates new version)

### Phase 6: Production Deployment (Friday PM)
**Duration:** 30 minutes  
**Risk:** Medium

- [ ] **6.1** Final staging verification
- [ ] **6.2** Merge staging → main
- [ ] **6.3** Monitor Azure Static Web App deployment
- [ ] **6.4** Clear CDN cache if needed
- [ ] **6.5** Test production with GTM Preview mode
- [ ] **6.6** Verify conversions in Google Ads real-time report

---

## Rollback Plan

If tracking breaks after deployment:

### Immediate (< 5 minutes)
1. GTM: Revert to previous container version
2. Code: `git revert HEAD` and push

### If unclear what broke
1. Enable GTM Preview on production
2. Check browser Network tab for failed requests
3. Review Google Ads conversion status

---

## Verification Checklist (Post-Deployment)

### Same Day
- [ ] GTM Preview shows correct tags firing
- [ ] No duplicate events visible
- [ ] Network requests show correct conversion labels
- [ ] GA4 Realtime shows events

### Next 24-48 Hours
- [ ] Google Ads shows conversions recording
- [ ] No "inactive" status on conversion actions
- [ ] Conversion values appearing correctly

### Next Week
- [ ] Compare conversion volume to previous week
- [ ] Check for any anomalies in reporting
- [ ] Verify ROAS calculations still accurate

---

## Files to Modify

| File | Change | Risk |
|------|--------|------|
| `apps/website/src/utils/trackingEvents.ts` | Keep as primary MICRO_CONVERSIONS source | Low |
| `apps/website/src/utils/conversionTracking.ts` | Import from trackingEvents.ts or remove duplicate | Low |
| GTM Container GTM-THWLBTNX | Verify/update tag configurations | Medium |
| Google Ads AW-11563740075 | Verify conversion action status | Low |

---

## Contacts & Access Required

- [ ] Google Tag Manager access (GTM-THWLBTNX)
- [ ] Google Ads access (AW-11563740075)
- [ ] GA4 access (G-XGGBRLPBKK)
- [ ] GitHub repo access (staging → main merge)
- [ ] Azure portal access (if cache clear needed)

---

## Notes

- GA4 staging property (G-MVE59VPCQH) is isolated - safe for testing
- Google Ads conversions point to same account - test carefully
- Service worker may cache old JS - hard refresh required after deploy
- GTM Preview mode works without publishing changes

---

## Appendix: Quick Commands

### Clear Service Worker (Browser Console)
```javascript
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

### Check gtag Available
```javascript
typeof gtag !== 'undefined' && console.log('gtag ready');
```

### Manual Conversion Test (Browser Console)
```javascript
gtag('event', 'conversion', {
  send_to: 'AW-11563740075/IvW6CPqnw6UbEKvXgoor',
  value: 3,
  currency: 'AUD'
});
```
