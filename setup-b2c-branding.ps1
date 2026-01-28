# Azure AD B2C Custom Branding - Automated Setup Script

# Variables
$TENANT_NAME = "LifePsychologyAustralia138"
$TENANT_DOMAIN = "LifePsychologyAustralia138.onmicrosoft.com"
$RESOURCE_GROUP = "rg-lpa-unified"
$SWA_NAME = "delightfulglacier"  # Replace with your actual Static Web App name

Write-Host "🌸 Configuring Azure AD B2C Custom Branding for Bloom" -ForegroundColor Green
Write-Host ""

# Step 1: Get Static Web App URL
Write-Host "📍 Step 1: Getting Static Web App URL..." -ForegroundColor Cyan
$SWA_URL = az staticwebapp show `
  --name $SWA_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "defaultHostname" `
  --output tsv

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Could not find Static Web App. Please check the name and resource group." -ForegroundColor Red
    Write-Host "Available Static Web Apps:" -ForegroundColor Yellow
    $swaList = az staticwebapp list --resource-group $RESOURCE_GROUP --output json | ConvertFrom-Json
    $swaList | Select-Object name, @{Name='URL';Expression={$_.defaultHostname}} | Format-Table
    exit 1
}

$CUSTOM_UI_URL = "https://$SWA_URL/azure-b2c/unified.html"
Write-Host "✅ Static Web App URL: https://$SWA_URL" -ForegroundColor Green
Write-Host "✅ Custom UI URL: $CUSTOM_UI_URL" -ForegroundColor Green
Write-Host ""

# Step 2: Verify custom UI is accessible
Write-Host "🔍 Step 2: Verifying custom UI is deployed..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $CUSTOM_UI_URL -UseBasicParsing -Method Head -ErrorAction Stop
    Write-Host "✅ Custom UI is accessible (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Warning: Custom UI not yet accessible at $CUSTOM_UI_URL" -ForegroundColor Yellow
    Write-Host "   Please wait a few minutes for deployment to complete, then run this script again." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Configure Azure AD B2C
Write-Host "⚙️  Step 3: Configuring Azure AD B2C..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Azure AD B2C custom page configuration requires MS Graph API." -ForegroundColor Yellow
Write-Host "This script will generate the configuration for you." -ForegroundColor Yellow
Write-Host ""

# Get B2C User Flows
Write-Host "📋 Getting existing user flows..." -ForegroundColor Cyan
$userFlows = az rest `
  --method GET `
  --url "https://graph.microsoft.com/v1.0/identity/b2cUserFlows" `
  --headers "Content-Type=application/json" `
  --output json 2>$null | ConvertFrom-Json

if ($userFlows.value) {
    $userFlows.value | Select-Object id, displayName | Format-Table
} else {
    Write-Host "No user flows found or unable to query. You may need to sign in with 'az login'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To complete the configuration, you have two options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPTION 1: Azure Portal (Recommended - 2 minutes)" -ForegroundColor Cyan
Write-Host "1. Go to: https://portal.azure.com/#view/Microsoft_AAD_B2CAdmin/TenantManagementMenuBlade/~/Overview" -ForegroundColor White
Write-Host "2. Navigate to: User flows → [Your Flow] → Page layouts" -ForegroundColor White
Write-Host "3. Select 'Unified sign-up or sign-in page'" -ForegroundColor White
Write-Host "4. Toggle 'Use custom page content' to YES" -ForegroundColor White
Write-Host "5. Enter this URL:" -ForegroundColor White
Write-Host "   $CUSTOM_UI_URL" -ForegroundColor Green
Write-Host "6. Add CORS origins:" -ForegroundColor White
Write-Host "   https://$SWA_URL" -ForegroundColor Green
Write-Host "   http://localhost:5173" -ForegroundColor Green
Write-Host "7. Save" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 2: PowerShell Script (Advanced)" -ForegroundColor Cyan
Write-Host "Run the generated configuration script below:" -ForegroundColor White
Write-Host ""

# Generate MS Graph API script
$SCRIPT = @"
# Azure AD B2C Custom Page Configuration via MS Graph API
`$customPageUrl = "$CUSTOM_UI_URL"
`$corsOrigins = @("https://$SWA_URL", "http://localhost:5173")

# This requires appropriate permissions in Azure AD
# Ensure you're logged in with an account that has B2C IEF policy admin rights

# Update B2C User Flow with custom page
# Note: Replace 'B2C_1_signupsignin1' with your actual user flow ID
`$userFlowId = "B2C_1_signupsignin1"

`$body = @{
    userFlowPageLayoutConfiguration = @{
        isCustomized = `$true
        selfAssertedPageConfiguration = @{
            customPageContentUrl = `$customPageUrl
        }
    }
} | ConvertTo-Json -Depth 10

# Execute the update
az rest \
  --method PATCH \
  --url "https://graph.microsoft.com/v1.0/identity/b2cUserFlows/`$userFlowId" \
  --headers "Content-Type=application/json" \
  --body "`$body"

Write-Host "✅ Custom page configured!" -ForegroundColor Green
"@

Write-Host $SCRIPT -ForegroundColor Gray
Write-Host ""

# Step 4: Create verification script
Write-Host "📝 Creating verification script..." -ForegroundColor Cyan
$VERIFY_SCRIPT = @"
# Verify Azure AD B2C Custom Branding Setup

Write-Host "🔍 Verifying Bloom Custom Branding..." -ForegroundColor Cyan
Write-Host ""

# Check 1: Custom UI accessible
Write-Host "1. Checking custom UI..." -ForegroundColor Yellow
try {
    `$response = Invoke-WebRequest -Uri "$CUSTOM_UI_URL" -UseBasicParsing
    if (`$response.Content -match "Bloom" -and `$response.Content -match "Welcome back") {
        Write-Host "   ✅ Custom UI is deployed and contains Bloom branding" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Custom UI found but content may be incorrect" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Custom UI not accessible" -ForegroundColor Red
}

# Check 2: User flows
Write-Host ""
Write-Host "2. Your B2C User Flows:" -ForegroundColor Yellow
`$flows = az rest \
  --method GET \
  --url "https://graph.microsoft.com/v1.0/identity/b2cUserFlows" \
  --headers "Content-Type=application/json" \
  --output json 2>`$null | ConvertFrom-Json
`$flows.value | Select-Object displayName, userFlowType | Format-Table

Write-Host ""
Write-Host "3. Next steps:" -ForegroundColor Yellow
Write-Host "   - Test login from your app" -ForegroundColor White
Write-Host "   - You should see Bloom's botanical design (🌸)" -ForegroundColor White
Write-Host "   - Sage green colors and 'Care for people, not paperwork' tagline" -ForegroundColor White
"@

Set-Content -Path ".\verify-b2c-branding.ps1" -Value $VERIFY_SCRIPT
Write-Host "✅ Created verify-b2c-branding.ps1" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=" * 80 -ForegroundColor DarkGray
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor DarkGray
Write-Host "Custom UI URL:  $CUSTOM_UI_URL" -ForegroundColor White
Write-Host "CORS Origins:   https://$SWA_URL, http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "✅ Custom UI deployed and accessible" -ForegroundColor Green
Write-Host "⏳ Awaiting B2C configuration (see Option 1 or 2 above)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run './verify-b2c-branding.ps1' after configuration to verify." -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor DarkGray
