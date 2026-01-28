# Save Azure SQL Credentials for Reuse
# This creates a secure config file so you don't have to re-enter credentials

param(
    [string]$SqlServer = "lpa-sql-server.database.windows.net",
    [string]$SqlDatabase = "lpa-bloom-db-prod",
    [string]$SqlUser,
    [string]$SqlPassword
)

Write-Host "Saving Azure SQL credentials for reuse..." -ForegroundColor Cyan
Write-Host ""

if (-not $SqlUser) {
    $SqlUser = Read-Host "SQL Username"
}
if (-not $SqlPassword) {
    $securePassword = Read-Host "SQL Password" -AsSecureString
    $SqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
}

# Create config object
$config = @{
    SqlServer = $SqlServer
    SqlDatabase = $SqlDatabase
    SqlUser = $SqlUser
    SqlPassword = $SqlPassword
    SavedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

# Save to JSON file
$configPath = "..\bloom-sql-config.json"
$config | ConvertTo-Json | Set-Content $configPath

Write-Host "Credentials saved to: $configPath" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run migrations without re-entering credentials." -ForegroundColor Green
Write-Host ""
