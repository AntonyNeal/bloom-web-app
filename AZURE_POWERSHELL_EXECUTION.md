# Azure Optimization - PowerShell Script for Phase Execution

This script provides the same Azure upgrades using PowerShell instead of Azure CLI.

## Prerequisites

Before running the script, ensure you have:

1. **Azure PowerShell Modules** installed:
```powershell
Install-Module -Name Az.Sql -Force -Scope CurrentUser
Install-Module -Name Az.Network -Force -Scope CurrentUser  
Install-Module -Name Az.Compute -Force -Scope CurrentUser
Install-Module -Name Az.Reservations -Force -Scope CurrentUser
```

2. **Authenticate to Azure**:
```powershell
Connect-AzAccount -SubscriptionId "47b5552f-0eb8-4462-97e7-cd67e8e660b8"
```

3. **Verify subscription context**:
```powershell
Get-AzContext
```

---

## PHASE 1: SQL Database Upgrade

### Check Current Status
```powershell
$resourceGroup = "lpa-rg"
$serverName = "lpa-sql-server"
$databaseName = "lpa-bloom-db-prod"

$database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName

Write-Host "Current SQL Database Status:"
Write-Host "  Edition: $($database.Edition)"
Write-Host "  Service Objective: $($database.CurrentServiceObjectiveName)"
Write-Host "  Status: $($database.Status)"
Write-Host "  Capacity: $($database.Capacity) DTUs"
```

### Upgrade to Standard S1
```powershell
Write-Host "Upgrading SQL Database from Basic to Standard S1..."
$database = Set-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName `
  -Edition "Standard" `
  -RequestedServiceObjectiveName "S1"

Write-Host "Upgrade initiated. Current status: $($database.Status)"
Write-Host "Waiting for upgrade to complete (usually 5-10 minutes)..."

# Wait for upgrade to complete
$maxWait = 600  # 10 minutes
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
      -ServerName $serverName `
      -DatabaseName $databaseName
    
    if ($database.CurrentServiceObjectiveName -eq "S1" -and $database.Status -eq "Online") {
        Write-Host "✅ Upgrade completed successfully!"
        break
    }
    
    Write-Host "  Still upgrading... Current objective: $($database.CurrentServiceObjectiveName), Status: $($database.Status)"
    Start-Sleep -Seconds 10
    $elapsed += 10
}

# Final verification
$database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName

Write-Host ""
Write-Host "Final SQL Database Status:"
Write-Host "  Edition: $($database.Edition)"
Write-Host "  Service Objective: $($database.CurrentServiceObjectiveName)"
Write-Host "  Status: $($database.Status)"
```

### Monitor DTU Usage (First 24 Hours)
```powershell
$endTime = (Get-Date)
$startTime = $endTime.AddHours(-1)

$metrics = Get-AzMetric -ResourceId $database.ResourceId `
  -MetricName "dtu_consumption_percent" `
  -StartTime $startTime `
  -EndTime $endTime `
  -WarningAction SilentlyContinue

Write-Host "DTU Usage (Last Hour):"
$metrics.Data | ForEach-Object {
    Write-Host "  Time: $($_.TimeStamp), Average: $($_.Average)%, Max: $($_.Maximum)%"
}

Write-Host ""
Write-Host "✅ PHASE 1 Complete: SQL Database upgraded to Standard S1"
Write-Host "   Cost impact: +$15/month"
Write-Host "   Monitor DTU usage for next 24 hours (target: <80%)"
```

---

## PHASE 2: WAF Enablement

### Create WAF Policy in Detection Mode
```powershell
$resourceGroup = "lpa-rg"
$frontDoorName = "bloom-front-door"
$wafPolicyName = "bloom-waf-policy"

Write-Host "Creating WAF policy in Detection mode..."
$wafPolicy = New-AzFrontDoorWafPolicy -ResourceGroupName $resourceGroup `
  -Name $wafPolicyName `
  -Mode Detection

Write-Host "✅ WAF Policy created: $($wafPolicy.Name)"

