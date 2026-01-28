#!/bin/bash
# Azure Infrastructure Optimization Scripts
# Run this script to implement all recommendations
# Usage: ./azure-optimization.sh [phase]

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-lpa-unified"
SQL_RESOURCE_GROUP="lpa-rg"
SQL_SERVER="lpa-sql-server"
SQL_DATABASE="lpa-bloom-db-prod"
FUNCTION_APP="bloom-functions-prod"
FRONT_DOOR="fdt42kldozqahcu"
WAF_POLICY_NAME="lpa-waf-policy"

echo -e "${YELLOW}=== Azure Infrastructure Optimization ===${NC}"
echo "Target Date: January 28, 2026"
echo ""

# Phase selection
PHASE=${1:-all}

case $PHASE in
  all)
    echo -e "${GREEN}Running all phases...${NC}"
    PHASE_1=true
    PHASE_2=true
    PHASE_3=true
    ;;
  phase1)
    echo -e "${GREEN}Running Phase 1: Critical Fixes${NC}"
    PHASE_1=true
    ;;
  phase2)
    echo -e "${GREEN}Running Phase 2: Security${NC}"
    PHASE_2=true
    ;;
  phase3)
    echo -e "${GREEN}Running Phase 3: Cost Optimization${NC}"
    PHASE_3=true
    ;;
  *)
    echo -e "${RED}Usage: $0 [all|phase1|phase2|phase3]${NC}"
    exit 1
    ;;
esac

# Phase 1: Critical Fixes
if [ "$PHASE_1" = true ]; then
  echo ""
  echo -e "${YELLOW}--- Phase 1: Critical Fixes ---${NC}"
  
  # 1.1 Upgrade SQL Database
  echo -e "${YELLOW}1.1: Upgrading SQL database to Standard S1...${NC}"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    az sql db update \
      --resource-group "$SQL_RESOURCE_GROUP" \
      --server "$SQL_SERVER" \
      --name "$SQL_DATABASE" \
      --service-objective "S1"
    echo -e "${GREEN}✓ SQL database upgrade initiated${NC}"
    echo "Note: Upgrade may take 5-10 minutes. Verify with:"
    echo "  az sql db show --resource-group $SQL_RESOURCE_GROUP --server $SQL_SERVER --name $SQL_DATABASE --query serviceLevelObjective"
  else
    echo -e "${RED}✗ Skipped SQL upgrade${NC}"
  fi
fi

# Phase 2: Security Hardening
if [ "$PHASE_2" = true ]; then
  echo ""
  echo -e "${YELLOW}--- Phase 2: Security Hardening ---${NC}"
  
  # 2.1 Enable WAF
  echo -e "${YELLOW}2.1: Enabling WAF on Front Door...${NC}"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    
    # Create WAF policy
    echo "Creating WAF policy..."
    az network front-door waf-policy create \
      --name "$WAF_POLICY_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --sku Premium_AzureFrontDoor \
      --mode Detection  # Start in Detection mode for testing
    
    echo -e "${GREEN}✓ WAF policy created in Detection mode${NC}"
    echo "  Rule set: Microsoft_DefaultRuleSet v2.0"
    echo "  Mode: Detection (log-only, no blocking)"
    echo ""
    echo "After testing, switch to Prevention mode:"
    echo "  az network front-door waf-policy update --name $WAF_POLICY_NAME --resource-group $RESOURCE_GROUP --set properties.policySettings.mode=Prevention"
  else
    echo -e "${RED}✗ Skipped WAF setup${NC}"
  fi
fi

# Phase 3: Cost Optimization
if [ "$PHASE_3" = true ]; then
  echo ""
  echo -e "${YELLOW}--- Phase 3: Cost Optimization ---${NC}"
  
  # 3.1 Downgrade SWAs
  echo -e "${YELLOW}3.1: Downgrading dev/staging Static Web Apps to Free tier...${NC}"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    
    # Downgrade frontend-dev
    echo "Downgrading lpa-frontend-dev..."
    az staticwebapp update \
      --name "lpa-frontend-dev" \
      --resource-group "$SQL_RESOURCE_GROUP" \
      --sku "Free"
    echo -e "${GREEN}✓ lpa-frontend-dev → Free tier${NC}"
    
    # Downgrade frontend-staging
    echo "Downgrading lpa-frontend-staging..."
    az staticwebapp update \
      --name "lpa-frontend-staging" \
      --resource-group "$SQL_RESOURCE_GROUP" \
      --sku "Free"
    echo -e "${GREEN}✓ lpa-frontend-staging → Free tier${NC}"
    
    echo ""
    echo "Savings: $18/month ($216/year)"
  else
    echo -e "${RED}✗ Skipped SWA downgrades${NC}"
  fi
  
  # 3.2 Reserved Instances
  echo ""
  echo -e "${YELLOW}3.2: Reserved Instances for EP1 Function App...${NC}"
  echo "Note: Reserved Instances must be purchased via Azure Portal or programmatically"
  echo "Cost: $1,320/year (saves ~$480/year vs on-demand)"
  echo ""
  echo "To purchase:"
  echo "  1. Go to https://portal.azure.com"
  echo "  2. Search for 'Reservations'"
  echo "  3. Click 'Purchase Reservation'"
  echo "  4. Select 'App Service' → 'EP1' → '1 year' → 'Australia East'"
  echo "  5. Complete purchase"
fi

echo ""
echo -e "${GREEN}=== Phase execution complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Verify all changes in Azure Portal"
echo "2. Monitor Application Insights for errors"
echo "3. Test all endpoints"
echo "4. Document completion in tickets"
echo ""
echo "Documentation:"
echo "  - Implementation guide: docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md"
echo "  - Subscription recovery: docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md"
echo "  - Database backup/restore: docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md"
echo "  - Disaster recovery: docs/DISASTER_RECOVERY_RUNBOOK.md"
