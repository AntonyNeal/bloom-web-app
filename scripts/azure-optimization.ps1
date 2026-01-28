@echo off
REM Azure Infrastructure Optimization Scripts (PowerShell)
REM Run this script to implement all recommendations
REM Usage: azure-optimization.ps1 -Phase [all|phase1|phase2|phase3]

param (
    [string]$Phase = "all"
)

# Configuration
$RESOURCE_GROUP = "rg-lpa-unified"
$SQL_RESOURCE_GROUP = "lpa-rg"
$SQL_SERVER = "lpa-sql-server"
$SQL_DATABASE = "lpa-bloom-db-prod"
$FUNCTION_APP = "bloom-functions-prod"
$FRONT_DOOR = "fdt42kldozqahcu"
$WAF_POLICY_NAME = "lpa-waf-policy"

Write-Host "=== Azure Infrastructure Optimization ===" -ForegroundColor Yellow
Write-Host "Target Date: January 28, 2026" -ForegroundColor Yellow
Write-Host ""

# Determine which phases to run
$runPhase1 = $false
$runPhase2 = $false
$runPhase3 = $false

switch ($Phase.ToLower()) {
    "all" {
        Write-Host "Running all phases..." -ForegroundColor Green
        $runPhase1 = $true
        $runPhase2 = $true
        $runPhase3 = $true
    }
    "phase1" {
        Write-Host "Running Phase 1: Critical Fixes" -ForegroundColor Green
        $runPhase1 = $true
    }
    "phase2" {
        Write-Host "Running Phase 2: Security" -ForegroundColor Green
        $runPhase2 = $true
    }
    "phase3" {
        Write-Host "Running Phase 3: Cost Optimization" -ForegroundColor Green
        $runPhase3 = $true
    }
    default {
        Write-Host "Usage: azure-optimization.ps1 -Phase [all|phase1|phase2|phase3]" -ForegroundColor Red
        exit 1
    }
}

# Phase 1: Critical Fixes
if ($runPhase1) {
    Write-Host ""
    Write-Host "--- Phase 1: Critical Fixes ---" -ForegroundColor Yellow
    
    # 1.1 Upgrade SQL Database
    Write-Host "1.1: Upgrading SQL database to Standard S1..." -ForegroundColor Yellow
    $proceed = Read-Host "Continue? (y/n)"
    if ($proceed -eq 'y' -or $proceed -eq 'Y') {
        Write-Host "Upgrading database..."
        az sql db update `
            --resource-group $SQL_RESOURCE_GROUP `
            --server $SQL_SERVER `
            --name $SQL_DATABASE `
            --service-objective "S1"
        
        Write-Host "✓ SQL database upgrade initiated" -ForegroundColor Green
        Write-Host "Note: Upgrade may take 5-10 minutes. Verify with:" -ForegroundColor Cyan
        Write-Host "  az sql db show --resource-group $SQL_RESOURCE_GROUP --server $SQL_SERVER --name $SQL_DATABASE --query serviceLevelObjective"
    } else {
        Write-Host "✗ Skipped SQL upgrade" -ForegroundColor Red
    }
}

# Phase 2: Security Hardening
if ($runPhase2) {
    Write-Host ""
    Write-Host "--- Phase 2: Security Hardening ---" -ForegroundColor Yellow
    
    # 2.1 Enable WAF
    Write-Host "2.1: Enabling WAF on Front Door..." -ForegroundColor Yellow
    $proceed = Read-Host "Continue? (y/n)"
    if ($proceed -eq 'y' -or $proceed -eq 'Y') {
        Write-Host "Creating WAF policy..." -ForegroundColor Cyan
        az network front-door waf-policy create `
            --name $WAF_POLICY_NAME `
            --resource-group $RESOURCE_GROUP `
            --sku Premium_AzureFrontDoor `
            --mode Detection
        
        Write-Host "✓ WAF policy created in Detection mode" -ForegroundColor Green
        Write-Host "  Rule set: Microsoft_DefaultRuleSet v2.0" -ForegroundColor Cyan
        Write-Host "  Mode: Detection (log-only, no blocking)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "After testing, switch to Prevention mode:" -ForegroundColor Cyan
        Write-Host "  az network front-door waf-policy update --name $WAF_POLICY_NAME --resource-group $RESOURCE_GROUP --set properties.policySettings.mode=Prevention"
    } else {
        Write-Host "✗ Skipped WAF setup" -ForegroundColor Red
    }
}

# Phase 3: Cost Optimization
if ($runPhase3) {
    Write-Host ""
    Write-Host "--- Phase 3: Cost Optimization ---" -ForegroundColor Yellow
    
    # 3.1 Downgrade SWAs
    Write-Host "3.1: Downgrading dev/staging Static Web Apps to Free tier..." -ForegroundColor Yellow
    $proceed = Read-Host "Continue? (y/n)"
    if ($proceed -eq 'y' -or $proceed -eq 'Y') {
        Write-Host "Downgrading lpa-frontend-dev..." -ForegroundColor Cyan
        az staticwebapp update `
            --name "lpa-frontend-dev" `
            --resource-group $SQL_RESOURCE_GROUP `
            --sku "Free"
        Write-Host "✓ lpa-frontend-dev → Free tier" -ForegroundColor Green
        
        Write-Host "Downgrading lpa-frontend-staging..." -ForegroundColor Cyan
        az staticwebapp update `
            --name "lpa-frontend-staging" `
            --resource-group $SQL_RESOURCE_GROUP `
            --sku "Free"
        Write-Host "✓ lpa-frontend-staging → Free tier" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Savings: $18/month ($216/year)" -ForegroundColor Green
    } else {
        Write-Host "✗ Skipped SWA downgrades" -ForegroundColor Red
    }
    
    # 3.2 Reserved Instances
    Write-Host ""
    Write-Host "3.2: Reserved Instances for EP1 Function App..." -ForegroundColor Yellow
    Write-Host "Note: Reserved Instances must be purchased via Azure Portal" -ForegroundColor Cyan
    Write-Host "Cost: $1,320/year (saves ~$480/year vs on-demand)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To purchase:" -ForegroundColor Cyan
    Write-Host "  1. Go to https://portal.azure.com" -ForegroundColor Cyan
    Write-Host "  2. Search for 'Reservations'" -ForegroundColor Cyan
    Write-Host "  3. Click 'Purchase Reservation'" -ForegroundColor Cyan
    Write-Host "  4. Select 'App Service' → 'EP1' → '1 year' → 'Australia East'" -ForegroundColor Cyan
    Write-Host "  5. Complete purchase" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Phase execution complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify all changes in Azure Portal" -ForegroundColor Cyan
Write-Host "2. Monitor Application Insights for errors" -ForegroundColor Cyan
Write-Host "3. Test all endpoints" -ForegroundColor Cyan
Write-Host "4. Document completion in tickets" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Implementation guide: docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md" -ForegroundColor Cyan
Write-Host "  - Subscription recovery: docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md" -ForegroundColor Cyan
Write-Host "  - Database backup/restore: docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md" -ForegroundColor Cyan
Write-Host "  - Disaster recovery: docs/DISASTER_RECOVERY_RUNBOOK.md" -ForegroundColor Cyan
