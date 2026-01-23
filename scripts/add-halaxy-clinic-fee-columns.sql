-- Add Halaxy clinic and fee IDs to practitioners table
-- These are needed for the Halaxy booking API to work correctly

-- Add new columns
ALTER TABLE practitioners
ADD halaxy_clinic_id NVARCHAR(50) NULL,
    halaxy_fee_id NVARCHAR(50) NULL;

-- Update Zoe's values (we know these work)
UPDATE practitioners
SET halaxy_clinic_id = '1023041',
    halaxy_fee_id = '9381231'
WHERE first_name = 'Zoe'
  AND halaxy_practitioner_id = '1304541';

-- Julian's values need to be discovered from Halaxy
-- For now, try the same clinic/fee as Zoe (they work at the same practice)
UPDATE practitioners
SET halaxy_clinic_id = '1023041',
    halaxy_fee_id = '9381231'
WHERE first_name = 'Julian'
  AND halaxy_practitioner_id = '1473161';

-- Verify
SELECT 
  first_name,
  halaxy_practitioner_id,
  halaxy_clinic_id,
  halaxy_fee_id
FROM practitioners
WHERE is_active = 1;
