# Documentation Archive Organization Script

# This PowerShell script organizes the Bloom Web App documentation into a curated structure

Write-Host "🗂️  Organizing Bloom Web App Documentation..." -ForegroundColor Green

# Create backup of current state
Write-Host "Creating backup..." -ForegroundColor Yellow
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "docs_backup_$backupDate"
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item -Path "*.md" -Destination $backupDir -Force

# Archive historical development documents
Write-Host "Archiving development phase documents..." -ForegroundColor Yellow
$archiveFiles = @(
    "AMBIENT_BACKGROUND_PHASE_1.md",
    "BLOOM_BUTTON_ENHANCEMENT.md",
    "BLOOM_DEVELOPMENT_PROMPT.md",
    "COLOR_CONTRAST_ANALYSIS.md",
    "DESIGN_SYSTEM_PROGRESS_REPORT.md",
    "DEVELOPMENT_ENVIRONMENT_SETUP_REPORT.md",
    "GARDEN_COMPOSITION_REBALANCING.md",
    "JOIN_US_COPY_STRATEGY.md",
    "LANDING_PAGE_GARDEN_ANIMATION_REPORT.md",
    "LANDING_PAGE_OPTIMIZATION_COMPLETE_SUMMARY.md",
    "LANDING_PAGE_OPTIMIZATION_EXECUTIVE_SUMMARY.md",
    "LANDING_PAGE_OPTIMIZATION_FINAL.md",
    "LANDING_PAGE_OPTIMIZATION_PHASE_2.md",
    "LANDING_PAGE_OPTIMIZATION_PHASE_2A_RESULTS.md",
    "LANDING_PAGE_OPTIMIZATION_REPORT.md",
    "LIGHTHOUSE_OPTIMIZATION_FINAL_REPORT.md",
    "LIGHTHOUSE_PERFORMANCE_OPTIMIZATION_PLAN.md",
    "OPTIMIZATION_COMPLETE_PHASE_1.md",
    "PERFORMANCE_OPTIMIZATION_PLAN.md",
    "PERFORMANCE_OPTIMIZATION_REPORT.md",
    "PERFORMANCE_OPTIMIZATION_REPORT_2.md",
    "PHASE_1_FIX_NO_MORE_GRUBS.md",
    "PHASE_1_OPTIMIZATION_PROGRESS.md",
    "PHASE_1_OPTIMIZATION_SUMMARY.md",
    "PHASE_2_ENTRANCE_ANIMATIONS.md",
    "PHASE_2_OPTIMIZATION_PROGRESS.md",
    "PHASE_3_FORM_INTERACTIONS.md",
    "PHASE_7_PERFORMANCE_OPTIMIZATION.md",
    "PHASE_7_THE_GARDEN_GATE.md",
    "PHASE_8_SPATIAL_NAVIGATION.md",
    "QUALIFICATION_CHECK_BLOOM_ITERATION_1.md",
    "QUALIFICATION_CHECK_PHASE_PROGRESS_REPORT.md",
    "QUALIFICATIONCHECK_OPTIMIZATIONS.md",
    "TIER_1_CHERRY_BLOSSOM_REFINEMENT.md",
    "TIER_2_ROSE_MIYAZAKI_REDESIGN.md",
    "AZURE_RESOURCES_AUDIT_REPORT.md",
    "AZURE_AD_AUTHENTICATION_REPORT.md",
    "AZURE_AD_CONFIGURATION_CHECKLIST.md",
    "BLOOM_APPS_CREATED.md",
    "WORKFLOW_FIXED.md"
)

foreach ($file in $archiveFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/archive/" -Force
        Write-Host "  ✅ Archived: $file" -ForegroundColor Green
    }
}

# Move superseded documents
Write-Host "Moving superseded documents..." -ForegroundColor Yellow
$supersededFiles = @(
    "DEPLOYMENT_CHECKLIST.md",
    "DEPLOYMENT_IN_PROGRESS.md",
    "DEPLOY_NOW.md",
    "QUICK_DEPLOY.md",
    "PRODUCTION_SETUP.md",
    "BLOOM-AUTH-SETUP-INSTRUCTIONS.md",
    "APPLICATION_SUBMISSION_DEPLOYMENT.md",
    "QUICKSTART_APPLICATION_SUBMISSION.md",
    "CRITICAL_FIX_REQUIRED.md",
    "ACCESSIBILITY_IMPROVEMENTS.md"
)

foreach ($file in $supersededFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/superseded/" -Force
        Write-Host "  ✅ Superseded: $file" -ForegroundColor Green
    }
}

