<#
.SYNOPSIS
    Creates a new database migration.

.DESCRIPTION
    Generates a new migration with a timestamp-based ID and registers it in the
    version control system. Creates both up and down script templates.

.PARAMETER Name
    Descriptive name for the migration (e.g., "add_user_preferences")

.PARAMETER Database
    Target database identifier (e.g., "lpa-bloom-sql-dev")

.PARAMETER Author
    Author name for the migration (defaults to current user)

.PARAMETER Description
    Optional detailed description of the migration

.PARAMETER DependsOn
    Optional comma-separated list of migration IDs this depends on

.PARAMETER Tags
    Optional comma-separated list of tags for categorization

.PARAMETER ApiUrl
    Base URL for the DBVC API (defaults to local development)

.EXAMPLE
    .\New-Migration.ps1 -Name "add_user_preferences" -Database "lpa-bloom-sql-dev"
    .\New-Migration.ps1 -Name "create_audit_log" -Database "lpa-bloom-sql-prod" -Author "John Doe"

.NOTES
    Author: LPA Development Team
    Date: 2025-11-27
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^[a-zA-Z0-9_]+$')]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$Database,

    [Parameter(Mandatory = $false)]
    [string]$Author = $env:USERNAME,

    [Parameter(Mandatory = $false)]
    [string]$Description,

    [Parameter(Mandatory = $false)]
    [string]$DependsOn,

    [Parameter(Mandatory = $false)]
    [string]$Tags,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:7071/api"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  New Migration" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Build request body
$body = @{
    name = $Name
    databaseId = $Database
    author = $Author
}

if ($Description) {
    $body.description = $Description
}

if ($DependsOn) {
    $body.dependsOn = $DependsOn -split ',' | ForEach-Object { $_.Trim() }
}

if ($Tags) {
    $body.tags = $Tags -split ',' | ForEach-Object { $_.Trim() }
}

Write-Host "  Name:        $Name" -ForegroundColor White
Write-Host "  Database:    $Database" -ForegroundColor White
Write-Host "  Author:      $Author" -ForegroundColor White
Write-Host ""

try {
    Write-Host "🚀 Creating migration..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/dbvc/migrations" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json -Depth 10) `
        -Headers @{ "X-Executor" = $Author }
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Migration created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Migration ID: $($response.data.migrationId)" -ForegroundColor Cyan
        Write-Host "  File Path:    $($response.data.filePath)" -ForegroundColor White
        Write-Host ""
        Write-Host "  Next Steps:" -ForegroundColor Yellow
        Write-Host "    1. Edit the migration script at: $($response.data.filePath)" -ForegroundColor White
        Write-Host "    2. Run migrations: .\Invoke-Migrations.ps1 -Environment dev -Database $Database" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ Failed to create migration" -ForegroundColor Red
        Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error creating migration: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
    }
    exit 1
}
