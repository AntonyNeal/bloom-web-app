# A/B Testing with Real Data Collection

## Overview

Your A/B testing dashboard now connects to a real SQL database to collect and analyze A/B test data. This replaces the mock data with production-ready infrastructure.

## Architecture

### Database Schema

The system uses a SQL Server table `ab_test_events` with the following structure:

```sql
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

### API Endpoints

#### 1. Track Event

**POST** `/api/ab-test/track`

Track a user allocation or conversion event.

**Request:**

```json
{
  "testName": "homepage-header-test",
  "variant": "control",
  "sessionId": "session_1234567890",
  "userId": "user@example.com",
  "converted": false
}
```

**Response:**

```json
{
  "success": true,
  "eventId": 12345
}
```

#### 2. Get Test Results (Realtime)

**GET** `/api/ab-test/track?testName=homepage-header-test`

Get real-time results for a specific test.

**Response:**

```json
{
  "testName": "homepage-header-test",
  "variants": [
    {
      "variant": "control",
      "allocations": 1000,
      "conversions": 45,
      "conversionRate": 0.045
    },
    {
      "variant": "variant_a",
      "allocations": 1050,
      "conversions": 63,
      "conversionRate": 0.06
    }
  ]
}
```

#### 3. Get Test Summary

**GET** `/api/ab-test/results/{testName}`

Get statistical analysis and significance for a test.

**Response:**

```json
{
  "testName": "homepage-header-test",
  "variants": {
    "control": {
      "allocations": 1000,
      "conversions": 45,
      "conversionRate": 0.045
    },
    "variant_a": {
      "allocations": 1050,
      "conversions": 63,
      "conversionRate": 0.06
    }
  },
  "statisticalSignificance": {
    "zScore": 1.23,
    "pValue": 0.219,
    "isSignificant": false,
    "confidenceLevel": "78%"
  },
  "improvement": {
    "percentage": 33.33,
    "winner": "variant_a"
  }
}
```

## Usage in Frontend

### Tracking User Allocation

```typescript
import { abTestTracker } from '@/services/abTestTracker';

// In your page/component initialization
const variant = Math.random() < 0.5 ? 'control' : 'variant_a';

// Track the allocation
await abTestTracker.trackAllocation('homepage-header-test', variant, userEmail);

// Use variant in your UI
if (variant === 'control') {
  // Show control version
} else {
  // Show variant A
}
```

### Tracking Conversions

```typescript
// When user performs desired action (e.g., submits form, makes purchase)
await abTestTracker.trackConversion('homepage-header-test', userVariant, userEmail);
```

### Getting Real-Time Results

```typescript
const results = await abTestTracker.getTestResults('homepage-header-test');

if (results) {
  console.log('Test results:', results.variants);
  console.log('Winner:', results.improvement.winner);
}
```

## Setup Instructions

### 1. Create the Database Table

Run the migration to create the `ab_test_events` table:

```bash
cd api
# Execute migration against your database
sqlcmd -S lpa-sql-server.database.windows.net -d lpa-bloom-db -U [username] -P [password] -i migrations/001_create_ab_test_events.sql
```

### 2. Configure Connection String

Update `api/local.settings.json` with your SQL Server credentials:

```json
{
  "Values": {
    "SQL_SERVER": "lpa-sql-server.database.windows.net",
    "SQL_DATABASE": "lpa-bloom-db",
    "SQL_USER": "your-username",
    "SQL_PASSWORD": "your-password"
  }
}
```

### 3. Deploy to Azure

The functions are automatically deployed when you push to your connected Azure Functions app:

```bash
# Build
npm run build

# Deploy (automatic or via Azure DevOps)
```

## Statistical Analysis

The system automatically calculates:

- **Z-Score**: Measures difference between variants in standard deviations
- **P-Value**: Probability that observed difference is due to chance
- **Statistical Significance**: True if p-value < 0.05 (95% confidence)
- **Confidence Level**: Displayed as percentage (e.g., 95%, 99%)

### Interpretation

- **Significant (p < 0.05)**: Result is statistically reliable
- **Not Significant (p ≥ 0.05)**: Need more data to make conclusion
- **High Confidence (p < 0.01)**: Very strong evidence of difference

## Best Practices

1. **Randomization**: Ensure even split between control and variants
2. **Sample Size**: Run test until you have sufficient conversions
3. **Avoid Peeking**: Don't stop test early even if results look significant
4. **Document Changes**: Keep track of what varies between control and variant
5. **One Metric**: Focus on primary conversion metric to avoid false positives

## Monitoring

### Check Event Collection

```sql
SELECT
  test_name,
  variant,
  COUNT(*) as total_events,
  SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions
FROM ab_test_events
GROUP BY test_name, variant
ORDER BY test_name, variant;
```

### Recent Events

```sql
SELECT TOP 100
  test_name,
  variant,
  converted,
  created_at
FROM ab_test_events
ORDER BY created_at DESC;
```

## Troubleshooting

### No Data Appearing

1. Verify migration ran successfully
2. Check SQL connection string in local.settings.json
3. Ensure `abTestTracker.trackAllocation()` is being called
4. Check browser console for fetch errors

### Getting 404 Errors

- Verify test data exists in database
- Check test name spelling (case-sensitive)
- Ensure API functions are running: `func host start`

### Connection String Issues

- SQL Server must be accessible from your location (check firewall rules)
- Credentials must be valid
- Database must exist and be accessible

## Next Steps

1. Implement A/B testing in your components
2. Start tracking user interactions
3. Monitor dashboard for results
4. Once significant, make data-driven decision on variant
5. Archive test results for future reference
