-- ============================================================================
-- Migration: V4__practitioner_dashboard_schema.sql
-- Description: Schema for practitioner dashboard data (synced from Halaxy)
-- Author: System
-- Date: 2025-11-27
-- ============================================================================

-- ============================================================================
-- PRACTITIONERS TABLE
-- Stores practitioner profiles synced from Halaxy
-- ============================================================================
CREATE TABLE practitioners (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_practitioner_id NVARCHAR(50) NOT NULL,
  halaxy_practitioner_role_id NVARCHAR(50),
  
  -- Personal info
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  display_name NVARCHAR(200) NOT NULL,
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20),
  
  -- Professional info
  ahpra_number NVARCHAR(50),
  qualification_type NVARCHAR(50), -- 'clinical', 'counselling', 'general'
  specializations NVARCHAR(MAX), -- JSON array
  
  -- Profile
  profile_photo_url NVARCHAR(500),
  timezone NVARCHAR(50) DEFAULT 'Australia/Sydney',
  
  -- Targets
  weekly_session_target INT DEFAULT 25,
  weekly_revenue_target DECIMAL(10,2) DEFAULT 5500.00,
  monthly_revenue_target DECIMAL(10,2) DEFAULT 22000.00,
  
  -- Status
  status NVARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'onboarding'
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  last_synced_at DATETIME2,
  
  -- Constraints
  CONSTRAINT uq_practitioners_halaxy_id UNIQUE (halaxy_practitioner_id),
  CONSTRAINT uq_practitioners_email UNIQUE (email)
);

-- Indexes
CREATE INDEX idx_practitioners_status ON practitioners(status);
CREATE INDEX idx_practitioners_halaxy_id ON practitioners(halaxy_practitioner_id);

