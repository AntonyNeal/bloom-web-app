-- V021__add_missing_offer_token.sql
-- Migration: Add offer_token column that was missing from database

-- Add offer_token for secure offer acceptance links
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'offer_token')
BEGIN
  ALTER TABLE applications ADD offer_token NVARCHAR(100) NULL;
  PRINT 'Added offer_token column to applications';
END
GO

-- Add index for offer_token lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_applications_offer_token' AND object_id = OBJECT_ID('applications'))
BEGIN
  CREATE NONCLUSTERED INDEX IX_applications_offer_token ON applications (offer_token) WHERE offer_token IS NOT NULL;
  PRINT 'Created index IX_applications_offer_token';
END

PRINT 'V021 migration complete - offer_token column added';
