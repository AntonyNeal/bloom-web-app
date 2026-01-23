-- ============================================================================
-- V034: Interview Analysis and Notes
-- 
-- Adds columns to store AI-generated analysis and interviewer notes
-- for candidate evaluation during the hiring process.
-- 
-- Note: Full transcripts are NOT stored for privacy reasons.
-- Transcripts are processed in-memory to generate analysis, then discarded.
-- ============================================================================

-- Add analysis columns to applications table
ALTER TABLE applications ADD
    interview_analysis NVARCHAR(MAX) NULL,             -- AI-generated candidate analysis
    interview_notes NVARCHAR(MAX) NULL,                -- Interviewer's manual notes
    interview_recommendation NVARCHAR(50) NULL,        -- strong_yes, yes, maybe, no, strong_no
    interview_analyzed_at DATETIME2 NULL;              -- When analysis was generated
GO

-- Index for finding applications with completed interviews awaiting review
CREATE INDEX IX_applications_interview_analysis 
ON applications(status, interview_analyzed_at) 
WHERE interview_analysis IS NOT NULL;
