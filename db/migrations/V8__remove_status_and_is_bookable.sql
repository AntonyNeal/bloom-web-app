-- ============================================================================
-- Migration: V8__remove_status_and_is_bookable.sql
-- Description: Remove status and is_bookable columns from availability_slots
--              Slots from /Appointment/$find are all available by definition
-- Author: System
-- Date: 2025-12-12
-- ============================================================================

PRINT 'Starting migration V8: Removing status and is_bookable columns';

-- Drop the view that references these columns
PRINT '🔍 Checking for view vw_available_slots...';
IF OBJECT_ID('vw_available_slots', 'V') IS NOT NULL
BEGIN
  PRINT '  🗑️  Dropping view: vw_available_slots';
  DROP VIEW vw_available_slots;
  PRINT '  ✅ Dropped view: vw_available_slots';
END
ELSE
BEGIN
  PRINT '  ⏭️  View does not exist, skipping';
END;

-- Drop the composite filtered index that uses status and is_bookable in WHERE clause
PRINT '🔍 Checking for composite index idx_availability_slots_search...';
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_search' AND object_id = OBJECT_ID('availability_slots'))
BEGIN
  PRINT '  🗑️  Dropping filtered index: idx_availability_slots_search';
  DROP INDEX idx_availability_slots_search ON availability_slots;
  PRINT '  ✅ Dropped filtered index: idx_availability_slots_search';
END
ELSE
BEGIN
  PRINT '  ⏭️  Index does not exist, skipping';
END;

-- Drop the status index
PRINT '🔍 Checking for index idx_availability_slots_status...';
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_status' AND object_id = OBJECT_ID('availability_slots'))
BEGIN
  PRINT '  🗑️  Dropping index: idx_availability_slots_status';
  DROP INDEX idx_availability_slots_status ON availability_slots;
  PRINT '  ✅ Dropped index: idx_availability_slots_status';
END
ELSE
BEGIN
  PRINT '  ⏭️  Index does not exist, skipping';
END;

-- Drop default constraint on status column if it exists
PRINT '🔍 Checking for default constraint on status column...';
DECLARE @StatusConstraintName NVARCHAR(200);
SELECT @StatusConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('availability_slots') AND c.name = 'status';

IF @StatusConstraintName IS NOT NULL
BEGIN
  PRINT '  🗑️  Dropping default constraint: ' + @StatusConstraintName;
  EXEC('ALTER TABLE availability_slots DROP CONSTRAINT [' + @StatusConstraintName + ']');
  PRINT '  ✅ Dropped default constraint on status: ' + @StatusConstraintName;
END
ELSE
BEGIN
  PRINT '  ⏭️  No default constraint found, skipping';
END;

-- Drop default constraint on is_bookable column if it exists
PRINT '🔍 Checking for default constraint on is_bookable column...';
DECLARE @BookableConstraintName NVARCHAR(200);
SELECT @BookableConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.object_id = OBJECT_ID('availability_slots') AND c.name = 'is_bookable';

IF @BookableConstraintName IS NOT NULL
BEGIN
  PRINT '  🗑️  Dropping default constraint: ' + @BookableConstraintName;
  EXEC('ALTER TABLE availability_slots DROP CONSTRAINT [' + @BookableConstraintName + ']');
  PRINT '  ✅ Dropped default constraint on is_bookable: ' + @BookableConstraintName;
END
ELSE
BEGIN
  PRINT '  ⏭️  No default constraint found, skipping';
END;

-- Drop the status column
PRINT '🔍 Checking for status column...';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'status')
BEGIN
  PRINT '  🗑️  Attempting to drop column: status';
  ALTER TABLE availability_slots DROP COLUMN status;
  PRINT '  ✅ Dropped column: status';
END
ELSE
BEGIN
  PRINT '  ⏭️  Column does not exist, skipping';
END;

-- Drop the is_bookable column
PRINT '🔍 Checking for is_bookable column...';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'is_bookable')
BEGIN
  PRINT '  🗑️  Attempting to drop column: is_bookable';
  ALTER TABLE availability_slots DROP COLUMN is_bookable;
  PRINT '  ✅ Dropped column: is_bookable';
END
ELSE
BEGIN
  PRINT '  ⏭️  Column does not exist, skipping';
END;

PRINT '✅ Migration V8 completed successfully';
