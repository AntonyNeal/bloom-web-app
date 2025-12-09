-- ============================================================================
-- Migration: V7__convert_to_unix_timestamps.sql
-- Description: Convert datetime columns to Unix timestamps (seconds since epoch)
-- This eliminates timezone conversion issues and stores time in a universal format
-- Author: System
-- Date: 2025-12-10
-- ============================================================================

-- Add new Unix timestamp columns to availability_slots
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='availability_slots' AND COLUMN_NAME='slot_start_unix')
BEGIN
    ALTER TABLE availability_slots ADD slot_start_unix BIGINT;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='availability_slots' AND COLUMN_NAME='slot_end_unix')
BEGIN
    ALTER TABLE availability_slots ADD slot_end_unix BIGINT;
END
GO

-- Backfill Unix timestamps from existing datetime columns
UPDATE availability_slots
SET 
    slot_start_unix = DATEDIFF(SECOND, '1970-01-01 00:00:00', slot_start),
    slot_end_unix = DATEDIFF(SECOND, '1970-01-01 00:00:00', slot_end)
WHERE slot_start_unix IS NULL OR slot_end_unix IS NULL;
GO

-- Add indexes on Unix timestamp columns for faster queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_start_unix')
BEGIN
    CREATE INDEX idx_availability_slots_start_unix ON availability_slots(slot_start_unix);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_search_unix')
BEGIN
    CREATE INDEX idx_availability_slots_search_unix ON availability_slots(
        practitioner_id,
        slot_start_unix,
        slot_end_unix,
        status
    ) WHERE status = 'free' AND is_bookable = 1;
END
GO

-- Update the view to use Unix timestamps
IF OBJECT_ID('vw_available_slots', 'V') IS NOT NULL DROP VIEW vw_available_slots;
GO

CREATE VIEW vw_available_slots AS
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
    a.last_synced_at
FROM availability_slots a
JOIN practitioners p ON a.practitioner_id = p.id
WHERE a.status = 'free'
    AND a.is_bookable = 1
    AND a.slot_start_unix > DATEDIFF(SECOND, '1970-01-01 00:00:00', GETUTCDATE()); -- Only future slots
GO

-- Note: Sessions table structure will be updated separately if needed
-- This migration focuses on availability_slots which use Unix timestamps for slot times

PRINT 'Unix timestamp migration completed successfully!';
PRINT 'Guidelines:';
PRINT '- Store all new timestamps as Unix (seconds since 1970-01-01 00:00:00 UTC)';
PRINT '- Use DATEDIFF(SECOND, ''1970-01-01 00:00:00'', GETUTCDATE()) to get current Unix time';
PRINT '- Frontend converts Unix timestamps to local time using Intl.DateTimeFormat or toLocaleString()';
PRINT '- No more timezone confusion!';
GO
