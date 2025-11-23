# A/B Testing System - Real Data Collection Implementation

## ✅ Complete Setup Summary

Your A/B testing system has been fully configured to collect **real data** from your SQL database instead of using mock data.

## What's Been Done

### 1. **Fixed Critical Error**

- ✅ Resolved "Cannot convert undefined or null to object" TypeError in ABTestDashboard
- ✅ Added comprehensive null-safety checks
- ✅ Component now gracefully handles missing data

### 2. **Backend Functions Created**

| Function           | Purpose                              | Endpoint                              |
| ------------------ | ------------------------------------ | ------------------------------------- |
| `ab-test.ts`       | Query and analyze results            | `GET /api/ab-test/results/{testName}` |
| `track-ab-test.ts` | Track events & get real-time results | `POST/GET /api/ab-test/track`         |

### 3. **Database Schema**

- Created migration: `api/migrations/001_create_ab_test_events.sql`
- Table: `ab_test_events` with proper indexing
- Tracks: test name, variant, session, user, conversions, timestamps

### 4. **Frontend Library**

- Created: `src/services/abTestTracker.ts`
- Session management
- Event tracking (allocation & conversion)
- Real-time result queries

### 5. **Statistical Analysis**

- Z-score calculation
- P-value computation
- Significance testing (α = 0.05)
- Automatic winner detection
- Improvement percentage

### 6. **Documentation**

- `AB_TESTING_REAL_DATA_GUIDE.md` - Comprehensive guide
- `REAL_AB_TESTING_SETUP.md` - Setup overview
- `src/components/examples/ABTestingExamples.tsx` - Code examples

## How to Get Started

### Step 1: Execute Database Migration

```sql
-- Connect to: lpa-sql-server.database.windows.net / lpa-bloom-db
-- Execute the contents of: api/migrations/001_create_ab_test_events.sql

CREATE TABLE ab_test_events (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    test_name NVARCHAR(255) NOT NULL,
    user_id NVARCHAR(255),
    session_id NVARCHAR(255) NOT NULL,
    variant NVARCHAR(255) NOT NULL,
    converted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);
```

### Step 2: Start Tracking in Your Components

```typescript
import { abTestTracker } from '@/services/abTestTracker';

// Allocate user to variant
const variant = Math.random() < 0.5 ? 'control' : 'variant_a';
await abTestTracker.trackAllocation('test-name', variant, userEmail);

// Track conversion
await abTestTracker.trackConversion('test-name', variant, userEmail);
```

### Step 3: View Results

Navigate to `/admin/ab-tests` to see:

- Real-time data from your database
- Statistical significance
- Winner determination
- Performance metrics

## System Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React)        │
│                 │
│ Track events via│
│ abTestTracker   │
└────────┬────────┘
         │
         │ POST/GET /api/ab-test/track
         ↓
┌─────────────────────────────────┐
│   Azure Functions               │
│                                 │
│ - track-ab-test.ts             │
│   (POST events, GET live data) │
│                                 │
│ - ab-test.ts                   │
│   (GET analyzed results)        │
└────────┬────────────────────────┘
         │
         │ SQL Queries
         ↓
┌─────────────────────┐
│   SQL Server        │
│                     │
│  ab_test_events     │
│  (Real data)        │
└─────────────────────┘

Dashboard
/admin/ab-tests → Fetches from ab-test.ts → Displays to admin
```

## Key Features

- ✅ **Real Database** - Uses your SQL Server instance
- ✅ **Event Tracking** - Allocation + Conversion events
- ✅ **Session Management** - Persistent session IDs
- ✅ **Statistical Tests** - Z-score, p-value, significance
- ✅ **CORS Enabled** - Works with localhost
- ✅ **Performance Optimized** - Indexed database queries
- ✅ **Production Ready** - Proper error handling

## API Endpoints

### Track Events

```bash
curl -X POST http://localhost:7071/api/ab-test/track \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "homepage-header-test",
    "variant": "control",
    "sessionId": "session_123",
    "userId": "user@example.com",
    "converted": false
  }'
```

### Get Real-Time Results

```bash
curl "http://localhost:7071/api/ab-test/track?testName=homepage-header-test"
```

### Get Analyzed Results

```bash
curl "http://localhost:7071/api/ab-test/results/homepage-header-test"
```

## Testing Locally

1. Start Functions: `npm run watch` in `/api`
2. Start Frontend: `npm run dev` (Vite)
3. Dashboard: http://localhost:5173/admin/ab-tests
4. Functions: http://localhost:7071/api/...

## Important Notes

⚠️ **Database Migration Required**

- Execute the SQL migration before tracking events
- Run against: `lpa-sql-server.database.windows.net`
- Database: `lpa-bloom-db`

⚠️ **Connection String**

- Verify SQL credentials in `api/local.settings.json`
- Server must be accessible from your network
- Firewall rules may need adjustment

⚠️ **Testing Best Practices**

- Run sufficient sample size for statistical validity
- Don't peek at results before reaching significance
- Document what varies between control and variant
- Focus on one primary metric

## Troubleshooting

**No data appearing?**

- Check SQL migration was executed
- Verify connection string in local.settings.json
- Ensure `abTestTracker.trackAllocation()` is called
- Check browser console for fetch errors

**Getting 404 errors?**

- Verify test data exists in database
- Check test name spelling (case-sensitive)
- Ensure Functions are running

**Slow performance?**

- Check database indexes exist
- Monitor query execution times
- Consider archiving old test data

## Next Steps

1. ✅ Execute the database migration
2. ✅ Update your components with `abTestTracker` calls
3. ✅ Generate test data
4. ✅ Monitor dashboard for results
5. ✅ Make data-driven decisions

## Files Modified/Created

### New Files:

```
api/src/functions/ab-test.ts
api/src/functions/track-ab-test.ts
api/migrations/001_create_ab_test_events.sql
src/services/abTestTracker.ts
src/components/examples/ABTestingExamples.tsx
AB_TESTING_REAL_DATA_GUIDE.md
REAL_AB_TESTING_SETUP.md
```

### Updated Files:

```
api/src/app.ts (registered new functions)
src/pages/admin/ABTestDashboard.tsx (null safety)
```

## Support & Documentation

- **Implementation Guide**: `AB_TESTING_REAL_DATA_GUIDE.md`
- **Setup Reference**: `REAL_AB_TESTING_SETUP.md`
- **Code Examples**: `src/components/examples/ABTestingExamples.tsx`

---

**Status**: ✅ Ready for production testing with real data collection
