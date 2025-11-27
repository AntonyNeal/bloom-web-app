gh run watch 19747890095-- ============================================================================
-- Seed Data: Dr. Sarah Chen Practice
-- Description: Realistic mock data for development and testing
-- Run after V4b migration
-- ============================================================================

-- Dr Sarah Chen's practitioner ID (fixed GUID for consistency)
DECLARE @PractitionerId UNIQUEIDENTIFIER = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';

-- ============================================================================
-- CLEAN UP EXISTING DATA
-- ============================================================================
DELETE FROM sessions WHERE practitioner_id = @PractitionerId;
DELETE FROM sync_status WHERE practitioner_id = @PractitionerId;
DELETE FROM clients WHERE practitioner_id = @PractitionerId;
DELETE FROM practitioners WHERE id = @PractitionerId;

PRINT 'Cleaned up existing data';

-- ============================================================================
-- PRACTITIONER
-- ============================================================================
INSERT INTO practitioners (
  id, halaxy_practitioner_id, halaxy_practitioner_role_id,
  first_name, last_name, display_name, email, phone,
  ahpra_number, qualification_type, specializations, timezone,
  weekly_session_target, weekly_revenue_target, monthly_revenue_target,
  status, last_synced_at
) VALUES (
  @PractitionerId, 'HAL-PRAC-001', 'HAL-PR-001',
  'Sarah', 'Chen', 'Dr. Sarah Chen', 'sarah.chen@bloom.health', '0412 345 678',
  'PSY0012345', 'clinical', '["Anxiety", "Depression", "PTSD", "Trauma", "Relationship Issues"]', 'Australia/Sydney',
  25, 5500.00, 22000.00,
  'active', GETDATE()
);

PRINT 'Created practitioner';

-- ============================================================================
-- CLIENTS
-- ============================================================================
DECLARE @Client1Id UNIQUEIDENTIFIER = 'C1111111-1111-1111-1111-111111111111';
DECLARE @Client2Id UNIQUEIDENTIFIER = 'C2222222-2222-2222-2222-222222222222';
DECLARE @Client3Id UNIQUEIDENTIFIER = 'C3333333-3333-3333-3333-333333333333';
DECLARE @Client4Id UNIQUEIDENTIFIER = 'C4444444-4444-4444-4444-444444444444';
DECLARE @Client5Id UNIQUEIDENTIFIER = 'C5555555-5555-5555-5555-555555555555';
DECLARE @Client6Id UNIQUEIDENTIFIER = 'C6666666-6666-6666-6666-666666666666';
DECLARE @Client7Id UNIQUEIDENTIFIER = 'C7777777-7777-7777-7777-777777777777';
DECLARE @Client8Id UNIQUEIDENTIFIER = 'C8888888-8888-8888-8888-888888888888';
DECLARE @Client9Id UNIQUEIDENTIFIER = 'C9999999-9999-9999-9999-999999999999';
DECLARE @Client10Id UNIQUEIDENTIFIER = 'CAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
DECLARE @Client11Id UNIQUEIDENTIFIER = 'CBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB';
DECLARE @Client12Id UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC';

