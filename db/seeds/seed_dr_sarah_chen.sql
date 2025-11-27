-- ============================================================================
-- Seed Data: Dr. Sarah Chen Practice
-- Description: Realistic mock data for development and testing
-- Author: System
-- Date: 2025-01-28
-- ============================================================================
-- This script creates a complete mock practice setup for Dr Sarah Chen including:
-- - Practitioner profile
-- - 12 active clients with varied presenting issues
-- - Sessions for today (5 sessions), this week, and this month
-- - Sync status indicating healthy Halaxy connection
-- ============================================================================

-- Use a specific GUID so we can reference it reliably
-- Dr Sarah Chen's practitioner ID
DECLARE @PractitionerId UNIQUEIDENTIFIER = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';

-- Check if practitioner already exists
IF NOT EXISTS (SELECT 1 FROM practitioners WHERE id = @PractitionerId)
BEGIN
  PRINT 'Creating practitioner: Dr. Sarah Chen';
  
  INSERT INTO practitioners (
    id,
    halaxy_practitioner_id,
    halaxy_practitioner_role_id,
    first_name,
    last_name,
    display_name,
    email,
    phone,
    ahpra_number,
    qualification_type,
    specializations,
    timezone,
    weekly_session_target,
    weekly_revenue_target,
    monthly_revenue_target,
    status,
    last_synced_at
  ) VALUES (
    @PractitionerId,
    'HAL-PRAC-001',
    'HAL-PR-001',
    'Sarah',
    'Chen',
    'Dr. Sarah Chen',
    'sarah.chen@bloom.health',
    '0412 345 678',
    'PSY0012345',
    'clinical',
    '["Anxiety", "Depression", "PTSD", "Trauma", "Relationship Issues"]',
    'Australia/Sydney',
    25,
    5500.00,
    22000.00,
    'active',
    GETDATE()
  );
END
ELSE
BEGIN
  PRINT 'Practitioner Dr. Sarah Chen already exists - updating...';
  UPDATE practitioners SET
    display_name = 'Dr. Sarah Chen',
    specializations = '["Anxiety", "Depression", "PTSD", "Trauma", "Relationship Issues"]',
    weekly_session_target = 25,
    weekly_revenue_target = 5500.00,
    monthly_revenue_target = 22000.00,
    last_synced_at = GETDATE()
  WHERE id = @PractitionerId;
END

-- ============================================================================
-- CLIENT DATA
-- 12 diverse clients with realistic presenting issues and MHCP status
-- ============================================================================

-- Client 1: JM - Long-term anxiety and depression client
DECLARE @Client1Id UNIQUEIDENTIFIER = 'C1111111-1111-1111-1111-111111111111';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client1Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, relationship_months, total_sessions, last_session_date, status
  ) VALUES (
    @Client1Id, 'HAL-PAT-001', @PractitionerId,
    'Jessica', 'Mitchell', 'JM', 'j.mitchell@email.com', '1988-03-15', 'female',
    '["Anxiety", "Depression"]', 1, 10, 8,
    DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 9, GETDATE()), 'Dr. Robert Wong',
    DATEADD(MONTH, -14, GETDATE()), 14, 32, DATEADD(DAY, -7, GETDATE()), 'active'
  );
END

-- Client 2: AK - Work stress and relationship issues
DECLARE @Client2Id UNIQUEIDENTIFIER = 'C2222222-2222-2222-2222-222222222222';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client2Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client2Id, 'HAL-PAT-002', @PractitionerId,
    'Alex', 'Kumar', 'AK', 'alex.kumar@email.com', '1992-07-22', 'male',
    '["Work Stress", "Relationship Issues"]', 1, 10, 3,
    DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 11, GETDATE()), 'Dr. Michelle Lee',
    DATEADD(MONTH, -2, GETDATE()), 3, DATEADD(DAY, -14, GETDATE()), 'active'
  );
END

-- Client 3: RL - PTSD from trauma
DECLARE @Client3Id UNIQUEIDENTIFIER = 'C3333333-3333-3333-3333-333333333333';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client3Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client3Id, 'HAL-PAT-003', @PractitionerId,
    'Rebecca', 'Liu', 'RL', 'r.liu@email.com', '1985-11-08', 'female',
    '["PTSD", "Trauma"]', 1, 10, 6,
    DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 'Dr. James Chen',
    DATEADD(MONTH, -18, GETDATE()), 45, DATEADD(DAY, -5, GETDATE()), 'active'
  );
