-- ============================================================================
-- V034: Interview Analysis and Notes
-- 
-- Adds columns to store AI-generated analysis and interviewer notes
-- for candidate evaluation during the hiring process.
-- 
-- Note: Full transcripts are NOT stored for privacy reasons.
-- Transcripts are processed in-memory to generate analysis, then discarded.
-- ============================================================================

-- Add analysis columns to applications table (with existence checks)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_analysis')
BEGIN
    ALTER TABLE applications ADD interview_analysis NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_notes')
BEGIN
    ALTER TABLE applications ADD interview_notes NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_recommendation')
BEGIN
    ALTER TABLE applications ADD interview_recommendation NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_analyzed_at')
BEGIN
    ALTER TABLE applications ADD interview_analyzed_at DATETIME2 NULL;
END
GO

-- Index for finding applications with completed interviews awaiting review
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_applications_interview_analysis' AND object_id = OBJECT_ID('applications'))
BEGIN
    CREATE INDEX IX_applications_interview_analysis 
    ON applications(status, interview_analyzed_at) 
    WHERE interview_analysis IS NOT NULL;
END
