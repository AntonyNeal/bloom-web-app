-- Migration V011: Add Azure AD fields to practitioners table
-- Stores Azure AD Object ID and company email for practitioner accounts

-- Add Azure AD Object ID column (with existence check)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('practitioners') 
    AND name = 'azure_ad_object_id'
)
BEGIN
    ALTER TABLE practitioners
    ADD azure_ad_object_id NVARCHAR(100) NULL;
    PRINT 'Added azure_ad_object_id column';
END
GO

-- Add company email column (with existence check)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('practitioners') 
    AND name = 'company_email'
)
BEGIN
    ALTER TABLE practitioners
    ADD company_email NVARCHAR(255) NULL;
    PRINT 'Added company_email column';
END
GO

-- Add index for looking up practitioners by their Azure AD Object ID
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_practitioners_azure_ad_object_id')
BEGIN
    CREATE NONCLUSTERED INDEX IX_practitioners_azure_ad_object_id 
    ON practitioners (azure_ad_object_id) 
    WHERE azure_ad_object_id IS NOT NULL;
    PRINT 'Created IX_practitioners_azure_ad_object_id index';
END
GO

-- Add unique index for company email (each practitioner gets one)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_practitioners_company_email')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_practitioners_company_email 
    ON practitioners (company_email) 
    WHERE company_email IS NOT NULL;
    PRINT 'Created IX_practitioners_company_email index';
END
GO

-- Add comments for documentation (skip if they already exist)
IF NOT EXISTS (
    SELECT * FROM sys.extended_properties 
    WHERE major_id = OBJECT_ID('practitioners') 
    AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'azure_ad_object_id')
    AND name = 'MS_Description'
)
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Azure AD user Object ID for this practitioner. Created during onboarding.', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE',  @level1name = N'practitioners',
        @level2type = N'COLUMN', @level2name = N'azure_ad_object_id';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.extended_properties 
    WHERE major_id = OBJECT_ID('practitioners') 
    AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'company_email')
    AND name = 'MS_Description'
)
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Company email address (@life-psychology.com.au) created for this practitioner.', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE',  @level1name = N'practitioners',
        @level2type = N'COLUMN', @level2name = N'company_email';
END
GO

PRINT 'V011: Azure AD fields migration complete';
