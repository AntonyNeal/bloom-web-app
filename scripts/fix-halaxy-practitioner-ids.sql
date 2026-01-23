-- Fix Halaxy Practitioner IDs
-- Current values are database IDs (PR-xxxxx), need to be actual Halaxy practitioner IDs

-- Julian Neal: PR-1955619 → 1473161
UPDATE practitioners
SET halaxy_practitioner_id = '1473161'
WHERE id = '5FBC0F0B-99E8-4D4F-92A7-F9E3307C50E0'
  AND first_name = 'Julian';

-- Zoe Semmler: PR-1439411 → 1304541  
UPDATE practitioners
SET halaxy_practitioner_id = '1304541'
WHERE id = '359514A4-9689-4EDE-A73E-BD2563C4C651'
  AND first_name = 'Zoe';

-- Verify the changes
SELECT 
  id,
  first_name,
  display_name,
  halaxy_practitioner_id
FROM practitioners
WHERE is_active = 1;
