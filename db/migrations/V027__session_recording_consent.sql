-- ============================================================================
-- V027: Session Recording Consent & Transcription
-- ============================================================================
-- Tracks patient consent for audio recording and logs transcription activity.
-- Audio is NEVER stored - only consent records and activity logs.
-- ============================================================================

-- Session Recording Consent
-- Records whether patient consented to recording for each appointment
CREATE TABLE session_recording_consent (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Which appointment and patient
    appointment_halaxy_id NVARCHAR(100) NOT NULL,
    patient_halaxy_id NVARCHAR(100) NOT NULL,
    
    -- Consent status
    consent_given BIT NOT NULL,
    consent_timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- If consent was withdrawn during session
    withdrawn_at DATETIME2 NULL,
    
    -- Audit info (for compliance)
    ip_address NVARCHAR(50) NULL,
    user_agent NVARCHAR(500) NULL,
    
    -- Ensure one consent record per appointment
    CONSTRAINT UQ_consent_appointment UNIQUE (appointment_halaxy_id)
);

-- Index for quick lookup by appointment
CREATE INDEX IX_consent_appointment 
    ON session_recording_consent(appointment_halaxy_id);

-- Index for patient consent history
CREATE INDEX IX_consent_patient 
    ON session_recording_consent(patient_halaxy_id, consent_timestamp DESC);


-- ============================================================================
-- Transcription Activity Log
-- ============================================================================
-- Logs when transcription happened (for audit) but NOT the content
-- Content is ephemeral and never stored

CREATE TABLE session_transcription_log (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Which appointment
    appointment_halaxy_id NVARCHAR(100) NOT NULL,
    practitioner_id UNIQUEIDENTIFIER NULL,  -- May be NULL if not tracked
    
    -- Activity metrics (NOT content)
    audio_size_bytes INT NOT NULL,
    transcript_length_chars INT NOT NULL,
    
    -- When it happened
    transcribed_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign key to consent (must have consent to transcribe)
    CONSTRAINT FK_transcription_consent 
        FOREIGN KEY (appointment_halaxy_id) 
        REFERENCES session_recording_consent(appointment_halaxy_id)
);

-- Index for audit queries
CREATE INDEX IX_transcription_appointment 
    ON session_transcription_log(appointment_halaxy_id);

CREATE INDEX IX_transcription_practitioner 
    ON session_transcription_log(practitioner_id, transcribed_at DESC);