# Get Front Door
$frontDoor = Get-AzFrontDoor -ResourceGroupName $resourceGroup `
  -Name $frontDoorName

# Link WAF to Front Door frontend endpoints
Write-Host "Linking WAF to Front Door..."
foreach ($endpoint in $frontDoor.FrontendEndpoints) {
    $endpoint.WebApplicationFirewallPolicyLink = $wafPolicy.Id
}

# Update Front Door
$frontDoor | Set-AzFrontDoor

Write-Host "✅ WAF linked to Front Door"
Write-Host ""
Write-Host "⏳ IMPORTANT: Monitor WAF logs for 48 hours before switching to Prevention mode"
Write-Host "   Check: Azure Portal → Front Door → WAF logs"
Write-Host "   Once validated, run Phase 2 Part 2 (below)"
```

### Switch to Prevention Mode (After 48 Hours)
```powershell
Write-Host "Switching WAF to Prevention mode..."
$wafPolicy = Get-AzFrontDoorWafPolicy -ResourceGroupName $resourceGroup `
  -Name $wafPolicyName

$wafPolicy.Mode = "Prevention"
Set-AzFrontDoorWafPolicy -InputObject $wafPolicy

Write-Host "✅ WAF switched to Prevention mode"
Write-Host ""
Write-Host "✅ PHASE 2 Complete: WAF enabled and protecting Front Door"
Write-Host "   Cost impact: $0 (included in Premium tier)"
```

---

## PHASE 3: Cost Optimization

### Downgrade Static Web Apps to Free Tier
```powershell
$resourceGroup = "lpa-rg"

# Get current App Service plans
Write-Host "Current App Service plans:"
Get-AzAppServicePlan -ResourceGroupName $resourceGroup | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Sku.Name)"
}

# Downgrade Dev
Write-Host ""
Write-Host "Downgrading Dev Static Web App to Free tier..."
$devPlan = Get-AzAppServicePlan -ResourceGroupName $resourceGroup `
  -Name "bloom-static-web-app-dev-plan"

Set-AzAppServicePlan -AppServicePlan $devPlan -Tier Free

Write-Host "✅ Dev SWA downgraded to Free"

# Downgrade Staging
Write-Host "Downgrading Staging Static Web App to Free tier..."
$stagingPlan = Get-AzAppServicePlan -ResourceGroupName $resourceGroup `
  -Name "bloom-static-web-app-staging-plan"

Set-AzAppServicePlan -AppServicePlan $stagingPlan -Tier Free

Write-Host "✅ Staging SWA downgraded to Free"

# Verify
Write-Host ""
Write-Host "Verified App Service plans:"
Get-AzAppServicePlan -ResourceGroupName $resourceGroup | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Sku.Name)"
}

Write-Host "Savings: -$48/month"
```

### Purchase 1-Year Reserved Instance
```powershell
$subscriptionId = "47b5552f-0eb8-4462-97e7-cd67e8e660b8"

Write-Host "Purchasing 1-year Reserved Instance for EP1 Premium..."
Write-Host "This will take 2-3 minutes..."

# Note: Reservations purchase via PowerShell requires Azure Reservations API
# For now, use Azure Portal or Azure CLI

Write-Host ""
Write-Host "⚠️ Reserved Instance Purchase via PowerShell:"
Write-Host "  Reservations API requires direct REST calls."
Write-Host "  Recommended: Use Azure Portal for RI purchase"
Write-Host ""
Write-Host "Manual steps:"
Write-Host "  1. Go to Azure Portal → Reservations"
Write-Host "  2. Click '+Add'"
Write-Host "  3. Select 'Compute' → 'App Service'"
Write-Host "  4. Select 'EP1 Premium' tier"
Write-Host "  5. Set term to '1 year'"
Write-Host "  6. Purchase (Cost: $1,320/year, Saves: $480/year)"
Write-Host ""
Write-Host "After purchase, verify:"
```

### Verify Reserved Instance Purchase
```powershell
Write-Host "Checking Reserved Instances..."
Get-AzReservation -SubscriptionId $subscriptionId | ForEach-Object {
    Write-Host "  Term: $($_.ProvisioningState)"
    Write-Host "  SKU: $($_.Sku)"
}

