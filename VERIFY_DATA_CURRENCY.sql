-- Verify A/B Test Data Currency
-- Run this in Azure Portal Query Editor to check if data is up-to-date

-- 1. Check most recent events for all tests
SELECT 
    test_name,
    COUNT(*) as total_events,
    MAX(created_at) as most_recent_event,
    MIN(created_at) as oldest_event,
    DATEDIFF(hour, MAX(created_at), GETUTCDATE()) as hours_since_last_event,
    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as total_conversions
FROM ab_test_events
GROUP BY test_name
ORDER BY most_recent_event DESC;

-- 2. Detailed breakdown by variant
SELECT 
    test_name,
    variant,
    COUNT(*) as allocations,
    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
    MAX(created_at) as last_event,
    CONVERT(varchar, MAX(created_at), 120) as last_event_formatted
FROM ab_test_events
GROUP BY test_name, variant
ORDER BY test_name, variant;

-- 3. Events recorded today (Nov 18, 2025)
SELECT 
    test_name,
    variant,
    COUNT(*) as events_today,
    MAX(created_at) as latest_time
FROM ab_test_events
WHERE CAST(created_at AS DATE) = CAST(GETUTCDATE() AS DATE)
GROUP BY test_name, variant
ORDER BY test_name, variant;

-- 4. Timeline of events (last 7 days)
SELECT 
    CAST(created_at AS DATE) as date,
    test_name,
    COUNT(*) as events,
    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions
FROM ab_test_events
WHERE created_at >= DATEADD(day, -7, GETUTCDATE())
GROUP BY CAST(created_at AS DATE), test_name
ORDER BY date DESC, test_name;
