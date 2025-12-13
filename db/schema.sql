-- ============================================================================
-- COMPLETE DATABASE SCHEMA - Life Psychology Australia
-- This script drops and recreates the entire database schema
-- WARNING: This will DELETE ALL DATA
-- ============================================================================

-- Drop all existing objects
PRINT 'Dropping existing objects...';
DROP VIEW IF EXISTS vw_all_slots;
DROP VIEW IF EXISTS vw_available_slots;
DROP TABLE IF EXISTS availability_slots;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS practitioners;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS ab_test_variants;
DROP TABLE IF EXISTS ab_test_experiments;
DROP TABLE IF EXISTS applications;
GO

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE applications (
  id INT PRIMARY KEY IDENTITY(1,1),
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(20),
  ahpra_registration NVARCHAR(50) NOT NULL,
  specializations NVARCHAR(MAX),
  experience_years INT,
  cv_url NVARCHAR(500),
  certificate_url NVARCHAR(500),
  photo_url NVARCHAR(500),
  cover_letter TEXT,
  qualification_type NVARCHAR(50),
  qualification_check NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'submitted',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  reviewed_by NVARCHAR(100),
  reviewed_at DATETIME2
);

CREATE INDEX idx_status ON applications(status);
CREATE INDEX idx_created_at ON applications(created_at DESC);
CREATE INDEX idx_email ON applications(email);
GO

-- ============================================================================
-- AB TESTING TABLES
-- ============================================================================
CREATE TABLE ab_test_experiments (
  id INT PRIMARY KEY IDENTITY(1,1),
  name NVARCHAR(100) NOT NULL UNIQUE,
  description NVARCHAR(500),
  status NVARCHAR(20) DEFAULT 'draft',
  start_date DATETIME2,
  end_date DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE ab_test_variants (
  id INT PRIMARY KEY IDENTITY(1,1),
  experiment_id INT NOT NULL,
  name NVARCHAR(100) NOT NULL,
  description NVARCHAR(500),
  traffic_percentage INT DEFAULT 50,
  is_control BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (experiment_id) REFERENCES ab_test_experiments(id) ON DELETE CASCADE
);

CREATE INDEX idx_experiment_id ON ab_test_variants(experiment_id);
GO

-- ============================================================================
-- SESSION TRACKING TABLE
-- ============================================================================
CREATE TABLE sessions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  session_id NVARCHAR(255) UNIQUE NOT NULL,
  user_agent NVARCHAR(500),
  ip_address NVARCHAR(50),
  referrer NVARCHAR(1000),
  landing_page NVARCHAR(1000),
  utm_source NVARCHAR(100),
  utm_medium NVARCHAR(100),
  utm_campaign NVARCHAR(100),
  utm_term NVARCHAR(100),
  utm_content NVARCHAR(100),
  ab_experiment_id INT,
  ab_variant_id INT,
  created_at DATETIME2 DEFAULT GETDATE(),
  last_activity DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (ab_experiment_id) REFERENCES ab_test_experiments(id),
  FOREIGN KEY (ab_variant_id) REFERENCES ab_test_variants(id)
);

CREATE INDEX idx_session_id ON sessions(session_id);
CREATE INDEX idx_created_at_sessions ON sessions(created_at);
GO

-- ============================================================================
-- PRACTITIONERS TABLE
-- ============================================================================
CREATE TABLE practitioners (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_practitioner_id NVARCHAR(100) UNIQUE NOT NULL,
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  specialization NVARCHAR(200),
  bio NVARCHAR(MAX),
  is_active BIT DEFAULT 1,
  sync_enabled BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  last_synced_at DATETIME2
);

CREATE INDEX idx_practitioners_halaxy_id ON practitioners(halaxy_practitioner_id);
CREATE INDEX idx_practitioners_active ON practitioners(is_active);
GO

-- ============================================================================
-- AVAILABILITY SLOTS TABLE (using Unix timestamps)
-- ============================================================================
CREATE TABLE availability_slots (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_slot_id NVARCHAR(100) NOT NULL UNIQUE,
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  slot_start_unix BIGINT NOT NULL,
  slot_end_unix BIGINT NOT NULL,
  duration_minutes INT NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'free',
  halaxy_schedule_id NVARCHAR(100),
  location_type NVARCHAR(50),
  service_category NVARCHAR(100),
  is_bookable BIT DEFAULT 1,
  is_booked BIT DEFAULT 0,
  booked_at DATETIME2,
  booking_reference NVARCHAR(100),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  last_synced_at DATETIME2,
  CONSTRAINT fk_availability_slots_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE
);

CREATE INDEX idx_availability_slots_practitioner_id ON availability_slots(practitioner_id);
CREATE INDEX idx_availability_slots_slot_start_unix ON availability_slots(slot_start_unix);
CREATE INDEX idx_availability_slots_is_booked ON availability_slots(is_booked);
CREATE INDEX idx_availability_slots_search ON availability_slots(
  practitioner_id, 
  slot_start_unix, 
  slot_end_unix
) WHERE is_bookable = 1;
GO

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE VIEW vw_all_slots AS
SELECT
  a.id,
  a.halaxy_slot_id,
  a.practitioner_id,
  p.first_name AS practitioner_first_name,
  p.last_name AS practitioner_last_name,
  p.halaxy_practitioner_id,
  a.slot_start_unix,
  a.slot_end_unix,
  a.duration_minutes,
  a.status,
  a.location_type,
  a.service_category,
  a.is_bookable,
  a.is_booked,
  a.booked_at,
  a.booking_reference,
  a.last_synced_at,
  a.created_at,
  a.updated_at
FROM availability_slots a
JOIN practitioners p ON a.practitioner_id = p.id
WHERE a.slot_start_unix > DATEDIFF_BIG(SECOND, '1970-01-01', DATEADD(DAY, -7, GETUTCDATE()));
GO

PRINT 'Database schema created successfully!';
