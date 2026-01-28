-- ============================================================================
-- V037: Availability Slots Table - Weekly Schedule Management
-- ============================================================================
-- Stores Zoe's available time slots for appointments.
-- Allows flexible scheduling without hard-coded availability.
-- ============================================================================

-- Drop old table if it exists (migrating from old schema)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'availability_slots')
DROP TABLE availability_slots;

CREATE TABLE availability_slots (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Practitioner
    practitioner_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    
    -- Time range
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Slot duration (in minutes) - e.g., 60 for 1-hour slots
    duration_minutes INT NOT NULL DEFAULT 60,
    
    -- Status
    is_active BIT NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Foreign key
    CONSTRAINT FK_availability_slots_practitioner 
        FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)
);

-- Index for practitioner availability lookup
CREATE INDEX IX_availability_slots_practitioner 
    ON availability_slots(practitioner_id, day_of_week, is_active)
    INCLUDE (start_time, end_time, duration_minutes);

PRINT 'V037: Availability slots table created successfully';
