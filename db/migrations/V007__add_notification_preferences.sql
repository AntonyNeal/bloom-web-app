-- =============================================================================
-- V007__add_notification_preferences.sql
-- Migration: Add notification preferences for practitioners
-- =============================================================================

-- Add SMS notification preference (enabled by default)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'sms_notifications_enabled')
BEGIN
  ALTER TABLE practitioners ADD sms_notifications_enabled BIT DEFAULT 1 NOT NULL;
  PRINT 'Added sms_notifications_enabled column to practitioners';
END

-- Add email notification preference (enabled by default)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'email_notifications_enabled')
BEGIN
  ALTER TABLE practitioners ADD email_notifications_enabled BIT DEFAULT 1 NOT NULL;
  PRINT 'Added email_notifications_enabled column to practitioners';
END

-- Add quiet hours start (e.g., 21:00 = don't send after 9pm)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'quiet_hours_start')
BEGIN
  ALTER TABLE practitioners ADD quiet_hours_start TIME NULL;
  PRINT 'Added quiet_hours_start column to practitioners';
END

-- Add quiet hours end (e.g., 07:00 = don't send before 7am)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'quiet_hours_end')
BEGIN
  ALTER TABLE practitioners ADD quiet_hours_end TIME NULL;
  PRINT 'Added quiet_hours_end column to practitioners';
END

-- Add timezone for quiet hours calculation
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'notification_timezone')
BEGIN
  ALTER TABLE practitioners ADD notification_timezone NVARCHAR(50) DEFAULT 'Australia/Sydney';
  PRINT 'Added notification_timezone column to practitioners';
END

PRINT 'V007 migration complete - notification preferences added';
