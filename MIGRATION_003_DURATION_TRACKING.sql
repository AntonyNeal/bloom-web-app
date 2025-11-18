# Run this SQL in Azure Portal Query Editor

-- Add duration tracking fields to ab_test_metadata
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ab_test_metadata') AND name = 'started_at')
BEGIN
    ALTER TABLE ab_test_metadata
    ADD started_at DATETIME2,
        expected_duration_days INT,
        status NVARCHAR(50) DEFAULT 'running';

    -- Update existing tests with start dates and expected durations
    UPDATE ab_test_metadata 
    SET started_at = DATEADD(day, -3, GETUTCDATE()),
        expected_duration_days = 14,
        status = 'running'
    WHERE test_name = 'homepage-header-test';

    UPDATE ab_test_metadata 
    SET started_at = DATEADD(day, -2, GETUTCDATE()),
        expected_duration_days = 14,
        status = 'running'
    WHERE test_name = 'hero-cta-test';

    UPDATE ab_test_metadata 
    SET started_at = DATEADD(day, -5, GETUTCDATE()),
        expected_duration_days = 21,
        status = 'running'
    WHERE test_name = 'mobile-touch-test';

    UPDATE ab_test_metadata 
    SET started_at = DATEADD(day, -1, GETUTCDATE()),
        expected_duration_days = 14,
        status = 'running'
    WHERE test_name = 'form-fields-test';

    UPDATE ab_test_metadata 
    SET started_at = DATEADD(day, -4, GETUTCDATE()),
        expected_duration_days = 10,
        status = 'running'
    WHERE test_name = 'trust-badges-test';

    PRINT 'Duration tracking fields added successfully';
END
ELSE
BEGIN
    PRINT 'Duration tracking fields already exist';
END

-- Verify the updates
SELECT 
    test_name,
    display_label,
    started_at,
    expected_duration_days,
    DATEDIFF(day, started_at, GETUTCDATE()) as days_running,
    expected_duration_days - DATEDIFF(day, started_at, GETUTCDATE()) as days_remaining,
    status
FROM ab_test_metadata
ORDER BY test_name;
