-- Database Migration Script
-- Adding missing qualification_type and qualification_check columns
-- Run this to fix the 500 error in application submissions

-- Add qualification_type column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'qualification_type')
BEGIN
    ALTER TABLE applications ADD qualification_type NVARCHAR(50);
END

-- Add qualification_check column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'qualification_check')
BEGIN
    ALTER TABLE applications ADD qualification_check NVARCHAR(MAX);
END

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'applications'
ORDER BY ORDINAL_POSITION;
