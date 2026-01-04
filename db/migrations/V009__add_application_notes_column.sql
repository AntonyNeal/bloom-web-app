-- V009__add_application_notes_column.sql
-- Add internal_notes column to applications table for admin use
-- This is a test migration to verify the CI/CD migration system works
-- Created: 2026-01-04

-- Add internal notes column to applications (for admin comments during review)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('applications') 
    AND name = 'internal_notes'
)
BEGIN
    ALTER TABLE applications
    ADD internal_notes NVARCHAR(MAX) NULL;
    
    PRINT 'Added internal_notes column to applications table';
END
GO
