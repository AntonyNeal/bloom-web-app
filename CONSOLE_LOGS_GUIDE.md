# 🔍 Console Logs - What to Look For

Your dashboard is now using **Azure Function Apps directly** (no more local proxy). Here's what the console should show:

## ✅ SUCCESS (What You Should See Now)

### Network Requests

```
GET https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/homepage-header-test 200 OK
GET https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/hero-cta-test 200 OK
GET https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/mobile-touch-test 200 OK
GET https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/form-fields-test 200 OK
GET https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/trust-badges-test 200 OK
```

### Console Logs (Good)

```
[AB] Data loaded successfully
[PERF] Navigation timing: {domContentLoaded: 0, loadComplete: 0.2, domInteractive: 40}
[Auth] Configuration check: {hasValidClientId: true, hasValidAuthority: true}
```

### Dashboard Display

```
✓ A/B Testing Dashboard loads
✓ Real production data appears
✓ Metrics display correctly
✓ No error messages
✓ Auto-refresh every 30 seconds
```

---

## ❌ ERRORS (What to Fix If You See These)

### CORS Error (Should Be Fixed Now ✅)

```
❌ Access to fetch at 'https://fnt42kldozqahcu.azurewebsites.net...'
   has been blocked by CORS policy
```

**Status**: FIXED - Added localhost:5173 and localhost:5175 to CORS allowed origins

---

### Network Error - Connection Failed

```
❌ Failed to fetch homepage-header-test: TypeError: Failed to fetch
```

**Causes**:

- Azure Function App is down
- Network connectivity issues
- CORS settings not applied yet (wait 5-10 minutes)

**Fix**:

```powershell
# Check if Azure function app is responding:
Invoke-WebRequest -Uri "https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/homepage-header-test"
```

---

### API Response Error

```
❌ Test homepage-header-test: Need exactly 2 variants for statistical significance
```

**Status**: This is OK - means test data isn't ready yet
**Fix**: Continue collecting data

---

### Authentication Error

```
❌ Auth] Configuration check: {hasValidClientId: false}
```

**Cause**: Azure AD not configured
**Fix**: Check environment variables

---

## 📊 Normal Console Output (Line-by-Line Explanation)

```javascript
// 1. Auth check on page load
[Auth] Configuration check:
{hasValidClientId: true, hasValidAuthority: true, isEnabled: true}
// ✓ Azure AD is configured correctly

// 2. MSAL setup
[Wed, 05 Nov 2025 01:36:56 GMT] : @azure/msal-react@2.2.0 :
Info - MsalProvider - handleRedirectPromise resolved, setting inProgress to 'none'
// ✓ Authentication provider loaded

// 3. Token retrieval
[Wed, 05 Nov 2025 01:36:56 GMT] : @azure/msal-common@14.16.1 :
Info - CacheManager:getIdToken - Returning ID token
// ✓ User is authenticated

// 4. Performance metrics
[PERF] Navigation timing:
{domContentLoaded: 0, loadComplete: 0.19999999925494194, domInteractive: 40.8}
// ✓ Page loaded in 40ms (good!)

// 5. Fetch A/B test data from AZURE (new!)
GET https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/homepage-header-test
// ✓ Requesting from Azure Function App (CORS enabled!)

// 6. Response received
200 OK
// ✓ Data retrieved successfully

// 7. Dashboard updates
ABTestDashboard.tsx: Tests loaded: 1 test with real data
// ✓ Dashboard displays results
```

---

## 🔧 How It Works Now (Direct Azure Connection)

### Current Architecture ✅

```
Browser (localhost:5173/5175)
  ↓ (HTTPS request to Azure)
Azure Function App (fnt42kldozqahcu.azurewebsites.net)
  ↓ (queries production database)
SQL Database
  ↓ (returns real A/B test data)
Azure Function App
  ↓ (with CORS headers)
Browser
✓ Dashboard displays real production data!
```

### What Was Fixed

- ✅ **CORS enabled**: Added localhost:5173 and localhost:5175 to allowed origins
- ✅ **Direct connection**: Removed local proxy, calling Azure directly
- ✅ **Real data**: Using production Azure Function App with live data
- ✅ **No local functions**: Stopped running function apps locally

