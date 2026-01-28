# Run All MVP Migrations (V035-V038)
# Creates full practice management database schema

param(
    [string]$SqlServer,
    [string]$SqlDatabase,
    [string]$SqlUser,
    [string]$SqlPassword
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Bloom MVP - Run All Migrations (V035-V038)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Try to load credentials from saved config
$configPath = ".\bloom-sql-config.json"
if (Test-Path $configPath) {
    Write-Host "Loading saved credentials from config..." -ForegroundColor Yellow
    $config = Get-Content $configPath | ConvertFrom-Json
    $SqlServer = $config.SqlServer
    $SqlDatabase = $config.SqlDatabase
    $SqlUser = $config.SqlUser
    $SqlPassword = $config.SqlPassword
} else {
    # Use defaults and prompt for missing credentials
    if (-not $SqlServer) { $SqlServer = "lpa-sql-server.database.windows.net" }
    if (-not $SqlDatabase) { $SqlDatabase = "lpa-bloom-db-prod" }
    
    if (-not $SqlUser) {
        Write-Host "First time setup - entering credentials..." -ForegroundColor Yellow
        $SqlUser = Read-Host "SQL Username"
    }
    if (-not $SqlPassword) {
        $securePassword = Read-Host "SQL Password" -AsSecureString
        $SqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
    }
}

$connectionString = "Server=$SqlServer;Database=$SqlDatabase;User Id=$SqlUser;Password=$SqlPassword;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    Write-Host "[OK] Database connected" -ForegroundColor Green
    $connection.Close()
} catch {
    Write-Host "[ERROR] Failed to connect: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Migrations to run
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
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        $command = $connection.CreateCommand()
        $command.CommandText = $sql
        $command.CommandTimeout = 60
        
        $command.ExecuteNonQuery() | Out-Null
        $connection.Close()
        
        Write-Host "[$($migration.Version)] [OK] $($migration.Description)" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "[$($migration.Version)] [ERROR] $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

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
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Import Halaxy patients: .\import-halaxy-patients.ps1" -ForegroundColor Gray
    Write-Host "  2. Create availability slots for Zoe" -ForegroundColor Gray
    Write-Host "  3. Start building the UI for appointment management" -ForegroundColor Gray
    Write-Host ""
} else {
    exit 1
}
