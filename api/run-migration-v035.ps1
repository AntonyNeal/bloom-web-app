# Run Migration V035 - Clients Table
# PowerShell script to execute SQL migration directly

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Bloom - Run Migration V035 (Clients Table)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from local.settings.json
$settingsPath = Join-Path $PSScriptRoot "local.settings.json"
if (Test-Path $settingsPath) {
    Write-Host "Loading settings from local.settings.json..." -ForegroundColor Yellow
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $env:SQL_SERVER = $settings.Values.SQL_SERVER
    $env:SQL_DATABASE = $settings.Values.SQL_DATABASE
    $env:SQL_USER = $settings.Values.SQL_USER
    $env:SQL_PASSWORD = $settings.Values.SQL_PASSWORD
} else {
    # Use Azure SQL Server credentials
    if (-not $env:SQL_SERVER) { $env:SQL_SERVER = "lpa-sql-server.database.windows.net" }
    if (-not $env:SQL_DATABASE) { $env:SQL_DATABASE = "lpa-bloom-db-prod" }
    if (-not $env:SQL_USER) {
        Write-Host "SQL credentials not found. Please provide them:" -ForegroundColor Yellow
        $env:SQL_USER = Read-Host "SQL_USER"
        $securePassword = Read-Host "SQL_PASSWORD" -AsSecureString
        $env:SQL_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
    }
}

# Build connection string
$connectionString = "Server=$env:SQL_SERVER;Database=$env:SQL_DATABASE;User Id=$env:SQL_USER;Password=$env:SQL_PASSWORD;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

Write-Host "Connecting to database..." -ForegroundColor Yellow
Write-Host "   Server: $env:SQL_SERVER" -ForegroundColor Gray
Write-Host "   Database: $env:SQL_DATABASE" -ForegroundColor Gray
Write-Host ""

# Read migration file
$migrationPath = Join-Path $PSScriptRoot "..\db\migrations\V035__create_clients_table.sql"
if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Migration file not found: $migrationPath" -ForegroundColor Red
    exit 1
}

$migrationSql = Get-Content $migrationPath -Raw

# Execute migration
try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    Write-Host "[OK] Connected to database" -ForegroundColor Green
    Write-Host ""
    Write-Host "Running migration V035..." -ForegroundColor Yellow
    
    $command = $connection.CreateCommand()
    $command.CommandText = $migrationSql
    $command.CommandTimeout = 60
    
    $result = $command.ExecuteNonQuery()
    
    Write-Host "[OK] Migration V035 completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Clients table created with columns:" -ForegroundColor Cyan
    Write-Host "   - id (UNIQUEIDENTIFIER)" -ForegroundColor Gray
    Write-Host "   - practitioner_id (UNIQUEIDENTIFIER)" -ForegroundColor Gray
    Write-Host "   - first_name, last_name" -ForegroundColor Gray
    Write-Host "   - email, phone" -ForegroundColor Gray
    Write-Host "   - date_of_birth, gender" -ForegroundColor Gray
    Write-Host "   - medicare_number, ndis_number" -ForegroundColor Gray
    Write-Host "   - halaxy_patient_id (for import tracking)" -ForegroundColor Gray
    Write-Host ""
    
    $connection.Close()
    
    Write-Host "[OK] Ready to import patients from Halaxy!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
