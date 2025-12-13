-- ============================================================================
-- Migration: V9__remove_datetime_columns.sql
-- Description: Remove redundant DATETIME2 columns, use Unix timestamps only
-- Author: System
-- Date: 2025-12-14
-- ============================================================================

-- Ensure Unix timestamps are populated before dropping DATETIME2 columns
UPDATE availability_slots
SET 
  slot_start_unix = DATEDIFF_BIG(SECOND, '1970-01-01', slot_start),
  slot_end_unix = DATEDIFF_BIG(SECOND, '1970-01-01', slot_end)
WHERE slot_start_unix IS NULL AND slot_start IS NOT NULL;
GO

-- Make Unix timestamp columns NOT NULL
ALTER TABLE availability_slots 
ALTER COLUMN slot_start_unix BIGINT NOT NULL;
GO

ALTER TABLE availability_slots 
ALTER COLUMN slot_end_unix BIGINT NOT NULL;
GO

-- Drop dependent indexes that reference the DATETIME2 columns
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_slot_start')
BEGIN
  DROP INDEX idx_availability_slots_slot_start ON availability_slots;
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_search')
BEGIN
  DROP INDEX idx_availability_slots_search ON availability_slots;
END
GO

-- Drop the redundant DATETIME2 columns
ALTER TABLE availability_slots DROP COLUMN slot_start;
GO

ALTER TABLE availability_slots DROP COLUMN slot_end;
GO

PRINT 'Removed redundant DATETIME2 columns. Using Unix timestamps only.';
GO
