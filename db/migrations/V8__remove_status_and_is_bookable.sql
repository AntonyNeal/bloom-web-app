-- ============================================================================
-- Migration: V8__remove_status_and_is_bookable.sql
-- Description: Remove status and is_bookable columns from availability_slots
--              Slots from /Appointment/$find are all available by definition
-- Author: System
-- Date: 2025-12-12
-- ============================================================================

PRINT 'Starting migration V8: Removing status and is_bookable columns';

-- Drop the view that references these columns
IF OBJECT_ID('vw_available_slots', 'V') IS NOT NULL
BEGIN
  DROP VIEW vw_available_slots;
  PRINT '  ✓ Dropped view: vw_available_slots';
END;

-- Drop the composite filtered index that uses status and is_bookable in WHERE clause
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_search' AND object_id = OBJECT_ID('availability_slots'))
BEGIN
  DROP INDEX idx_availability_slots_search ON availability_slots;
  PRINT '  ✓ Dropped filtered index: idx_availability_slots_search';
END;

-- Drop the status index
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_status' AND object_id = OBJECT_ID('availability_slots'))
BEGIN
  DROP INDEX idx_availability_slots_status ON availability_slots;
  PRINT '  ✓ Dropped index: idx_availability_slots_status';
END;

-- Drop default constraint on status column if it exists
DECLARE @StatusConstraintName NVARCHAR(200);
SELECT @StatusConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('availability_slots') AND c.name = 'status';

IF @StatusConstraintName IS NOT NULL
BEGIN
  EXEC('ALTER TABLE availability_slots DROP CONSTRAINT [' + @StatusConstraintName + ']');
  PRINT '  ✓ Dropped default constraint on status: ' + @StatusConstraintName;
END;

-- Drop default constraint on is_bookable column if it exists
DECLARE @BookableConstraintName NVARCHAR(200);
SELECT @BookableConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('availability_slots') AND c.name = 'is_bookable';

IF @BookableConstraintName IS NOT NULL
BEGIN
  EXEC('ALTER TABLE availability_slots DROP CONSTRAINT [' + @BookableConstraintName + ']');
  PRINT '  ✓ Dropped default constraint on is_bookable: ' + @BookableConstraintName;
END;

-- Drop the status column
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'status')
BEGIN
  ALTER TABLE availability_slots DROP COLUMN status;
  PRINT '  ✓ Dropped column: status';
END;

-- Drop the is_bookable column
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'is_bookable')
BEGIN
  ALTER TABLE availability_slots DROP COLUMN is_bookable;
  PRINT '  ✓ Dropped column: is_bookable';
END;

PRINT '✅ Migration V8 completed successfully';
