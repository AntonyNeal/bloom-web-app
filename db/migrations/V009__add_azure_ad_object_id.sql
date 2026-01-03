-- Migration V009: Add Azure AD Object ID to practitioners table
-- This stores the Azure AD B2C user Object ID for linking practitioner accounts

ALTER TABLE practitioners
ADD azure_ad_object_id NVARCHAR(100) NULL;

-- Add index for looking up practitioners by their Azure AD Object ID
CREATE NONCLUSTERED INDEX IX_practitioners_azure_ad_object_id 
ON practitioners (azure_ad_object_id) 
WHERE azure_ad_object_id IS NOT NULL;

-- Add comment for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Azure AD B2C user Object ID for this practitioner. Created during onboarding.', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE',  @level1name = N'practitioners',
    @level2type = N'COLUMN', @level2name = N'azure_ad_object_id';
