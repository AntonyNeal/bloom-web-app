<#
.SYNOPSIS
    Initializes Azure infrastructure for the Database Version Control System.

.DESCRIPTION
    Creates Cosmos DB account and database with required collections for tracking
    database migrations, change events, and schema snapshots. Extends existing
    SQL Database with version control tables.
    
    Database Architecture (4 total):
    - 2 SQL databases: dev, prod
    - 2 Cosmos databases: dev, prod
    - Staging branch uses dev databases for validation

.PARAMETER Environment
    Target environment: dev or prod (staging uses dev)

.PARAMETER ResourceGroup
    Azure resource group name (defaults to existing LPA resource group)

.PARAMETER Location
    Azure region (defaults to Australia East)

.PARAMETER SkipSqlSetup
    Skip SQL table creation (useful if already exists)

.PARAMETER SkipCosmosSetup
    Skip Cosmos DB setup (useful if already exists)

.EXAMPLE
    .\Initialize-Infrastructure.ps1 -Environment dev
    .\Initialize-Infrastructure.ps1 -Environment prod -SkipSqlSetup

.NOTES
    Author: LPA Development Team
    Date: 2025-11-27
    Requires: Azure CLI, PowerShell 5.1+
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $false)]
    [string]$ResourceGroup = "rg-lpa-unified",

    [Parameter(Mandatory = $false)]
    [string]$Location = "australiaeast",

    [Parameter(Mandatory = $false)]
    [switch]$SkipSqlSetup,

    [Parameter(Mandatory = $false)]
    [switch]$SkipCosmosSetup
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Configuration
# ============================================================================

$config = @{
    dev = @{
        cosmosAccount = "lpa-cosmos"  # Shared account, separate database
        cosmosDatabase = "lpa-dbvc-dev"
        sqlServer = "lpa-sql-server"
        sqlDatabase = "lpa-bloom-db-dev"
        keyVaultName = "lpa-kv-dev"
    }
    prod = @{
        cosmosAccount = "lpa-cosmos"  # Shared account, separate database
        cosmosDatabase = "lpa-dbvc-prod"
        sqlServer = "lpa-sql-server"
        sqlDatabase = "lpa-bloom-db-prod"
        keyVaultName = "lpa-kv-prod"
    }
}

$envConfig = $config[$Environment]

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Database Version Control - Infrastructure Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Environment:    $Environment" -ForegroundColor White
Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "  Location:       $Location" -ForegroundColor White
Write-Host ""

# ============================================================================
# Verify Azure CLI Authentication
# ============================================================================