-- ============================================================================
-- CLIENTS TABLE
-- Stores client/patient data synced from Halaxy
-- ============================================================================
CREATE TABLE clients (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_patient_id NVARCHAR(50) NOT NULL,
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  
  -- Personal info (minimal for privacy)
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  initials NVARCHAR(10) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(20),
  date_of_birth DATE,
  gender NVARCHAR(20), -- 'male', 'female', 'other', 'unknown'
  
  -- Clinical context
  presenting_issues NVARCHAR(MAX), -- JSON array of presenting issues
  treatment_plan NVARCHAR(MAX),
  
  -- MHCP (Medicare Health Care Plan) tracking
  mhcp_is_active BIT DEFAULT 0,
  mhcp_total_sessions INT DEFAULT 10,
  mhcp_used_sessions INT DEFAULT 0,
  mhcp_remaining_sessions AS (mhcp_total_sessions - mhcp_used_sessions) PERSISTED,
  mhcp_plan_start_date DATE,
  mhcp_plan_expiry_date DATE,
  mhcp_referring_gp NVARCHAR(200),
  mhcp_referral_date DATE,
  
  -- Relationship tracking
  first_session_date DATE,
  relationship_months AS (
    CASE 
      WHEN first_session_date IS NULL THEN 0
      ELSE DATEDIFF(MONTH, first_session_date, GETDATE())
    END
  ) PERSISTED,
  total_sessions INT DEFAULT 0,
  last_session_date DATE,
  
  -- Status
  status NVARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'discharged'
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  last_synced_at DATETIME2,
  
  -- Constraints
  CONSTRAINT uq_clients_halaxy_id UNIQUE (halaxy_patient_id),
  CONSTRAINT fk_clients_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_clients_practitioner ON clients(practitioner_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_halaxy_id ON clients(halaxy_patient_id);
CREATE INDEX idx_clients_mhcp_expiry ON clients(mhcp_plan_expiry_date) 
  WHERE mhcp_is_active = 1;
CREATE INDEX idx_clients_mhcp_remaining ON clients(mhcp_remaining_sessions) 
  WHERE mhcp_is_active = 1;

-- ============================================================================
-- SESSIONS TABLE
-- Stores appointment/session data synced from Halaxy
-- ============================================================================
CREATE TABLE sessions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_appointment_id NVARCHAR(50) NOT NULL,
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  client_id UNIQUEIDENTIFIER NOT NULL,
  
  -- Timing
  scheduled_start_time DATETIME2 NOT NULL,
  scheduled_end_time DATETIME2 NOT NULL,
  actual_start_time DATETIME2,
  actual_end_time DATETIME2,
  duration_minutes INT NOT NULL DEFAULT 50,
  
  -- Session details
  session_number INT NOT NULL DEFAULT 1,
  session_type NVARCHAR(50) NOT NULL, -- 'initial_consultation', 'standard_consultation', etc.
  status NVARCHAR(20) NOT NULL DEFAULT 'scheduled',
  -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled', 'rescheduled'
  
  -- Location
  location_type NVARCHAR(20) DEFAULT 'in-person', -- 'in-person', 'telehealth', 'phone'
  location_details NVARCHAR(500),
  
  -- Clinical notes
  notes NVARCHAR(MAX),
  presenting_issues_session NVARCHAR(MAX), -- JSON array for this specific session
  interventions_used NVARCHAR(MAX), -- JSON array
  
  -- Billing
  billing_type NVARCHAR(20) DEFAULT 'medicare', -- 'medicare', 'private', 'dva', 'workcover', 'ndis'
  invoice_amount DECIMAL(10,2),
  is_paid BIT DEFAULT 0,
  
  -- Attribution tracking
  gclid NVARCHAR(100),
  utm_source NVARCHAR(100),
  stripe_payment_intent_id NVARCHAR(100),
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  last_synced_at DATETIME2,
  
  -- Constraints
  CONSTRAINT uq_sessions_halaxy_id UNIQUE (halaxy_appointment_id),
  CONSTRAINT fk_sessions_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_client FOREIGN KEY (client_id) 
    REFERENCES clients(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_sessions_practitioner ON sessions(practitioner_id);
CREATE INDEX idx_sessions_client ON sessions(client_id);
CREATE INDEX idx_sessions_date ON sessions(scheduled_start_time);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_halaxy_id ON sessions(halaxy_appointment_id);

-- Composite index for common dashboard queries
CREATE INDEX idx_sessions_practitioner_date ON sessions(practitioner_id, scheduled_start_time)
  INCLUDE (client_id, session_number, status, location_type);

-- ============================================================================
-- SYNC LOG TABLE
-- Tracks sync operations for monitoring and debugging
-- ============================================================================
CREATE TABLE sync_log (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  practitioner_id UNIQUEIDENTIFIER,
  
  -- Sync metadata
  sync_type NVARCHAR(20) NOT NULL, -- 'full', 'incremental', 'webhook', 'manual'
  entity_type NVARCHAR(20) NOT NULL, -- 'practitioner', 'client', 'session', 'all'
  entity_id NVARCHAR(50), -- Specific entity ID if applicable
  operation NVARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'sync'
  
  -- Result
  status NVARCHAR(20) NOT NULL, -- 'started', 'success', 'error', 'partial'
  error_message NVARCHAR(MAX),
  
  -- Metrics
  records_processed INT DEFAULT 0,
  records_created INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_deleted INT DEFAULT 0,
  
  -- Timing
  started_at DATETIME2 NOT NULL DEFAULT GETDATE(),
  completed_at DATETIME2,
  duration_ms AS (DATEDIFF(MILLISECOND, started_at, completed_at)) PERSISTED,
  
  -- Constraints
  CONSTRAINT fk_sync_log_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_sync_log_practitioner ON sync_log(practitioner_id);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);
CREATE INDEX idx_sync_log_status ON sync_log(status);

-- ============================================================================
-- SYNC STATUS TABLE
-- Current sync status per practitioner (for dashboard display)
-- ============================================================================
CREATE TABLE sync_status (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  
  -- Connection status
  is_connected BIT DEFAULT 1,
  last_successful_sync DATETIME2,
  last_sync_attempt DATETIME2,
  
  -- Error tracking
  consecutive_failures INT DEFAULT 0,
  last_error_message NVARCHAR(MAX),
  
  -- Pending changes (for write-back if implemented)
  pending_changes INT DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  
  -- Constraints
  CONSTRAINT uq_sync_status_practitioner UNIQUE (practitioner_id),
  CONSTRAINT fk_sync_status_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE
);

-- ============================================================================
-- VIEWS FOR DASHBOARD QUERIES
-- ============================================================================

-- Today's sessions for a practitioner
GO
CREATE VIEW vw_todays_sessions AS
SELECT 
  s.id,
  s.halaxy_appointment_id,
  s.practitioner_id,
  s.client_id,
  s.scheduled_start_time,
  s.scheduled_end_time,
  s.session_number,
  s.session_type,
  s.status,
  s.location_type,
  c.initials as client_initials,
  c.presenting_issues,
  c.mhcp_remaining_sessions,
  c.mhcp_total_sessions,
  c.relationship_months,
  c.first_name as client_first_name
FROM sessions s
JOIN clients c ON s.client_id = c.id
WHERE CAST(s.scheduled_start_time AS DATE) = CAST(GETDATE() AS DATE);
GO

-- Weekly stats summary
GO
CREATE VIEW vw_weekly_stats AS
SELECT 
  s.practitioner_id,
  p.weekly_session_target,
  p.weekly_revenue_target,
  DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)) as week_start,
  DATEADD(DAY, 7 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)) as week_end,
  COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN s.status IN ('scheduled', 'confirmed') THEN 1 END) as scheduled_sessions,
  COUNT(*) as total_sessions,
  SUM(CASE WHEN s.status = 'completed' THEN s.invoice_amount ELSE 0 END) as earned_revenue,
  SUM(s.invoice_amount) as potential_revenue,
  COUNT(CASE WHEN s.status = 'no_show' THEN 1 END) as no_shows,
  COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancellations
FROM sessions s
JOIN practitioners p ON s.practitioner_id = p.id
WHERE s.scheduled_start_time >= DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))
  AND s.scheduled_start_time < DATEADD(DAY, 8 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))
