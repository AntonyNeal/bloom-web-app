<#
.SYNOPSIS
    Captures a snapshot of the current database schema.

.DESCRIPTION
    Creates a point-in-time snapshot of the database schema and stores it
    in Cosmos DB for comparison and drift detection.
    
    Note: Only dev and prod environments exist. Staging uses dev DBs.

.PARAMETER Database
    Target database identifier

.PARAMETER Environment
    Target environment: dev or prod

.PARAMETER Type
    Capture type: auto, manual, or baseline

.PARAMETER TriggeringMigration
    Optional: Migration ID that triggered this snapshot

.PARAMETER ApiUrl
    Base URL for the DBVC API (defaults to local development)

.EXAMPLE
    .\Export-SchemaSnapshot.ps1 -Database "lpa-bloom-sql-dev" -Environment dev
    .\Export-SchemaSnapshot.ps1 -Database "lpa-bloom-sql-prod" -Environment prod -Type baseline

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
    [ValidateSet('auto', 'manual', 'baseline')]
    [string]$Type = "manual",

    [Parameter(Mandatory = $false)]
    [string]$TriggeringMigration,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:7071/api"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Export Schema Snapshot" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Database:    $Database" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  Type:        $Type" -ForegroundColor White
Write-Host ""

# Build request body
$body = @{
    databaseId = $Database
    environment = $Environment
    captureType = $Type
    capturedBy = "$env:USERNAME@$env:COMPUTERNAME"
}

if ($TriggeringMigration) {
    $body.triggeringMigrationId = $TriggeringMigration
}

try {
    Write-Host "📸 Capturing schema snapshot..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/dbvc/snapshots" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json -Depth 10) `
        -Headers @{ "X-Executor" = $env:USERNAME }
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Schema snapshot captured successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Snapshot ID:        $($response.data.snapshotId)" -ForegroundColor Cyan
        Write-Host "  Schema Hash:        $($response.data.schemaHash)" -ForegroundColor White
        Write-Host "  Tables Captured:    $($response.data.tableCount)" -ForegroundColor White
        Write-Host "  Cosmos Document ID: $($response.data.cosmosDocumentId)" -ForegroundColor Gray
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ Failed to capture snapshot" -ForegroundColor Red
        Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error capturing snapshot: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
    }
    exit 1
}
