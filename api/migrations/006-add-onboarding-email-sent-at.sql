-- Add onboarding_email_sent_at column to track when onboarding email was sent
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('applications') AND name = 'onboarding_email_sent_at')
BEGIN
  ALTER TABLE applications ADD onboarding_email_sent_at DATETIME2 NULL;
  PRINT 'Added onboarding_email_sent_at column';
END
GO