INSERT INTO clients (id, halaxy_patient_id, practitioner_id, first_name, last_name, initials, gender, presenting_issues, mhcp_is_active, mhcp_total_sessions, mhcp_used_sessions, relationship_months, total_sessions, status)
VALUES 
  (@Client1Id, 'HAL-PAT-001', @PractitionerId, 'Jessica', 'Mitchell', 'JM', 'female', '["Anxiety", "Depression"]', 1, 10, 8, 14, 32, 'active'),
  (@Client2Id, 'HAL-PAT-002', @PractitionerId, 'Alex', 'Kumar', 'AK', 'male', '["Work Stress", "Relationship Issues"]', 1, 10, 3, 2, 3, 'active'),
  (@Client3Id, 'HAL-PAT-003', @PractitionerId, 'Rebecca', 'Liu', 'RL', 'female', '["PTSD", "Trauma"]', 1, 10, 6, 18, 45, 'active'),
  (@Client4Id, 'HAL-PAT-004', @PractitionerId, 'Benjamin', 'Taylor', 'BT', 'male', '["Grief", "Adjustment Disorder"]', 1, 10, 0, 0, 0, 'active'),
  (@Client5Id, 'HAL-PAT-005', @PractitionerId, 'Mia', 'Williams', 'MW', 'female', '["Social Anxiety", "Self-esteem"]', 1, 10, 9, 8, 18, 'active'),
  (@Client6Id, 'HAL-PAT-006', @PractitionerId, 'Daniel', 'Jones', 'DJ', 'male', '["Burnout", "Career Stress"]', 1, 10, 4, 5, 12, 'active'),
  (@Client7Id, 'HAL-PAT-007', @PractitionerId, 'Sophie', 'Patel', 'SP', 'female', '["Panic Disorder", "Agoraphobia"]', 1, 10, 7, 10, 24, 'active'),
  (@Client8Id, 'HAL-PAT-008', @PractitionerId, 'Ethan', 'Nguyen', 'EN', 'male', '["OCD", "Anxiety"]', 1, 10, 5, 6, 14, 'active'),
  (@Client9Id, 'HAL-PAT-009', @PractitionerId, 'Charlotte', 'Hughes', 'CH', 'female', '["Bipolar Disorder", "Depression"]', 1, 20, 15, 24, 56, 'active'),
  (@Client10Id, 'HAL-PAT-010', @PractitionerId, 'Laura', 'Garcia', 'LG', 'female', '["Perinatal Anxiety", "Adjustment"]', 1, 10, 2, 1, 2, 'active'),
  (@Client11Id, 'HAL-PAT-011', @PractitionerId, 'Kate', 'Morrison', 'KM', 'female', '["Eating Disorder", "Body Image"]', 1, 40, 28, 12, 36, 'active'),
  (@Client12Id, 'HAL-PAT-012', @PractitionerId, 'Thomas', 'Wright', 'TW', 'male', '["Insomnia", "Stress Management"]', 0, 0, 0, 4, 8, 'active');

PRINT 'Created 12 clients';

-- ============================================================================
-- SESSIONS - Today
-- ============================================================================
DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @BaseTime DATETIME2 = CAST(@Today AS DATETIME2);

-- Today's 5 sessions
INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-TODAY-001', @PractitionerId, @Client1Id, DATEADD(HOUR, 9, @BaseTime), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @BaseTime)), 50, 33, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00),
  ('HAL-APT-TODAY-002', @PractitionerId, @Client2Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @BaseTime)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @BaseTime)), 50, 4, 'standard_consultation', 'confirmed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-TODAY-003', @PractitionerId, @Client3Id, DATEADD(HOUR, 13, @BaseTime), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @BaseTime)), 50, 46, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00),
  ('HAL-APT-TODAY-004', @PractitionerId, @Client4Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 14, @BaseTime)), DATEADD(MINUTE, 20, DATEADD(HOUR, 15, @BaseTime)), 50, 1, 'initial_consultation', 'confirmed', 'in-person', 'medicare', 280.00),
  ('HAL-APT-TODAY-005', @PractitionerId, @Client5Id, DATEADD(HOUR, 16, @BaseTime), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @BaseTime)), 50, 19, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00);

PRINT 'Created today''s sessions';

-- ============================================================================
-- SESSIONS - Yesterday (completed)
-- ============================================================================
DECLARE @Yesterday DATE = DATEADD(DAY, -1, @Today);
DECLARE @YesterdayBase DATETIME2 = CAST(@Yesterday AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-YEST-001', @PractitionerId, @Client6Id, DATEADD(HOUR, 9, @YesterdayBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @YesterdayBase)), 50, 13, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-YEST-002', @PractitionerId, @Client7Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @YesterdayBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @YesterdayBase)), 50, 25, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-YEST-003', @PractitionerId, @Client8Id, DATEADD(HOUR, 13, @YesterdayBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @YesterdayBase)), 50, 15, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-YEST-004', @PractitionerId, @Client9Id, DATEADD(HOUR, 15, @YesterdayBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @YesterdayBase)), 50, 57, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

PRINT 'Created yesterday''s sessions';

