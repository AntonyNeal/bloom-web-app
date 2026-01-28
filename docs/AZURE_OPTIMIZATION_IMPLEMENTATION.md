# Azure Infrastructure Optimization - Implementation Guide

> **Date**: January 28, 2026  
> **Status**: Ready for Implementation  
> **Priority**: Phased (Critical → Medium)

---

## Overview

This guide implements all recommendations from the Azure Infrastructure Assessment across 3 weeks.

---

## Phase 1: Critical Fixes (Week 1)

### Task 1.1: Upgrade Production Database to Standard S1

**Current State**: Basic tier (5 DTUs, 2GB)  
**Target State**: Standard S1 (20 DTUs, 250GB)  
**Estimated Downtime**: 2-3 minutes  

**Option A: Azure CLI (Recommended)**

```bash
# Set variables
RESOURCE_GROUP="lpa-rg"
SERVER_NAME="lpa-sql-server"
DATABASE_NAME="lpa-bloom-db-prod"
NEW_OBJECTIVE="S1"

# Upgrade database
az sql db update \
  --resource-group "$RESOURCE_GROUP" \
  --server "$SERVER_NAME" \
  --name "$DATABASE_NAME" \
  --service-objective "$NEW_OBJECTIVE"

# Verify upgrade
az sql db show \
  --resource-group "$RESOURCE_GROUP" \
  --server "$SERVER_NAME" \
  --name "$DATABASE_NAME" \
  --query "{Name:name, Edition:edition, ServiceObjective:serviceLevelObjective}"
```

**Option B: Azure Portal**

1. Go to Azure Portal → SQL databases → `lpa-bloom-db-prod`
2. Click **Pricing tier** (currently "Basic")
3. Select **Standard** tier, then **S1** (20 DTUs, 250GB)
4. Click **Apply**
5. Wait for upgrade to complete (~5 minutes)

**Verification**

```bash
# Should show Standard S1
az sql db show --resource-group lpa-rg --server lpa-sql-server --name lpa-bloom-db-prod --query serviceLevelObjective
```

**Cost Impact**: $15/month → $30/month (+$15/month, ~$180/year)

---

### Task 1.2: Document Subscription Suspension Recovery

Create a runbook for when subscription is suspended (see Appendix A).

