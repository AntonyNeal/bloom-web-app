-- ============================================================================
-- V028: Telehealth Session Management
-- 
-- Tables for:
--   - session_tokens: Secure patient session links
--   - telehealth_rooms: Azure Communication Services rooms
--   - telehealth_participants: Who joined/left calls
-- ============================================================================

-- ============================================================================
-- Session Tokens
-- Secure tokens for patient session links sent in appointment emails
-- ============================================================================

CREATE TABLE session_tokens (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Token (URL-safe base64, 32 bytes = 43 chars)
    token NVARCHAR(100) NOT NULL UNIQUE,
    
    -- Appointment reference
    appointment_halaxy_id NVARCHAR(50) NOT NULL,
    patient_halaxy_id NVARCHAR(50) NOT NULL,
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Display info (for patient-facing UI)
    patient_first_name NVARCHAR(100),
    patient_email NVARCHAR(255),
    practitioner_name NVARCHAR(255),
    
    -- Appointment timing
    appointment_time DATETIME2 NOT NULL,
    appointment_duration_mins INT DEFAULT 50,
    
    -- Room reference (set when clinician creates room)
    room_id UNIQUEIDENTIFIER NULL,
    
    -- Token lifecycle
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    used_at DATETIME2 NULL, -- First use timestamp
    
    CONSTRAINT FK_session_tokens_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

-- Fast lookup by token (primary patient access path)
CREATE UNIQUE INDEX IX_session_tokens_token ON session_tokens(token);

-- Find tokens by appointment
CREATE INDEX IX_session_tokens_appointment ON session_tokens(appointment_halaxy_id);

-- Cleanup expired tokens
CREATE INDEX IX_session_tokens_expires ON session_tokens(expires_at);


-- ============================================================================
-- Telehealth Rooms
-- Azure Communication Services room tracking
-- ============================================================================

CREATE TABLE telehealth_rooms (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Appointment reference
    appointment_halaxy_id NVARCHAR(50) NOT NULL,
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Azure Communication Services
    acs_room_id NVARCHAR(255) NOT NULL,
    
    -- Room status: created, active, ended
    room_status NVARCHAR(20) NOT NULL DEFAULT 'created',
    
    -- Room validity window
    valid_from DATETIME2 NOT NULL,
    valid_until DATETIME2 NOT NULL,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    started_at DATETIME2 NULL,  -- First participant joined
    ended_at DATETIME2 NULL,    -- Room closed
    
    CONSTRAINT FK_telehealth_rooms_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

-- Find room by appointment
CREATE UNIQUE INDEX IX_telehealth_rooms_appointment ON telehealth_rooms(appointment_halaxy_id);

-- Find rooms by ACS ID
CREATE INDEX IX_telehealth_rooms_acs ON telehealth_rooms(acs_room_id);

-- Query active rooms
CREATE INDEX IX_telehealth_rooms_status ON telehealth_rooms(room_status, valid_until);


-- ============================================================================
-- Telehealth Participants
-- Track who joined/left video calls
-- ============================================================================

CREATE TABLE telehealth_participants (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    room_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Participant type: clinician, patient
    participant_type NVARCHAR(20) NOT NULL,
    
    -- External reference (practitioner_id or patient_halaxy_id)
    participant_external_id NVARCHAR(100) NOT NULL,
    
    -- Display name in call
    participant_name NVARCHAR(255) NOT NULL,
    
    -- Azure Communication Services user ID
    acs_user_id NVARCHAR(255) NOT NULL,
    
    -- Join/leave times
    joined_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    left_at DATETIME2 NULL,
    
    CONSTRAINT FK_telehealth_participants_room 
        FOREIGN KEY (room_id) REFERENCES telehealth_rooms(id)
);

-- Find participants by room
CREATE INDEX IX_telehealth_participants_room ON telehealth_participants(room_id);

-- Track participant history
CREATE INDEX IX_telehealth_participants_external 
    ON telehealth_participants(participant_external_id, joined_at DESC);


-- ============================================================================
-- Add room_id FK to session_tokens
-- ============================================================================

ALTER TABLE session_tokens
ADD CONSTRAINT FK_session_tokens_room 
    FOREIGN KEY (room_id) REFERENCES telehealth_rooms(id);


-- ============================================================================
-- Cleanup: Stored procedure to delete expired tokens
-- Run daily via Azure scheduled function
-- ============================================================================

GO

CREATE PROCEDURE cleanup_expired_session_tokens
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Delete tokens expired more than 7 days ago
    DELETE FROM session_tokens
    WHERE expires_at < DATEADD(DAY, -7, GETUTCDATE());
    
    -- Return count of deleted tokens
    SELECT @@ROWCOUNT AS deleted_count;
END;
GO