-- ============================================================================
-- SESSIONS - Earlier this week
-- ============================================================================
DECLARE @TwoDaysAgo DATE = DATEADD(DAY, -2, @Today);
DECLARE @TwoDaysAgoBase DATETIME2 = CAST(@TwoDaysAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-2DA-001', @PractitionerId, @Client10Id, DATEADD(HOUR, 10, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, @TwoDaysAgoBase)), 50, 3, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-2DA-002', @PractitionerId, @Client11Id, DATEADD(HOUR, 11, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, @TwoDaysAgoBase)), 50, 37, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-2DA-003', @PractitionerId, @Client12Id, DATEADD(HOUR, 14, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, @TwoDaysAgoBase)), 50, 9, 'standard_consultation', 'completed', 'in-person', 'private', 280.00),
  ('HAL-APT-2DA-004', @PractitionerId, @Client1Id, DATEADD(HOUR, 16, @TwoDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @TwoDaysAgoBase)), 50, 32, 'standard_consultation', 'no_show', 'in-person', 'medicare', 220.00);

DECLARE @ThreeDaysAgo DATE = DATEADD(DAY, -3, @Today);
DECLARE @ThreeDaysAgoBase DATETIME2 = CAST(@ThreeDaysAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-3DA-001', @PractitionerId, @Client2Id, DATEADD(HOUR, 9, @ThreeDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @ThreeDaysAgoBase)), 50, 3, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-3DA-002', @PractitionerId, @Client5Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @ThreeDaysAgoBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @ThreeDaysAgoBase)), 50, 18, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-3DA-003', @PractitionerId, @Client7Id, DATEADD(HOUR, 13, @ThreeDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @ThreeDaysAgoBase)), 50, 24, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-3DA-004', @PractitionerId, @Client9Id, DATEADD(HOUR, 15, @ThreeDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @ThreeDaysAgoBase)), 50, 56, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

DECLARE @FourDaysAgo DATE = DATEADD(DAY, -4, @Today);
DECLARE @FourDaysAgoBase DATETIME2 = CAST(@FourDaysAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-4DA-001', @PractitionerId, @Client3Id, DATEADD(HOUR, 9, @FourDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @FourDaysAgoBase)), 50, 45, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-4DA-002', @PractitionerId, @Client6Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @FourDaysAgoBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @FourDaysAgoBase)), 50, 12, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-4DA-003', @PractitionerId, @Client8Id, DATEADD(HOUR, 13, @FourDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @FourDaysAgoBase)), 50, 14, 'standard_consultation', 'cancelled', 'in-person', 'medicare', 220.00),
  ('HAL-APT-4DA-004', @PractitionerId, @Client11Id, DATEADD(HOUR, 15, @FourDaysAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @FourDaysAgoBase)), 50, 36, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

PRINT 'Created earlier this week sessions';

-- ============================================================================
-- SESSIONS - Tomorrow and day after
-- ============================================================================
DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
DECLARE @TomorrowBase DATETIME2 = CAST(@Tomorrow AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-TOM-001', @PractitionerId, @Client6Id, DATEADD(HOUR, 9, @TomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @TomorrowBase)), 50, 14, 'standard_consultation', 'confirmed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-TOM-002', @PractitionerId, @Client8Id, DATEADD(MINUTE, 30, DATEADD(HOUR, 10, @TomorrowBase)), DATEADD(MINUTE, 20, DATEADD(HOUR, 11, @TomorrowBase)), 50, 16, 'standard_consultation', 'scheduled', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-TOM-003', @PractitionerId, @Client10Id, DATEADD(HOUR, 13, @TomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 13, @TomorrowBase)), 50, 4, 'standard_consultation', 'confirmed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-TOM-004', @PractitionerId, @Client12Id, DATEADD(HOUR, 15, @TomorrowBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 15, @TomorrowBase)), 50, 10, 'standard_consultation', 'scheduled', 'in-person', 'private', 280.00);