END

-- Client 4: BT - New client with grief and adjustment
DECLARE @Client4Id UNIQUEIDENTIFIER = 'C4444444-4444-4444-4444-444444444444';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client4Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client4Id, 'HAL-PAT-004', @PractitionerId,
    'Benjamin', 'Taylor', 'BT', 'b.taylor@email.com', '1979-05-30', 'male',
    '["Grief", "Adjustment Disorder"]', 1, 10, 0,
    DATEADD(WEEK, -1, GETDATE()), DATEADD(MONTH, 11, GETDATE()), 'Dr. Sarah Williams',
    NULL, 0, NULL, 'active'
  );
END

-- Client 5: MW - Social anxiety and self-esteem
DECLARE @Client5Id UNIQUEIDENTIFIER = 'C5555555-5555-5555-5555-555555555555';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client5Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client5Id, 'HAL-PAT-005', @PractitionerId,
    'Mia', 'Williams', 'MW', 'mia.w@email.com', '1995-09-12', 'female',
    '["Social Anxiety", "Self-esteem"]', 1, 10, 9,
    DATEADD(MONTH, -4, GETDATE()), DATEADD(MONTH, 8, GETDATE()), 'Dr. Peter Jackson',
    DATEADD(MONTH, -8, GETDATE()), 18, DATEADD(DAY, -3, GETDATE()), 'active'
  );
END

-- Client 6: DJ - Burnout and career stress
DECLARE @Client6Id UNIQUEIDENTIFIER = 'C6666666-6666-6666-6666-666666666666';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client6Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client6Id, 'HAL-PAT-006', @PractitionerId,
    'Daniel', 'Jones', 'DJ', 'd.jones@email.com', '1983-02-28', 'male',
    '["Burnout", "Career Stress"]', 1, 10, 4,
    DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 'Dr. Emma Brown',
    DATEADD(MONTH, -5, GETDATE()), 12, DATEADD(DAY, -10, GETDATE()), 'active'
  );
END

-- Client 7: SP - Panic disorder
DECLARE @Client7Id UNIQUEIDENTIFIER = 'C7777777-7777-7777-7777-777777777777';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client7Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client7Id, 'HAL-PAT-007', @PractitionerId,
    'Sophie', 'Patel', 'SP', 's.patel@email.com', '1990-12-05', 'female',
    '["Panic Disorder", "Agoraphobia"]', 1, 10, 7,
    DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 9, GETDATE()), 'Dr. David Kim',
    DATEADD(MONTH, -10, GETDATE()), 24, DATEADD(DAY, -8, GETDATE()), 'active'
  );
END

-- Client 8: EN - OCD
DECLARE @Client8Id UNIQUEIDENTIFIER = 'C8888888-8888-8888-8888-888888888888';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client8Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client8Id, 'HAL-PAT-008', @PractitionerId,
    'Ethan', 'Nguyen', 'EN', 'e.nguyen@email.com', '1997-04-18', 'male',
    '["OCD", "Anxiety"]', 1, 10, 5,
    DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 'Dr. Lisa Thompson',
    DATEADD(MONTH, -6, GETDATE()), 14, DATEADD(DAY, -6, GETDATE()), 'active'
  );
END

-- Client 9: CH - Bipolar disorder
DECLARE @Client9Id UNIQUEIDENTIFIER = 'C9999999-9999-9999-9999-999999999999';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client9Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client9Id, 'HAL-PAT-009', @PractitionerId,
    'Charlotte', 'Hughes', 'CH', 'c.hughes@email.com', '1986-08-25', 'female',
    '["Bipolar Disorder", "Depression"]', 1, 20, 15,
    DATEADD(MONTH, -6, GETDATE()), DATEADD(MONTH, 6, GETDATE()), 'Dr. Psychiatrist Smith',
    DATEADD(MONTH, -24, GETDATE()), 56, DATEADD(DAY, -4, GETDATE()), 'active'
  );
END

-- Client 10: LG - Perinatal anxiety
DECLARE @Client10Id UNIQUEIDENTIFIER = 'CAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client10Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client10Id, 'HAL-PAT-010', @PractitionerId,
    'Laura', 'Garcia', 'LG', 'l.garcia@email.com', '1991-01-20', 'female',
    '["Perinatal Anxiety", "Adjustment"]', 1, 10, 2,
    DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 11, GETDATE()), 'Dr. Maria Santos (OB)',
    DATEADD(MONTH, -1, GETDATE()), 2, DATEADD(DAY, -12, GETDATE()), 'active'
  );
