-- =============================================================================
-- V010__add_practitioner_is_active.sql
-- Migration: Add is_active column for practitioner visibility control
-- =============================================================================
-- Controls whether a practitioner is visible on the website and can accept
-- new bookings. Defaults to 0 (inactive) - admin must explicitly activate
-- practitioners after they complete onboarding.
-- =============================================================================

-- Add is_active column (defaults to 0/inactive)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'is_active')
BEGIN
  ALTER TABLE practitioners ADD is_active BIT NOT NULL DEFAULT 0;
  PRINT 'Added is_active column to practitioners table';
END
GO

-- Add activated_at timestamp
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'activated_at')
BEGIN
  ALTER TABLE practitioners ADD activated_at DATETIME2 NULL;
  PRINT 'Added activated_at column to practitioners table';
END
GO

-- Add activated_by column (who activated the practitioner)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'activated_by')
BEGIN
  ALTER TABLE practitioners ADD activated_by NVARCHAR(100) NULL;
  PRINT 'Added activated_by column to practitioners table';
END
GO

-- Create index for active practitioners (used in website queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_practitioners_is_active' AND object_id = OBJECT_ID('practitioners'))
BEGIN
  CREATE INDEX idx_practitioners_is_active ON practitioners(is_active) WHERE is_active = 1;
  PRINT 'Created idx_practitioners_is_active index';
END
GO

PRINT 'V010: Added is_active column for practitioner visibility control';
