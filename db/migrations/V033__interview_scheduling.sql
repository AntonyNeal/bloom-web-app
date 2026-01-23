-- ============================================================================
-- V033: Interview Scheduling for Applicant Onboarding
-- 
-- Tables for:
--   - interview_tokens: Secure tokens for interview scheduling links
--   - interview_rooms: ACS video rooms for interviews
-- ============================================================================

-- ============================================================================
-- Interview Tokens
-- Secure tokens sent to applicants to schedule their interview
-- ============================================================================

CREATE TABLE interview_tokens (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Token (URL-safe base64, 32 bytes = 43 chars)
    token NVARCHAR(100) NOT NULL UNIQUE,
    
    -- Application reference
    application_id INT NOT NULL,
    
    -- Applicant info (cached for email/display)
    applicant_first_name NVARCHAR(100) NOT NULL,
    applicant_last_name NVARCHAR(100) NOT NULL,
    applicant_email NVARCHAR(255) NOT NULL,
    
    -- Interview details (set after scheduling)
    interview_scheduled_at DATETIME2 NULL,
    interview_duration_mins INT DEFAULT 30,
    halaxy_appointment_id NVARCHAR(50) NULL,
    
    -- Video room reference (set when interview is scheduled)
    room_id UNIQUEIDENTIFIER NULL,
    
    -- Token lifecycle
    expires_at DATETIME2 NOT NULL,  -- Token expires 14 days after creation
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    scheduled_at DATETIME2 NULL,    -- When applicant scheduled the interview
    completed_at DATETIME2 NULL,    -- When interview was marked complete
    
    CONSTRAINT FK_interview_tokens_application 
        FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Fast lookup by token (primary applicant access path)
CREATE UNIQUE INDEX IX_interview_tokens_token ON interview_tokens(token);

-- Find token by application
CREATE INDEX IX_interview_tokens_application ON interview_tokens(application_id);

-- Cleanup expired tokens
CREATE INDEX IX_interview_tokens_expires ON interview_tokens(expires_at);


-- ============================================================================
-- Interview Rooms
-- Azure Communication Services room for interviews (similar to telehealth_rooms)
-- ============================================================================

CREATE TABLE interview_rooms (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Reference to interview token
    interview_token_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Azure Communication Services
    acs_room_id NVARCHAR(255) NOT NULL,
    
    -- Room status: created, active, ended
    room_status NVARCHAR(20) NOT NULL DEFAULT 'created',
    
    -- Room validity window (30 min before to 2 hours after interview)
    valid_from DATETIME2 NOT NULL,
    valid_until DATETIME2 NOT NULL,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    started_at DATETIME2 NULL,  -- First participant joined
    ended_at DATETIME2 NULL,    -- Room closed
    
    CONSTRAINT FK_interview_rooms_token 
        FOREIGN KEY (interview_token_id) REFERENCES interview_tokens(id)
);

-- Find room by interview token
CREATE UNIQUE INDEX IX_interview_rooms_token ON interview_rooms(interview_token_id);

-- Find rooms by ACS ID
CREATE INDEX IX_interview_rooms_acs ON interview_rooms(acs_room_id);

-- Query active rooms
CREATE INDEX IX_interview_rooms_status ON interview_rooms(room_status, valid_until);


-- ============================================================================
-- Add room_id FK to interview_tokens
-- ============================================================================

ALTER TABLE interview_tokens
ADD CONSTRAINT FK_interview_tokens_room 
    FOREIGN KEY (room_id) REFERENCES interview_rooms(id);

