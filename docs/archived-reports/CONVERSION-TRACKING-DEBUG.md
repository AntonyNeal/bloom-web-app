# Conversion Tracking Debug Guide

## Micro - About Zoe View Conversion

**Issue:** Google Ads conversion "Micro - About Zoe View" shows 0 conversions  
**Date:** November 4, 2025  
**Status:** 🔍 Investigating

---

## Configuration Summary

### Google Ads Setup

- **Conversion Name:** Micro - About Zoe View
- **Conversion ID:** AW-11563740075
- **Conversion Label:** IvW6CPqnw6UbEKvXgoor
- **Value:** $3 AUD
- **Action Optimization:** Page views, Secondary action
- **Count:** One conversion
- **Click-through window:** 30 days
- **Engaged-view window:** 3 days
- **View-through window:** 1 day
- **Attribution:** Data-driven (Recommended)
- **Enhanced Conversions:** Managed through Google Tag

### Google Tag Manager Trigger

- **Trigger Type:** Page View
- **Condition:** Page URL contains `/about`
- **Tag Type:** Google Ads Conversion Tracking
- **Google tag found:** ✓ This tag will use the configuration of Google tag Untitled tag

---

## Code Implementation

### ✅ FIXED: About page now uses UnifiedTracker (matches Pricing page)

**File: `src/pages/About.tsx`**

```typescript
import { tracker } from '../utils/UnifiedTracker';

useEffect(() => {
  // Initialize about page tracking with unified tracker (matches Pricing.tsx pattern)
  tracker.trackAboutPage();

  // All tracking now handled by UnifiedTracker
}, []);
```

This ensures:

1. ✅ `trackPageView('about_page')` fires → sends `page_view` event for GTM trigger
2. ✅ `fireMicroConversion('about_page', {...})` fires → sends Google Ads conversion
3. ✅ Consistent with Pricing page implementation
4. ✅ Includes all debug logging from UnifiedTracker

---

### File: `src/utils/UnifiedTracker.ts`

```typescript
trackAboutPage(): void {
  this.trackPageView('about_page');
  this.fireMicroConversion('about_page', {
    page_path: window.location.pathname,
    page_title: document.title,
  });
}
```

Micro-conversion config:

```typescript
about_page: {
  label: 'IvW6CPqnw6UbEKvXgoor',  // ✓ Matches Google Ads
  value: 3,                         // ✓ Matches Google Ads ($3)
  name: 'About Zoe View',
}
```

---## Potential Issues

### ✅ FIXED: Inconsistent tracking implementation

**Problem:** About page was using the old `fireAboutPageConversion()` from `microConversions.ts`, while Pricing page uses `tracker.trackPricingPage()` from `UnifiedTracker`.

**Impact:**

- About page wasn't firing the necessary `page_view` event for GTM Page View trigger
- Different code paths for same functionality = harder to debug
- Missing scroll depth, time on page, and engagement tracking

**Solution Applied:**

- ✅ Switched About.tsx to use `tracker.trackAboutPage()` (matches Pricing.tsx)
- ✅ UnifiedTracker handles both page_view AND micro-conversion
- ✅ Consistent implementation across all pages
- ✅ Enhanced debug logging included

---

### 1. **gtag Loading Delay**

**Problem:** `index.html` loads gtag.js with a 100ms delay:

```javascript
setTimeout(function () {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
}, 100);
```

**Impact:** If `About.tsx` mounts before gtag is ready, the conversion won't fire.

**Solution Applied:**

- Added enhanced debug logging to microConversions.ts
- Added explicit page_view event to About.tsx
- Logs will show if gtag is unavailable

---

### 2. **Session-Based Firing (Once Per Session)**

**Problem:** Conversion only fires once per session due to sessionStorage check:

```typescript
const hasConverted = (conversionType) => {
  return sessionStorage.getItem(`lpa_micro_${conversionType}`) === 'true';
};
```

**Impact:**

- First visit to `/about` = Conversion fires ✓
- Subsequent visits to `/about` in same session = Conversion skipped ✗
- Testing requires clearing sessionStorage or opening new session

**Solution:** This is intentional (prevents duplicate conversions), but makes testing harder.

---

### 3. **Google Ads Data Delay**

**Problem:** Google Ads can take 24-48 hours to process conversions

**Impact:** Even if conversions are firing correctly, they may not appear in reports immediately.

---

### 4. **GTM Page View Trigger vs React SPA**

**Problem:** React is a Single Page Application (SPA). When navigating from Home → About:

- No full page reload occurs
- GTM "Page View" trigger might not fire automatically
- React Router changes URL without triggering traditional page view

