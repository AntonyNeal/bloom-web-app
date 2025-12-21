-- =============================================================================
-- V002__add_missing_application_columns.sql
-- Migration: Add missing columns to applications table
-- =============================================================================
-- This migration adds columns that may be missing from older database setups
-- Uses IF NOT EXISTS pattern for idempotency
-- =============================================================================

-- Add cover_letter column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'cover_letter')
BEGIN
  ALTER TABLE applications ADD cover_letter NVARCHAR(MAX) NULL;
  PRINT 'Added cover_letter column';
END
GO

-- Add qualification_type column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'qualification_type')
BEGIN
  ALTER TABLE applications ADD qualification_type NVARCHAR(50) NULL;
  PRINT 'Added qualification_type column';
END
GO

-- Add qualification_check column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'qualification_check')
BEGIN
  ALTER TABLE applications ADD qualification_check NVARCHAR(MAX) NULL;
  PRINT 'Added qualification_check column';
END
GO

-- Add photo_url column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'photo_url')
BEGIN
  ALTER TABLE applications ADD photo_url NVARCHAR(500) NULL;
  PRINT 'Added photo_url column';
END
GO

-- Add cv_url column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'cv_url')
BEGIN
  ALTER TABLE applications ADD cv_url NVARCHAR(500) NULL;
  PRINT 'Added cv_url column';
END
GO

-- Add certificate_url column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'certificate_url')
BEGIN
  ALTER TABLE applications ADD certificate_url NVARCHAR(500) NULL;
  PRINT 'Added certificate_url column';
END
GO

PRINT 'V002: Missing application columns migration completed';
