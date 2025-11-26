<#
.SYNOPSIS
    Displays the status of database migrations.

.DESCRIPTION
    Shows all registered migrations and their applied status across environments.
    Displays pending, applied, and failed migrations for each database.
    
    Note: Only dev and prod environments exist. Staging uses dev DBs.

.PARAMETER Environment
    Optional: Filter by specific environment (dev, prod)

.PARAMETER Database
    Optional: Filter by specific database identifier

.PARAMETER Detailed
    Show detailed information including migration descriptions and timestamps

.PARAMETER ApiUrl
    Base URL for the DBVC API (defaults to local development)

.EXAMPLE
    .\Get-MigrationStatus.ps1
    .\Get-MigrationStatus.ps1 -Environment prod
    .\Get-MigrationStatus.ps1 -Database "lpa-bloom-sql-dev" -Detailed

.NOTES
    Author: LPA Development Team
    Date: 2025-11-27
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [string]$Database,

    [Parameter(Mandatory = $false)]
    [switch]$Detailed,

    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = "http://localhost:7071/api"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Migration Status" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Build query string
$queryParams = @()
if ($Environment) {
    $queryParams += "environment=$Environment"
}
if ($Database) {
    $queryParams += "databaseId=$Database"
}
$queryString = if ($queryParams.Count -gt 0) { "?" + ($queryParams -join "&") } else { "" }

try {
    Write-Host "🔍 Fetching migration status..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/dbvc/migrations/status$queryString" `
        -Method GET `
        -ContentType "application/json"
    
    if (-not $response.success) {
        Write-Host ""
        Write-Host "❌ Failed to fetch status: $($response.error.message)" -ForegroundColor Red
        exit 1
    }
    
    $databases = $response.data.databases
    
    if ($databases.Count -eq 0) {
        Write-Host ""
        Write-Host "   No databases found." -ForegroundColor Yellow
        exit 0
    }
    
    foreach ($db in $databases) {
        Write-Host ""
        Write-Host "──────────────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host "📦 $($db.databaseName)" -ForegroundColor Cyan
        Write-Host "   ID: $($db.databaseId) | Type: $($db.databaseType)" -ForegroundColor Gray
        Write-Host "──────────────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host ""
        
        # Summary
        Write-Host "  📊 Summary:" -ForegroundColor White
        Write-Host "     Total Migrations:   $($db.totalMigrations)" -ForegroundColor Gray
        Write-Host "     Applied:            $($db.appliedMigrations)" -ForegroundColor Green
        Write-Host "     Pending:            $($db.pendingMigrations)" -ForegroundColor $(if ($db.pendingMigrations -gt 0) { "Yellow" } else { "Gray" })
        if ($db.lastMigrationAt) {
            Write-Host "     Last Migration:     $($db.lastMigrationAt)" -ForegroundColor Gray
        }
        Write-Host ""
        
        if ($db.migrations -and $db.migrations.Count -gt 0) {
            Write-Host "  📋 Migrations:" -ForegroundColor White
            Write-Host ""
            
            foreach ($m in $db.migrations) {
                # Determine overall status (simplified: dev and prod only)
                $statusDev = $m.status.dev
                $statusProd = $m.status.prod
                
                $devIcon = switch ($statusDev) {
                    'success' { "✅" }
                    'failed' { "❌" }
                    'not-applied' { "⬜" }
                    default { "❓" }
                }
                $prodIcon = switch ($statusProd) {
                    'success' { "✅" }
                    'failed' { "❌" }
                    'not-applied' { "⬜" }
                    default { "❓" }
                }
                
                $reversibleIcon = if ($m.isReversible) { "↩️" } else { "🔒" }
                
                Write-Host "     $reversibleIcon $($m.migrationId)" -ForegroundColor White
                Write-Host "        Dev: $devIcon  Prod: $prodIcon" -ForegroundColor Gray
                
                if ($Detailed) {
                    Write-Host "        Description: $($m.description)" -ForegroundColor Gray
                    Write-Host "        Author: $($m.author) | Created: $($m.createdAt)" -ForegroundColor DarkGray
                }
                Write-Host ""
            }
        }
        else {
            Write-Host "   No migrations registered." -ForegroundColor Gray
        }
    }
    
    # Legend
    Write-Host ""
    Write-Host "Legend: ✅ Applied  ❌ Failed  ⬜ Not Applied  ↩️ Reversible  🔒 Non-reversible" -ForegroundColor DarkGray
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "❌ Error fetching status: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
    }
    exit 1
}
