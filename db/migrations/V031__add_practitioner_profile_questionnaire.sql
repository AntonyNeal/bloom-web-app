-- =============================================================================
-- V031__add_practitioner_profile_questionnaire.sql
-- Migration: Add fields to store practitioner onboarding questionnaire answers
-- =============================================================================
-- These fields capture structured answers from practitioners during onboarding.
-- Admin/AI uses these to generate SEO-friendly profile content.
-- =============================================================================

-- Add qualification details (e.g., "MPsych (Clinical)", "MAPS", "AAPi")
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'qualification_details')
BEGIN
    ALTER TABLE practitioners ADD qualification_details NVARCHAR(MAX) NULL;
    PRINT 'Added qualification_details column (JSON array)';
END
GO

-- Add registration type (Clinical, Counselling, Educational, etc.)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'registration_type')
BEGIN
    ALTER TABLE practitioners ADD registration_type NVARCHAR(100) NULL;
    PRINT 'Added registration_type column';
END
GO

-- What do you help people with? (feeds areas_of_focus)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'helps_with')
BEGIN
    ALTER TABLE practitioners ADD helps_with NVARCHAR(MAX) NULL;
    PRINT 'Added helps_with column (JSON array)';
END
GO

-- What therapeutic approaches do you use?
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'therapeutic_approaches')
BEGIN
    ALTER TABLE practitioners ADD therapeutic_approaches NVARCHAR(MAX) NULL;
    PRINT 'Added therapeutic_approaches column (JSON array)';
END
GO

-- What age groups do you work with?
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'age_groups')
BEGIN
    ALTER TABLE practitioners ADD age_groups NVARCHAR(MAX) NULL;
    PRINT 'Added age_groups column (JSON array)';
END
GO

-- What drew you to psychology? (free text for bio generation)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'why_psychology')
BEGIN
    ALTER TABLE practitioners ADD why_psychology NVARCHAR(MAX) NULL;
    PRINT 'Added why_psychology column';
END
GO

-- What do you find most rewarding about your work? (free text)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'most_rewarding')
BEGIN
    ALTER TABLE practitioners ADD most_rewarding NVARCHAR(MAX) NULL;
    PRINT 'Added most_rewarding column';
END
GO

-- How would you describe your therapeutic style? (free text)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'therapeutic_style')
BEGIN
    ALTER TABLE practitioners ADD therapeutic_style NVARCHAR(MAX) NULL;
    PRINT 'Added therapeutic_style column';
END
GO

-- Any special populations or areas of particular expertise?
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'special_expertise')
BEGIN
    ALTER TABLE practitioners ADD special_expertise NVARCHAR(MAX) NULL;
    PRINT 'Added special_expertise column';
END
GO

-- Outside of work interests (humanizes the profile)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'outside_interests')
BEGIN
    ALTER TABLE practitioners ADD outside_interests NVARCHAR(MAX) NULL;
    PRINT 'Added outside_interests column';
END
GO

-- Profile questionnaire completed flag
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'profile_questionnaire_completed_at')
BEGIN
    ALTER TABLE practitioners ADD profile_questionnaire_completed_at DATETIME2 NULL;
    PRINT 'Added profile_questionnaire_completed_at column';
END
GO

PRINT 'V031 migration complete - practitioner profile questionnaire fields added';