**Impact:** GTM trigger configured for "Page URL contains /about" might not fire on SPA navigation.

**Solution Applied:**

- Added explicit `gtag('event', 'page_view')` call in About.tsx
- This ensures both GTM trigger AND direct conversion fire

---

## Testing Procedure

### Step 1: Open Browser DevTools

1. Open Chrome/Edge
2. Press F12 for DevTools
3. Go to Console tab
4. Keep DevTools open

### Step 2: Clear Session Data

```javascript
// Run in browser console
sessionStorage.clear();
console.log('Session storage cleared');
```

### Step 3: Navigate to About Page

Visit: `https://life-psychology.com.au/about`

### Step 4: Check Console Logs

You should see these logs:

```
[GA4] Environment detected: production - Hostname: life-psychology.com.au
[GA4] Initialized with ID: G-XGGBRLPBKK
[About Page] Component mounted - firing tracking events
[MicroConversion] 🎯 Firing About Zoe View ($3 AUD)
[MicroConversion] Send to: AW-11563740075/IvW6CPqnw6UbEKvXgoor
[MicroConversion] Additional params: { page_path: "/about", page_title: "..." }
[MicroConversion] ✅ About Zoe View fired successfully at 2025-11-04T...
[About Page] Sending page_view event to gtag
```

### Step 5: Verify gtag Call

```javascript
// Run in browser console to check if gtag exists
typeof window.gtag;
// Should return: "function"

typeof window.dataLayer;
// Should return: "object"

// Check dataLayer contents
window.dataLayer;
// Should show array with conversion events
```

### Step 6: Check Network Tab

1. Go to Network tab in DevTools
2. Filter by "google"
3. Look for requests to:
   - `google-analytics.com/g/collect`
   - `googleadservices.com/pagead/conversion`

Expected network call:

```
https://googleadservices.com/pagead/conversion/11563740075/?
  label=IvW6CPqnw6UbEKvXgoor
  &value=3
  &currency=AUD
```

---

## Debug Commands

### Check Micro-Conversion Stats

```javascript
// Run in browser console
window.getMicroConversionStats = function () {
  const stats = {};
  ['service_page', 'about_page', 'pricing_page', 'high_intent'].forEach(
    (key) => {
      const fired = sessionStorage.getItem(`lpa_micro_${key}`) === 'true';
      const timestamp = sessionStorage.getItem(`lpa_micro_${key}_timestamp`);
      stats[key] = {
        fired,
        timestamp: timestamp
          ? new Date(parseInt(timestamp)).toISOString()
          : null,
      };
    }
  );
  return stats;
};

getMicroConversionStats();
```

### Manually Fire Conversion

```javascript
// Run in browser console (for testing only)
if (typeof window.gtag === 'function') {
  window.gtag('event', 'conversion', {
    send_to: 'AW-11563740075/IvW6CPqnw6UbEKvXgoor',
    value: 3,
    currency: 'AUD',
    transaction_id: `test_${Date.now()}`,
  });
  console.log('✅ Test conversion fired');
} else {
  console.error('❌ gtag not available');
}
```

### Clear Micro-Conversion Data

```javascript
// Run in browser console (allows re-testing)
['service_page', 'about_page', 'pricing_page', 'high_intent'].forEach((key) => {
  sessionStorage.removeItem(`lpa_micro_${key}`);
  sessionStorage.removeItem(`lpa_micro_${key}_timestamp`);
});
sessionStorage.removeItem('lpa_intent_timer_started');
sessionStorage.removeItem('lpa_intent_timer_start_time');
console.log('🧹 All micro-conversion data cleared');
```

---

## Google Ads Verification

### Check Conversion Status in Google Ads

1. Go to Google Ads dashboard
2. Navigate to: **Tools & Settings** → **Measurement** → **Conversions**
3. Find: "Micro - About Zoe View"
4. Check **Status** column:
   - ✅ Recording conversions
   - ⚠️ No recent conversions
   - ❌ Not recording

### View Recent Conversions

1. Click on conversion name
2. Go to **"Conversion actions"** tab
3. Check **"Last received"** timestamp
4. If conversions are firing, this should update within 2-24 hours

### Enable Test Mode (Optional)

Google Ads has a conversion test mode:

1. Edit conversion action
2. Toggle **"Test mode"** ON
3. Conversions will be marked as "TEST" in reports
4. Useful for verifying tracking without polluting real data

---

## Common Issues & Solutions

### Issue: gtag is undefined

**Symptoms:**

