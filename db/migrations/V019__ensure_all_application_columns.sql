-- =============================================================================
-- V019__ensure_all_application_columns.sql
-- Migration: Ensure all required application columns exist (consolidated fix)
-- =============================================================================
-- This migration ensures all columns needed by the applications API exist
-- Uses IF NOT EXISTS for idempotent operation (safe to run multiple times)
-- =============================================================================

-- Review workflow columns (from V004/V012)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'admin_notes')
BEGIN
    ALTER TABLE applications ADD admin_notes NVARCHAR(MAX) NULL;
    PRINT 'Added admin_notes column';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_scheduled_at')
BEGIN
    ALTER TABLE applications ADD interview_scheduled_at DATETIME2 NULL;
    PRINT 'Added interview_scheduled_at column';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'interview_notes')
BEGIN
    ALTER TABLE applications ADD interview_notes NVARCHAR(MAX) NULL;
    PRINT 'Added interview_notes column';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'decision_reason')
BEGIN
    ALTER TABLE applications ADD decision_reason NVARCHAR(500) NULL;
    PRINT 'Added decision_reason column';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'waitlisted_at')
BEGIN
    ALTER TABLE applications ADD waitlisted_at DATETIME2 NULL;
    PRINT 'Added waitlisted_at column';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'accepted_at')
BEGIN
    ALTER TABLE applications ADD accepted_at DATETIME2 NULL;
    PRINT 'Added accepted_at column';
END

-- Contract columns (from V006/V018)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'contract_url')
BEGIN
    ALTER TABLE applications ADD contract_url NVARCHAR(500) NULL;
    PRINT 'Added contract_url column';
END

-- Offer workflow column (from V013)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'offer_sent_at')
BEGIN
    ALTER TABLE applications ADD offer_sent_at DATETIME2 NULL;
    PRINT 'Added offer_sent_at column';
END

PRINT 'V019 migration complete - All application columns verified';