END

-- Client 11: KM - Eating disorder
DECLARE @Client11Id UNIQUEIDENTIFIER = 'CBBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client11Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    mhcp_plan_start_date, mhcp_plan_expiry_date, mhcp_referring_gp,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client11Id, 'HAL-PAT-011', @PractitionerId,
    'Kate', 'Morrison', 'KM', 'k.morrison@email.com', '1999-06-14', 'female',
    '["Eating Disorder", "Body Image"]', 1, 40, 28,
    DATEADD(MONTH, -8, GETDATE()), DATEADD(MONTH, 4, GETDATE()), 'Dr. Dietitian Ref',
    DATEADD(MONTH, -12, GETDATE()), 36, DATEADD(DAY, -2, GETDATE()), 'active'
  );
END

-- Client 12: TW - Insomnia and stress (private pay, no MHCP)
DECLARE @Client12Id UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC';
IF NOT EXISTS (SELECT 1 FROM clients WHERE id = @Client12Id)
BEGIN
  INSERT INTO clients (
    id, halaxy_patient_id, practitioner_id,
    first_name, last_name, initials, email, date_of_birth, gender,
    presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions,
    first_session_date, total_sessions, last_session_date, status
  ) VALUES (
    @Client12Id, 'HAL-PAT-012', @PractitionerId,
    'Thomas', 'Wright', 'TW', 't.wright@email.com', '1975-10-03', 'male',
    '["Insomnia", "Stress Management"]', 0, 0, 0,
    DATEADD(MONTH, -4, GETDATE()), 8, DATEADD(DAY, -9, GETDATE()), 'active'
  );
END

PRINT 'Created 12 client records';

-- ============================================================================
-- SESSION DATA
-- Create sessions for today, this week, and this month
-- ============================================================================

-- Clean up old test sessions for this practitioner
DELETE FROM sessions WHERE practitioner_id = @PractitionerId;

-- Get today's date at midnight (Sydney time)
DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @BaseTime DATETIME2 = CAST(@Today AS DATETIME2);

-- ============================================================================
-- TODAY'S SESSIONS (5 sessions - matches sample data in BloomHomepage)
-- ============================================================================
PRINT 'Creating today''s sessions...';

-- Session 1: 9:00 AM - JM (Anxiety, Depression)
INSERT INTO sessions (
  id, halaxy_appointment_id, practitioner_id, client_id,
  scheduled_start_time, scheduled_end_time, duration_minutes,
  session_number, session_type, status, location_type, billing_type, invoice_amount
) VALUES (
  NEWID(), 'HAL-APT-TODAY-001', @PractitionerId, @Client1Id,
  DATEADD(HOUR, 9, @BaseTime), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @BaseTime)), 50,
  33, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00
);

-- Session 2: 10:30 AM - AK (Work Stress, Relationship Issues)
INSERT INTO sessions (
  id, halaxy_appointment_id, practitioner_id, client_id,
  scheduled_start_time, scheduled_end_time, duration_minutes,
  session_number, session_type, status, location_type, billing_type, invoice_amount
) VALUES (
  NEWID(), 'HAL-APT-TODAY-002', @PractitionerId, @Client2Id,
  DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @BaseTime)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @BaseTime)), 50,
  4, 'standard_consultation', 'confirmed', 'telehealth', 'medicare', 220.00
);

-- Session 3: 1:00 PM - RL (PTSD)
INSERT INTO sessions (
  id, halaxy_appointment_id, practitioner_id, client_id,
  scheduled_start_time, scheduled_end_time, duration_minutes,
  session_number, session_type, status, location_type, billing_type, invoice_amount
) VALUES (
  NEWID(), 'HAL-APT-TODAY-003', @PractitionerId, @Client3Id,
  DATEADD(HOUR, 13, @BaseTime), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @BaseTime)), 50,
  46, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00
);

-- Session 4: 2:30 PM - BT (Grief, Adjustment) - FIRST SESSION
INSERT INTO sessions (
  id, halaxy_appointment_id, practitioner_id, client_id,
  scheduled_start_time, scheduled_end_time, duration_minutes,
  session_number, session_type, status, location_type, billing_type, invoice_amount
) VALUES (
  NEWID(), 'HAL-APT-TODAY-004', @PractitionerId, @Client4Id,
  DATEADD(MINUTE, 30, DATEADD(HOUR, 14, @BaseTime)), DATEADD(MINUTE, 20, DATEADD(HOUR, 15, @BaseTime)), 50,
  1, 'initial_consultation', 'confirmed', 'in-person', 'medicare', 280.00
);

