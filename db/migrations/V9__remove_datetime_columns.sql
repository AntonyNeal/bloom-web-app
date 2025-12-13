-- ============================================================================
-- Migration: V9__remove_datetime_columns.sql
-- Description: Remove redundant DATETIME2 columns, use Unix timestamps only
-- Author: System
-- Date: 2025-12-14
-- ============================================================================

-- Check if DATETIME2 columns exist before trying to use them
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='availability_slots' AND COLUMN_NAME='slot_start')
BEGIN
  -- Ensure Unix timestamps are populated before dropping DATETIME2 columns
  UPDATE availability_slots
  SET 
    slot_start_unix = DATEDIFF_BIG(SECOND, '1970-01-01', slot_start),
    slot_end_unix = DATEDIFF_BIG(SECOND, '1970-01-01', slot_end)
  WHERE slot_start_unix IS NULL AND slot_start IS NOT NULL;
  
  PRINT 'Populated Unix timestamps from DATETIME2 columns';
END
ELSE
BEGIN
  PRINT 'DATETIME2 columns already removed, skipping backfill';
END
GO

-- Drop dependent views first
IF OBJECT_ID('vw_all_slots', 'V') IS NOT NULL 
BEGIN
  DROP VIEW vw_all_slots;
  PRINT 'Dropped view vw_all_slots';
END
GO

-- Drop indexes that reference the DATETIME2 columns
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_slot_start')
BEGIN
  DROP INDEX idx_availability_slots_slot_start ON availability_slots;
  PRINT 'Dropped index idx_availability_slots_slot_start';
END
GO

-- Drop the redundant DATETIME2 columns if they exist
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='availability_slots' AND COLUMN_NAME='slot_start')
BEGIN
  ALTER TABLE availability_slots DROP COLUMN slot_start;
  PRINT 'Dropped column slot_start';
END
GO

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='availability_slots' AND COLUMN_NAME='slot_end')
BEGIN
  ALTER TABLE availability_slots DROP COLUMN slot_end;
  PRINT 'Dropped column slot_end';
END
GO

-- Make Unix timestamp columns NOT NULL
ALTER TABLE availability_slots 
ALTER COLUMN slot_start_unix BIGINT NOT NULL;
GO

ALTER TABLE availability_slots 
ALTER COLUMN slot_end_unix BIGINT NOT NULL;
GO

-- Recreate index on Unix timestamp column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_slot_start_unix')
BEGIN
  CREATE INDEX idx_availability_slots_slot_start_unix ON availability_slots(slot_start_unix);
  PRINT 'Created index idx_availability_slots_slot_start_unix';
END
GO

-- Recreate view using Unix timestamps
CREATE VIEW vw_all_slots AS
SELECT
  a.id,
  a.halaxy_slot_id,
  a.practitioner_id,
  p.first_name AS practitioner_first_name,
  p.last_name AS practitioner_last_name,
  p.halaxy_practitioner_id,
  a.slot_start_unix,
  a.slot_end_unix,
  a.duration_minutes,
  a.status,
  a.location_type,
  a.service_category,
  a.is_bookable,
  a.is_booked,
  a.booked_at,
  a.booking_reference,
  a.last_synced_at,
  a.created_at,
  a.updated_at
FROM availability_slots a
JOIN practitioners p ON a.practitioner_id = p.id
WHERE a.slot_start_unix > DATEDIFF_BIG(SECOND, '1970-01-01', DATEADD(DAY, -7, GETUTCDATE()));
GO

PRINT 'Removed redundant DATETIME2 columns. Using Unix timestamps only.';
GO