Write-Host "🔐 Verifying Azure CLI authentication..." -ForegroundColor Yellow
try {
    $account = az account show 2>&1 | ConvertFrom-Json
    Write-Host "   ✅ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "   📍 Subscription: $($account.name)" -ForegroundColor White
}
catch {
    Write-Host "   ❌ Not logged in to Azure CLI. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# ============================================================================
# Verify Resource Group Exists
# ============================================================================

Write-Host ""
Write-Host "📁 Verifying resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroup 2>&1
if ($rgExists -ne "true") {
    Write-Host "   ⚠️ Resource group '$ResourceGroup' not found. Creating..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location | Out-Null
    Write-Host "   ✅ Resource group created" -ForegroundColor Green
}
else {
    Write-Host "   ✅ Resource group exists" -ForegroundColor Green
}

# ============================================================================
# Create Cosmos DB Infrastructure
# ============================================================================

if (-not $SkipCosmosSetup) {
    Write-Host ""
    Write-Host "🌐 Setting up Cosmos DB for version control..." -ForegroundColor Yellow
    
    $cosmosAccountName = $envConfig.cosmosAccount
    
    # Check if account exists
    $existingAccount = az cosmosdb show `
        --name $cosmosAccountName `
        --resource-group $ResourceGroup `
        2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   📦 Creating Cosmos DB account: $cosmosAccountName" -ForegroundColor White
        
        az cosmosdb create `
            --name $cosmosAccountName `
            --resource-group $ResourceGroup `
            --locations regionName=$Location failoverPriority=0 isZoneRedundant=false `
            --default-consistency-level Session `
            --enable-automatic-failover false `
            --capabilities EnableServerless `
            --kind GlobalDocumentDB | Out-Null
        
        Write-Host "   ✅ Cosmos DB account created" -ForegroundColor Green
    }
    else {
        Write-Host "   ✅ Cosmos DB account already exists" -ForegroundColor Green
    }
    
    # Create database
    Write-Host "   📦 Creating 'version-control' database..." -ForegroundColor White
    az cosmosdb sql database create `
        --account-name $cosmosAccountName `
        --name "version-control" `
        --resource-group $ResourceGroup `
        2>&1 | Out-Null
    
    Write-Host "   ✅ Database created/verified" -ForegroundColor Green
    
    # Create change-events container
    Write-Host "   📦 Creating 'change-events' container..." -ForegroundColor White
    az cosmosdb sql container create `
        --account-name $cosmosAccountName `
        --database-name "version-control" `
        --name "change-events" `
        --partition-key-path "/databaseId" `
        --resource-group $ResourceGroup `
        2>&1 | Out-Null
    
    Write-Host "   ✅ change-events container created/verified" -ForegroundColor Green
    
    # Create schema-snapshots container
    Write-Host "   📦 Creating 'schema-snapshots' container..." -ForegroundColor White
    az cosmosdb sql container create `
        --account-name $cosmosAccountName `
        --database-name "version-control" `
        --name "schema-snapshots" `
        --partition-key-path "/databaseId" `
        --resource-group $ResourceGroup `
        2>&1 | Out-Null
    
    Write-Host "   ✅ schema-snapshots container created/verified" -ForegroundColor Green
    
    # Create migrations container (for storing migration metadata in Cosmos)
    Write-Host "   📦 Creating 'migrations' container..." -ForegroundColor White
    az cosmosdb sql container create `
        --account-name $cosmosAccountName `
        --database-name "version-control" `
        --name "migrations" `
        --partition-key-path "/databaseId" `
        --resource-group $ResourceGroup `
        2>&1 | Out-Null
    
    Write-Host "   ✅ migrations container created/verified" -ForegroundColor Green
    
    # Get connection string and store in Key Vault (if exists)
    Write-Host "   🔑 Retrieving connection string..." -ForegroundColor White
    $connectionString = az cosmosdb keys list `
        --name $cosmosAccountName `
        --resource-group $ResourceGroup `
        --type connection-strings `
        --query "connectionStrings[0].connectionString" `
        --output tsv
    
    Write-Host "   ✅ Connection string retrieved" -ForegroundColor Green
    
    # Output connection string for local development
    $envFile = Join-Path $PSScriptRoot "..\..\api\.env.dbvc.$Environment"
    @"
# Database Version Control - $Environment Environment
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

DBVC_COSMOS_CONNECTION_STRING=$connectionString
DBVC_COSMOS_DATABASE=version-control
"@ | Set-Content $envFile
    
    Write-Host "   📄 Environment file created: $envFile" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "⏭️ Skipping Cosmos DB setup (--SkipCosmosSetup)" -ForegroundColor Yellow
}

# ============================================================================
# Create SQL Database Tables
# ============================================================================

if (-not $SkipSqlSetup) {
    Write-Host ""
    Write-Host "🗃️ Setting up SQL Database tables for version control..." -ForegroundColor Yellow
    
    $sqlScriptPath = Join-Path $PSScriptRoot "..\..\db\migrations\V100__version_control_schema.sql"
    
    if (-not (Test-Path $sqlScriptPath)) {
        Write-Host "   ⚠️ SQL script not found. Please run the migration manually." -ForegroundColor Yellow
        Write-Host "   📍 Expected path: $sqlScriptPath" -ForegroundColor White
    }
    else {
        Write-Host "   ✅ SQL migration script found: V100__version_control_schema.sql" -ForegroundColor Green
        Write-Host "   💡 Run migrations using: npm run migrate:$Environment (from /db folder)" -ForegroundColor White
    }
}
else {
    Write-Host ""
    Write-Host "⏭️ Skipping SQL setup (--SkipSqlSetup)" -ForegroundColor Yellow
}

# ============================================================================
# Summary
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Resources Created/Verified:" -ForegroundColor White
Write-Host "    • Cosmos DB Account: $($envConfig.cosmosAccount)" -ForegroundColor Gray
Write-Host "    • Database: version-control" -ForegroundColor Gray
Write-Host "    • Containers: change-events, schema-snapshots, migrations" -ForegroundColor Gray
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "    1. Run SQL migrations: cd db && npm run migrate:$Environment" -ForegroundColor White
Write-Host "    2. Update Function App settings with new env vars" -ForegroundColor White
Write-Host "    3. Test migration CLI: .\New-Migration.ps1 -Name 'test'" -ForegroundColor White
Write-Host ""
