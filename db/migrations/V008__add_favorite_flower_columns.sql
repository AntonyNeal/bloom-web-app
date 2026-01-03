-- V008__add_favorite_flower_columns.sql
-- Add favorite_flower to applications and practitioners tables
-- This is Zoe's secret intel for the onboarding surprise
-- Updated: 2026-01-04 - trigger CI/CD migration run

-- Add to applications table (where it's collected)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('applications') 
    AND name = 'favorite_flower'
)
BEGIN
    ALTER TABLE applications
    ADD favorite_flower NVARCHAR(100) NULL;
    
    PRINT 'Added favorite_flower column to applications table';
END
GO

-- Add to practitioners table (for onboarding display)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('practitioners') 
    AND name = 'favorite_flower'
)
BEGIN
    ALTER TABLE practitioners
    ADD favorite_flower NVARCHAR(100) NULL;
    
    PRINT 'Added favorite_flower column to practitioners table';
END
GO

-- Update Julian's application with a flower for testing
UPDATE applications
SET favorite_flower = 'Sunflower'
WHERE email = 'julian@life-psychology.com.au'
AND favorite_flower IS NULL;
GO
