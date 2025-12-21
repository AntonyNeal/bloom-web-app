-- Migration: 004_add_application_review_workflow.sql
-- Epic 1.1: Add new application statuses and admin review fields
-- Sprint: December 2025
-- 
-- New statuses: denied, waitlisted, interview_scheduled, accepted
-- New columns: admin_notes, interview_scheduled_at, interview_notes
--
-- Note: Status column uses NVARCHAR without a constraint currently.
-- Valid statuses after migration: submitted, reviewing, denied, waitlisted, 
--                                 interview_scheduled, accepted, approved, rejected (legacy)

-- Add admin_notes column for recording review decisions
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'admin_notes')
BEGIN
    ALTER TABLE applications ADD admin_notes NVARCHAR(MAX) NULL;
    PRINT 'Added admin_notes column';
END
GO

-- Add interview_scheduled_at column for tracking interview date/time
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_scheduled_at')
BEGIN
    ALTER TABLE applications ADD interview_scheduled_at DATETIME2 NULL;
    PRINT 'Added interview_scheduled_at column';
END
GO

-- Add interview_notes column for recording interview feedback
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_notes')
BEGIN
    ALTER TABLE applications ADD interview_notes NVARCHAR(MAX) NULL;
    PRINT 'Added interview_notes column';
END
GO

-- Add decision_reason column for recording why a decision was made (useful for auditing)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'decision_reason')
BEGIN
    ALTER TABLE applications ADD decision_reason NVARCHAR(500) NULL;
    PRINT 'Added decision_reason column';
END
GO

-- Add waitlisted_at timestamp for tracking when an application was waitlisted
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'waitlisted_at')
BEGIN
    ALTER TABLE applications ADD waitlisted_at DATETIME2 NULL;
    PRINT 'Added waitlisted_at column';
END
GO

-- Add accepted_at timestamp for tracking when an application was accepted
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'accepted_at')
BEGIN
    ALTER TABLE applications ADD accepted_at DATETIME2 NULL;
    PRINT 'Added accepted_at column';
END
GO

-- Create index on interview_scheduled_at for efficient queries on upcoming interviews
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_interview_scheduled_at' AND object_id = OBJECT_ID('applications'))
BEGIN
    CREATE INDEX idx_interview_scheduled_at ON applications(interview_scheduled_at) WHERE interview_scheduled_at IS NOT NULL;
    PRINT 'Created index idx_interview_scheduled_at';
END
GO

-- Verification query - run this to confirm migration was successful
-- SELECT 
--     c.name AS column_name,
--     t.name AS data_type,
--     c.max_length,
--     c.is_nullable
-- FROM sys.columns c
-- JOIN sys.types t ON c.user_type_id = t.user_type_id
-- WHERE c.object_id = OBJECT_ID('applications')
-- AND c.name IN ('admin_notes', 'interview_scheduled_at', 'interview_notes', 'decision_reason', 'waitlisted_at', 'accepted_at');

PRINT 'Migration 004_add_application_review_workflow completed successfully';
