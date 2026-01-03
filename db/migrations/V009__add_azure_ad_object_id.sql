-- Migration V009: Add Azure AD fields to practitioners table
-- Stores Azure AD Object ID and company email for practitioner accounts

-- Add Azure AD Object ID column
ALTER TABLE practitioners
ADD azure_ad_object_id NVARCHAR(100) NULL;

-- Add company email column (their @life-psychology.com.au address)
ALTER TABLE practitioners
ADD company_email NVARCHAR(255) NULL;

-- Add index for looking up practitioners by their Azure AD Object ID
CREATE NONCLUSTERED INDEX IX_practitioners_azure_ad_object_id 
ON practitioners (azure_ad_object_id) 
WHERE azure_ad_object_id IS NOT NULL;

-- Add unique index for company email (each practitioner gets one)
CREATE UNIQUE NONCLUSTERED INDEX IX_practitioners_company_email 
ON practitioners (company_email) 
WHERE company_email IS NOT NULL;

-- Add comments for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Azure AD user Object ID for this practitioner. Created during onboarding.', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE',  @level1name = N'practitioners',
    @level2type = N'COLUMN', @level2name = N'azure_ad_object_id';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Company email address (@life-psychology.com.au) created for this practitioner.', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE',  @level1name = N'practitioners',
    @level2type = N'COLUMN', @level2name = N'company_email';
