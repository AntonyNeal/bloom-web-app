-- Migration V040: Add test practitioner Xena
-- A test practitioner for development and testing purposes

-- Check if Xena already exists
IF NOT EXISTS (
  SELECT 1 FROM practitioners WHERE email = 'xena@test.life-psychology.com.au'
)
BEGIN
  INSERT INTO practitioners (
    id,
    email,
    first_name,
    last_name,
    display_name,
    phone,
    halaxy_practitioner_id,
    halaxy_clinic_id,
    halaxy_fee_id,
    booking_enabled,
    is_active,
    bio,
    specializations,
    languages,
    session_types,
    experience_years,
    medicare_provider,
    ndis_registered,
    onboarding_completed_at,
    created_at,
    updated_at
  )
  VALUES (
    NEWID(),
    'xena@test.life-psychology.com.au',
    'Xena',
    'Warrior',
    'Xena Warrior',
    '0400000000',
    NULL, -- No Halaxy ID - test practitioner
    NULL,
    NULL,
    0, -- booking_enabled = false (no Halaxy booking)
    1, -- is_active = true
    'Test practitioner for development and testing. Xena specializes in warrior psychology and overcoming ancient Greek trauma.',
    '["Anxiety", "Depression", "Trauma Recovery", "Anger Management"]',
    '["English", "Ancient Greek"]',
    '["Telehealth", "In-Person"]',
    2500, -- Years of experience (she''s immortal)
    1, -- Medicare provider
    0, -- Not NDIS registered
    GETUTCDATE(), -- Onboarding complete
    GETUTCDATE(),
    GETUTCDATE()
  );
  PRINT 'Added test practitioner Xena';
END
ELSE
BEGIN
  PRINT 'Test practitioner Xena already exists';
END
GO

-- Print confirmation
SELECT display_name, email, is_active, booking_enabled 
FROM practitioners 
WHERE email = 'xena@test.life-psychology.com.au';
