# Azure Optimization Implementation - Next Steps

**Current Status**: All documentation and automation scripts created ✅  
**Ready for**: Git commit and Phase 1 implementation  
**Timeline**: 3 weeks to complete all phases

---

## 🎯 Action Items (Priority Order)

### IMMEDIATE (Today)
- [ ] **1. Review Documentation Package**
  - Read: `AZURE_OPTIMIZATION_README.md` (overview, 5 min)
  - Skim: `AZURE_QUICK_REFERENCE.md` (cheat sheet, 2 min)
  - Read: `AZURE_OPTIMIZATION_IMPLEMENTATION.md` (detailed plan, 15 min)
  - **Total Time**: ~20 minutes

- [ ] **2. Verify File Structure**
  - Check root: `AZURE_*.md` files (5 files present)
  - Check docs/: Runbooks and implementation guide (4 files present)
  - Check scripts/: Bash and PowerShell automation (2 files present)
  - ✅ All 12 files verified above

- [ ] **3. Git Commit**
  ```bash
  git add AZURE*.md AZURE_IMPLEMENTATION_SUMMARY.md NEXT_STEPS.md
  git add docs/AZURE*.md docs/SUBSCRIPTION*.md docs/DATABASE*.md docs/DISASTER*.md
  git add scripts/azure-*.*
  git commit -m "docs: add comprehensive azure optimization implementation package

  - 3-week phased implementation plan (Phase 1: SQL upgrade, Phase 2: WAF, Phase 3: Cost optimization)
  - Production database upgrade: Basic → Standard S1 (CRITICAL)
  - Web Application Firewall enablement (Detection → Prevention mode)
  - Reserved Instance purchasing and SWA tier downgrades
  - Emergency runbooks: Subscription recovery, Database backup/restore, Disaster recovery
  - Automation scripts: Bash and PowerShell versions for all phases
  - Total cost impact: +$73/month with $480/year RI savings (net positive over 12 months)"
  git push origin develop
  ```

---

## 📅 PHASE 1: Critical Database Upgrade (Week 1)

**Objective**: Fix production database under-provisioning  
**Timeline**: Monday-Friday (Week 1)  
**Effort**: ~30 minutes execution, 2 hours monitoring

### Step 1: Schedule Maintenance Window
- [ ] Choose a low-traffic window (off-hours recommended)
- [ ] Notify team: "SQL upgrade happening at [time], no downtime expected"
- [ ] Prepare rollback plan (database backup available)

### Step 2: Execute SQL Upgrade
**Choose one approach**:

**Option A - Automated (Recommended)**
```bash
cd scripts
./azure-optimization.sh phase1
# Follow interactive prompts
```

**Option B - Manual (Full control)**
```bash
az sql db update \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --service-objective S1 \
  --compute-model vcore \
  --edition GeneralPurpose
```

**Option C - Azure Portal**
- Navigate to Azure Portal → SQL databases → `lpa-bloom-db-prod`
- Click "Compute + Storage"
- Change: Basic (5 DTU, 2 GB) → Standard (S1, 20 DTU, 250 GB)
- Click "Apply"

### Step 3: Verify Upgrade (Immediately After)
```bash
# Confirm new tier
az sql db show \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --query "{ edition: edition, serviceLevelObjective: serviceLevelObjective }"

# Expected output:
# {
#   "edition": "Standard",
#   "serviceLevelObjective": "S1"
# }
```

### Step 4: Monitor Performance (First 24 Hours)
- [ ] Check Azure Portal → SQL database → Metrics
  - DTU usage should be < 80% under peak load
  - Watch for connection errors (should be zero)
  - Database response time should remain stable

- [ ] Monitor application logs (Bloom)
  - Check for database connection errors
  - Verify API response times are normal

- [ ] Query active sessions
  ```sql
  SELECT COUNT(*) as active_connections
  FROM sys.dm_exec_sessions
  WHERE database_id = DB_ID('lpa-bloom-db-prod');
  ```

