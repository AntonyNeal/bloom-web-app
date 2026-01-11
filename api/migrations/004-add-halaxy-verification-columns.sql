-- Migration: Add Halaxy verification columns
-- Description: Add columns to track Halaxy practitioner verification status
-- Date: 2025-01-11

-- Check if columns exist before adding them
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'practitioner_id'
)
BEGIN
    ALTER TABLE applications
    ADD practitioner_id NVARCHAR(50);
    PRINT 'Added column: practitioner_id';
END;

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'halaxy_practitioner_verified'
)
BEGIN
    ALTER TABLE applications
    ADD halaxy_practitioner_verified BIT DEFAULT 0;
    PRINT 'Added column: halaxy_practitioner_verified';
END;

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'halaxy_verified_at'
)
BEGIN
    ALTER TABLE applications
    ADD halaxy_verified_at DATETIME2;
    PRINT 'Added column: halaxy_verified_at';
END;

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'halaxy_account_id'
)
BEGIN
    ALTER TABLE applications
    ADD halaxy_account_id NVARCHAR(MAX);
    PRINT 'Added column: halaxy_account_id';
END;

PRINT 'Migration 004 completed successfully';
