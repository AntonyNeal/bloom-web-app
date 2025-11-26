<#
.SYNOPSIS
    Rolls back a specific database migration.

.DESCRIPTION
    Reverts a previously applied migration by executing its down script.
    Only reversible migrations (those with down scripts) can be rolled back.
    
    Note: Staging branch uses dev environment databases.

.PARAMETER MigrationId
    The ID of the migration to rollback (e.g., "20251127_143000_add_users")

.PARAMETER Database
    Target database identifier

.PARAMETER Environment
    Target environment: dev or prod

.PARAMETER Force
    Skip confirmation prompt

.PARAMETER ApiUrl
    Base URL for the DBVC API (defaults to local development)

.EXAMPLE
    .\Undo-Migration.ps1 -MigrationId "20251127_143000_add_users" -Database "lpa-bloom-sql-dev" -Environment dev
    .\Undo-Migration.ps1 -MigrationId "20251127_143000_add_users" -Database "lpa-bloom-sql-prod" -Environment prod -Force

.NOTES
    Author: LPA Development Team
    Date: 2025-11-27
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$MigrationId,

    [Parameter(Mandatory = $true)]
    [string]$Database,

    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [switch]$Force,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:7071/api"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Undo Migration (Rollback)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Migration:   $MigrationId" -ForegroundColor White
Write-Host "  Database:    $Database" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host ""

# Confirmation for production
if ($Environment -eq "prod" -and -not $Force) {
    Write-Host "⚠️  WARNING: You are about to rollback a migration in PRODUCTION!" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "   Type 'ROLLBACK' to confirm"
    
    if ($confirmation -ne "ROLLBACK") {
        Write-Host ""
        Write-Host "❌ Rollback cancelled." -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

# Build request body
$body = @{
    migrationId = $MigrationId
    databaseId = $Database
    environment = $Environment
    executor = "$env:USERNAME@$env:COMPUTERNAME"
    executionContext = @{
        triggeredBy = "CLI"
        clientMachine = $env:COMPUTERNAME
        workingDirectory = $PWD.Path
        forcedExecution = $Force.IsPresent
    }
}

try {
    Write-Host "🔄 Rolling back migration..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/dbvc/migrations/rollback" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json -Depth 10) `
        -Headers @{ "X-Executor" = $env:USERNAME }
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Migration rolled back successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Migration ID: $($response.data.migrationId)" -ForegroundColor White
        Write-Host "  Duration:     $($response.data.durationMs)ms" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ Rollback failed!" -ForegroundColor Red
        if ($response.data.error) {
            Write-Host "   Error: $($response.data.error)" -ForegroundColor Red
        }
        if ($response.error) {
            Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
        }
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error rolling back migration: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
    }
    exit 1
}
