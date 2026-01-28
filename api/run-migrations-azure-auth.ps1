#!/usr/bin/env pwsh
# Run migrations using Azure-authenticated SQL connection (no password needed)
# This uses your current Azure login for authentication

param(
    [string]$SqlServer = "lpa-sql-server.database.windows.net",
    [string]$SqlDatabase = "lpa-bloom-db-prod"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Bloom MVP - Run Migrations (Azure Auth)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Get Azure access token for SQL
Write-Host "Getting Azure access token for SQL..." -ForegroundColor Yellow

try {
    # Get the current Azure context
    $context = Get-AzContext
    if (-not $context) {
        Write-Host "[ERROR] Not authenticated to Azure. Please run: Connect-AzAccount" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Authenticated as: $($context.Account.Id)" -ForegroundColor Green
    
    # Get access token for SQL
    $token = Get-AzAccessToken -ResourceUrl "https://database.windows.net"
    $accessToken = $token.Token
    
    Write-Host "[OK] Got SQL access token" -ForegroundColor Green
    Write-Host ""
    
    # Build connection using token
    $connectionString = "Server=$SqlServer;Database=$SqlDatabase;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    
    Write-Host "Connecting to: $SqlServer / $SqlDatabase" -ForegroundColor Cyan
    
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.AccessToken = $accessToken
    $connection.Open()
    
    Write-Host "[OK] Connected!" -ForegroundColor Green
    Write-Host ""
    
    # Run migrations
    $migrations = @(
        @{ Version = "V035"; File = "V035__create_clients_table.sql"; Description = "Clients Table" },
        @{ Version = "V036"; File = "V036__create_appointments_table.sql"; Description = "Appointments Table" },
        @{ Version = "V037"; File = "V037__create_availability_slots.sql"; Description = "Availability Slots" },
        @{ Version = "V038"; File = "V038__create_invoices_table.sql"; Description = "Invoices Table" }
    )
    
    $successCount = 0
    $failCount = 0
    
    foreach ($migration in $migrations) {
        $migrationPath = "..\db\migrations\$($migration.File)"
        
        if (-not (Test-Path $migrationPath)) {
            Write-Host "[$($migration.Version)] [SKIP] $($migration.Description) - File not found" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "[$($migration.Version)] Running: $($migration.Description)..." -ForegroundColor Cyan
        
        try {
            $sql = Get-Content $migrationPath -Raw
            
            $command = $connection.CreateCommand()
            $command.CommandText = $sql
            $command.CommandTimeout = 60
            
            $command.ExecuteNonQuery() | Out-Null
            
            Write-Host "[$($migration.Version)] [OK] $($migration.Description)" -ForegroundColor Green
            $successCount++
            
        } catch {
            Write-Host "[$($migration.Version)] [ERROR] $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    }
    
    $connection.Close()
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  Migration Results" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  Success: $successCount" -ForegroundColor Green
    Write-Host "  Failed:  $failCount" -ForegroundColor Red
    Write-Host ""
    
    if ($failCount -eq 0) {
        Write-Host "[OK] All migrations completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next: Import Halaxy patients" -ForegroundColor Cyan
        Write-Host "      .\import-halaxy-patients.ps1" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
