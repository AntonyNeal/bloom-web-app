-- =============================================================================
-- V006__add_contract_fields.sql
-- Migration: Add contract fields for practitioner agreements
-- =============================================================================

-- Add contract_url to applications (stores URL to uploaded contract PDF)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'contract_url')
BEGIN
  ALTER TABLE applications ADD contract_url NVARCHAR(500) NULL;
  PRINT 'Added contract_url column to applications';
END

-- Add contract acceptance fields to practitioners
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'contract_accepted_at')
BEGIN
  ALTER TABLE practitioners ADD contract_accepted_at DATETIME2 NULL;
  PRINT 'Added contract_accepted_at column to practitioners';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'contract_version')
BEGIN
  ALTER TABLE practitioners ADD contract_version NVARCHAR(50) NULL;
  PRINT 'Added contract_version column to practitioners';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'contract_ip_address')
BEGIN
  ALTER TABLE practitioners ADD contract_ip_address NVARCHAR(50) NULL;
  PRINT 'Added contract_ip_address column to practitioners';
END

PRINT 'V006 migration complete - contract fields added';
