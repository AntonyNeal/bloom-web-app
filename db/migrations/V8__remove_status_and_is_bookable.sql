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

GO

-- Drop indexes on status column (before statistics)
PRINT '🔍 Checking for indexes on status column...';
DECLARE @StatusIndexName NVARCHAR(200);
DECLARE status_index_cursor CURSOR FOR
SELECT i.name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('availability_slots')
  AND c.name = 'status'
  AND i.name IS NOT NULL
  AND i.is_primary_key = 0
  AND i.is_unique_constraint = 0;

OPEN status_index_cursor;
FETCH NEXT FROM status_index_cursor INTO @StatusIndexName;

WHILE @@FETCH_STATUS = 0
BEGIN
  PRINT '  🗑️  Dropping index: ' + @StatusIndexName;
  EXEC('DROP INDEX [' + @StatusIndexName + '] ON availability_slots');
  PRINT '  ✅ Dropped index: ' + @StatusIndexName;
  FETCH NEXT FROM status_index_cursor INTO @StatusIndexName;
END;

CLOSE status_index_cursor;
DEALLOCATE status_index_cursor;

-- Drop statistics on status column
PRINT '🔍 Checking for statistics on status column...';
DECLARE @StatusColumnId INT = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'status');
DECLARE @StatsName NVARCHAR(200);
DECLARE stats_cursor CURSOR FOR
SELECT s.name
FROM sys.stats s
INNER JOIN sys.stats_columns sc ON s.object_id = sc.object_id AND s.stats_id = sc.stats_id
LEFT JOIN sys.indexes i ON s.object_id = i.object_id AND s.name = i.name
WHERE s.object_id = OBJECT_ID('availability_slots')
  AND sc.column_id = @StatusColumnId
  AND i.index_id IS NULL;  -- Only get statistics, not indexes

OPEN stats_cursor;
FETCH NEXT FROM stats_cursor INTO @StatsName;

WHILE @@FETCH_STATUS = 0
BEGIN
  PRINT '  🗑️  Dropping statistic: ' + @StatsName;
  EXEC('DROP STATISTICS availability_slots.[' + @StatsName + ']');
  PRINT '  ✅ Dropped statistic: ' + @StatsName;
  FETCH NEXT FROM stats_cursor INTO @StatsName;
END;

CLOSE stats_cursor;
DEALLOCATE stats_cursor;

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

GO

-- Drop indexes on is_bookable column (before statistics)
PRINT '🔍 Checking for indexes on is_bookable column...';
DECLARE @BookableIndexName NVARCHAR(200);
DECLARE bookable_index_cursor CURSOR FOR
SELECT i.name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('availability_slots')
  AND c.name = 'is_bookable'
  AND i.name IS NOT NULL
  AND i.is_primary_key = 0
  AND i.is_unique_constraint = 0;

OPEN bookable_index_cursor;
FETCH NEXT FROM bookable_index_cursor INTO @BookableIndexName;

WHILE @@FETCH_STATUS = 0
BEGIN
  PRINT '  🗑️  Dropping index: ' + @BookableIndexName;
  EXEC('DROP INDEX [' + @BookableIndexName + '] ON availability_slots');
  PRINT '  ✅ Dropped index: ' + @BookableIndexName;
  FETCH NEXT FROM bookable_index_cursor INTO @BookableIndexName;
END;

CLOSE bookable_index_cursor;
DEALLOCATE bookable_index_cursor;

-- Drop statistics on is_bookable column
PRINT '🔍 Checking for statistics on is_bookable column...';
DECLARE @BookableColumnId INT = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('availability_slots') AND name = 'is_bookable');
DECLARE @BookableStatsName NVARCHAR(200);
DECLARE bookable_stats_cursor CURSOR FOR
SELECT s.name
FROM sys.stats s
INNER JOIN sys.stats_columns sc ON s.object_id = sc.object_id AND s.stats_id = sc.stats_id
LEFT JOIN sys.indexes i ON s.object_id = i.object_id AND s.name = i.name
WHERE s.object_id = OBJECT_ID('availability_slots')
  AND sc.column_id = @BookableColumnId
  AND i.index_id IS NULL;  -- Only get statistics, not indexes

OPEN bookable_stats_cursor;
FETCH NEXT FROM bookable_stats_cursor INTO @BookableStatsName;

WHILE @@FETCH_STATUS = 0
BEGIN
  PRINT '  🗑️  Dropping statistic: ' + @BookableStatsName;
  EXEC('DROP STATISTICS availability_slots.[' + @BookableStatsName + ']');
  PRINT '  ✅ Dropped statistic: ' + @BookableStatsName;
  FETCH NEXT FROM bookable_stats_cursor INTO @BookableStatsName;
END;

CLOSE bookable_stats_cursor;
DEALLOCATE bookable_stats_cursor;

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

GO

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