### Success Criteria ✅
- [ ] SQL tier upgraded to Standard S1
- [ ] Zero connection failures for 24 hours
- [ ] DTU usage < 80% under normal load
- [ ] No increase in API error rates

---

## 📅 PHASE 2: Security - WAF Enablement (Week 2)

**Objective**: Protect Front Door with Web Application Firewall  
**Timeline**: Monday-Friday (Week 2)  
**Effort**: ~1 hour configuration, 48 hours monitoring

### Step 1: Enable WAF in Detection Mode
```bash
# Create WAF policy in Detection mode first
az network front-door waf-policy create \
  --resource-group lpa-rg \
  --name bloom-waf-policy \
  --mode Detection  # Don't block, just log
```

### Step 2: Associate WAF with Front Door
```bash
az network front-door update \
  --name bloom-front-door \
  --resource-group lpa-rg \
  --web-application-firewall-policy-link \
    "/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourcegroups/lpa-rg/providers/microsoft.network/frontdoorwebapplicationfirewallpolicies/bloom-waf-policy"
```

### Step 3: Monitor WAF Logs (48 Hours)
- [ ] Check Azure Portal → Front Door → WAF logs
- [ ] Look for blocked requests and their rules
- [ ] Document any legitimate traffic being flagged
- [ ] Adjust WAF rules if needed (whitelist IPs, exclude rules)

### Step 4: Enable Prevention Mode
```bash
# Switch from Detection (log only) to Prevention (block)
az network front-door waf-policy update \
  --name bloom-waf-policy \
  --resource-group lpa-rg \
  --mode Prevention
```

### Success Criteria ✅
- [ ] WAF policy created and linked
- [ ] Detection mode ran for 48 hours without blocking legitimate traffic
- [ ] WAF switched to Prevention mode
- [ ] Monitoring alerts configured for blocked requests

---

## 📅 PHASE 3: Cost Optimization (Week 3)

**Objective**: Reduce monthly costs while maintaining performance  
**Timeline**: Monday-Friday (Week 3)  
**Effort**: ~2 hours configuration

### Step 1: Downgrade Dev Static Web App
```bash
az appservice plan update \
  --name bloom-static-web-app-dev-plan \
  --resource-group lpa-rg \
  --sku Free

# Or via Portal: Static Web Apps → Production environment → Pricing → Free
```
**Savings**: -$24/month

### Step 2: Downgrade Staging Static Web App
```bash
az appservice plan update \
  --name bloom-static-web-app-staging-plan \
  --resource-group lpa-rg \
  --sku Free
```
**Savings**: -$24/month

### Step 3: Purchase 1-Year Reserved Instance (EP1)
```bash
# Reserve EP1 Premium for 1 year (best discount)
az reservations reservation-order create \
  --sku standard_ep1 \
  --location australiaeast \
  --term P1Y \
  --billing-scope /subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8
```

**Cost**: $1,320/year  
**Savings vs On-demand**: $480/year  
**ROI**: Full payback in 2.75 months

Alternatively, via Azure Portal:
- Reservations → +Add → Compute → Azure App Service
- Select "EP1 Premium" → 1-year term → Purchase

### Step 4: Verify Cost Reduction
```bash
# Check Azure Cost Management after 30 days
az costmanagement query \
  --scope "/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8" \
  --timeframe MonthToDate
```

Expected monthly reduction: $73 (after SQL upgrade cost)

### Success Criteria ✅
- [ ] Dev SWA downgraded to Free tier
- [ ] Staging SWA downgraded to Free tier
- [ ] 1-year Reserved Instance purchased and active
- [ ] Azure bill reduced by $48/month (Phase 3 net savings)

---

