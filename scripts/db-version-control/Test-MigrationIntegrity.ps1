<#
.SYNOPSIS
    Verifies the integrity of the migration system.

.DESCRIPTION
    Checks for checksum mismatches, expired locks, and schema drift.
    Can optionally fix detected issues.
    
    Note: Only dev and prod environments exist. Staging uses dev DBs.

.PARAMETER Database
    Target database identifier

.PARAMETER Environment
    Target environment: dev or prod

.PARAMETER Fix
    Attempt to fix detected issues (expired locks, etc.)

.PARAMETER ApiUrl
    Base URL for the DBVC API (defaults to local development)

.EXAMPLE
    .\Test-MigrationIntegrity.ps1 -Database "lpa-bloom-sql-dev" -Environment dev
    .\Test-MigrationIntegrity.ps1 -Database "lpa-bloom-sql-prod" -Environment prod -Fix

.NOTES
    Author: LPA Development Team
    Date: 2025-11-27
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Database,

    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [switch]$Fix,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:7071/api"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Migration Integrity Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Database:    $Database" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor White
if ($Fix) {
    Write-Host "  Mode:        Auto-fix enabled" -ForegroundColor Yellow
}
Write-Host ""

# Build request body
$body = @{
    databaseId = $Database
    environment = $Environment
    fixDrift = $Fix.IsPresent
}

try {
    Write-Host "🔍 Verifying integrity..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/dbvc/integrity/verify" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json -Depth 10) `
        -Headers @{ "X-Executor" = $env:USERNAME }
    
    $data = $response.data
    
    Write-Host ""
    if ($data.isValid) {
        Write-Host "✅ Integrity check passed!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Integrity issues detected" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Checksum mismatches
    if ($data.checksumMismatches -and $data.checksumMismatches.Count -gt 0) {
        Write-Host "  🔐 Checksum Mismatches:" -ForegroundColor Red
        foreach ($m in $data.checksumMismatches) {
            Write-Host "     ❌ $($m.migrationId)" -ForegroundColor Red
            Write-Host "        Registered: $($m.registeredChecksum.Substring(0, 16))..." -ForegroundColor Gray
            Write-Host "        Calculated: $($m.calculatedChecksum.Substring(0, 16))..." -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    # Schema drift
    if ($data.schemaDrift -and $data.schemaDrift.detected) {
        Write-Host "  📊 Schema Drift Detected:" -ForegroundColor Yellow
        Write-Host "     $($data.schemaDrift.details)" -ForegroundColor White
        Write-Host "     Last Snapshot: $($data.schemaDrift.lastSnapshotId)" -ForegroundColor Gray
        Write-Host "     Current Hash:  $($data.schemaDrift.currentSchemaHash.Substring(0, 16))..." -ForegroundColor Gray
        Write-Host "     Snapshot Hash: $($data.schemaDrift.snapshotSchemaHash.Substring(0, 16))..." -ForegroundColor Gray
        Write-Host ""
    }
    
    # Issues
    if ($data.issues -and $data.issues.Count -gt 0) {
        Write-Host "  📋 Issues:" -ForegroundColor White
        foreach ($issue in $data.issues) {
            $severityIcon = switch ($issue.severity) {
                'error' { "❌" }
                'warning' { "⚠️" }
                'info' { "ℹ️" }
                default { "❓" }
            }
            $severityColor = switch ($issue.severity) {
                'error' { "Red" }
                'warning' { "Yellow" }
                'info' { "Gray" }
                default { "White" }
            }
            Write-Host "     $severityIcon [$($issue.type)] $($issue.description)" -ForegroundColor $severityColor
            Write-Host "        Recommendation: $($issue.recommendation)" -ForegroundColor DarkGray
        }
        Write-Host ""
    }
    
    # Summary
    $errorCount = ($data.issues | Where-Object { $_.severity -eq 'error' }).Count
    $warningCount = ($data.issues | Where-Object { $_.severity -eq 'warning' }).Count
    
    Write-Host "  📊 Summary:" -ForegroundColor White
    Write-Host "     Errors:   $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    Write-Host "     Warnings: $warningCount" -ForegroundColor $(if ($warningCount -gt 0) { "Yellow" } else { "Green" })
    Write-Host ""
    
    if (-not $data.isValid) {
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error verifying integrity: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
    }
    exit 1
}
