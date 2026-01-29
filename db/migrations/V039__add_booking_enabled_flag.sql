-- Migration V039: Add booking_enabled flag to practitioners
-- This indicates whether the practitioner has online booking set up in Halaxy
-- Practitioners without this flag set to 1 should not appear in the public booking dropdown

-- Add the booking_enabled column
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'booking_enabled'
)
BEGIN
  ALTER TABLE practitioners ADD booking_enabled BIT DEFAULT 0;
  PRINT 'Added booking_enabled column to practitioners table';
END
GO

-- Set booking_enabled = 1 for Zoe (who has online booking configured in Halaxy)
UPDATE practitioners 
SET booking_enabled = 1
WHERE halaxy_practitioner_id = '1304541';
GO

-- Ensure Julian (test practitioner) has booking_enabled = 0 (not configured)
UPDATE practitioners 
SET booking_enabled = 0
WHERE halaxy_practitioner_id = '1473161';
GO

PRINT 'Migration V039 complete - booking_enabled column added';