---

## ✅ Console Checklist

When you refresh the dashboard, you should see:

- ✅ Auth configuration check passes
- ✅ MSAL provider initializes
- ✅ ID token retrieved
- ✅ Performance metrics log
- ✅ 5 HTTPS GET requests to `https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/`
- ✅ All return status 200 OK
- ✅ Dashboard loads with real production data
- ✅ No CORS errors
- ✅ No TypeError messages
- ✅ "Tests loaded" message in console

---

## Debug Tips

### To see network requests:

1. Open DevTools: **F12**
2. Go to **Network** tab
3. Refresh page
4. Look for requests to `fnt42kldozqahcu.azurewebsites.net`
5. Click each request to see response

### To see console logs:

1. Open DevTools: **F12**
2. Go to **Console** tab
3. Refresh page
4. Look for messages starting with `[` (auth, perf, etc.)

### To test Azure connectivity:

```javascript
// In browser console, type:
fetch('https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/homepage-header-test')
  .then((r) => r.json())
  .then((d) => console.log('✓ Azure working!', d))
  .catch((e) => console.error('✗ Azure error:', e));
```

Expected output:

```javascript
✓ Azure working! {testName: "homepage-header-test", variants: {...}}
```

---

## Common Issues & Solutions

### Problem: "CORS error still showing"

```
❌ Still see "CORS policy" messages
```

**Solution**:

1. CORS changes take 5-10 minutes to propagate
2. Hard refresh: `Ctrl + Shift + R`
3. Clear browser cache
4. Check if you're on localhost:5173 or localhost:5175

### Problem: "All requests return 404"

```
❌ GET requests return 404 Not Found
```

**Solution**:

- Azure Function App might be down
- Check Azure status: https://status.azure.com
- Verify function app name is correct

### Problem: "Data shows but very slow"

```
✓ Dashboard loads but takes 30+ seconds
```

**Solution**: Normal on first load, should improve after refresh

### Problem: "Empty dashboard"

```
❌ Dashboard loads but no data appears
```

**Solution**:

1. Check console for error messages
2. Verify Azure Function App is responding
3. Check network tab for failed requests

---

## Expected Timeline

1. **Page loads**:
   - Auth checks: 0-5 seconds
   - Page renders: 5-10 seconds
   - Requests start: 10-15 seconds

2. **Requests complete**:
   - Azure API: 200-1000ms each
   - Total: ~1-5 seconds for all 5 tests

3. **Dashboard updates**:
   - Shows real production data
   - Auto-refreshes every 30 seconds

---

## Success Message Format

When everything is working, you should see:

```
✅ A/B Testing Dashboard
✅ Last updated: 12:17:38
✅ 1+ tests with real production data displayed
✅ Metrics calculating correctly
✅ Statistical analysis showing
✅ Auto-refresh every 30 seconds
```

---

## Quick Reference

| Symptom         | Cause               | Fix                    |
| --------------- | ------------------- | ---------------------- |
| CORS error      | Origins not allowed | Wait 5-10 min, refresh |
| 404 error       | Function app down   | Check Azure status     |
| No data         | Network issue       | Check console errors   |
| Slow loading    | Network latency     | Normal, refresh helps  |
| Empty dashboard | API errors          | Check network tab      |

---

## Real Data Expected

Your Azure Function App is returning **real production data**:

```json
{
  "testName": "homepage-header-test",
  "variants": {
    "minimal": {
      "allocations": 13,
      "conversions": 1,
      "conversionRate": 0.077
    },
    "healthcare-optimized": {
      "allocations": 7,
      "conversions": 1,
      "conversionRate": 0.143
    }
  },
  "statisticalSignificance": {
    "zScore": 0.47,
    "pValue": 0.64,
    "isSignificant": false,
    "confidenceLevel": "Not significant"
  },
  "improvement": {
    "percentage": 85.7,
    "winner": "healthcare-optimized"
  }
}
```

---

**Everything is now configured to work with Azure! 🚀**

Just refresh your browser and watch the console - you should see all green! ✅