GROUP BY s.practitioner_id, p.weekly_session_target, p.weekly_revenue_target;
GO

-- Monthly stats summary
GO
CREATE VIEW vw_monthly_stats AS
SELECT 
  s.practitioner_id,
  p.monthly_revenue_target,
  DATENAME(MONTH, GETDATE()) as month_name,
  FORMAT(GETDATE(), 'yyyy-MM') as month_year,
  COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN s.status IN ('scheduled', 'confirmed') THEN 1 END) as scheduled_sessions,
  SUM(CASE WHEN s.status = 'completed' THEN s.invoice_amount ELSE 0 END) as earned_revenue,
  SUM(CASE WHEN s.status IN ('scheduled', 'confirmed') THEN s.invoice_amount ELSE 0 END) as projected_revenue,
  AVG(CASE WHEN s.status = 'completed' THEN s.invoice_amount END) as avg_session_value,
  -- Revenue by billing type
  SUM(CASE WHEN s.status = 'completed' AND s.billing_type = 'medicare' THEN s.invoice_amount ELSE 0 END) as medicare_revenue,
  SUM(CASE WHEN s.status = 'completed' AND s.billing_type = 'private' THEN s.invoice_amount ELSE 0 END) as private_revenue,
  SUM(CASE WHEN s.status = 'completed' AND s.billing_type = 'dva' THEN s.invoice_amount ELSE 0 END) as dva_revenue,
  SUM(CASE WHEN s.status = 'completed' AND s.billing_type = 'workcover' THEN s.invoice_amount ELSE 0 END) as workcover_revenue,
  SUM(CASE WHEN s.status = 'completed' AND s.billing_type = 'ndis' THEN s.invoice_amount ELSE 0 END) as ndis_revenue
FROM sessions s
JOIN practitioners p ON s.practitioner_id = p.id
WHERE s.scheduled_start_time >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
  AND s.scheduled_start_time < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY s.practitioner_id, p.monthly_revenue_target;
GO

-- Upcoming stats
GO
CREATE VIEW vw_upcoming_stats AS
SELECT 
  s.practitioner_id,
  COUNT(CASE WHEN CAST(s.scheduled_start_time AS DATE) = CAST(DATEADD(DAY, 1, GETDATE()) AS DATE) 
             AND s.status IN ('scheduled', 'confirmed') THEN 1 END) as tomorrow_sessions,
  COUNT(CASE WHEN s.scheduled_start_time > GETDATE() 
             AND s.scheduled_start_time < DATEADD(DAY, 8 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))
             AND s.status IN ('scheduled', 'confirmed') THEN 1 END) as remaining_this_week,
  COUNT(CASE WHEN s.scheduled_start_time >= DATEADD(DAY, 8 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))
             AND s.scheduled_start_time < DATEADD(DAY, 15 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))
             AND s.status IN ('scheduled', 'confirmed') THEN 1 END) as next_week_sessions
FROM sessions s
GROUP BY s.practitioner_id;
GO

-- MHCP ending soon (clients with ≤2 sessions remaining)
GO
CREATE VIEW vw_mhcp_ending_soon AS
SELECT 
  practitioner_id,
  COUNT(*) as clients_mhcp_ending
FROM clients
WHERE mhcp_is_active = 1 
  AND mhcp_remaining_sessions <= 2
  AND status = 'active'
GROUP BY practitioner_id;
GO

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on practitioners
GO
CREATE TRIGGER trg_practitioners_updated_at
ON practitioners
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE practitioners
    SET updated_at = GETDATE()
    FROM practitioners p
    INNER JOIN inserted i ON p.id = i.id;
END;
GO

-- Auto-update updated_at on clients
GO
CREATE TRIGGER trg_clients_updated_at
ON clients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE clients
    SET updated_at = GETDATE()
    FROM clients c
    INNER JOIN inserted i ON c.id = i.id;
END;
GO

-- Auto-update updated_at on sessions
GO
CREATE TRIGGER trg_sessions_updated_at
ON sessions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE sessions
    SET updated_at = GETDATE()
    FROM sessions s
    INNER JOIN inserted i ON s.id = i.id;
END;
GO

-- Update client total_sessions and last_session_date when sessions complete
GO
CREATE TRIGGER trg_sessions_update_client_stats
ON sessions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update client stats for clients whose sessions changed to 'completed'
    UPDATE c
    SET 
      total_sessions = (
        SELECT COUNT(*) 
        FROM sessions s 
        WHERE s.client_id = c.id AND s.status = 'completed'
      ),
      last_session_date = (
        SELECT MAX(scheduled_start_time) 
        FROM sessions s 
        WHERE s.client_id = c.id AND s.status = 'completed'
      ),
      first_session_date = COALESCE(c.first_session_date, (
        SELECT MIN(scheduled_start_time) 
        FROM sessions s 
        WHERE s.client_id = c.id AND s.status = 'completed'
      ))
    FROM clients c
    INNER JOIN inserted i ON c.id = i.client_id
    WHERE i.status = 'completed';
END;
GO
