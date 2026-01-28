# Azure Infrastructure Optimization - Complete Package

> **Date**: January 28, 2026  
> **Status**: Ready to Implement  
> **Total Estimated Cost Savings**: $516/year

---

## 📦 What Was Created

This complete Azure infrastructure optimization package includes:

### 1. **Implementation Guide** 
📄 [AZURE_OPTIMIZATION_IMPLEMENTATION.md](./docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md)
- 3-week phased implementation plan
- Checklist for all tasks
- Cost impact analysis
- Risk assessment
- Success criteria

### 2. **Runbooks (Operational Procedures)**

#### 🔴 Subscription Recovery Runbook
📄 [SUBSCRIPTION_RECOVERY_RUNBOOK.md](./docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md)
- **RTO**: 30 minutes
- Step-by-step recovery from subscription suspension
- When subscription auto-disables Front Door endpoint
- Prevention: Enable auto-pay

#### 🛠️ Database Backup & Restore Runbook
📄 [DATABASE_BACKUP_RESTORE_RUNBOOK.md](./docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md)
- **RTO**: 30 minutes | **RPO**: 5 minutes
- Automatic backup strategies
- Point-in-time restore procedures
- Data integrity verification
- Manual backup for archival
- Geo-redundant recovery

#### 🚨 Disaster Recovery Runbook
📄 [DISASTER_RECOVERY_RUNBOOK.md](./docs/DISASTER_RECOVERY_RUNBOOK.md)
- **RTO**: 1 hour | **RPO**: 5 minutes
- Regional failover procedures
- Data corruption recovery
- Security breach response
- Component failure recovery
- Testing schedule

### 3. **Automation Scripts**

#### Bash Script
📜 [scripts/azure-optimization.sh](./scripts/azure-optimization.sh)
```bash
./scripts/azure-optimization.sh all      # Run all phases
./scripts/azure-optimization.sh phase1   # Run Phase 1 only
./scripts/azure-optimization.sh phase2   # Run Phase 2 only
./scripts/azure-optimization.sh phase3   # Run Phase 3 only
```

#### PowerShell Script
📜 [scripts/azure-optimization.ps1](./scripts/azure-optimization.ps1)
```powershell
.\scripts\azure-optimization.ps1 -Phase all      # Run all phases
.\scripts\azure-optimization.ps1 -Phase phase1   # Run Phase 1 only
```

---

## 🎯 Implementation Timeline

### Week 1: Critical Fixes 🔴
- [ ] Upgrade production SQL database from Basic to Standard S1 ($15/month)
- [ ] Document subscription suspension recovery procedure
- **Duration**: ~2 hours (including 5-10 min database downtime)
- **Risk**: LOW

### Week 2: Security Hardening 🛡️
- [ ] Enable WAF (Web Application Firewall) on Front Door
- [ ] Create database backup & restore runbook
- [ ] Downgrade dev/staging Static Web Apps to Free tier (-$18/month)
- **Duration**: ~3 hours
- **Risk**: LOW (WAF in Detection mode first)

### Week 3: Optimization & Planning 📊
- [ ] Purchase 1-year Reserved Instance for EP1 Function App (-$40/month)
- [ ] Create disaster recovery runbook
- [ ] Consolidate duplicate Azure resources
- **Duration**: ~4 hours
- **Risk**: NONE (Reserved Instance is financial only)

---

## 💰 Cost Impact

### Monthly Impact
| Service | Current | After | Savings |
|---------|---------|-------|---------|
| Azure SQL (Basic → S1) | $15 | $30 | **-$15** |
| Static Web Apps | $54 | $36 | **+$18** |
| Azure Functions (Reserved) | $150 | $110 | **+$40** |
| Other Services | $75 | $75 | - |
| **TOTAL** | **$294** | **$251** | **+$43** |

### Annual Impact
- **Current Annual Cost**: $3,528
- **Optimized Annual Cost**: $3,012
- **Net Annual Savings**: $516
- **Plus**: Improved security, better disaster recovery, reduced risk

> **Note**: SQL upgrade is mandatory for production workloads. Reserved instance saves money long-term.

---

## ✅ Phased Checklist

### Phase 1: Critical Fixes (Week 1)
- [ ] Review SQL upgrade impact
- [ ] Schedule database upgrade during low-traffic window
- [ ] Execute SQL upgrade (5-10 min downtime)
- [ ] Verify database upgrade with queries
- [ ] Test application functionality
- [ ] Create subscription recovery runbook (this guide)

### Phase 2: Security & Cost (Week 2)
- [ ] Test WAF in Detection mode
- [ ] Switch WAF to Prevention mode after validation
- [ ] Review and approve SWA downgrades
- [ ] Downgrade dev/staging Static Web Apps
- [ ] Create database backup & restore runbook
- [ ] Test point-in-time restore

### Phase 3: Optimization (Week 3)
- [ ] Review Reserved Instance benefits
- [ ] Budget approval for Reserved Instance purchase
- [ ] Purchase 1-year Reserved Instance
- [ ] Create disaster recovery runbook
- [ ] Audit duplicate resources
- [ ] Consolidate Communication Services and Action Groups

---

## 🚀 Getting Started

### Option 1: Run Automation Scripts
**Fastest**: Use pre-built scripts to execute all changes

```bash
# Bash (Linux/Mac)
cd scripts
./azure-optimization.sh all

# PowerShell (Windows)
cd scripts
.\azure-optimization.ps1 -Phase all
```

