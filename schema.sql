-- Proto-Bloom Application Management System
-- Database schema for Life Psychology Australia
-- Azure SQL Database

-- Applications table
CREATE TABLE applications (
  id INT PRIMARY KEY IDENTITY(1,1),
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(20),
  ahpra_registration NVARCHAR(50) NOT NULL,
  specializations NVARCHAR(MAX), -- JSON array
  experience_years INT,
  cv_url NVARCHAR(500),
  certificate_url NVARCHAR(500),
  photo_url NVARCHAR(500),
  cover_letter TEXT,
  qualification_type NVARCHAR(50), -- 'clinical', 'experienced', 'phd'
  qualification_check NVARCHAR(MAX), -- JSON object with qualification check data
  -- Status: submitted, reviewing, denied, waitlisted, interview_scheduled, accepted (approved, rejected are legacy)
  status NVARCHAR(20) DEFAULT 'submitted',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  reviewed_by NVARCHAR(100),
  reviewed_at DATETIME2,
  -- Review workflow fields (Epic 1.1)
  admin_notes NVARCHAR(MAX),              -- Admin notes/comments for review decisions
  interview_scheduled_at DATETIME2,       -- Date/time of scheduled interview
  interview_notes NVARCHAR(MAX),          -- Notes from interview
  decision_reason NVARCHAR(500),          -- Reason for decision
  waitlisted_at DATETIME2,                -- When application was waitlisted
  accepted_at DATETIME2                   -- When application was accepted
);

-- Performance indexes
CREATE INDEX idx_status ON applications(status);
CREATE INDEX idx_created_at ON applications(created_at DESC);
CREATE INDEX idx_email ON applications(email);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trg_applications_updated_at
ON applications
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE applications
    SET updated_at = GETDATE()
    FROM applications a
    INNER JOIN inserted i ON a.id = i.id;
END;
GO