```
[MicroConversion] ❌ gtag not available, cannot fire about_page
[About Page] gtag not available yet
```

**Causes:**

1. Ad blocker enabled (uBlock Origin, Privacy Badger)
2. Script loading delay (100ms in index.html)
3. Network blocking googletagmanager.com

**Solutions:**

1. Disable ad blockers
2. Wait 200ms after page load
3. Check Network tab for blocked requests

---

### Issue: Conversion fires but not in Google Ads

**Symptoms:**

- Console shows: `✅ About Zoe View fired successfully`
- Network shows request to googleadservices.com
- Google Ads still shows 0 conversions

**Causes:**

1. Data processing delay (24-48 hours)
2. Ad clicks required (conversion needs associated ad click)
3. Cookie consent blocking
4. Testing on localhost (conversions might be filtered)

**Solutions:**

1. Wait 24-48 hours
2. Click a Google Ad before visiting /about page
3. Accept all cookies
4. Test on production domain only

---

### Issue: Multiple conversions per session

**Symptoms:**

- Conversion fires every time user visits /about
- Google Ads count is inflated

**Cause:**

- sessionStorage check removed or failing

**Solution:**

- Verify `hasConverted()` function works
- Check sessionStorage in DevTools → Application tab

---

## Production Testing Checklist

- [ ] Visit https://life-psychology.com.au/about in Incognito mode
- [ ] Open DevTools Console
- [ ] Clear sessionStorage
- [ ] Reload page
- [ ] Verify console logs show successful conversion
- [ ] Check Network tab for googleadservices.com request
- [ ] Verify gtag and dataLayer exist in console
- [ ] Wait 24-48 hours
- [ ] Check Google Ads for new conversions

---

## Enhanced Debugging (November 4, 2025)

### Changes Made

1. **Added Enhanced Console Logging**
   - `About.tsx` now logs component mount and gtag availability
   - `microConversions.ts` shows detailed conversion firing logs
   - All logs visible in both dev and production

2. **Added Explicit page_view Event**
   - Ensures GTM Page View trigger fires correctly
   - Fixes SPA navigation issue
   - Includes page_title, page_location, page_path

3. **Improved Error Handling**
   - Checks if window exists
   - Checks if gtag function exists
   - Logs exact error states

---

## Next Steps

1. **Test on Production**
   - Visit https://life-psychology.com.au/about
   - Check console logs
   - Verify conversion fires

2. **Monitor Google Ads**
   - Check conversion status daily
   - Look for "Last received" timestamp update
   - Verify conversion count increases

3. **Alternative Tracking Methods**
   - Consider using Google Tag Manager triggers instead of direct gtag calls
   - Add GA4 event tracking as backup
   - Implement Server-Side Tagging for reliability

4. **A/B Test Impact**
   - If conversions start recording, measure impact on ad optimization
   - Compare campaigns with/without micro-conversion data
   - Evaluate ROI of $3 value vs actual booking value

---

## Expected Behavior

**Correct Flow:**

1. User lands on homepage from Google Ad (GCLID captured)
2. User navigates to /about page
3. React Router changes URL to /about (no page reload)
4. About component mounts
5. `useEffect` hook runs
6. `fireAboutPageConversion()` called
7. gtag checks pass (window exists, gtag is function)
8. Session check passes (first visit this session)
9. Conversion event sent to Google Ads
10. sessionStorage marked to prevent duplicate
11. Console shows success message
12. Network request sent to googleadservices.com
13. Google Ads receives conversion (may take 24-48hrs to appear)

**Success Indicators:**

- ✅ Console: `✅ About Zoe View fired successfully`
- ✅ Network: Request to `googleadservices.com` with label `IvW6CPqnw6UbEKvXgoor`
- ✅ sessionStorage: `lpa_micro_about_page` = "true"
- ✅ Google Ads (24-48hrs later): Conversion count increases

---

## Contact & Support

If conversions still don't appear after 48 hours:

1. **Export Debug Data**

   ```javascript
   // Run in console
   {
     gtag: typeof window.gtag,
     dataLayer: window.dataLayer?.length,
     sessionData: getMicroConversionStats(),
     url: window.location.href,
     timestamp: new Date().toISOString()
   }
   ```

2. **Check Google Ads Diagnostics**
   - Tools → Conversions → Diagnostic tab
   - Look for errors or warnings

3. **Verify Tag Configuration**
   - Ensure conversion action is ENABLED
   - Check counting method is "One" not "Every"
   - Verify attribution model is set

---

**Last Updated:** November 4, 2025  
**Debug Version:** v1.1 (Enhanced logging enabled)
