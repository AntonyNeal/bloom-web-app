-- Add Halaxy practitioner verification fields
-- These track whether a practitioner has been created in Halaxy before onboarding

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.applications') 
    AND name = 'halaxy_practitioner_verified'
)
BEGIN
    ALTER TABLE applications
    ADD halaxy_practitioner_verified BIT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.applications') 
    AND name = 'halaxy_verified_at'
)
BEGIN
    ALTER TABLE applications
    ADD halaxy_verified_at DATETIME2 NULL;
END
GO

-- Create index for verified practitioners
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_applications_halaxy_verified' 
    AND object_id = OBJECT_ID(N'dbo.applications')
)
BEGIN
    CREATE INDEX IX_applications_halaxy_verified 
    ON applications(halaxy_practitioner_verified, halaxy_verified_at)
    WHERE halaxy_practitioner_verified = 1;
END
GO