DECLARE @DayAfter DATE = DATEADD(DAY, 2, @Today);
DECLARE @DayAfterBase DATETIME2 = CAST(@DayAfter AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-DAT-001', @PractitionerId, @Client1Id, DATEADD(HOUR, 10, @DayAfterBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 10, @DayAfterBase)), 50, 34, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00),
  ('HAL-APT-DAT-002', @PractitionerId, @Client7Id, DATEADD(HOUR, 14, @DayAfterBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, @DayAfterBase)), 50, 26, 'standard_consultation', 'scheduled', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-DAT-003', @PractitionerId, @Client9Id, DATEADD(HOUR, 16, @DayAfterBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @DayAfterBase)), 50, 58, 'standard_consultation', 'scheduled', 'in-person', 'medicare', 220.00);

PRINT 'Created upcoming sessions';

-- ============================================================================
-- SESSIONS - Earlier this month (for monthly stats)
-- ============================================================================
DECLARE @WeekAgo DATE = DATEADD(DAY, -7, @Today);
DECLARE @WeekAgoBase DATETIME2 = CAST(@WeekAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-W1-001', @PractitionerId, @Client1Id, DATEADD(HOUR, 9, @WeekAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @WeekAgoBase)), 50, 30, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W1-002', @PractitionerId, @Client3Id, DATEADD(HOUR, 11, @WeekAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, @WeekAgoBase)), 50, 43, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-W1-003', @PractitionerId, @Client5Id, DATEADD(HOUR, 14, @WeekAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, @WeekAgoBase)), 50, 16, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W1-004', @PractitionerId, @Client7Id, DATEADD(HOUR, 16, @WeekAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @WeekAgoBase)), 50, 22, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00);

DECLARE @TwoWeeksAgo DATE = DATEADD(DAY, -14, @Today);
DECLARE @TwoWeeksAgoBase DATETIME2 = CAST(@TwoWeeksAgo AS DATETIME2);

INSERT INTO sessions (halaxy_appointment_id, practitioner_id, client_id, scheduled_start_time, scheduled_end_time, duration_minutes, session_number, session_type, status, location_type, billing_type, invoice_amount)
VALUES 
  ('HAL-APT-W2-001', @PractitionerId, @Client2Id, DATEADD(HOUR, 9, @TwoWeeksAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, @TwoWeeksAgoBase)), 50, 2, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W2-002', @PractitionerId, @Client6Id, DATEADD(HOUR, 11, @TwoWeeksAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 11, @TwoWeeksAgoBase)), 50, 11, 'standard_consultation', 'completed', 'telehealth', 'medicare', 220.00),
  ('HAL-APT-W2-003', @PractitionerId, @Client8Id, DATEADD(HOUR, 14, @TwoWeeksAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 14, @TwoWeeksAgoBase)), 50, 13, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W2-004', @PractitionerId, @Client10Id, DATEADD(HOUR, 16, @TwoWeeksAgoBase), DATEADD(MINUTE, 50, DATEADD(HOUR, 16, @TwoWeeksAgoBase)), 50, 2, 'standard_consultation', 'completed', 'in-person', 'medicare', 220.00),
  ('HAL-APT-W2-005', @PractitionerId, @Client12Id, DATEADD(HOUR, 9, DATEADD(DAY, 1, @TwoWeeksAgoBase)), DATEADD(MINUTE, 50, DATEADD(HOUR, 9, DATEADD(DAY, 1, @TwoWeeksAgoBase))), 50, 8, 'standard_consultation', 'completed', 'in-person', 'private', 280.00);

PRINT 'Created historical sessions';

-- ============================================================================
-- SYNC STATUS
-- ============================================================================
INSERT INTO sync_status (
  practitioner_id, is_connected, last_successful_sync, last_sync_attempt,
  consecutive_failures, pending_changes
) VALUES (
  @PractitionerId, 1, DATEADD(MINUTE, -5, GETDATE()), DATEADD(MINUTE, -5, GETDATE()), 0, 0
);

PRINT 'Created sync status';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Practitioner' as Entity, COUNT(*) as Count FROM practitioners WHERE id = @PractitionerId;
SELECT 'Clients' as Entity, COUNT(*) as Count FROM clients WHERE practitioner_id = @PractitionerId;
SELECT 'Sessions' as Entity, COUNT(*) as Count FROM sessions WHERE practitioner_id = @PractitionerId;
SELECT 'Sync Status' as Entity, COUNT(*) as Count FROM sync_status WHERE practitioner_id = @PractitionerId;

SELECT 'Sessions by Status:' as Info;
SELECT status, COUNT(*) as count FROM sessions WHERE practitioner_id = @PractitionerId GROUP BY status;

PRINT '';
PRINT '============================================';
PRINT 'SEED COMPLETE!';
PRINT '============================================';
PRINT 'Practitioner ID: A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
PRINT 'API Endpoint: /api/practitioners/A1B2C3D4-E5F6-7890-ABCD-EF1234567890/dashboard';
PRINT '============================================';
