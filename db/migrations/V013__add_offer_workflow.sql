-- =============================================================================
-- V013__add_offer_workflow.sql
-- Migration: Add offer workflow fields for candidate offers
-- =============================================================================

-- Add offer_sent_at timestamp to applications
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'offer_sent_at')
BEGIN
  ALTER TABLE applications ADD offer_sent_at DATETIME2 NULL;
  PRINT 'Added offer_sent_at column to applications';
END
GO

-- Add offer_accepted_at timestamp to applications (when candidate clicks accept)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'offer_accepted_at')
BEGIN
  ALTER TABLE applications ADD offer_accepted_at DATETIME2 NULL;
  PRINT 'Added offer_accepted_at column to applications';
END
GO

-- Add offer_token for secure offer acceptance link
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
GO

PRINT 'V013 migration complete - offer workflow fields added';
