-- ============================================================================
-- COMPLETE CLEANUP FOR FRESH ONBOARDING TEST
-- Run this to delete all test data and start completely fresh
-- ============================================================================

USE [lpa-db-dev];
GO

-- Delete all practitioners (cascades to related records)
DELETE FROM practitioners;
PRINT 'Deleted all practitioners';

-- Delete all applications
DELETE FROM applications;
PRINT 'Deleted all applications';

-- Delete all AB test variants
DELETE FROM ab_test_assignments;
DELETE FROM ab_test_variants;
DELETE FROM ab_tests;
PRINT 'Deleted all AB test data';

-- Delete sync logs
DELETE FROM halaxy_sync_logs;
PRINT 'Deleted sync logs';

-- Verify cleanup
PRINT '';
PRINT '=== VERIFICATION ===';
SELECT 'applications' as [table], COUNT(*) as [count] FROM applications
UNION ALL
SELECT 'practitioners', COUNT(*) FROM practitioners
UNION ALL
SELECT 'ab_tests', COUNT(*) FROM ab_tests
UNION ALL
SELECT 'halaxy_sync_logs', COUNT(*) FROM halaxy_sync_logs;

PRINT '';
PRINT '✅ Database cleanup complete! Ready for fresh onboarding test.';
