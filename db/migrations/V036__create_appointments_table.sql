-- ============================================================================
-- V036: Appointments Table - Standalone Appointment Management
-- ============================================================================
-- Stores appointments scheduled by Zoe for her clients.
-- Replaces dependency on Halaxy for appointment data.
-- ============================================================================

CREATE TABLE appointments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Relationships
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    client_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Scheduling
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    
    -- Type
    appointment_type NVARCHAR(50) NOT NULL DEFAULT 'session' CHECK (appointment_type IN (
        'session',          -- Regular therapy session
        'initial',          -- Initial consultation
        'review',           -- Review session
        'assessment',       -- Psychological assessment
        'followup',         -- Follow-up appointment
        'cancellation',     -- Cancellation (for record-keeping)
        'other'
    )),
    
    -- Status tracking
    status NVARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',        -- Confirmed appointment
        'completed',        -- Completed successfully
        'cancelled',        -- Cancelled by practitioner
        'no-show',          -- Client didn't show up
        'rescheduled',      -- Rescheduled to different time
        'confirmed'         -- Client confirmed attendance
    )),
    
    -- Telehealth integration
    is_telehealth BIT NOT NULL DEFAULT 1,
    session_token NVARCHAR(100) NULL,  -- Token for patient join link
    acs_room_id NVARCHAR(255) NULL,    -- Azure Communication Services room ID
    
    -- Clinical notes integration
    clinical_notes_id UNIQUEIDENTIFIER NULL,  -- Link to clinical_notes table
    
    -- Client communication
    reminder_sent_24h BIT NOT NULL DEFAULT 0,
    reminder_sent_1h BIT NOT NULL DEFAULT 0,
    confirmation_sent BIT NOT NULL DEFAULT 0,
    
    -- Billing
    invoice_id UNIQUEIDENTIFIER NULL,  -- Link to invoices (once created)
    billing_status NVARCHAR(20) DEFAULT 'pending' CHECK (billing_status IN (
        'pending',          -- Not yet billed
        'billed',           -- Invoice created
        'paid',             -- Payment received
        'refunded'          -- Refunded
    )),
    
    -- Notes
    notes NVARCHAR(MAX) NULL,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    scheduled_at DATETIME2 NULL,  -- When appointment was booked
    completed_at DATETIME2 NULL,  -- When session ended
    
    -- Soft delete
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    
    -- Foreign keys
    CONSTRAINT FK_appointments_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id),
    CONSTRAINT FK_appointments_client 
        FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Index for practitioner calendar view (most common query)
CREATE INDEX IX_appointments_practitioner_date 
    ON appointments(practitioner_id, appointment_date, is_deleted)
    INCLUDE (start_time, end_time, status, client_id);

-- Index for client appointment history
CREATE INDEX IX_appointments_client 
    ON appointments(client_id, is_deleted)
    INCLUDE (appointment_date, status);

-- Index for status tracking (reminders, billing)
CREATE INDEX IX_appointments_status 
    ON appointments(practitioner_id, status, is_deleted)
    INCLUDE (appointment_date, reminder_sent_24h, reminder_sent_1h);

-- Index for upcoming appointments (used for reminders)
CREATE INDEX IX_appointments_upcoming 
    ON appointments(practitioner_id, appointment_date, start_time)
    WHERE status IN ('scheduled', 'confirmed') AND is_deleted = 0;

-- Index for telehealth sessions
CREATE INDEX IX_appointments_telehealth 
    ON appointments(practitioner_id, is_telehealth, status)
    WHERE is_telehealth = 1 AND status IN ('scheduled', 'confirmed') AND is_deleted = 0;

-- Index for session token lookup
CREATE INDEX IX_appointments_session_token 
    ON appointments(session_token)
    WHERE session_token IS NOT NULL AND is_deleted = 0;

PRINT 'V036: Appointments table created successfully';
