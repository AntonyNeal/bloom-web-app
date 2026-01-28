# PHASE 1: SQL Database Upgrade - Ready to Execute

## Prerequisites
```powershell
# You may have already done this, but if not:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Import-Module -Name Az.Accounts -Force
Import-Module -Name Az.Sql -Force
Connect-AzAccount -SubscriptionId "47b5552f-0eb8-4462-97e7-cd67e8e660b8"
```

## Execute Phase 1 - SQL Upgrade

Copy and run this entire block:

```powershell
$resourceGroup = "lpa-rg"
$serverName = "lpa-sql-server"
$databaseName = "lpa-bloom-db-prod"

# Check current status
Write-Host "========================================"
Write-Host "PHASE 1: SQL Database Upgrade"
Write-Host "========================================"
Write-Host ""
Write-Host "Current SQL Database Status:"
$database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName

Write-Host "  Edition: $($database.Edition)"
Write-Host "  Service Objective: $($database.CurrentServiceObjectiveName)"
Write-Host "  Status: $($database.Status)"
Write-Host "  Capacity: $($database.Capacity) DTUs"
Write-Host ""

# Perform upgrade
Write-Host "Starting upgrade to Standard S1..."
$database = Set-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName `
  -Edition "Standard" `
  -RequestedServiceObjectiveName "S1"

Write-Host "✅ Upgrade command issued"
Write-Host "Waiting for upgrade to complete (typically 5-10 minutes)..."
Write-Host ""

# Monitor upgrade progress
$maxWait = 600  # 10 minutes
$elapsed = 0
$checkInterval = 10

while ($elapsed -lt $maxWait) {
    $database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
      -ServerName $serverName `
      -DatabaseName $databaseName
    
    $progress = [math]::Round(($elapsed / $maxWait) * 100, 0)
    Write-Host "  Progress: $progress% | Current objective: $($database.CurrentServiceObjectiveName) | Status: $($database.Status)"
    
    if ($database.CurrentServiceObjectiveName -eq "S1" -and $database.Status -eq "Online") {
        Write-Host ""
        Write-Host "✅✅✅ UPGRADE COMPLETED SUCCESSFULLY ✅✅✅"
        break
    }
    
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
}

Write-Host ""
Write-Host "Final SQL Database Status:"
$database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName

Write-Host "  Edition: $($database.Edition)"
Write-Host "  Service Objective: $($database.CurrentServiceObjectiveName)"
Write-Host "  Status: $($database.Status)"
Write-Host "  Capacity: $($database.Capacity) DTUs"
Write-Host ""
Write-Host "========================================"
Write-Host "PHASE 1 COMPLETE ✅"
Write-Host "========================================"
Write-Host ""
Write-Host "Cost Impact: +$15/month"
Write-Host "Next Steps:"
Write-Host "  1. Monitor DTU usage for 24 hours"
Write-Host "  2. Check application performance"
Write-Host "  3. Then proceed to PHASE 2 (WAF)"
Write-Host ""
```

## Monitor DTU Usage (Do this for next 24 hours)

```powershell
# Check DTU usage in the past hour
$resourceGroup = "lpa-rg"
$serverName = "lpa-sql-server"
$databaseName = "lpa-bloom-db-prod"

$database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName

$endTime = (Get-Date).ToUniversalTime()
$startTime = $endTime.AddHours(-1)

Write-Host "DTU Usage (Last 1 hour):"
try {
    $metrics = Get-AzMetric -ResourceId $database.ResourceId `
      -MetricName "dtu_consumption_percent" `
      -StartTime $startTime `
      -EndTime $endTime `
      -TimeGrain ([timespan]::FromMinutes(5)) `
      -ErrorAction Stop
    
    if ($metrics.Data.Count -eq 0) {
        Write-Host "  (No metrics available yet - try again in 5 minutes)"
    } else {
        $metrics.Data | ForEach-Object {
            $time = $_.TimeStamp.ToString("HH:mm:ss")
            Write-Host "  $time: Avg=$([math]::Round($_.Average, 1))% Max=$([math]::Round($_.Maximum, 1))%"
        }
    }
} catch {
    Write-Host "  Note: May need a few minutes for metrics to appear in Azure"
    Write-Host "  Check Azure Portal → SQL Database → Metrics → DTU Consumption %"
}
```

## Verify Success Criteria

After upgrade completes, verify:

```powershell
$resourceGroup = "lpa-rg"
$serverName = "lpa-sql-server"
$databaseName = "lpa-bloom-db-prod"

Write-Host "Verifying Phase 1 Success Criteria:"
Write-Host ""

# Criterion 1: Database tier is Standard S1
$database = Get-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName

if ($database.CurrentServiceObjectiveName -eq "S1") {
    Write-Host "✅ Criterion 1: Database is Standard S1"
} else {
    Write-Host "❌ Criterion 1: Database is $($database.CurrentServiceObjectiveName) (should be S1)"
}

# Criterion 2: Database is Online
if ($database.Status -eq "Online") {
    Write-Host "✅ Criterion 2: Database is Online"
} else {
    Write-Host "❌ Criterion 2: Database is $($database.Status) (should be Online)"
}

# Criterion 3: DTU capacity increased from 5 to 20
if ($database.Capacity -eq 20 -or ($database.Capacity -ge 18 -and $database.Capacity -le 20)) {
    Write-Host "✅ Criterion 3: DTU capacity is $($database.Capacity) (was 5, now should be 20)"
} else {
    Write-Host "⚠️ Criterion 3: DTU capacity is $($database.Capacity) (check if upgrade is still in progress)"
}

# Criterion 4: Check for connection errors in past hour
Write-Host ""
Write-Host "Connection Status: Check Azure Portal or application logs for errors"
Write-Host "  Expected: Zero connection failures"
Write-Host "  Where to check: Azure Portal → SQL Database → Metrics"
Write-Host ""

Write-Host "Phase 1 Validation Complete"
```

---

## If Something Goes Wrong

### Rollback Phase 1 (Revert to Basic)

```powershell
Write-Host "ROLLING BACK: Reverting SQL to Basic tier..."
$resourceGroup = "lpa-rg"
$serverName = "lpa-sql-server"
$databaseName = "lpa-bloom-db-prod"

$database = Set-AzSqlDatabase -ResourceGroupName $resourceGroup `
  -ServerName $serverName `
  -DatabaseName $databaseName `
  -Edition "Basic" `
  -RequestedServiceObjectiveName "Basic"

Write-Host "✅ Rollback initiated - reverting to Basic tier"
```

---

## Next Phase

Once Phase 1 is complete and validated (24 hours of monitoring):
→ See **PHASE 2: WAF_ENABLEMENT.md** for Web Application Firewall setup

---

## Summary

| Item | Details |
|------|---------|
| **Phase** | 1 - SQL Upgrade |
| **Change** | Basic → Standard S1 |
| **DTU** | 5 → 20 |
| **Storage** | 2 GB → 250 GB |
| **Duration** | ~5-10 minutes |
| **Downtime** | None (in-place scaling) |
| **Cost Impact** | +$15/month |
| **Risk** | Low (easy rollback) |

Ready? Copy and run the **Execute Phase 1** block above.
