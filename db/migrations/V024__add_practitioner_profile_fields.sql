-- V024: Add profile fields to practitioners table
-- These fields are used during onboarding and profile display

-- Add AHPRA registration number
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'ahpra_number')
BEGIN
    ALTER TABLE practitioners ADD ahpra_number NVARCHAR(50);
    PRINT 'Added ahpra_number column';
END
GO

-- Add specializations (JSON array)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'specializations')
BEGIN
    ALTER TABLE practitioners ADD specializations NVARCHAR(MAX);
    PRINT 'Added specializations column';
END
GO

-- Add years of experience
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'experience_years')
BEGIN
    ALTER TABLE practitioners ADD experience_years INT;
    PRINT 'Added experience_years column';
END
GO

-- Add profile photo URL
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'profile_photo_url')
BEGIN
    ALTER TABLE practitioners ADD profile_photo_url NVARCHAR(500);
    PRINT 'Added profile_photo_url column';
END
GO

PRINT 'V024 migration complete - practitioner profile fields added';
