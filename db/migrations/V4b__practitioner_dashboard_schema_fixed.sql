-- ============================================================================
-- Migration: V4b__practitioner_dashboard_schema_fixed.sql
-- Description: Schema for practitioner dashboard data (synced from Halaxy)
-- Fixed: Removed PERSISTED from non-deterministic computed columns
-- ============================================================================

-- ============================================================================
-- PRACTITIONERS TABLE
-- Stores practitioner profiles synced from Halaxy
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='practitioners' AND xtype='U')
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
  qualification_type NVARCHAR(50),
  specializations NVARCHAR(MAX),
  
  -- Profile
  profile_photo_url NVARCHAR(500),
  timezone NVARCHAR(50) DEFAULT 'Australia/Sydney',
  
  -- Targets
  weekly_session_target INT DEFAULT 25,
  weekly_revenue_target DECIMAL(10,2) DEFAULT 5500.00,
  monthly_revenue_target DECIMAL(10,2) DEFAULT 22000.00,
  
  -- Status
  status NVARCHAR(20) DEFAULT 'active',
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  last_synced_at DATETIME2
);
GO

-- ============================================================================
-- CLIENTS TABLE
-- Stores client/patient data synced from Halaxy
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='clients' AND xtype='U')
CREATE TABLE clients (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_patient_id NVARCHAR(50) NOT NULL,
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  
  -- Personal info
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  initials NVARCHAR(10) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(20),
  date_of_birth DATE,
  gender NVARCHAR(20),
  
  -- Clinical context
  presenting_issues NVARCHAR(MAX),
  treatment_plan NVARCHAR(MAX),
  
  -- MHCP tracking
  mhcp_is_active BIT DEFAULT 0,
  mhcp_total_sessions INT DEFAULT 10,
  mhcp_used_sessions INT DEFAULT 0,
  mhcp_remaining_sessions AS (mhcp_total_sessions - mhcp_used_sessions),
  mhcp_plan_start_date DATE,
  mhcp_plan_expiry_date DATE,
  mhcp_referring_gp NVARCHAR(200),
  mhcp_referral_date DATE,
  
  -- Relationship tracking
  first_session_date DATE,
  relationship_months INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  last_session_date DATE,
  
  -- Status
  status NVARCHAR(20) DEFAULT 'active',
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  last_synced_at DATETIME2,
  
  -- Constraints
  CONSTRAINT fk_clients_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
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
  session_type NVARCHAR(50) NOT NULL DEFAULT 'standard_consultation',
  status NVARCHAR(20) NOT NULL DEFAULT 'scheduled',
  
  -- Location
  location_type NVARCHAR(20) DEFAULT 'in-person',
  location_details NVARCHAR(500),
  
  -- Clinical notes
  notes NVARCHAR(MAX),
  presenting_issues_session NVARCHAR(MAX),
  interventions_used NVARCHAR(MAX),
  
  -- Billing
  billing_type NVARCHAR(20) DEFAULT 'medicare',
  invoice_amount DECIMAL(10,2),
  is_paid BIT DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  last_synced_at DATETIME2,
  
  -- Constraints
  CONSTRAINT fk_sessions_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_client FOREIGN KEY (client_id) 
    REFERENCES clients(id)
);
GO

-- ============================================================================
-- SYNC STATUS TABLE
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sync_status' AND xtype='U')
CREATE TABLE sync_status (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  practitioner_id UNIQUEIDENTIFIER NOT NULL,
  
  is_connected BIT DEFAULT 1,
  last_successful_sync DATETIME2,
  last_sync_attempt DATETIME2,
  
  consecutive_failures INT DEFAULT 0,
  last_error_message NVARCHAR(MAX),
  
  pending_changes INT DEFAULT 0,
  
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  
  CONSTRAINT fk_sync_status_practitioner FOREIGN KEY (practitioner_id) 
    REFERENCES practitioners(id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- VIEWS FOR DASHBOARD QUERIES
-- ============================================================================

-- Weekly stats summary
IF OBJECT_ID('vw_weekly_stats', 'V') IS NOT NULL DROP VIEW vw_weekly_stats;
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
IF OBJECT_ID('vw_monthly_stats', 'V') IS NOT NULL DROP VIEW vw_monthly_stats;
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
IF OBJECT_ID('vw_upcoming_stats', 'V') IS NOT NULL DROP VIEW vw_upcoming_stats;
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

-- MHCP ending soon
IF OBJECT_ID('vw_mhcp_ending_soon', 'V') IS NOT NULL DROP VIEW vw_mhcp_ending_soon;
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

PRINT 'Schema migration completed successfully!';