**What happens when subscription suspends**:
1. ❌ All resources stop (databases pause, functions offline)
2. ❌ Front Door endpoint auto-disables
3. ❌ SSL certificates may fail validation
4. ✅ Data is retained (doesn't delete)

**Recovery Steps** (documented in [SUBSCRIPTION_RECOVERY_RUNBOOK.md](./SUBSCRIPTION_RECOVERY_RUNBOOK.md)):
1. Pay Azure bill to reactivate subscription
2. Re-enable Front Door endpoint
3. Verify custom domain SSL
4. Test all endpoints
5. Monitor Application Insights

---

## Phase 2: Security Hardening (Week 2)

### Task 2.1: Enable WAF on Front Door

**Current State**: Premium Front Door without WAF  
**Target State**: Premium Front Door with WAF policy enabled  
**Cost**: $0 (included in Premium tier)

```bash
# Set variables
RESOURCE_GROUP="rg-lpa-unified"
WAF_POLICY_NAME="lpa-waf-policy"
FRONT_DOOR_NAME="fdt42kldozqahcu"

# Create WAF policy
az network front-door waf-policy create \
  --name "$WAF_POLICY_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku Premium_AzureFrontDoor \
  --mode Prevention

# Create basic rule set (OWASP top 10)
az network front-door waf-policy rule-set add \
  --name "$WAF_POLICY_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --rule-set-type "Microsoft_DefaultRuleSet" \
  --rule-set-version "2.0" \
  --action "Block" \
  --priority "1" \
  --type "Microsoft_DefaultRuleSet"

# Verify WAF policy created
az network front-door waf-policy show \
  --name "$WAF_POLICY_NAME" \
  --resource-group "$RESOURCE_GROUP"
```

**What WAF Rules Block**:
- SQL Injection attempts
- XSS (Cross-site scripting)
- DDoS patterns
- Bot traffic
- Geo-blocking (can configure)
- Rate limiting (can configure)

**Testing WAF**:

```bash
# Test SQL injection attempt (should be blocked)
curl -X GET "https://life-psychology.com.au/?test=1' OR '1'='1" -v

# Check WAF logs in Application Insights
az monitor diagnostic-settings create \
  --resource-group rg-lpa-unified \
  --resource fdt42kldozqahcu \
  --resource-type "Microsoft.Network/frontDoors" \
  --name "waf-diagnostics" \
  --logs '[{"category":"FrontdoorAccessLog","enabled":true}]'
```

---

### Task 2.2: Create Database Backup & Restore Runbook

See [DATABASE_BACKUP_RESTORE_RUNBOOK.md](./DATABASE_BACKUP_RESTORE_RUNBOOK.md)

Key procedures:
- Automated backups (7 days retention)
- Point-in-time restore (35 days for Standard tier)
- Geo-redundant backup setup
- Manual backup creation
- Restore from backup

---

## Phase 3: Cost Optimization (Week 2-3)

### Task 3.1: Downgrade Development Static Web Apps to Free Tier

**Savings**: ~$9/month per app ($18/month total)

```bash
# Downgrade lpa-frontend-dev to Free tier
az staticwebapp update \
  --name "lpa-frontend-dev" \
  --resource-group "lpa-rg" \
  --sku "Free"

# Downgrade lpa-frontend-staging to Free tier  
az staticwebapp update \
  --name "lpa-frontend-staging" \
  --resource-group "lpa-rg" \
  --sku "Free"

# Verify downgrades
az staticwebapp list --query "[].{Name:name, Sku:sku}" -o table
```

**Important Notes**:
- Free tier supports development/staging workflows
- Production apps (`lpa-frontend-prod`, `lpa-bloom-prod`) stay on Standard
- Dev app `lpa-bloom-dev` is already on Free ✅

---

### Task 3.2: Enable Azure Reserved Instances for EP1

**Savings**: ~$40/month (1-year commitment, 40% discount)

```bash
# Check current Azure resource usage
az reservations list-all

# Purchase 1-year reserved instance for EP1
# Note: Must be done via Azure Portal or using reservations API
# Cost: ~$1,320/year (vs $1,800 regular, saves $480/year)
```

**Portal Steps**:
1. Go Azure Portal → Reservations → Purchase
2. Select **App Service** → **EP1** → **Australia East**
3. Term: **1 year**
4. Billing: **Monthly** or **Upfront**
5. Quantity: 1
6. Purchase

---

## Phase 4: Operational Excellence (Week 3)

### Task 4.1: Create Disaster Recovery Runbook

See [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)

Covers:
- Database failover
- Front Door failover
- Function App recovery
- Communication Services failover
- Geo-redundancy setup

---

### Task 4.2: Consolidate Duplicate Resources

**Investigate and consolidate**:

```bash
# Check duplicate Communication Services
az communication list --query "[].{Name:name, Location:location, State:dataLocation}"

# Result: Both lpa-communication-service and lpa-communications exist
# Action: Determine which is actively used, decommission the other
```

**Check duplicate Action Groups**:

```bash
# List action groups
az monitor action-group list --query "[].{Name:name, ResourceGroup:resourceGroup}"

# Result: Both bloom-prod-alerts and LPA-Production-Alerts exist
# Action: Merge alerts into single action group
```

---

## Implementation Checklist

### Week 1: Critical
- [ ] **SQL Upgrade** - Upgrade `lpa-bloom-db-prod` to S1
  - [ ] Perform upgrade (Option A or B)
  - [ ] Verify with query
  - [ ] Test application functionality
  - [ ] Monitor Application Insights for performance
  
- [ ] **Runbook Creation** - Document subscription recovery
  - [ ] Create `SUBSCRIPTION_RECOVERY_RUNBOOK.md`
  - [ ] Test recovery procedure (if possible)
  - [ ] Share with ops team

### Week 2: Security
- [ ] **WAF Setup** - Enable WAF on Front Door
  - [ ] Create WAF policy
  - [ ] Add OWASP rule set
  - [ ] Enable diagnostics logging
  - [ ] Test WAF rules
  - [ ] Configure allowlist for known services
  
- [ ] **Database Runbook** - Backup & restore procedures
  - [ ] Create `DATABASE_BACKUP_RESTORE_RUNBOOK.md`
  - [ ] Test restore from backup
  - [ ] Document recovery point objectives (RPO)

- [ ] **SWA Downgrades** - Move dev/staging to Free tier
  - [ ] Downgrade `lpa-frontend-dev`
  - [ ] Downgrade `lpa-frontend-staging`
  - [ ] Verify no functionality lost
  - [ ] Update documentation

### Week 3: Optimization & Planning
- [ ] **Reserved Instances** - Purchase 1-year EP1 reservation
  - [ ] Review and approve reservation purchase
  - [ ] Complete purchase via Azure Portal
  - [ ] Configure auto-renewal

- [ ] **DR Runbook** - Create disaster recovery procedures
  - [ ] Create `DISASTER_RECOVERY_RUNBOOK.md`
  - [ ] Test failover procedures
  - [ ] Define RTO/RPO targets

- [ ] **Resource Consolidation** - Eliminate duplicates
  - [ ] Audit Communication Services usage
  - [ ] Consolidate to single resource
  - [ ] Audit Action Groups usage
  - [ ] Consolidate alerting

---

## Cost Impact Summary

| Action | Current | After | Savings | Notes |
|--------|---------|-------|---------|-------|
| SQL Upgrade | $15 | $30 | -$15 | Necessary for production |
| SWA Downgrade | $54 | $36 | +$18 | Dev/staging only |
| Reserved Instance | $150 | $110 | +$40 | 1-year commitment |
| Duplicate Resources | ~$50 | ~$0 | +$50 | If consolidated |
| **Monthly Total** | **$294** | **$251** | **+$43** | |
| **Annual Total** | **$3,528** | **$3,012** | **+$516** | |

*Note: SQL upgrade is mandatory. Reserved instance requires commitment but provides ongoing savings.*

---

## Risk Assessment

| Action | Risk Level | Mitigation |
|--------|-----------|-----------|
| SQL Upgrade to S1 | LOW | 2-3 min downtime (schedule off-hours) |
| WAF Enablement | LOW | Test in Detection mode first, switch to Prevention |
| SWA Downgrade | LOW | Only affects dev/staging environments |
| Reserved Instance | NONE | Financial commitment only |

---

## Success Criteria

- ✅ Production database on Standard S1 tier
- ✅ WAF policy active, blocking known threats
- ✅ Operational runbooks documented and tested
- ✅ Cost savings realized ($43/month reduction)
- ✅ Backup/restore procedures validated
- ✅ Disaster recovery plan documented

---

## Appendices

See related runbook files:
- [SUBSCRIPTION_RECOVERY_RUNBOOK.md](./SUBSCRIPTION_RECOVERY_RUNBOOK.md)
- [DATABASE_BACKUP_RESTORE_RUNBOOK.md](./DATABASE_BACKUP_RESTORE_RUNBOOK.md)
- [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)

---

## Next Steps

1. Review and approve implementation plan
2. Schedule maintenance windows for Week 1 SQL upgrade
3. Assign team members to implementation tasks
4. Begin Phase 1 implementation
5. Track progress against checklist
