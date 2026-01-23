-- V032: Add Halaxy clinic and fee IDs to practitioners table
-- These are needed for the Halaxy booking API to work correctly with per-practitioner credentials

-- Add new columns
ALTER TABLE practitioners
ADD halaxy_clinic_id NVARCHAR(50) NULL,
    halaxy_fee_id NVARCHAR(50) NULL;
GO

-- Update Zoe's values (verified working values)
UPDATE practitioners
SET halaxy_clinic_id = '1023041',
    halaxy_fee_id = '9381231'
WHERE first_name = 'Zoe'
  AND halaxy_practitioner_id = '1304541';

-- Julian's values - using same clinic/fee as Zoe (same practice)
UPDATE practitioners
SET halaxy_clinic_id = '1023041',
    halaxy_fee_id = '9381231'
WHERE first_name = 'Julian'
  AND halaxy_practitioner_id = '1473161';

-- Set default values for any other active practitioners
UPDATE practitioners
SET halaxy_clinic_id = '1023041',
    halaxy_fee_id = '9381231'
WHERE is_active = 1
  AND halaxy_clinic_id IS NULL;
