-- Migration V012: Add missing workflow columns to applications table
-- These columns should have been added by V004 but may be missing due to migration issues
-- Using IF NOT EXISTS for idempotent operation

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

-- Add decision_reason column for recording why a decision was made
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

PRINT 'V012: Missing workflow columns migration complete';
