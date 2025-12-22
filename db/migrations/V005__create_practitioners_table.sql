-- =============================================================================
-- V005__create_practitioners_table.sql
-- Migration: Extend practitioners table for onboarding workflow
-- =============================================================================
-- The practitioners table already exists (from Halaxy sync). This migration
-- adds columns needed for the application/onboarding workflow.
-- =============================================================================

-- Add application_id column to link to applications
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'application_id')
BEGIN
  ALTER TABLE practitioners ADD application_id INT NULL;
  PRINT 'Added application_id column';
END
GO

-- Add ahpra_number column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'ahpra_number')
BEGIN
  ALTER TABLE practitioners ADD ahpra_number NVARCHAR(50) NULL;
  PRINT 'Added ahpra_number column';
END
GO

-- Add specializations column (JSON array, different from existing specialization)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'specializations')
BEGIN
  ALTER TABLE practitioners ADD specializations NVARCHAR(MAX) NULL;
  PRINT 'Added specializations column';
END
GO

-- Add experience_years column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'experience_years')
BEGIN
  ALTER TABLE practitioners ADD experience_years INT NULL;
  PRINT 'Added experience_years column';
END
GO

-- Add profile_photo_url column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'profile_photo_url')
BEGIN
  ALTER TABLE practitioners ADD profile_photo_url NVARCHAR(500) NULL;
  PRINT 'Added profile_photo_url column';
END
GO

-- Add password_hash column for auth
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'password_hash')
BEGIN
  ALTER TABLE practitioners ADD password_hash NVARCHAR(255) NULL;
  PRINT 'Added password_hash column';
END
GO

-- Add onboarding_token column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'onboarding_token')
BEGIN
  ALTER TABLE practitioners ADD onboarding_token NVARCHAR(100) NULL;
  PRINT 'Added onboarding_token column';
END
GO

-- Add onboarding_token_expires_at column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'onboarding_token_expires_at')
BEGIN
  ALTER TABLE practitioners ADD onboarding_token_expires_at DATETIME2 NULL;
  PRINT 'Added onboarding_token_expires_at column';
END
GO

-- Add onboarding_completed_at column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'onboarding_completed_at')
BEGIN
  ALTER TABLE practitioners ADD onboarding_completed_at DATETIME2 NULL;
  PRINT 'Added onboarding_completed_at column';
END
GO

-- Add practitioner_id to applications table for linking
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'practitioner_id')
BEGIN
  ALTER TABLE applications ADD practitioner_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added practitioner_id column to applications';
END
GO

-- Create index for onboarding token lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_practitioners_onboarding_token' AND object_id = OBJECT_ID('practitioners'))
BEGIN
  CREATE INDEX idx_practitioners_onboarding_token ON practitioners(onboarding_token) WHERE onboarding_token IS NOT NULL;
  PRINT 'Created idx_practitioners_onboarding_token index';
END
GO

-- Create index for application_id lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_practitioners_application_id' AND object_id = OBJECT_ID('practitioners'))
BEGIN
  CREATE INDEX idx_practitioners_application_id ON practitioners(application_id) WHERE application_id IS NOT NULL;
  PRINT 'Created idx_practitioners_application_id index';
END
GO

PRINT 'V005: Practitioners table extended for onboarding workflow';

PRINT 'V005: Practitioners table created successfully';
