-- Migration 005: Add onboarding token fields to practitioners table
-- Adds fields needed for tracking onboarding progress

BEGIN TRANSACTION;

-- Add onboarding token column if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'onboarding_token'
)
BEGIN
  ALTER TABLE practitioners
  ADD onboarding_token nvarchar(255) NULL;
  PRINT 'Added column: onboarding_token';
END;

-- Add onboarding token expiry column if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'onboarding_token_expires_at'
)
BEGIN
  ALTER TABLE practitioners
  ADD onboarding_token_expires_at datetime2 NULL;
  PRINT 'Added column: onboarding_token_expires_at';
END;

-- Add onboarding completed timestamp if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'onboarding_completed_at'
)
BEGIN
  ALTER TABLE practitioners
  ADD onboarding_completed_at datetime2 NULL;
  PRINT 'Added column: onboarding_completed_at';
END;

COMMIT;

PRINT 'Migration 005 completed successfully!';
