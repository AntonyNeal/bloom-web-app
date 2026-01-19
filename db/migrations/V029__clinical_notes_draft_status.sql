-- ============================================================================
-- V029: Clinical Notes Draft Status
-- ============================================================================
-- Adds draft/final status to clinical notes for LLM-generated drafts.
-- Draft notes are auto-generated from session transcription.
-- Only becomes final when reviewed and saved by clinician.
-- ============================================================================

-- Add status column to clinical_notes
ALTER TABLE clinical_notes ADD 
    status NVARCHAR(20) NOT NULL DEFAULT 'final' 
    CHECK (status IN ('draft', 'final'));

-- Add source tracking - was this auto-generated or manual?
ALTER TABLE clinical_notes ADD
    source NVARCHAR(50) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'llm_transcription', 'llm_assisted'));

-- Add LLM metadata for audit trail
ALTER TABLE clinical_notes ADD
    llm_model NVARCHAR(100) NULL,           -- e.g., 'gpt-4o'
    llm_generated_at DATETIME2 NULL,        -- When LLM generated the draft
    finalized_at DATETIME2 NULL,            -- When clinician approved
    finalized_by UNIQUEIDENTIFIER NULL;     -- Who approved (same practitioner)

-- Track the transcription that generated this note (reference only - transcription is not stored)
ALTER TABLE clinical_notes ADD
    transcription_session_id NVARCHAR(100) NULL,  -- Reference to telehealth session
    transcription_duration_seconds INT NULL;       -- How long the session audio was

GO

-- Update existing notes to be 'final' and 'manual' (already set by default, but be explicit)
UPDATE clinical_notes 
SET status = 'final', source = 'manual' 
WHERE status = 'final' AND source = 'manual';

GO

-- ============================================================================
-- Session Transcription Aggregation Table
-- ============================================================================
-- Stores running transcription for a session (chunks get appended).
-- Automatically deleted after notes are generated.
-- TRANSCRIPTION CONTENT IS EPHEMERAL - DELETED AFTER LLM PROCESSING.

CREATE TABLE session_transcription_buffer (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Session identification
    appointment_halaxy_id NVARCHAR(100) NOT NULL,
    telehealth_room_id UNIQUEIDENTIFIER NULL,
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    patient_halaxy_id NVARCHAR(100) NOT NULL,
    
    -- Running transcription (built up from chunks during session)
    transcription_text NVARCHAR(MAX) NOT NULL DEFAULT '',
    chunk_count INT NOT NULL DEFAULT 0,
    total_audio_seconds INT NOT NULL DEFAULT 0,
    
    -- Status
    status NVARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'processing', 'completed', 'deleted')),
    
    -- Timestamps
    session_started_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    last_chunk_at DATETIME2 NULL,
    processing_started_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    
    -- Generated note reference
    generated_note_id UNIQUEIDENTIFIER NULL,
    
    CONSTRAINT FK_transcription_buffer_practitioner
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id),
    CONSTRAINT FK_transcription_buffer_note
        FOREIGN KEY (generated_note_id) REFERENCES clinical_notes(id)
);

-- Index for active session lookup
CREATE UNIQUE INDEX IX_transcription_buffer_active_session
    ON session_transcription_buffer(appointment_halaxy_id)
    WHERE status = 'active';

-- Index for cleanup
CREATE INDEX IX_transcription_buffer_cleanup
    ON session_transcription_buffer(status, completed_at)
    WHERE status IN ('completed', 'deleted');

GO

-- ============================================================================
-- Stored Procedure: Cleanup old transcription buffers
-- ============================================================================
-- Run periodically to ensure no transcription data lingers.
-- Transcriptions should be deleted immediately after note generation,
-- but this is a safety net.

CREATE OR ALTER PROCEDURE sp_cleanup_transcription_buffers
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @deleted_count INT;
    
    -- Delete transcription content from completed sessions older than 1 hour
    UPDATE session_transcription_buffer
    SET transcription_text = '[DELETED]',
        status = 'deleted',
        deleted_at = GETUTCDATE()
    WHERE status = 'completed'
      AND completed_at < DATEADD(HOUR, -1, GETUTCDATE())
      AND transcription_text != '[DELETED]';
    
    SET @deleted_count = @@ROWCOUNT;
    
    -- Delete abandoned sessions (active for more than 4 hours)
    UPDATE session_transcription_buffer
    SET transcription_text = '[DELETED - ABANDONED]',
        status = 'deleted',
        deleted_at = GETUTCDATE()
    WHERE status = 'active'
      AND session_started_at < DATEADD(HOUR, -4, GETUTCDATE())
      AND transcription_text != '[DELETED - ABANDONED]';
    
    SET @deleted_count = @deleted_count + @@ROWCOUNT;
    
    -- Hard delete very old records (keep metadata for 30 days)
    DELETE FROM session_transcription_buffer
    WHERE deleted_at < DATEADD(DAY, -30, GETUTCDATE());
    
    RETURN @deleted_count;
END;
GO

-- ============================================================================
-- Add audit action for draft operations
-- ============================================================================
ALTER TABLE clinical_notes_audit DROP CONSTRAINT IF EXISTS CK_clinical_notes_audit_action;
ALTER TABLE clinical_notes_audit ADD CONSTRAINT CK_clinical_notes_audit_action
    CHECK (action IN (
        'created',
        'viewed',
        'updated',
        'locked',
        'exported',
        'export_patient',
        'export_bulk',
        'deleted',
        'draft_generated',      -- NEW: LLM generated a draft
        'draft_finalized',      -- NEW: Clinician approved draft
        'draft_discarded'       -- NEW: Clinician discarded draft
    ));

GO

PRINT 'V029: Clinical notes draft status migration complete';
