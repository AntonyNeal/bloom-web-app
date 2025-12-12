-- ============================================================================
-- Migration: V8__remove_status_and_is_bookable.sql
-- Description: Remove status and is_bookable columns from availability_slots
--              Slots from /Appointment/$find are all available by definition
-- Author: System
-- Date: 2025-12-12
-- ============================================================================

-- Drop the status index first
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_status')
BEGIN
  DROP INDEX idx_availability_slots_status ON availability_slots;
  PRINT 'Dropped index idx_availability_slots_status';
END
GO

-- Drop the status column
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'status')
BEGIN
  ALTER TABLE availability_slots DROP COLUMN status;
  PRINT 'Dropped column status from availability_slots';
END
GO

-- Drop the is_bookable column
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'is_bookable')
BEGIN
  ALTER TABLE availability_slots DROP COLUMN is_bookable;
  PRINT 'Dropped column is_bookable from availability_slots';
END
GO

PRINT 'Migration V8 completed: Removed status and is_bookable columns';
GO