-- Session 5: 4:00 PM - MW (Social Anxiety, Self-esteem)
INSERT INTO sessions (
  id, halaxy_appointment_id, practitioner_id, client_id,
  scheduled_start_time, scheduled_end_time, duration_minutes,
  session_number, session_type, status, location_type, billing_type, invoice_amount
) VALUES (
  NEWID(), 'HAL-APT-TODAY-005', @PractitionerId, @Client5Id,
  DATEADD(HOUR, 16, @BaseTime), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @BaseTime)), 50,
  19, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00
);

PRINT 'Created 5 sessions for today';

-- ============================================================================
-- COMPLETED SESSIONS EARLIER THIS WEEK (to build weekly stats)
-- ============================================================================
PRINT 'Creating earlier this week''s sessions...';

-- Yesterday sessions (4 completed)
DECLARE @Yesterday DATE = DATEADD(DAY, -1, @Today);
DECLARE @YesterdayBase DATETIME2 = CAST(@Yesterday AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-YEST-001', @PractitionerId, @Client6Id, DATEADD(HOUR, 9, @YesterdayBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @YesterdayBase)), 50, 13, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-YEST-002', @PractitionerId, @Client7Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @YesterdayBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @YesterdayBase)), 50, 25, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-YEST-003', @PractitionerId, @Client8Id, DATEADD(HOUR, 13, @YesterdayBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @YesterdayBase)), 50, 15, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-YEST-004', @PractitionerId, @Client9Id, DATEADD(HOUR, 15, @YesterdayBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @YesterdayBase)), 50, 57, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

-- Two days ago (3 completed, 1 no-show)
DECLARE @TwoDaysAgo DATE = DATEADD(DAY, -2, @Today);
DECLARE @TwoDaysAgoBase DATETIME2 = CAST(@TwoDaysAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-2DA-001', @PractitionerId, @Client10Id, DATEADD(HOUR, 10, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, @TwoDaysAgoBase)), 50, 3, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-2DA-002', @PractitionerId, @Client11Id, DATEADD(HOUR, 11, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, @TwoDaysAgoBase)), 50, 37, 'standard_consultation', 'completed', 'medicare', 'medicare', 220.00),
  ('HAL-APT-2DA-003', @PractitionerId, @Client12Id, DATEADD(HOUR, 14, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, @TwoDaysAgoBase)), 50, 9, 'standard_consultation', 'completed', 'in-person', 'private', 280.00),
  ('HAL-APT-2DA-004', @PractitionerId, @Client1Id, DATEADD(HOUR, 16, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @TwoDaysAgoBase)), 50, 32, 'standard_consultation', 'no_show', 'in-person', 'medicare', 220.00);

-- Three days ago (4 completed)
DECLARE @ThreeDaysAgo DATE = DATEADD(DAY, -3, @Today);
DECLARE @ThreeDaysAgoBase DATETIME2 = CAST(@ThreeDaysAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-3DA-001', @PractitionerId, @Client2Id, DATEADD(HOUR, 9, @ThreeDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @ThreeDaysAgoBase)), 50, 3, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-3DA-002', @PractitionerId, @Client5Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @ThreeDaysAgoBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @ThreeDaysAgoBase)), 50, 18, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-3DA-003', @PractitionerId, @Client7Id, DATEADD(HOUR, 13, @ThreeDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @ThreeDaysAgoBase)), 50, 24, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-3DA-004', @PractitionerId, @Client9Id, DATEADD(HOUR, 15, @ThreeDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @ThreeDaysAgoBase)), 50, 56, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

-- Four days ago (3 completed, 1 cancelled)
DECLARE @FourDaysAgo DATE = DATEADD(DAY, -4, @Today);
DECLARE @FourDaysAgoBase DATETIME2 = CAST(@FourDaysAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-4DA-001', @PractitionerId, @Client3Id, DATEADD(HOUR, 9, @FourDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @FourDaysAgoBase)), 50, 45, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-4DA-002', @PractitionerId, @Client6Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @FourDaysAgoBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @FourDaysAgoBase)), 50, 12, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-4DA-003', @PractitionerId, @Client8Id, DATEADD(HOUR, 13, @FourDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @FourDaysAgoBase)), 50, 14, 'standard_consultation', 'cancelled', 'in-person', 'medicare', 220.00),
  ('HAL-APT-4DA-004', @PractitionerId, @Client11Id, DATEADD(HOUR, 15, @FourDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @FourDaysAgoBase)), 50, 36, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

