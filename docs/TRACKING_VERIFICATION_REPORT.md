# Tracking & Analytics Verification Report

**Generated**: November 20, 2025  
**Status**: 🔍 INVESTIGATION IN PROGRESS

## Executive Summary

This report verifies that analytics tracking is properly configured and data is being recorded in Azure Cosmos DB for the Life Psychology website.

## Infrastructure Status

### ✅ Azure Cosmos DB
- **Account**: `cdbt42kldozqahcu`
- **Resource Group**: `rg-lpa-prod-opt`
- **Location**: Australia East
- **Database**: `conversion-analytics`
- **Container**: `user-sessions`
- **Status**: ✅ DEPLOYED AND ACCESSIBLE

### ✅ Azure Function (Website Functions)
- **Name**: `fnt42kldozqahcu`
- **Resource Group**: `rg-lpa-prod-opt`
- **Cosmos Connection**: ✅ CONFIGURED
- **Connection String**: `AccountEndpoint=https://cdbt42kldozqahcu.documents.azure.com:443/;AccountKey=***`

### 📊 Cosmos DB Container Schema

The `user-sessions` container stores:

1. **Variant Allocations** (`type: 'variant-allocation'`)
   ```json
   {
     "id": "user-123-header-test-1234567890",
     "userId": "user-123",
     "testName": "header-test",
     "variant": "healthcare-optimized" | "minimal",
     "timestamp": "2025-11-20T12:00:00.000Z",
     "deviceType": "desktop" | "mobile",
     "location": "AU",
     "type": "variant-allocation",
     "ttl": 2592000
   }
   ```

2. **Conversion Events** (`type: 'conversion-event'`)
   ```json
   {
     "id": "user-123-book_now_click-1234567890",
     "userId": "user-123",
     "testName": "header-test",
     "variant": "healthcare-optimized",
     "eventType": "book_now_click" | "phone_call" | "contact_form",
     "eventData": {},
     "deviceType": "desktop",
     "timestamp": "2025-11-20T12:00:00.000Z",
     "type": "conversion-event",
     "ttl": 2592000
   }
   ```

## Tracking Implementation

### Frontend Tracking (`apps/website/src/`)

#### Core Tracking Files
1. **`utils/trackingCore.ts`** - Core primitives
   - gtag wrapper functions
   - DataLayer utilities
   - Session storage (GCLID, UTM parameters)
   - Type-safe tracking functions

2. **`utils/trackingEvents.ts`** - High-level event tracking
   - `trackBookNowClick()` - Book Now button clicks
   - `trackPhoneCallAttempt()` - Phone call clicks
   - `trackContactFormSubmit()` - Contact form submissions
   - `trackPageView()` - Page views
   - `fireMicroConversion()` - Google Ads micro-conversions

3. **`utils/UnifiedTracker.ts`** - Orchestration layer
   - Delegates to trackingEvents.ts
   - Manages state and configuration
   - High-level API for common patterns

#### A/B Testing Integration
- **`components/ABTestProvider.tsx`** - Variant allocation
  - Generates user ID
  - Allocates to variant (50/50 split)
  - Calls Azure Function `/api/ab-test/allocate`
  - **⚠️ NOTE**: Currently uses local fallback if Azure Function fails

### Backend Tracking (Azure Functions)

#### Website Functions (`apps/website/functions/src/ab-testing/`)

1. **`allocateVariant.ts`** - Variant allocation endpoint
   - Route: `/api/ab-test/allocate`
   - Records variant allocation in Cosmos DB
   - Database: `conversion-analytics`
   - Container: `user-sessions`
   - **Status**: ✅ DEPLOYED

2. **`trackConversion.ts`** - Conversion tracking endpoint
   - Route: `/api/ab-test/track-conversion`
   - Records conversion events in Cosmos DB
   - Calculates statistical significance
   - **Status**: ✅ DEPLOYED

#### Bloom API Functions (`apps/bloom/api/src/functions/`)

1. **`ab-test.ts`** - Get A/B test results
   - Route: `/api/ab-test/track` (GET)
   - Aggregates test results from Cosmos DB
   - Database: `bloom-ab-testing`
   - **Status**: ✅ DEPLOYED

