# A/B Testing Dashboard - Complete Setup Guide

## Current Status
✅ **Frontend Code**: All deployed and working  
✅ **Cosmos DB**: Contains live test data (20 allocations, 2 conversions)  
⏳ **Azure Function API**: Deploying now (check GitHub Actions)  
❌ **SQL Metadata**: Not yet created  

---

## Step 1: Run SQL Migrations (Do This Now)

### Open Azure Portal SQL Query Editor
1. Go to: https://portal.azure.com
2. Navigate to `lpa-applications-db` (SQL Database)
3. Click **Query editor (preview)**
4. Login

### Migration: Drop and Rebuild Table with All Fields
```sql
-- Drop existing table
DROP TABLE IF EXISTS dbo.ab_test_metadata;
PRINT 'Dropped existing ab_test_metadata table';
GO

-- Create new table with all fields including duration tracking
CREATE TABLE dbo.ab_test_metadata (
    test_name NVARCHAR(255) PRIMARY KEY,
    display_label NVARCHAR(500) NOT NULL,
    description NVARCHAR(1000),
    started_at DATETIME2,
    expected_duration_days INT,
    status NVARCHAR(50) DEFAULT 'running',
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Insert all test data with duration info
INSERT INTO dbo.ab_test_metadata (test_name, display_label, description, started_at, expected_duration_days, status) VALUES
('homepage-header-test', 'Homepage Header Copy', 'Testing different headline variations on the landing page', DATEADD(day, -3, GETUTCDATE()), 14, 'running'),
('hero-cta-test', 'Hero Call-to-Action Button', 'Testing CTA button text and styling variations', DATEADD(day, -2, GETUTCDATE()), 14, 'running'),
('mobile-touch-test', 'Mobile Touch Interactions', 'Testing mobile-specific touch feedback and interactions', DATEADD(day, -5, GETUTCDATE()), 21, 'running'),
('form-fields-test', 'Application Form Fields', 'Testing form field layouts and input styles', DATEADD(day, -1, GETUTCDATE()), 14, 'running'),
('trust-badges-test', 'Trust Badges & Social Proof', 'Testing placement and style of trust indicators', DATEADD(day, -4, GETUTCDATE()), 10, 'running');
GO

-- Verify the data
SELECT * FROM dbo.ab_test_metadata;

PRINT 'ab_test_metadata table recreated successfully with all fields and data';
```

**Click Run** ✓

### Verify Migrations
```sql
-- Check the metadata table
SELECT * FROM dbo.ab_test_metadata;
```

You should see 5 rows with display labels and duration info! ✓

---

## Step 2: Wait for Azure Function Deployment

### Check GitHub Actions Status
1. Go to: https://github.com/AntonyNeal/bloom-web-app/actions
2. Wait for "fix: Add fallback to format test names..." to complete
3. Should take ~2-5 more minutes

### Test the API After Deployment
Run this in PowerShell:
```powershell
Invoke-RestMethod -Uri "https://fnt42kldozqahcu.azurewebsites.net/api/ab-test/results/homepage-header-test" | ConvertTo-Json -Depth 10
```

**You should now see:**
- ✅ `displayLabel`: "Homepage Header Copy"
- ✅ `description`: "Testing different headline variations..."
- ✅ `duration` object with days running and remaining

---

## Step 3: Refresh Your Dashboard

1. Open: http://localhost:5173
2. Navigate to Admin Dashboard → A/B Testing Dashboard
3. Click **Refresh** button

### What You'll See:
✅ **Test Names**: "Homepage Header Copy" (not "homepage-header-test")  
✅ **Duration Info**: "Running 3 days • 11 days remaining"  
✅ **Progress Bars**: Visual completion percentage  
✅ **Collapsible Tabs**: Click to expand/collapse each test  
✅ **Live Data**: 20 allocations, 2 conversions from Cosmos DB  

---

## Architecture Summary

### Data Sources
1. **Cosmos DB** (`cdbt42kldozqahcu`)
   - Stores: A/B test events (allocations, conversions)
   - High volume: Thousands of events per day
   - Fast writes from live traffic

2. **SQL Database** (`lpa-applications-db`)
   - Stores: Test metadata (labels, descriptions, durations)
   - Low volume: Only 5 rows (one per test)
   - Easy to update test settings

### API Flow
```
Dashboard → Azure Function → Cosmos DB (test data)
                          ↘ SQL DB (metadata)
                          → Merged response
```

---

## Troubleshooting

### "Still seeing test names with underscores"
- ✅ Fallback formatting is working (converts to Title Case)
- ⏳ Wait for API deployment to finish
- ⏳ Run SQL migrations if not done yet

### "No duration info showing"
- ⏳ Wait for API deployment
- ❌ Check if Migration 2 was run successfully

### "Data looks old"
- Cosmos DB has the real data
- Test events are only created when users trigger tests
- Run this to check Cosmos DB in Data Explorer

### "API returning old data"
- Clear browser cache (Ctrl+F5)
- Check GitHub Actions completed
- API may have cold start (wait 30 seconds)

---

## Success Checklist

- [ ] Migration completed (ab_test_metadata table rebuilt with all fields)
- [ ] GitHub Actions deployment finished
- [ ] API returns displayLabel and duration fields
- [ ] Dashboard shows friendly test names
- [ ] Duration info displays ("Running X days...")
- [ ] Progress bars appear when tests expanded
- [ ] Data matches what's in Cosmos DB (20/2 for homepage test)

---

## Next Steps (Optional)

### Update Test Settings
```sql
-- Change duration or start date for any test
UPDATE dbo.ab_test_metadata 
SET expected_duration_days = 21,
    started_at = DATEADD(day, -7, GETUTCDATE())
WHERE test_name = 'homepage-header-test';
```

### Add New Test
```sql
INSERT INTO dbo.ab_test_metadata (test_name, display_label, description, started_at, expected_duration_days, status)
VALUES ('new-test-name', 'My New Test', 'Testing something new', GETUTCDATE(), 14, 'running');
```

Then add to `ACTIVE_TESTS` array in `ABTestDashboard.tsx`

---

## Support

All code is deployed to `main` branch:
- Frontend: Automatic via GitHub Actions
- Migrations: `api/migrations/` folder
- Documentation: This file

**Everything is ready - just run the migrations and wait for deployment!** 🚀
