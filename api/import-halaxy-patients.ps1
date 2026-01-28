# Import Halaxy Patients to Bloom Clients Table (PowerShell)
# 
# Imports ONLY non-sensitive demographic data:
# - Name, email, phone
# - Date of birth, gender
# - Contact details
# 
# Does NOT import:
# - Clinical notes
# - Medical history
# - Diagnoses
# - Treatment information
# 
# Usage:
#   .\import-halaxy-patients.ps1 -SqlServer "lpa-sql-server.database.windows.net" -SqlDatabase "lpa-bloom-db-prod" -SqlUser "user" -SqlPassword "pass"

param(
    [string]$SqlServer = "lpa-sql-server.database.windows.net",
    [string]$SqlDatabase = "lpa-bloom-db-prod",
    [string]$SqlUser,
    [string]$SqlPassword,
    [string]$HalaxyClientId,
    [string]$HalaxyClientSecret,
    [string]$PractitionerId
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Bloom - Import Halaxy Patients (Demographics Only)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Bloom - Import Halaxy Patients (Demographics Only)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Try to load SQL credentials from saved config
$configPath = ".\bloom-sql-config.json"
if (Test-Path $configPath) {
    Write-Host "Loading SQL credentials from config..." -ForegroundColor Yellow
    $config = Get-Content $configPath | ConvertFrom-Json
    if (-not $SqlServer) { $SqlServer = $config.SqlServer }
    if (-not $SqlDatabase) { $SqlDatabase = $config.SqlDatabase }
    if (-not $SqlUser) { $SqlUser = $config.SqlUser }
    if (-not $SqlPassword) { $SqlPassword = $config.SqlPassword }
}

# Prompt for missing credentials
if (-not $SqlUser) {
    $SqlUser = Read-Host "SQL Username"
}
if (-not $SqlPassword) {
    $securePassword = Read-Host "SQL Password" -AsSecureString
    $SqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
}
if (-not $HalaxyClientId) {
    Write-Host ""
    $HalaxyClientId = Read-Host "Halaxy Client ID"
}
if (-not $HalaxyClientSecret) {
    $secureSecret = Read-Host "Halaxy Client Secret" -AsSecureString
    $HalaxyClientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret))
}

Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor Yellow
$connectionString = "Server=$SqlServer;Database=$SqlDatabase;User Id=$SqlUser;Password=$SqlPassword;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    Write-Host "[OK] Database connected" -ForegroundColor Green
    $connection.Close()
} catch {
    Write-Host "[ERROR] Failed to connect to database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Getting Halaxy access token..." -ForegroundColor Yellow

# Get Halaxy OAuth token
try {
    $authString = [Convert]::ToBase64String(
        [System.Text.Encoding]::ASCII.GetBytes("$HalaxyClientId`:$HalaxyClientSecret"))
    
    $response = Invoke-WebRequest -Uri "https://au-api.halaxy.com/oauth2/token" `
        -Method POST `
        -Headers @{
            "Authorization" = "Basic $authString"
            "Content-Type" = "application/x-www-form-urlencoded"
        } `
        -Body "grant_type=client_credentials&scope=*" `
        -UseBasicParsing
    
    $tokenData = $response.Content | ConvertFrom-Json
    $accessToken = $tokenData.access_token
    
    if (-not $accessToken) {
        throw "No access token in response"
    }
    
    Write-Host "[OK] Got Halaxy access token" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to get Halaxy token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Fetching patients from Halaxy API..." -ForegroundColor Yellow

# Fetch patients
try {
    $response = Invoke-WebRequest -Uri "https://au-api.halaxy.com/main/Patient?_count=1000" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "Accept" = "application/fhir+json"
        } `
        -UseBasicParsing
    
    $bundle = $response.Content | ConvertFrom-Json
    $patients = $bundle.entry | ForEach-Object { $_.resource }
    
    Write-Host "[OK] Found $($patients.Count) patients in Halaxy" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to fetch patients: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($patients.Count -eq 0) {
    Write-Host "[WARNING] No patients found in Halaxy" -ForegroundColor Yellow
    exit 0
}

# Get practitioner ID if not provided
if (-not $PractitionerId) {
    Write-Host ""
    Write-Host "Getting practitioner ID from database..." -ForegroundColor Yellow
    
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT TOP 1 id FROM practitioners WHERE is_active = 1 ORDER BY created_at ASC"
    $command.CommandTimeout = 30
    
    $reader = $command.ExecuteReader()
    if ($reader.Read()) {
        $PractitionerId = $reader["id"].ToString()
        Write-Host "[OK] Practitioner ID: $PractitionerId" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No active practitioners found in database" -ForegroundColor Red
        $connection.Close()
        exit 1
    }
    
    $reader.Close()
    $connection.Close()
}

Write-Host ""
Write-Host "Importing patients..." -ForegroundColor Yellow
Write-Host ""

$imported = 0
$skipped = 0
$errors = 0

$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

foreach ($patient in $patients) {
    try {
        $halaxyPatientId = $patient.id
        $firstName = if ($patient.name[0].given[0]) { $patient.name[0].given[0] } else { "Unknown" }
        $lastName = if ($patient.name[0].family) { $patient.name[0].family } else { "Unknown" }
        
        $email = ($patient.telecom | Where-Object { $_.system -eq "email" } | Select-Object -First 1).value
        $phone = ($patient.telecom | Where-Object { $_.system -eq "phone" } | Select-Object -First 1).value
        
        $dateOfBirth = $patient.birthDate
        $gender = $patient.gender
        if ($gender -eq "unknown") { $gender = "prefer-not-to-say" }
        
        # Check if already imported
        $checkCmd = $connection.CreateCommand()
        $checkCmd.CommandText = "SELECT id FROM clients WHERE practitioner_id = @practitionerId AND halaxy_patient_id = @halaxyPatientId"
        $checkCmd.Parameters.AddWithValue("@practitionerId", [guid]$PractitionerId) | Out-Null
        $checkCmd.Parameters.AddWithValue("@halaxyPatientId", $halaxyPatientId) | Out-Null
        $checkCmd.CommandTimeout = 30
        
        $existing = $checkCmd.ExecuteReader()
        if ($existing.HasRows) {
            $existing.Close()
            Write-Host "  [SKIP] $firstName $lastName (already imported)"
            $skipped++
            continue
        }
        $existing.Close()
        
        # Insert new client
        $insertCmd = $connection.CreateCommand()
        $insertCmd.CommandText = @"
            INSERT INTO clients (
                practitioner_id,
                halaxy_patient_id,
                first_name,
                last_name,
                email,
                phone,
                date_of_birth,
                gender,
                imported_from_halaxy,
                imported_at
            ) VALUES (
                @practitionerId,
                @halaxyPatientId,
                @firstName,
                @lastName,
                @email,
                @phone,
                @dateOfBirth,
                @gender,
                1,
                GETUTCDATE()
            )
"@
        $insertCmd.Parameters.AddWithValue("@practitionerId", [guid]$PractitionerId) | Out-Null
        $insertCmd.Parameters.AddWithValue("@halaxyPatientId", $halaxyPatientId) | Out-Null
        $insertCmd.Parameters.AddWithValue("@firstName", $firstName) | Out-Null
        $insertCmd.Parameters.AddWithValue("@lastName", $lastName) | Out-Null
        $insertCmd.Parameters.AddWithValue("@email", [DBNull]::Value) | Out-Null
        $insertCmd.Parameters.AddWithValue("@phone", [DBNull]::Value) | Out-Null
        if ($email) { $insertCmd.Parameters["@email"].Value = $email }
        if ($phone) { $insertCmd.Parameters["@phone"].Value = $phone }
        if ($dateOfBirth) { $insertCmd.Parameters.AddWithValue("@dateOfBirth", [DateTime]$dateOfBirth) | Out-Null } 
        else { $insertCmd.Parameters.AddWithValue("@dateOfBirth", [DBNull]::Value) | Out-Null }
        if ($gender) { $insertCmd.Parameters.AddWithValue("@gender", $gender) | Out-Null }
        else { $insertCmd.Parameters.AddWithValue("@gender", [DBNull]::Value) | Out-Null }
        $insertCmd.CommandTimeout = 30
        
        $insertCmd.ExecuteNonQuery() | Out-Null
        
        Write-Host "  [OK] $firstName $lastName"
        $imported++
        
    } catch {
        Write-Host "  [ERROR] $($_.Exception.Message)"
        $errors++
    }
}

$connection.Close()

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Import Complete" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Imported: $imported" -ForegroundColor Green
Write-Host "  Skipped:  $skipped" -ForegroundColor Yellow
Write-Host "  Errors:   $errors" -ForegroundColor Red
Write-Host "  Total:    $($patients.Count)" -ForegroundColor Cyan
Write-Host ""