Write-Host ""
Write-Host "✅ PHASE 3 Complete: Cost Optimization"
Write-Host "   Savings: -$48/month (SWA downgrade) + $480/year (RI discount)"
Write-Host "   Net cost: +$40/month, but $480/year savings long-term"
```

---

## Quick Execution Guide

### Run All Phases Sequentially

```powershell
# Step 1: Install prerequisites
Write-Host "Installing Azure PowerShell modules..."
Install-Module -Name Az.Sql, Az.Network, Az.Compute, Az.Reservations -Force -Scope CurrentUser

# Step 2: Authenticate
Write-Host "Authenticating to Azure..."
Connect-AzAccount -SubscriptionId "47b5552f-0eb8-4462-97e7-cd67e8e660b8"

# Step 3: Verify context
Get-AzContext

# Step 4: Run Phase 1 (SQL Upgrade)
Write-Host "=== PHASE 1: SQL Upgrade ==="
# Copy and run all Phase 1 commands from above

# Step 5: Monitor for 24 hours
Write-Host "Monitor DTU usage for 24 hours before proceeding to Phase 2"

# Step 6: Run Phase 2 (WAF)
Write-Host "=== PHASE 2: WAF Enablement ==="
# Copy and run all Phase 2 Part 1 commands

# Step 7: Wait 48 hours, then run Phase 2 Part 2
# After 48 hours, run Phase 2 Part 2 commands

# Step 8: Run Phase 3 (Cost Optimization)
Write-Host "=== PHASE 3: Cost Optimization ==="
# Copy and run all Phase 3 commands
```

---

## Variables Reference

```powershell
# Azure Subscription
$subscriptionId = "47b5552f-0eb8-4462-97e7-cd67e8e660b8"
$resourceGroup = "lpa-rg"

# SQL Server
$sqlServer = "lpa-sql-server.database.windows.net"
$sqlServerName = "lpa-sql-server"
$sqlDatabase = "lpa-bloom-db-prod"

# Front Door & WAF
$frontDoorName = "bloom-front-door"
$wafPolicyName = "bloom-waf-policy"

# App Service Plans
$devPlanName = "bloom-static-web-app-dev-plan"
$stagingPlanName = "bloom-static-web-app-staging-plan"
$prodPlanName = "bloom-static-web-app-prod-plan"
```

---

## Troubleshooting

### Module Installation Issues
```powershell
# Update PowerShellGet first
Update-Module -Name PowerShellGet -Force

# Then install Az modules
Install-Module -Name Az -Repository PSGallery -Force -Scope CurrentUser
```

### Connection Issues
```powershell
# Clear cached credentials
Remove-AzContext -Force
Clear-AzContext

# Reconnect
Connect-AzAccount -SubscriptionId "47b5552f-0eb8-4462-97e7-cd67e8e660b8"
```

### Check Current Resource Status
```powershell
# Check SQL Database
Get-AzSqlDatabase -ResourceGroupName "lpa-rg" -ServerName "lpa-sql-server" -DatabaseName "lpa-bloom-db-prod"

# Check App Service Plans
Get-AzAppServicePlan -ResourceGroupName "lpa-rg"

# Check Front Door
Get-AzFrontDoor -ResourceGroupName "lpa-rg" -Name "bloom-front-door"
```

---

## Cost Tracking

After Phase 3 completion, check cost in Azure Cost Management:

```powershell
# Open Azure Cost Management in Portal
# Navigate to: Azure Portal → Subscriptions → Cost Management → Cost Analysis

# Or via PowerShell (requires Microsoft.CostManagement module):
$now = Get-Date
$30DaysAgo = $now.AddDays(-30)

Get-AzCostManagementExport -ResourceGroupName $resourceGroup `
  -Filter "properties/definition/timeframe eq 'MonthToDate'" 2>&1
```

---

**Next Steps:**
1. Install Azure PowerShell modules (if not already done)
2. Authenticate to Azure
3. Execute Phase 1 commands
4. Monitor for 24 hours
5. Proceed to Phase 2 after validation
6. Complete Phase 3 after Phase 2 validation

---

**Status**: Ready for PowerShell-based execution
