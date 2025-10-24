-- Quick Database Fix for Application Submission
-- This adds the missing columns that the function is trying to use

-- Add qualification_type column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'qualification_type')
BEGIN
    ALTER TABLE applications ADD qualification_type NVARCHAR(50);
    PRINT 'Added qualification_type column';
END
ELSE
BEGIN
    PRINT 'qualification_type column already exists';
END

-- Add qualification_check column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'qualification_check')
BEGIN
    ALTER TABLE applications ADD qualification_check NVARCHAR(MAX);
    PRINT 'Added qualification_check column';
END
ELSE
BEGIN
    PRINT 'qualification_check column already exists';
END

-- Verify columns exist
SELECT 'Applications table columns:' as Info;
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'applications'
ORDER BY ORDINAL_POSITION;
