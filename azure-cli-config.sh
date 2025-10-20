# Azure AD App Registration Configuration - Azure CLI Commands
# Bloom Platform - Life Psychology Australia
# Date: October 21, 2025

# App Registration Details
# Client ID: fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
# Tenant ID: 21f0abde-bd22-47bb-861a-64428079d129
# Tenant: LifePsychologyAustralia138.onmicrosoft.com

# ============================================
# PREREQUISITES
# ============================================

# 1. Install Azure CLI (if not already installed)
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows

# 2. Login to Azure
az login --tenant 21f0abde-bd22-47bb-861a-64428079d129

# 3. Set the subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# ============================================
# STEP 1: UPDATE REDIRECT URIs (SPA Platform)
# ============================================

# Add all three redirect URIs to the SPA platform
az ad app update \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --spa-redirect-uris \
    "https://bloom.life-psychology.com.au/auth/callback" \
    "https://www.bloom.life-psychology.com.au/auth/callback" \
    "http://localhost:5173/auth/callback"

# Verify redirect URIs were added
az ad app show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba --query "spa.redirectUris"

# ============================================
# STEP 2: ENABLE IMPLICIT GRANT FLOW
# ============================================

# Enable both ID tokens and Access tokens for implicit grant
az ad app update \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --enable-id-token-issuance true \
  --enable-access-token-issuance true

# Verify implicit grant settings
az ad app show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --query "{idToken: web.implicitGrantSettings.enableIdTokenIssuance, accessToken: web.implicitGrantSettings.enableAccessTokenIssuance}"

# ============================================
# STEP 3: ADD API PERMISSIONS (Microsoft Graph)
# ============================================

# Microsoft Graph API Application ID (constant)
# 00000003-0000-0000-c000-000000000000

# Required permissions with their IDs:
# - openid (37f7f235-527c-4136-accd-4a02d197296e)
# - profile (14dad69e-099b-42c9-810b-d002981feec1)
# - email (64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0)
# - User.Read (e1fe6dd8-ba31-4d61-89e7-88639da4683d)
# - offline_access (7427e0e9-2fba-42fe-b0c0-848c9e6a8182)

# Add all required permissions in one command
az ad app permission add \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions \
    37f7f235-527c-4136-accd-4a02d197296e=Scope \
    14dad69e-099b-42c9-810b-d002981feec1=Scope \
    64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope \
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
    7427e0e9-2fba-42fe-b0c0-848c9e6a8182=Scope

# ⚠️ CRITICAL: Grant admin consent for all permissions
az ad app permission admin-consent \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba

# Verify permissions were added
az ad app permission list \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba

# ============================================
# STEP 4: CONFIGURE OPTIONAL CLAIMS (Token Configuration)
# ============================================

# Create optional claims configuration JSON
# Save this to a file called optional-claims.json

# optional-claims.json content:
{
  "idToken": [
    {
      "name": "email",
      "essential": false
    },
    {
      "name": "preferred_username",
      "essential": false
    },
    {
      "name": "given_name",
      "essential": false
    },
    {
      "name": "family_name",
      "essential": false
    }
  ],
  "accessToken": [
    {
      "name": "email",
      "essential": false
    },
    {
      "name": "preferred_username",
      "essential": false
    }
  ]
}

# Apply optional claims (requires JSON file)
# First, create the JSON file, then run:
az ad app update \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --optional-claims "@optional-claims.json"

# ============================================
# STEP 5: VERIFY COMPLETE CONFIGURATION
# ============================================

# Get full app registration details
az ad app show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba

# Check specific settings
echo "=== SPA Redirect URIs ==="
az ad app show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba --query "spa.redirectUris"

echo "=== Implicit Grant Settings ==="
az ad app show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --query "{idToken: web.implicitGrantSettings.enableIdTokenIssuance, accessToken: web.implicitGrantSettings.enableAccessTokenIssuance}"

echo "=== API Permissions ==="
az ad app permission list --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba

echo "=== Optional Claims ==="
az ad app show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba --query "optionalClaims"

# ============================================
# ADDITIONAL USEFUL COMMANDS
# ============================================

# List all app registrations in your tenant
az ad app list --filter "displayName eq 'Bloom PlatformAccounts'"

# Get service principal (Enterprise Application) details
az ad sp show --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba

# Reset client secret (if needed - NOT required for SPA)
# az ad app credential reset --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba

# Delete all permissions (if you need to start over)
# az ad app permission delete --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba --api 00000003-0000-0000-c000-000000000000

# ============================================
# TROUBLESHOOTING
# ============================================

# If you get "Insufficient privileges" error:
# You need to be a Global Administrator, Application Administrator, or Cloud Application Administrator

# If admin consent fails:
# 1. You might not have admin rights - contact your Azure AD admin
# 2. Try granting consent through the portal instead
# 3. Or use: az ad app permission grant --id <app-id> --api 00000003-0000-0000-c000-000000000000

# Check your current role in Azure AD
az role assignment list --assignee $(az account show --query user.name -o tsv)

# ============================================
# NOTES
# ============================================

# - SPA platform uses Authorization Code Flow with PKCE (no client secret needed)
# - Implicit grant is enabled as fallback for older MSAL versions
# - offline_access permission allows refresh tokens
# - Admin consent is required for User.Read in some organizations
# - All commands are idempotent - safe to run multiple times

# ============================================
# PRODUCTION DEPLOYMENT VERIFICATION
# ============================================

# After running these commands, test:

# 1. Local development:
#    npm run dev
#    Navigate to http://localhost:5173
#    Click "Bloom" button
#    Should redirect to Microsoft login

# 2. Production:
#    Navigate to https://bloom.life-psychology.com.au
#    Click "Bloom" button
#    Should redirect to Microsoft login
#    After login, should redirect to /auth/callback
#    Then navigate to /admin/dashboard

# ============================================
# ROLLBACK (if needed)
# ============================================

# Remove all SPA redirect URIs
az ad app update \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --spa-redirect-uris ""

# Disable implicit grant
az ad app update \
  --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --enable-id-token-issuance false \
  --enable-access-token-issuance false