2. **`track-ab-test.ts`** - Track A/B test events
   - Route: `/api/ab-test/track` (POST)
   - Records events in Cosmos DB
   - **Status**: ✅ DEPLOYED

## Current Issues & Verification Needed

### 🔍 Data Verification Required

**Action Items:**
1. ✅ Verify Cosmos DB container exists → **CONFIRMED**
2. ✅ Verify Azure Function has connection string → **CONFIRMED**
3. ⚠️ **Query Cosmos DB for existing tracking data** → PENDING
4. ⚠️ **Verify frontend is calling Azure Function endpoints** → PENDING
5. ⚠️ **Test end-to-end tracking flow** → PENDING

### Potential Issues to Investigate

1. **Azure Function Endpoint URLs**
   - Need to verify the correct Function App URL
   - Check if API routes are accessible
   - Verify CORS configuration

2. **Frontend API Integration**
   - `ABTestProvider.tsx` may be using local fallback instead of calling API
   - Need to check `apiService` configuration
   - Verify `VITE_AZURE_FUNCTION_URL` environment variable

3. **Data Query Tools**
   - Azure CLI `az cosmosdb sql query` command has issues
   - Alternative: Use Azure Portal Data Explorer
   - Alternative: Create Node.js script with @azure/cosmos SDK

## Recommendations

### Immediate Actions

1. **Verify Function App Endpoints**
   ```bash
   # Test allocate variant endpoint
   curl https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/allocate
   
   # Test track conversion endpoint
   curl -X POST https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/track-conversion \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","testName":"test","variant":"control","eventType":"test"}'
   ```

2. **Query Cosmos DB via Azure Portal**
   - Navigate to: Azure Portal → Cosmos DB → Data Explorer
   - Database: `conversion-analytics`
   - Container: `user-sessions`
   - Query: `SELECT * FROM c ORDER BY c._ts DESC OFFSET 0 LIMIT 10`

3. **Check Application Insights**
   - Function: `fnt42kldozqahcu`
   - Check for:
     - Incoming HTTP requests to `/api/ab-test/*`
     - Cosmos DB operation telemetry
     - Any errors or exceptions

4. **Frontend Environment Variables**
   - Verify `apps/website/.env.production` has:
     ```
     VITE_AZURE_FUNCTION_URL=https://fnt42kldozqahcu.azurewebsites.net
     ```
   - Check `public/runtime-config.json` for staging deployment

### Long-term Improvements

1. **Add Monitoring Dashboard**
   - Create Power BI dashboard for A/B test results
   - Set up Application Insights workbook
   - Configure alerts for tracking failures

2. **Add Health Check Endpoint**
   - Create `/api/health` endpoint that verifies:
     - Cosmos DB connectivity
     - Environment variables configured
     - Sample query executes successfully

3. **Implement Retry Logic**
   - Add exponential backoff for Cosmos DB writes
   - Implement queue-based tracking for reliability
   - Log failed tracking attempts

## Next Steps

1. Test Azure Function endpoints manually
2. Query Cosmos DB for actual data
3. Verify frontend is calling correct URLs
4. Enable detailed logging and monitor
5. Create automated tests for tracking flow

## Related Files

### Frontend
- `apps/website/src/utils/trackingCore.ts`
- `apps/website/src/utils/trackingEvents.ts`
- `apps/website/src/utils/UnifiedTracker.ts`
- `apps/website/src/components/ABTestProvider.tsx`
- `apps/website/src/hooks/useABTest.ts`

### Backend (Website Functions)
- `apps/website/functions/src/ab-testing/allocateVariant.ts`
- `apps/website/functions/src/ab-testing/trackConversion.ts`

### Backend (Bloom API)
- `apps/bloom/api/src/functions/ab-test.ts`
- `apps/bloom/api/src/functions/track-ab-test.ts`

### Configuration
- `apps/website/.env.production`
- `apps/website/public/runtime-config.json`
- Azure Function App Settings (COSMOS_DB_CONNECTION_STRING)

---

**Status Legend:**
- ✅ = Verified working
- ⚠️ = Needs verification
- ❌ = Issue identified
- 🔍 = Investigation in progress
