-- =============================================================================
-- V005__create_practitioners_table.sql
-- Migration: Create practitioners table for onboarding workflow
-- =============================================================================
-- This migration creates the practitioners table that stores onboarded 
-- psychologists who have been accepted through the application process.
-- The is_active flag controls visibility on the LPA website and availability
-- for bookings.
-- =============================================================================

-- Create the practitioners table
EXEC('
CREATE TABLE practitioners (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  application_id INT NULL REFERENCES applications(id),
  
  -- Core info (from application)
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(50) NULL,
  ahpra_number NVARCHAR(50) NULL,
  specializations NVARCHAR(MAX) NULL,
  experience_years INT NULL,
  
  -- Profile (editable by practitioner)
  display_name NVARCHAR(200) NULL,
  bio NVARCHAR(MAX) NULL,
  profile_photo_url NVARCHAR(500) NULL,
  
  -- Auth
  password_hash NVARCHAR(255) NULL,
  
  -- Onboarding
  onboarding_token NVARCHAR(100) NULL,
  onboarding_token_expires_at DATETIME2 NULL,
  onboarding_completed_at DATETIME2 NULL,
  
  -- Status
  is_active BIT DEFAULT 0,
  
  -- Halaxy Integration (for future use)
  halaxy_practitioner_id NVARCHAR(50) NULL,
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
)
');

-- Create indexes for common queries
EXEC('CREATE UNIQUE INDEX idx_practitioners_email ON practitioners(email)');
EXEC('CREATE INDEX idx_practitioners_active ON practitioners(is_active)');
EXEC('CREATE INDEX idx_practitioners_onboarding_token ON practitioners(onboarding_token) WHERE onboarding_token IS NOT NULL');
EXEC('CREATE INDEX idx_practitioners_application_id ON practitioners(application_id) WHERE application_id IS NOT NULL');

-- Add a link from applications to practitioners for tracking
EXEC('ALTER TABLE applications ADD practitioner_id UNIQUEIDENTIFIER NULL');
EXEC('ALTER TABLE applications ADD CONSTRAINT FK_applications_practitioners 
      FOREIGN KEY (practitioner_id) REFERENCES practitioners(id)');

PRINT 'V005: Practitioners table created successfully';