# Create index files for each section
Write-Host "Creating index files..." -ForegroundColor Yellow

# Current documentation index
$currentIndex = @"
# Current Documentation Index

This directory contains the active, authoritative documentation for the Bloom Web App.

## Essential Documents (Start Here)
1. **README_FINAL.md** - Complete project overview and technical guide
2. **PROJECT_EXECUTIVE_SUMMARY.md** - Executive summary and project achievements
3. **DEPLOYMENT.md** - Production deployment guide
4. **QUICKSTART.md** - 10-minute local development setup

## Technical Documentation
- **ARCHITECTURE.md** - System architecture and technical design
- **AUTHENTICATION_COMPLETE.md** - Azure AD B2C implementation
- **APPLICATION_MANAGEMENT_README.md** - Feature documentation
- **IMPLEMENTATION_SUMMARY.md** - Feature implementation status

## Development Environment
- **WORKSPACE_OPTIMIZATION_README.md** - VS Code optimization guide
- **SECRETS_CONFIGURATION.md** - Environment variables guide

---
**Last Updated**: October 24, 2025
**Maintenance**: Review monthly for accuracy
"@

$currentIndex | Out-File -FilePath "docs/current/README.md" -Encoding UTF8

# Archive index
$archiveIndex = @"
# Documentation Archive

This directory contains historical development documents that chronicle the development journey of the Bloom Web App. These documents are preserved for reference but are not needed for current development.

## Development Phases
- **PHASE_*_*.md** - Development phase documentation
- **OPTIMIZATION_*.md** - Performance optimization reports
- **LANDING_PAGE_*.md** - Landing page optimization series

## Component Development
- **TIER_*_*.md** - Flower component refinement documentation
- **GARDEN_*.md** - Garden layout and composition documents

## Infrastructure Setup
- **AZURE_*.md** - Azure resource setup and configuration
- **BLOOM_*.md** - Application setup and configuration

## Strategy & Design
- **JOIN_US_*.md** - Content strategy documents
- **DESIGN_SYSTEM_*.md** - Design system development
- **COLOR_*.md** - Color and accessibility analysis

---
**Status**: Historical reference only
**Last Archived**: October 24, 2025
"@

$archiveIndex | Out-File -FilePath "docs/archive/README.md" -Encoding UTF8

# Superseded index
$supersededIndex = @"
# Superseded Documentation

This directory contains documents that have been replaced by newer versions or are no longer applicable. These are kept for historical reference only.

## Superseded by Current Documents
- **DEPLOYMENT_CHECKLIST.md** → Use **docs/current/DEPLOYMENT.md**
- **BLOOM-AUTH-SETUP-INSTRUCTIONS.md** → Use **docs/current/AUTHENTICATION_COMPLETE.md**
- **QUICKSTART_APPLICATION_SUBMISSION.md** → Use **docs/current/QUICKSTART.md**

## Completed/Resolved Issues
- **CRITICAL_FIX_REQUIRED.md** - Issues have been resolved
- **DEPLOYMENT_IN_PROGRESS.md** - Deployment is complete
- **ACCESSIBILITY_IMPROVEMENTS.md** - Improvements have been implemented

## Outdated Processes
- **QUICK_DEPLOY.md** - Superseded by automated deployment
- **PRODUCTION_SETUP.md** - Infrastructure is already set up

---
**Status**: Obsolete - Do not use for current development
**Last Updated**: October 24, 2025
"@

$supersededIndex | Out-File -FilePath "docs/superseded/README.md" -Encoding UTF8

# Summary report
Write-Host "`n📊 Documentation Organization Complete!" -ForegroundColor Green
Write-Host "📁 Current Documents: $(Get-ChildItem 'docs/current/*.md' | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Cyan
Write-Host "📁 Archived Documents: $(Get-ChildItem 'docs/archive/*.md' | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Cyan
Write-Host "📁 Superseded Documents: $(Get-ChildItem 'docs/superseded/*.md' | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Cyan
Write-Host "💾 Backup Created: $backupDir" -ForegroundColor Yellow

Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. Review docs/current/ for essential documentation" -ForegroundColor White
Write-Host "2. Use PROJECT_EXECUTIVE_SUMMARY.md for project overview" -ForegroundColor White
Write-Host "3. Reference DOCUMENTATION_LIBRARY.md for complete index" -ForegroundColor White
Write-Host "4. Commit organized documentation structure" -ForegroundColor White

Write-Host "`n✨ Bloom Web App Documentation is now beautifully organized! ✨" -ForegroundColor Magenta