PRINT 'Created sessions for earlier this week';

-- ============================================================================
-- UPCOMING SESSIONS (tomorrow and rest of week)
-- ============================================================================
PRINT 'Creating upcoming sessions...';

-- Tomorrow sessions (4 scheduled)
DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
DECLARE @TomorrowBase DATETIME2 = CAST(@Tomorrow AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-TOM-001', @PractitionerId, @Client6Id, DATEADD(HOUR, 9, @TomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @TomorrowBase)), 50, 14, 'standard_consultation', 'confirmed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-TOM-002', @PractitionerId, @Client8Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @TomorrowBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @TomorrowBase)), 50, 16, 'standard_consultation', 'scheduled', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-TOM-003', @PractitionerId, @Client10Id, DATEADD(HOUR, 13, @TomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @TomorrowBase)), 50, 4, 'standard_consultation', 'confirmed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-TOM-004', @PractitionerId, @Client12Id, DATEADD(HOUR, 15, @TomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @TomorrowBase)), 50, 10, 'standard_consultation', 'scheduled', 'in-person', 'private', 280.00);

-- Day after tomorrow (3 scheduled)
DECLARE @DayAfterTomorrow DATE = DATEADD(DAY, 2, @Today);
DECLARE @DayAfterTomorrowBase DATETIME2 = CAST(@DayAfterTomorrow AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-DAT-001', @PractitionerId, @Client1Id, DATEADD(HOUR, 10, @DayAfterTomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, @DayAfterTomorrowBase)), 50, 34, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00),
  ('HAL-APT-DAT-002', @PractitionerId, @Client7Id, DATEADD(HOUR, 14, @DayAfterTomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, @DayAfterTomorrowBase)), 50, 26, 'standard_consultation', 'scheduled', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-DAT-003', @PractitionerId, @Client9Id, DATEADD(HOUR, 16, @DayAfterTomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @DayAfterTomorrowBase)), 50, 58, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00);

PRINT 'Created upcoming sessions';

-- ============================================================================
-- EARLIER IN MONTH SESSIONS (for monthly stats)
-- ============================================================================
PRINT 'Creating earlier in month sessions...';

-- Week 1 of month (assuming we're in week 4)
DECLARE @WeekOneStart DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
DECLARE @WeekOneBase DATETIME2 = CAST(@WeekOneStart AS DATETIME2);

-- Add 15 completed sessions from weeks 1-3 of the month
INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  -- Week 1
  ('HAL-APT-W1-001', @PractitionerId, @Client1Id, DATEADD(HOUR, 9, DATEADD(DAY, 1, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, DATEADD(DAY, 1, @WeekOneBase))), 50, 30, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W1-002', @PractitionerId, @Client2Id, DATEADD(HOUR, 10, DATEADD(DAY, 1, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, DATEADD(DAY, 1, @WeekOneBase))), 50, 1, 'initial_consultation', 'completed', 'in-person', 'medicare', 280.00),
  ('HAL-APT-W1-003', @PractitionerId, @Client3Id, DATEADD(HOUR, 14, DATEADD(DAY, 2, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, DATEADD(DAY, 2, @WeekOneBase))), 50, 43, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-W1-004', @PractitionerId, @Client5Id, DATEADD(HOUR, 11, DATEADD(DAY, 3, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, DATEADD(DAY, 3, @WeekOneBase))), 50, 16, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W1-005', @PractitionerId, @Client6Id, DATEADD(HOUR, 15, DATEADD(DAY, 4, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, DATEADD(DAY, 4, @WeekOneBase))), 50, 10, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  
  -- Week 2
  ('HAL-APT-W2-001', @PractitionerId, @Client7Id, DATEADD(HOUR, 9, DATEADD(DAY, 7, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, DATEADD(DAY, 7, @WeekOneBase))), 50, 22, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W2-002', @PractitionerId, @Client8Id, DATEADD(HOUR, 11, DATEADD(DAY, 8, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, DATEADD(DAY, 8, @WeekOneBase))), 50, 12, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-W2-003', @PractitionerId, @Client9Id, DATEADD(HOUR, 14, DATEADD(DAY, 8, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, DATEADD(DAY, 8, @WeekOneBase))), 50, 54, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W2-004', @PractitionerId, @Client10Id, DATEADD(HOUR, 10, DATEADD(DAY, 9, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, DATEADD(DAY, 9, @WeekOneBase))), 50, 1, 'initial_consultation', 'completed', 'in-person', 'medicare', 280.00),
  ('HAL-APT-W2-005', @PractitionerId, @Client11Id, DATEADD(HOUR, 15, DATEADD(DAY, 10, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, DATEADD(DAY, 10, @WeekOneBase))), 50, 34, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W2-006', @PractitionerId, @Client12Id, DATEADD(HOUR, 16, DATEADD(DAY, 10, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, DATEADD(DAY, 10, @WeekOneBase))), 50, 7, 'standard_consultation', 'completed', 'in-person', 'private', 280.00),
  
  -- Week 3
  ('HAL-APT-W3-001', @PractitionerId, @Client1Id, DATEADD(HOUR, 9, DATEADD(DAY, 14, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, DATEADD(DAY, 14, @WeekOneBase))), 50, 31, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W3-002', @PractitionerId, @Client3Id, DATEADD(HOUR, 11, DATEADD(DAY, 15, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, DATEADD(DAY, 15, @WeekOneBase))), 50, 44, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-W3-003', @PractitionerId, @Client5Id, DATEADD(HOUR, 14, DATEADD(DAY, 15, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, DATEADD(DAY, 15, @WeekOneBase))), 50, 17, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W3-004', @PractitionerId, @Client7Id, DATEADD(HOUR, 10, DATEADD(DAY, 16, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, DATEADD(DAY, 16, @WeekOneBase))), 50, 23, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W3-005', @PractitionerId, @Client9Id, DATEADD(HOUR, 15, DATEADD(DAY, 17, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, DATEADD(DAY, 17, @WeekOneBase))), 50, 55, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W3-006', @PractitionerId, @Client11Id, DATEADD(HOUR, 11, DATEADD(DAY, 17, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, DATEADD(DAY, 17, @WeekOneBase))), 50, 35, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W3-007', @PractitionerId, @Client2Id, DATEADD(HOUR, 9, DATEADD(DAY, 18, @WeekOneBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, DATEADD(DAY, 18, @WeekOneBase))), 50, 2, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00);

PRINT 'Created earlier in month sessions';

-- ============================================================================
-- SYNC STATUS
-- ============================================================================
PRINT 'Creating sync status...';

-- Remove existing sync status for this practitioner
DELETE FROM sync_status WHERE practitioner_id = @PractitionerId;

INSERT INTO sync_status (
  id,
  practitioner_id,
  is_connected,
  last_successful_sync,
  last_sync_attempt,
  consecutive_failures,
  pending_changes
) VALUES (
  NEWID(),
  @PractitionerId,
  1,
  DATEADD(MINUTE, -5, GETDATE()),
  DATEADD(MINUTE, -5, GETDATE()),
  0,
  0
);

PRINT 'Created sync status';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
PRINT '';
PRINT '============================================';
PRINT 'SEED DATA VERIFICATION';
PRINT '============================================';

SELECT 'Practitioner' as Entity, COUNT(*) as Count FROM practitioners WHERE id = @PractitionerId;
SELECT 'Clients' as Entity, COUNT(*) as Count FROM clients WHERE practitioner_id = @PractitionerId;
SELECT 'Sessions' as Entity, COUNT(*) as Count FROM sessions WHERE practitioner_id = @PractitionerId;
SELECT 'Sync Status' as Entity, COUNT(*) as Count FROM sync_status WHERE practitioner_id = @PractitionerId;

PRINT '';
PRINT 'Sessions breakdown:';
SELECT status, COUNT(*) as count FROM sessions WHERE practitioner_id = @PractitionerId GROUP BY status;

PRINT '';
PRINT 'Practitioner ID to use in API:';
SELECT CAST(@PractitionerId AS NVARCHAR(50)) as PractitionerId;

PRINT '';
PRINT '============================================';
PRINT 'SEED COMPLETE!';
PRINT '============================================';
PRINT 'Use this practitioner ID in your API calls:';
PRINT 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
PRINT '';
PRINT 'Example API call:';
PRINT 'GET /api/practitioners/A1B2C3D4-E5F6-7890-ABCD-EF1234567890/dashboard';
PRINT '============================================';
