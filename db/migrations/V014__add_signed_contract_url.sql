-- =============================================================================
-- V014__add_signed_contract_url.sql
-- Migration: Add signed_contract_url field for applicant-signed contracts
-- =============================================================================

-- Add signed_contract_url to applications (stores URL to applicant's signed contract PDF)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'signed_contract_url')
BEGIN
  ALTER TABLE applications ADD signed_contract_url NVARCHAR(500) NULL;
  PRINT 'Added signed_contract_url column to applications';
END

PRINT 'V014 migration complete - signed_contract_url field added';
