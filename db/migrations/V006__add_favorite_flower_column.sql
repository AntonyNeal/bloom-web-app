-- ============================================================================
-- Migration: Add favorite_flower column to applications table
-- Author: Zoe's secret intel feature
-- Date: 2026-01-09
-- ============================================================================

-- Add the favorite_flower column to applications table (if not exists)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('applications') 
    AND name = 'favorite_flower'
)
BEGIN
    ALTER TABLE applications
    ADD favorite_flower NVARCHAR(100) NULL;
    PRINT '✅ Added favorite_flower column to applications table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Column favorite_flower already exists in applications table';
END
GO
