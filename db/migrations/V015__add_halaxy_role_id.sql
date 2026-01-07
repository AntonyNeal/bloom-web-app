-- =============================================================================
-- V015__add_halaxy_role_id.sql
-- Migration: Add halaxy_practitioner_role_id column to practitioners
-- =============================================================================

-- Add halaxy_practitioner_role_id column (stores the PractitionerRole ID from Halaxy)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'halaxy_practitioner_role_id')
BEGIN
  ALTER TABLE practitioners ADD halaxy_practitioner_role_id NVARCHAR(50) NULL;
  PRINT 'Added halaxy_practitioner_role_id column to practitioners';
END

PRINT 'V015 migration complete - halaxy_practitioner_role_id column added';
