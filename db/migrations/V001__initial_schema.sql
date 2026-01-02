-- =============================================================================
-- V001__initial_schema.sql
-- Migration: Create initial database schema
-- =============================================================================
-- This is the baseline migration that creates all core tables.
-- Run this on a fresh database before applying subsequent migrations.
-- =============================================================================

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'applications')
BEGIN
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

  CREATE INDEX idx_applications_status ON applications(status);
  CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
  CREATE INDEX idx_applications_email ON applications(email);
  
  PRINT 'Created applications table';
END
ELSE
BEGIN
  PRINT 'applications table already exists';
END
GO

-- ============================================================================
-- AB TESTING TABLES
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ab_test_experiments')
BEGIN
  CREATE TABLE ab_test_experiments (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'draft',
    start_date DATETIME2,
    end_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE()
  );
  
  PRINT 'Created ab_test_experiments table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ab_test_variants')
BEGIN
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

  CREATE INDEX idx_ab_test_variants_experiment_id ON ab_test_variants(experiment_id);
  
  PRINT 'Created ab_test_variants table';
END
GO

-- ============================================================================
-- SESSION TRACKING TABLE
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sessions')
BEGIN
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

  CREATE INDEX idx_sessions_session_id ON sessions(session_id);
  CREATE INDEX idx_sessions_created_at ON sessions(created_at);
  
  PRINT 'Created sessions table';
END
GO

PRINT 'V001: Initial schema migration completed';
