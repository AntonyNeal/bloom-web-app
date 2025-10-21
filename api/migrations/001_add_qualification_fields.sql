-- Migration script to add qualification fields to applications table
-- Run this against lpa-applications-db

-- Check if columns already exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'qualification_type')
BEGIN
  ALTER TABLE applications
  ADD qualification_type NVARCHAR(50) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'qualification_check')
BEGIN
  ALTER TABLE applications
  ADD qualification_check NVARCHAR(MAX) NULL;
END;

PRINT 'Migration completed successfully';
