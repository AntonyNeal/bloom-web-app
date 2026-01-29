# Google Ads Conversion Tracking - Troubleshooting Guide

**Created:** January 29, 2026  
**Campaign:** TEST - Conversion Tracking  
**Website:** life-psychology.com.au

---

## Current Status

- [ ] Conversions appearing in Google Ads (check after 24 hours)
- [ ] Tag firing confirmed via Tag Assistant
- [ ] Test conversion triggered successfully

**Test performed:** January 29, 2026
- Clicked ad link in Google Ads
- Visited `https://life-psychology.com.au/?gclid=test_conversion_123`
- Completed conversion action(s)

---

## Conversion Actions to Track

| Action | Type | Status |
|--------|------|--------|
| Book appointment | Click/Form submit | ❓ Pending |
| Contact form | Form submit | ❓ Pending |
| Phone call | Click-to-call | ❓ Pending |

*(Update this table with your actual conversion actions)*

---

## Troubleshooting Checklist

### 1. Verify Tag Installation

**Option A: Google Tag Assistant (Chrome Extension)**
1. Install "Tag Assistant Legacy" from Chrome Web Store
2. Navigate to life-psychology.com.au
3. Click the Tag Assistant icon
4. Look for Google Ads tags (AW-XXXXXXXXX)
5. Green = working, Yellow = minor issues, Red = broken

**Option B: Browser Developer Tools**
1. Open life-psychology.com.au
2. Press F12 → Network tab
3. Filter by "google" or "ads"
4. Look for requests to `googleadservices.com` or `google.com/pagead`

**Option C: Google Ads Real-Time Check**
1. Google Ads → Tools & Settings (wrench icon)
2. Measurement → Conversions
3. Click on your conversion action
4. Check "Last received" timestamp

---

### 2. Common Problems & Solutions

#### Problem: No conversions after 24 hours
**Possible causes:**
- [ ] Google Ads tag not installed on website
- [ ] Tag installed but not firing on conversion event
- [ ] Conversion action misconfigured in Google Ads
- [ ] Tag blocked by ad blocker or cookie consent

**Solution:**
1. Check if gtag.js is in your website's `<head>`
2. Verify the conversion snippet fires on the thank-you page or button click
3. Check Google Ads conversion settings match your website events

#### Problem: Tag shows but conversions not recording
**Possible causes:**
- [ ] Conversion window too narrow
- [ ] Attribution model excluding conversions
- [ ] Test clicks not counting (need real ad click)

**Solution:**
1. Check conversion window settings (default 30 days)
2. Ensure attribution model is set correctly
3. Do a real search and click the actual ad

#### Problem: "No recent conversions" in Google Ads
**Possible causes:**
- [ ] Conversion action paused
- [ ] Conversion tag ID mismatch
- [ ] Website SSL/security blocking scripts

---

### 3. Implementation Details

#### Global Site Tag (gtag.js)
Should be in `<head>` of every page:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

#### Event Snippet (for specific conversions)
Fires when conversion happens:
```html
<script>
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXX/CONVERSION_LABEL',
    'value': 1.0,
    'currency': 'AUD'
  });
</script>
```

**Replace `AW-XXXXXXXXX` and `CONVERSION_LABEL` with your actual values from Google Ads.**

---

### 4. Where to Find Your Conversion IDs

1. Google Ads → Tools & Settings
2. Measurement → Conversions
3. Click on your conversion action
4. Click "Tag setup"
5. Choose "Install the tag yourself"
6. Copy the Conversion ID and Conversion Label

---

### 5. Testing Workflow

1. **Before testing:**
   - Open incognito/private browser
   - Disable ad blockers
   - Clear cookies

2. **Test the conversion:**
   - Visit: `https://life-psychology.com.au/?gclid=test_123`
   - Complete the conversion action
   - Note the time

3. **Verify (after 1-24 hours):**
   - Check Google Ads → Conversions
   - Look for test conversion timestamp

4. **Real test (recommended):**
   - Search for your keyword on Google
   - Click your actual ad
   - Complete conversion
   - This is the most accurate test

---

## Notes

**RA Number (HPOS Delegation):** 5422360519  
*(From Zoe - kept here for reference)*

---

## Follow-up Actions

- [ ] Check conversions on January 30, 2026
- [ ] If no conversions, run Tag Assistant diagnostic
- [ ] Verify tag is installed on Next.js website
- [ ] Consider setting up Google Tag Manager for easier management

---

## Contact

If conversion tracking still isn't working after following this guide, potential next steps:
1. Review Google Ads Help documentation
2. Check if website uses consent management that blocks tracking
3. Verify Next.js/React hydration isn't affecting script loading
4. Consider implementing server-side conversion tracking (Google Ads API)
