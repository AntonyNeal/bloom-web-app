<#
.SYNOPSIS
    Executes pending database migrations.

.DESCRIPTION
    Runs all pending migrations for the specified database and environment.
    Migrations are executed in order based on their timestamp IDs.
    Supports dry-run mode for validation without execution.
    
    Note: Staging branch uses dev environment databases.

.PARAMETER Environment
    Target environment: dev or prod

.PARAMETER Database
    Target database identifier, or "all" to run for all registered databases

.PARAMETER TargetMigration
    Optional: Stop after applying this specific migration ID

.PARAMETER DryRun
    Preview migrations without executing them

.PARAMETER ApiUrl
    Base URL for the DBVC API (defaults to local development)

.EXAMPLE
    .\Invoke-Migrations.ps1 -Environment dev -Database "lpa-bloom-sql-dev"
    .\Invoke-Migrations.ps1 -Environment dev -Database all -DryRun
    .\Invoke-Migrations.ps1 -Environment prod -Database "lpa-bloom-sql-prod" -TargetMigration "20251127_143000_add_users"

.NOTES
    Author: LPA Development Team
    Date: 2025-11-27
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $true)]
    [string]$Database,

    [Parameter(Mandatory = $false)]
    [string]$TargetMigration,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:7071/api"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Invoke Database Migrations" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  Database:    $Database" -ForegroundColor White
if ($DryRun) {
    Write-Host "  Mode:        DRY RUN (no changes will be made)" -ForegroundColor Yellow
}
Write-Host ""

# Get databases to process
$databases = @()

if ($Database -eq "all") {
    Write-Host "🔍 Fetching registered databases..." -ForegroundColor Yellow
    try {
        $statusResponse = Invoke-RestMethod `
            -Uri "$ApiUrl/dbvc/migrations/status?environment=$Environment" `
            -Method GET `
            -ContentType "application/json"
        
        $databases = $statusResponse.data.databases | Where-Object { $_.databaseId } | Select-Object -ExpandProperty databaseId
        Write-Host "   Found $($databases.Count) database(s)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to fetch databases: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
else {
    $databases = @($Database)
}

# Run migrations for each database
$totalSuccess = 0
$totalFailed = 0

foreach ($db in $databases) {
    Write-Host ""
    Write-Host "──────────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "📦 Database: $db" -ForegroundColor Cyan
    Write-Host "──────────────────────────────────────────────────────────────────" -ForegroundColor Gray
    
    # Build request body
    $body = @{
        databaseId = $db
        environment = $Environment
        dryRun = $DryRun.IsPresent
        executor = "$env:USERNAME@$env:COMPUTERNAME"
        executionContext = @{
            triggeredBy = "CLI"
            clientMachine = $env:COMPUTERNAME
            workingDirectory = $PWD.Path
        }
    }
    
    if ($TargetMigration) {
        $body.targetMigrationId = $TargetMigration
    }
    
    try {
        Write-Host "🚀 Running migrations..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod `
            -Uri "$ApiUrl/dbvc/migrations/run" `
            -Method POST `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Depth 10) `
            -Headers @{ "X-Executor" = $env:USERNAME }
        
        if ($response.success) {
            $executed = $response.data.executedMigrations
            $skipped = $response.data.skippedMigrations
            
            Write-Host ""
            if ($executed.Count -eq 0 -and $skipped.Count -eq 0) {
                Write-Host "   ✅ No pending migrations" -ForegroundColor Green
            }
            else {
                foreach ($m in $executed) {
                    $statusIcon = switch ($m.status) {
                        'success' { "✅" }
                        'skipped' { "⏭️" }
                        'failed' { "❌" }
                        default { "❓" }
                    }
                    $statusColor = switch ($m.status) {
                        'success' { "Green" }
                        'skipped' { "Yellow" }
                        'failed' { "Red" }
                        default { "White" }
                    }
                    Write-Host "   $statusIcon $($m.migrationId) ($($m.durationMs)ms)" -ForegroundColor $statusColor
                    
                    if ($m.error) {
                        Write-Host "      Error: $($m.error)" -ForegroundColor Red
                    }
                }
                
                foreach ($s in $skipped) {
                    Write-Host "   ⏭️ $s (skipped)" -ForegroundColor Yellow
                }
                
                Write-Host ""
                Write-Host "   Total Duration: $($response.data.totalDurationMs)ms" -ForegroundColor Gray
            }
            
            $totalSuccess++
        }
        else {
            Write-Host ""
            Write-Host "   ❌ Migration failed!" -ForegroundColor Red
            if ($response.data.failedMigration) {
                Write-Host "      Failed at: $($response.data.failedMigration)" -ForegroundColor Red
            }
            if ($response.error) {
                Write-Host "      Error: $($response.error.message)" -ForegroundColor Red
            }
            $totalFailed++
        }
    }
    catch {
        Write-Host ""
        Write-Host "   ❌ Error running migrations: $($_.Exception.Message)" -ForegroundColor Red
        $totalFailed++
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Databases Processed: $($databases.Count)" -ForegroundColor White
Write-Host "  Successful: $totalSuccess" -ForegroundColor Green
Write-Host "  Failed: $totalFailed" -ForegroundColor $(if ($totalFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($totalFailed -gt 0) {
    exit 1
}
