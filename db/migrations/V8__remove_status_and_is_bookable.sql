-- ============================================================================
-- Migration: V8__remove_status_and_is_bookable.sql
-- Description: Remove status and is_bookable columns from availability_slots
--              Slots from /Appointment/$find are all available by definition
-- Author: System
-- Date: 2025-12-12
-- ============================================================================

PRINT 'Starting migration V8: Removing status and is_bookable columns';

-- Drop the status index if it exists
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_availability_slots_status' AND object_id = OBJECT_ID('availability_slots'))
BEGIN
  DROP INDEX idx_availability_slots_status ON availability_slots;
  PRINT '  ✓ Dropped index idx_availability_slots_status';
END;

-- Drop any statistics on status column
DECLARE @StatsName NVARCHAR(200);
DECLARE stats_cursor CURSOR FOR
SELECT s.name
FROM sys.stats s
INNER JOIN sys.stats_columns sc ON s.object_id = sc.object_id AND s.stats_id = sc.stats_id
INNER JOIN sys.columns c ON sc.object_id = c.object_id AND sc.column_id = c.column_id
WHERE s.object_id = OBJECT_ID('availability_slots') 
  AND c.name IN ('status', 'is_bookable')
  AND s.user_created = 1;

OPEN stats_cursor;
FETCH NEXT FROM stats_cursor INTO @StatsName;

WHILE @@FETCH_STATUS = 0
BEGIN
  EXEC('DROP STATISTICS availability_slots.[' + @StatsName + ']');
  PRINT '  ✓ Dropped statistics: ' + @StatsName;
  FETCH NEXT FROM stats_cursor INTO @StatsName;
END;

CLOSE stats_cursor;
DEALLOCATE stats_cursor;

-- Drop any check constraints
DECLARE @CheckConstraintName NVARCHAR(200);
DECLARE check_cursor CURSOR FOR
SELECT cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('availability_slots');

OPEN check_cursor;
FETCH NEXT FROM check_cursor INTO @CheckConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
  EXEC('ALTER TABLE availability_slots DROP CONSTRAINT [' + @CheckConstraintName + ']');
  PRINT '  ✓ Dropped check constraint: ' + @CheckConstraintName;
  FETCH NEXT FROM check_cursor INTO @CheckConstraintName;
END;

CLOSE check_cursor;
DEALLOCATE check_cursor;

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

-- Now try to drop the status column
BEGIN TRY
  IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'status')
  BEGIN
    ALTER TABLE availability_slots DROP COLUMN status;
    PRINT '  ✓ Dropped column: status';
  END;
END TRY
BEGIN CATCH
  PRINT '  ⚠ Could not drop status column: ' + ERROR_MESSAGE();
  PRINT '  Trying to identify blocking dependencies...';
  
  -- Show what's blocking
  SELECT 
    'Blocking object: ' + OBJECT_NAME(referencing_id) + ' (Type: ' + o.type_desc + ')'
  FROM sys.sql_expression_dependencies sed
  INNER JOIN sys.objects o ON sed.referencing_id = o.object_id
  WHERE sed.referenced_id = OBJECT_ID('availability_slots')
    AND sed.referenced_minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'status');
  
  THROW;
END CATCH;

-- Drop the is_bookable column
BEGIN TRY
  IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'is_bookable')
  BEGIN
    ALTER TABLE availability_slots DROP COLUMN is_bookable;
    PRINT '  ✓ Dropped column: is_bookable';
  END;
END TRY
BEGIN CATCH
  PRINT '  ⚠ Could not drop is_bookable column: ' + ERROR_MESSAGE();
  THROW;
END CATCH;

PRINT '✅ Migration V8 completed successfully';
