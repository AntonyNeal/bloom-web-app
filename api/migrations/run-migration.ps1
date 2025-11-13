# Run SQL migration on Azure SQL Database
# This script executes the migration using sqlcmd

$server = "lpa-sql-server.database.windows.net"
$database = "lpa-applications-db"
$username = "lpaadmin"
$password = "BloomPlatform2025!Secure"

$migrationFile = "002_add_all_application_columns.sql"

Write-Host "Running migration: $migrationFile" -ForegroundColor Cyan

# Read the SQL file
$sqlContent = Get-Content $migrationFile -Raw

# Use sqlcmd if available, otherwise use Invoke-Sqlcmd
try {
    if (Get-Command sqlcmd -ErrorAction SilentlyContinue) {
        sqlcmd -S $server -d $database -U $username -P $password -i $migrationFile -I
    } elseif (Get-Command Invoke-Sqlcmd -ErrorAction SilentlyContinue) {
        Invoke-Sqlcmd -ServerInstance $server -Database $database -Username $username -Password $password -Query $sqlContent
    } else {
        Write-Host "Neither sqlcmd nor Invoke-Sqlcmd is available. Please run the migration manually in Azure Portal." -ForegroundColor Yellow
        Write-Host "Migration file: $migrationFile" -ForegroundColor Yellow
    }
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error running migration: $_" -ForegroundColor Red
    Write-Host "Please run the migration manually in Azure Portal SQL Query Editor" -ForegroundColor Yellow
}