## 📚 Reference Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| `AZURE_OPTIMIZATION_README.md` | Getting started guide | 5 min |
| `AZURE_QUICK_REFERENCE.md` | One-page cheat sheet | 2 min |
| `AZURE_OPTIMIZATION_IMPLEMENTATION.md` | Complete 3-week plan with all CLI commands | 15 min |
| `AZURE_OPTIMIZATION_SUMMARY.md` | Executive summary with full details | 10 min |
| `SUBSCRIPTION_RECOVERY_RUNBOOK.md` | Emergency subscription recovery (30 min RTO) | 10 min |
| `DATABASE_BACKUP_RESTORE_RUNBOOK.md` | Database recovery procedures (30 min RTO, 5 min RPO) | 10 min |
| `DISASTER_RECOVERY_RUNBOOK.md` | Major incident response (1 hour RTO, 5 min RPO) | 15 min |
| `AZURE_FILE_INDEX.md` | Navigation guide for all Azure docs | 5 min |

---

## 🆘 If Something Goes Wrong

### Phase 1 Rollback (SQL Upgrade)
```bash
# Revert to Basic tier (if needed)
az sql db update \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --service-objective Basic
```

**Read**: `DATABASE_BACKUP_RESTORE_RUNBOOK.md` (database recovery procedures)

### Phase 2 Rollback (WAF)
```bash
# Disable WAF
az network front-door waf-policy delete \
  --name bloom-waf-policy \
  --resource-group lpa-rg
```

### Phase 3 Rollback (Cost Optimization)
```bash
# Upgrade SWA back to Standard
az appservice plan update \
  --name bloom-static-web-app-dev-plan \
  --resource-group lpa-rg \
  --sku Standard
```

**Cancel Reserved Instance**: Go to Azure Portal → Reservations → Select RI → Exchange/Return

---

## 📞 Support Resources

**Azure CLI Help**:
```bash
az sql db --help
az network front-door --help
az appservice plan --help
```

**Runbooks** (critical incident response):
- `SUBSCRIPTION_RECOVERY_RUNBOOK.md` - Subscription suspension
- `DATABASE_BACKUP_RESTORE_RUNBOOK.md` - Database issues
- `DISASTER_RECOVERY_RUNBOOK.md` - Major outages

**Automation Scripts**:
```bash
# View all phases
./scripts/azure-optimization.sh help

# Run specific phase
./scripts/azure-optimization.sh phase1
./scripts/azure-optimization.sh phase2
./scripts/azure-optimization.sh phase3

# Run all phases (non-interactive)
./scripts/azure-optimization.sh all
```

---

## ✅ Completion Checklist

### Pre-Implementation
- [ ] All 12 documentation files reviewed
- [ ] Team notified of upcoming optimization project
- [ ] Azure CLI installed and authenticated
- [ ] Current backups verified

### Phase 1 (Week 1)
- [ ] SQL upgrade completed
- [ ] DTU usage monitored for 24 hours
- [ ] Zero connection errors observed

### Phase 2 (Week 2)
- [ ] WAF enabled in Detection mode
- [ ] Logs monitored for 48 hours
- [ ] WAF switched to Prevention mode

### Phase 3 (Week 3)
- [ ] Dev and Staging SWAs downgraded to Free
- [ ] 1-year Reserved Instance purchased
- [ ] Monthly Azure bill verified reduced by ~$48

### Post-Implementation
- [ ] All costs tracked in Azure Cost Management
- [ ] Team trained on emergency procedures
- [ ] Disaster recovery runbook reviewed with ops team
- [ ] Monthly cost monitoring scheduled

---

## 📊 Expected Outcomes

**After 3 Weeks of Implementation**:
- ✅ Production database properly provisioned (20 DTU vs 5 DTU)
- ✅ Web applications protected by WAF (OWASP Top 10)
- ✅ Monthly costs reduced by $48/month
- ✅ 1-year savings of $480 with Reserved Instance
- ✅ Team trained on emergency procedures
- ✅ Disaster recovery capability validated

**Total Investment**: ~5 hours of engineering time  
**Total Benefit**: $480/year savings + improved security + production stability  
**Risk Level**: 🟢 LOW (phased approach with rollback options)

---

**Questions?** Refer to the relevant runbook or implementation guide.  
**Ready to start?** Begin with Phase 1 - SQL Upgrade this week.

