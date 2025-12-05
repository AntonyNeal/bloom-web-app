-- ============================================================================
-- Migration: V6__add_is_booked_field.sql
-- Description: Add is_booked field to availability_slots for explicit booking state
-- Author: System
-- Date: 2025-12-06
-- ============================================================================

-- ============================================================================
-- ADD is_booked COLUMN
-- Explicit indicator when a slot has been booked (separate from status)
-- ============================================================================
IF NOT EXISTS (
  SELECT 1 FROM sys.columns 
  WHERE object_id = OBJECT_ID('availability_slots') 
  AND name = 'is_booked'
)
BEGIN
  ALTER TABLE availability_slots 
  ADD is_booked BIT NOT NULL DEFAULT 0;
  
  PRINT 'Added is_booked column to availability_slots';
END
ELSE
BEGIN
  PRINT 'is_booked column already exists';
END
GO

-- ============================================================================
-- ADD booked_at TIMESTAMP
-- Track when the slot was booked
-- ============================================================================
IF NOT EXISTS (
  SELECT 1 FROM sys.columns 
  WHERE object_id = OBJECT_ID('availability_slots') 
  AND name = 'booked_at'
)
BEGIN
  ALTER TABLE availability_slots 
  ADD booked_at DATETIME2 NULL;
  
  PRINT 'Added booked_at column to availability_slots';
END
ELSE
BEGIN
  PRINT 'booked_at column already exists';
END
GO

-- ============================================================================
-- ADD booking_reference
-- Optional reference to the booking that claimed this slot
-- ============================================================================
IF NOT EXISTS (
  SELECT 1 FROM sys.columns 
  WHERE object_id = OBJECT_ID('availability_slots') 
  AND name = 'booking_reference'
)
BEGIN
  ALTER TABLE availability_slots 
  ADD booking_reference NVARCHAR(100) NULL;
  
  PRINT 'Added booking_reference column to availability_slots';
END
ELSE
BEGIN
  PRINT 'booking_reference column already exists';
END
GO

-- ============================================================================
-- CREATE INDEX for is_booked queries
-- ============================================================================
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes 
  WHERE name = 'idx_availability_slots_is_booked' 
  AND object_id = OBJECT_ID('availability_slots')
)
BEGIN
  CREATE INDEX idx_availability_slots_is_booked ON availability_slots(is_booked);
  PRINT 'Created index idx_availability_slots_is_booked';
END
GO

-- ============================================================================
-- UPDATE VIEW: Include is_booked in available slots view
-- Now excludes booked slots
-- ============================================================================
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
  a.slot_start,
  a.slot_end,
  a.duration_minutes,
  a.status,
  a.location_type,
  a.service_category,
  a.is_bookable,
  a.is_booked,
  a.booked_at,
  a.booking_reference,
  a.last_synced_at
FROM availability_slots a
JOIN practitioners p ON a.practitioner_id = p.id
WHERE a.status = 'free'
  AND a.is_bookable = 1
  AND a.is_booked = 0  -- Exclude booked slots
  AND a.slot_start > GETUTCDATE(); -- Only future slots
GO

-- ============================================================================
-- CREATE VIEW: All slots including booked (for admin/reporting)
-- ============================================================================
IF OBJECT_ID('vw_all_slots', 'V') IS NOT NULL DROP VIEW vw_all_slots;
GO

CREATE VIEW vw_all_slots AS
SELECT 
  a.id,
  a.halaxy_slot_id,
  a.practitioner_id,
  p.first_name AS practitioner_first_name,
  p.last_name AS practitioner_last_name,
  p.halaxy_practitioner_id,
  a.slot_start,
  a.slot_end,
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
WHERE a.slot_start > DATEADD(DAY, -7, GETUTCDATE()); -- Include recent past slots for reporting
GO

PRINT 'V6 migration completed: Added is_booked field and updated views';
