-- Add all missing columns to applications table
-- This migration adds columns that are being submitted by the frontend but don't exist in the database

-- Add experience_years column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'experience_years')
BEGIN
    ALTER TABLE applications ADD experience_years INT NULL;
    PRINT 'Added experience_years column';
END

-- Add cover_letter column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'cover_letter')
BEGIN
    ALTER TABLE applications ADD cover_letter NVARCHAR(MAX) NULL;
    PRINT 'Added cover_letter column';
END

-- Add qualification_type column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'qualification_type')
BEGIN
    ALTER TABLE applications ADD qualification_type NVARCHAR(50) NULL;
    PRINT 'Added qualification_type column';
END

-- Add qualification_check column (stored as JSON)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'qualification_check')
BEGIN
    ALTER TABLE applications ADD qualification_check NVARCHAR(MAX) NULL;
    PRINT 'Added qualification_check column';
END

-- Add cv_url column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'cv_url')
BEGIN
    ALTER TABLE applications ADD cv_url NVARCHAR(500) NULL;
    PRINT 'Added cv_url column';
END

-- Add certificate_url column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'certificate_url')
BEGIN
    ALTER TABLE applications ADD certificate_url NVARCHAR(500) NULL;
    PRINT 'Added certificate_url column';
END

-- Add photo_url column  
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'photo_url')
BEGIN
    ALTER TABLE applications ADD photo_url NVARCHAR(500) NULL;
    PRINT 'Added photo_url column';
END

GO

PRINT 'Migration completed successfully!';
