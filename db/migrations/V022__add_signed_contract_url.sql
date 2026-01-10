-- Add signed_contract_url column for storing candidate's signed contract
-- This is uploaded by the candidate when accepting an offer

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.applications') 
    AND name = 'signed_contract_url'
)
BEGIN
    ALTER TABLE applications
    ADD signed_contract_url NVARCHAR(500) NULL;
END
GO

-- Create index for faster lookups
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_applications_signed_contract_url' 
    AND object_id = OBJECT_ID(N'dbo.applications')
)
BEGIN
    CREATE INDEX IX_applications_signed_contract_url 
    ON applications(signed_contract_url)
    WHERE signed_contract_url IS NOT NULL;
END
GO
