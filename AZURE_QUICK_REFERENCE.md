# Azure Optimization - Quick Reference Card

> **Print this card or bookmark it for quick access**

---

## 🚀 Start Implementation

### Run Automation Script (Fastest)
```bash
# Bash/PowerShell
cd scripts
./azure-optimization.sh all        # Bash
.\azure-optimization.ps1 -Phase all # PowerShell
```

### Manual (Step-by-step)
Open: `docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md`

---

## 📋 Three Phases

| Phase | What | Duration | Downtime | Savings |
|-------|------|----------|----------|---------|
| **1** | SQL S1 Upgrade | Week 1 | 5-10 min | -$15/mo |
| **2** | WAF + SWA Free | Week 2 | None | +$18/mo |
| **3** | Reserved Instance | Week 3 | None | +$40/mo |
| **Total** | All | 3 weeks | ~15 min | **+$43/mo** |

---

## 🔴 Phase 1: Critical (Week 1)

### SQL Upgrade
```bash
az sql db update \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --service-objective S1
```
- Current: Basic (5 DTU) → Target: S1 (20 DTU)
- Cost: $15 → $30/month
- Why: Production requires SLA & performance
- Downtime: 5-10 minutes
- Verify: `az sql db show ... --query serviceLevelObjective`

---

## 🛡️ Phase 2: Security (Week 2)

### Enable WAF
```bash
az network front-door waf-policy create \
  --name lpa-waf-policy \
  --resource-group rg-lpa-unified \
  --sku Premium_AzureFrontDoor \
  --mode Detection
```
- **Cost**: $0 (included in Premium)
- **Why**: Protect against SQL injection, XSS, DDoS
- **Test**: Detection mode (log-only) first
- **Switch to Prevention**: After 1 week of testing

### Downgrade SWAs
```bash
az staticwebapp update \
  --name lpa-frontend-dev \
  --resource-group lpa-rg \
  --sku Free

az staticwebapp update \
  --name lpa-frontend-staging \
  --resource-group lpa-rg \
  --sku Free
```
- Savings: $9/month each = **$18/month**
- Only dev/staging (not production apps)

---

## 💰 Phase 3: Cost (Week 3)

### Reserved Instance
- **Cost**: $1,320/year (40% discount)
- **Savings**: $480/year vs on-demand
- **Manual**: Go to Azure Portal → Reservations → Purchase
  - Select: App Service → EP1 → 1 year → Australia East

---

## 🆘 Emergency Procedures

### Subscription Suspended?
📄 Open: `docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md`
- **RTO**: 30 minutes
- **Steps**: Pay bill → Reactivate → Enable Front Door → Test

### Database Corrupted?
📄 Open: `docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md`
- **RTO**: 30 minutes
- **Command**: PITR restore to point before corruption

### Regional Outage?
📄 Open: `docs/DISASTER_RECOVERY_RUNBOOK.md`
- **RTO**: 1 hour
- **Steps**: Failover to secondary region

---

## ✅ Verification Commands

```bash
# Verify SQL upgrade
az sql db show --resource-group lpa-rg \
  --server lpa-sql-server --name lpa-bloom-db-prod \
  --query serviceLevelObjective
# Expected: S1

# Verify WAF created
az network front-door waf-policy show \
  --name lpa-waf-policy \
  --resource-group rg-lpa-unified \
  --query properties.policySettings.mode
# Expected: Detection (or Prevention after testing)

# Verify SWA downgrades
az staticwebapp list --query "[].{Name:name, Sku:sku}" -o table
# Expected: lpa-frontend-dev=Free, lpa-frontend-staging=Free

# Test API health
curl https://bloom-functions-prod.azurewebsites.net/api/health
# Expected: 200 + JSON
```

---

## 📊 Cost Tracking

Go to: https://portal.azure.com → Cost Management

**Set Filters**:
- Resource Group: `rg-lpa-unified`, `lpa-rg`
- Metric: Cost
- Period: Last 30 days

**Expected Savings**:
- Monthly: $43/month
- Annual: $516/year

---

## 📞 Contacts

| Role | When to Contact |
|------|-----------------|
| **DevOps** | Script fails, verification errors |
| **DBA** | Database questions, restore issues |
| **Finance** | Reserved Instance approval |
| **Azure Support** | Service issues beyond 30 min |

---

## 🎓 Key Documents

| Document | Purpose | Read Time |
|----------|---------|-----------|
| `AZURE_OPTIMIZATION_README.md` | Overview (this file) | 5 min |
| `AZURE_OPTIMIZATION_IMPLEMENTATION.md` | Implementation guide | 15 min |
| `SUBSCRIPTION_RECOVERY_RUNBOOK.md` | Subscription suspension recovery | 10 min |
| `DATABASE_BACKUP_RESTORE_RUNBOOK.md` | Backup/restore procedures | 15 min |
| `DISASTER_RECOVERY_RUNBOOK.md` | Disaster response playbook | 20 min |

---

## ⏱️ Timeline

```
Week 1 (Critical)
├─ Mon-Tue: Review & approve Phase 1
├─ Wed: Schedule SQL upgrade window
├─ Thu-Fri: Execute upgrade (5-10 min downtime)
└─ Verify & test

Week 2 (Security)
├─ Mon-Tue: Set up WAF in Detection mode
├─ Wed: Monitor WAF logs
├─ Thu: Switch WAF to Prevention
├─ Fri: Downgrade SWAs
└─ Test & verify

Week 3 (Optimization)
├─ Mon-Tue: Purchase Reserved Instance
├─ Wed-Fri: Create runbooks & train team
└─ Archive old documentation
```

---

## ✨ Success Checklist

- [ ] SQL upgraded to Standard S1
- [ ] WAF enabled on Front Door
- [ ] dev/staging SWAs on Free tier
- [ ] Reserved Instance purchased
- [ ] All runbooks created & team trained
- [ ] Cost savings verified ($43/month)
- [ ] Disaster recovery procedures tested

---

**Status**: Ready for Implementation  
**Estimated Savings**: $516/year  
**Risk Level**: LOW (phased approach)  
**Time to Complete**: 3 weeks  

📍 **Start Here**: `AZURE_OPTIMIZATION_README.md`
