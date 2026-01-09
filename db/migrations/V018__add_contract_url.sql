-- =============================================================================
-- V018__add_contract_url.sql
-- Migration: Add contract_url field for admin-uploaded contract templates
-- =============================================================================

-- Add contract_url to applications (stores URL to admin's contract template PDF)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'contract_url')
BEGIN
  ALTER TABLE applications ADD contract_url NVARCHAR(500) NULL;
  PRINT 'Added contract_url column to applications';
END

PRINT 'V018 migration complete - contract_url field added';