### Option 2: Manual Implementation
**Most Control**: Follow implementation guide step-by-step

1. Open [AZURE_OPTIMIZATION_IMPLEMENTATION.md](./docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md)
2. Work through each phase in order
3. Use CLI commands provided in guide
4. Verify each step in Azure Portal

### Option 3: Portal-Only
**No CLI**: Use Azure Portal for all changes

1. [SQL Upgrade](https://portal.azure.com/#@microsoftcom/resource/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourceGroups/lpa-rg/providers/microsoft.sql/servers/lpa-sql-server/databases/lpa-bloom-db-prod/overview)
   - Click **Pricing tier** → Standard → S1
   
2. [WAF Setup](https://portal.azure.com/#@microsoftcom/resource/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourceGroups/rg-lpa-unified/providers/microsoft.network/frontDoors/fdt42kldozqahcu)
   - Create WAF policy with OWASP rules
   
3. [SWA Downgrades](https://portal.azure.com/#@microsoftcom/resource/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourceGroups/lpa-rg/providers/microsoft.web/staticSites)
   - Select app → Pricing → Free tier

---

## 📊 Monitoring & Verification

### SQL Upgrade Verification
```bash
az sql db show \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --query serviceLevelObjective
# Expected output: S1
```

### WAF Status
```bash
az network front-door waf-policy show \
  --name lpa-waf-policy \
  --resource-group rg-lpa-unified \
  --query properties.policySettings.mode
# Expected output: Detection (then Prevention after testing)
```

### Cost Monitoring
- Go to [Azure Cost Management](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu)
- Filter by resource group: `rg-lpa-unified`, `lpa-rg`
- Track savings over time

---

## 🆘 Support & Troubleshooting

### SQL Upgrade Issues
- **Problem**: Database still shows "Basic" after upgrade
  - **Solution**: Wait 5-10 minutes and refresh portal
- **Problem**: Application errors during upgrade
  - **Solution**: Automatic failover handles this, errors should clear after 2 min

### WAF Issues
- **Problem**: Legitimate traffic getting blocked
  - **Solution**: Check WAF logs, add to allowlist
  - **Reference**: [Azure WAF Documentation](https://learn.microsoft.com/azure/web-application-firewall/)

### Cost Questions
- **Problem**: Why is SQL more expensive?
  - **Solution**: Basic tier not suitable for production. Standard S1 provides SLA, more DTUs, point-in-time restore
- **Problem**: Unexpected charges
  - **Solution**: Check [Cost Management](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu) for breakdown

### Emergency Support
- **Azure Support**: https://portal.azure.com → Support requests
- **Severity Levels**: Critical (< 1 hr response), High (< 4 hrs)
- **Regional Issue**: Check [Azure Status](https://status.azure.com)

---

## 📚 Related Documentation

### Infrastructure
- [AZURE_INFRASTRUCTURE_ASSESSMENT.md](./docs/AZURE_INFRASTRUCTURE_ASSESSMENT.md) - Full audit
- [.github/GITHUB_SECRETS_REQUIRED.md](./.github/GITHUB_SECRETS_REQUIRED.md) - Secrets config

### Design & Architecture
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Development guide
- [DEVELOPER.md](./DEVELOPER.md) - Developer onboarding

### Halaxy Integration
- [docs/halaxy/HALAXY_SYNC_SERVICE.md](./docs/halaxy/HALAXY_SYNC_SERVICE.md) - Practice management sync

---

## 📝 Success Criteria

After implementation, verify:

✅ **Security**:
- WAF active, blocking known attack patterns
- Backup & restore procedures tested
- Disaster recovery runbook created

✅ **Reliability**:
- Database upgraded to production tier
- Subscription recovery documented
- PITR restores validated monthly

✅ **Cost**:
- Dev/staging SWAs on Free tier
- Reserved instances saving $40/month
- $516/year total savings realized

✅ **Documentation**:
- All runbooks created and reviewed
- Team trained on disaster recovery
- Scripts tested successfully

---

## 🎓 Team Training

### Minimal Knowledge Required
- [ ] All team members read this document
- [ ] DevOps team reads all runbooks
- [ ] DBAs understand PITR restore procedures
- [ ] Ops team knows subscription recovery steps

### Optional: Hands-On Training
- [ ] Practice PITR restore on test environment
- [ ] Simulate regional failover (read-only)
- [ ] Run disaster recovery drill

---

## 📞 Next Steps

1. **Review**: Share this package with team
2. **Approve**: Get sign-off on Phase 1 (SQL upgrade)
3. **Schedule**: Book maintenance window for Week 1
4. **Execute**: Run scripts or follow manual guide
5. **Verify**: Test all endpoints after each phase
6. **Document**: Update team wiki/runbooks

---

## Questions?

See the detailed runbooks in the `docs/` folder:
- **Phase 1**: [AZURE_OPTIMIZATION_IMPLEMENTATION.md](./docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md)
- **Subscription Issues**: [SUBSCRIPTION_RECOVERY_RUNBOOK.md](./docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md)
- **Database Issues**: [DATABASE_BACKUP_RESTORE_RUNBOOK.md](./docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md)
- **Disaster Scenarios**: [DISASTER_RECOVERY_RUNBOOK.md](./docs/DISASTER_RECOVERY_RUNBOOK.md)

---

**Created**: January 28, 2026  
**Status**: Ready for Implementation  
**Approval Required**: Finance (Reserved Instance), DevOps (all phases), DBA (database upgrade)
