-- ============================================================================
-- Migration: V5__availability_slots.sql
-- Description: Schema for availability slots synced from Halaxy
-- Author: System
-- Date: 2025-12-04
-- ============================================================================

-- ============================================================================
-- AVAILABILITY_SLOTS TABLE
-- Stores available appointment slots synced from Halaxy FHIR /Slot endpoint
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='availability_slots' AND xtype='U')
CREATE TABLE availability_slots (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_slot_id NVARCHAR(100) NOT NULL,
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  
  -- Slot timing
  slot_start DATETIME2 NOT NULL,
  slot_end DATETIME2 NOT NULL,
  duration_minutes INT NOT NULL,
  
  -- Slot status from Halaxy FHIR Slot resource
  -- Values: 'free', 'busy', 'busy-unavailable', 'busy-tentative', 'entered-in-error'
  status NVARCHAR(20) NOT NULL DEFAULT 'free',
  
  -- Schedule reference (Halaxy Schedule ID if available)
  halaxy_schedule_id NVARCHAR(100),
  
  -- Location/service context
  location_type NVARCHAR(50), -- 'telehealth', 'in-person'
  service_category NVARCHAR(100), -- Type of appointment this slot is for
  
  -- Booking constraints
  is_bookable BIT DEFAULT 1, -- Whether this slot can be booked online
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  last_synced_at DATETIME2,
  
  -- Constraints
  CONSTRAINT fk_availability_slots_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE,
  
  -- Unique constraint on Halaxy slot ID
  CONSTRAINT uq_halaxy_slot_id UNIQUE (halaxy_slot_id)
);
GO

-- Performance indexes for common queries
CREATE INDEX idx_availability_slots_practitioner_id ON availability_slots(practitioner_id);
GO

CREATE INDEX idx_availability_slots_slot_start ON availability_slots(slot_start);
GO

CREATE INDEX idx_availability_slots_status ON availability_slots(status);
GO

-- Composite index for typical availability queries
CREATE INDEX idx_availability_slots_search ON availability_slots(
  practitioner_id, 
  slot_start, 
  slot_end, 
  status
) WHERE status = 'free' AND is_bookable = 1;
GO

-- ============================================================================
-- VIEW: Available slots for booking calendar
-- ============================================================================
IF OBJECT_ID('vw_available_slots', 'V') IS NOT NULL DROP VIEW vw_available_slots;
GO

CREATE VIEW vw_available_slots AS
SELECT 
  a.id,
  a.halaxy_slot_id,
  a.practitioner_id,
  p.first_name AS practitioner_first_name,
  p.last_name AS practitioner_last_name,
  p.halaxy_practitioner_id,
  a.slot_start,
  a.slot_end,
  a.duration_minutes,
  a.status,
  a.location_type,
  a.service_category,
  a.is_bookable,
  a.last_synced_at
FROM availability_slots a
JOIN practitioners p ON a.practitioner_id = p.id
WHERE a.status = 'free'
  AND a.is_bookable = 1
  AND a.slot_start > GETUTCDATE(); -- Only future slots
GO

PRINT 'Availability slots schema migration completed successfully!';
