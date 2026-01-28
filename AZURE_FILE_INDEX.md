# Azure Optimization Package - File Index

**Date Created**: January 28, 2026  
**Status**: ✅ Complete & Ready to Implement  
**Total Cost Savings**: **$516/year** ($43/month)  

---

## 📚 Documentation Files

### 🎯 Start Here (5-10 min read)

| File | Purpose | Read Time |
|------|---------|-----------|
| [AZURE_OPTIMIZATION_README.md](./AZURE_OPTIMIZATION_README.md) | Overview + Getting started | 10 min |
| [AZURE_QUICK_REFERENCE.md](./AZURE_QUICK_REFERENCE.md) | Printable quick reference card | 5 min |

### 📋 Implementation Guide (Detailed)

| File | Purpose | Read Time | Details |
|------|---------|-----------|---------|
| [docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md](./docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md) | **3-week phased implementation plan** | 30 min | <ul><li>Week 1: SQL upgrade (critical)</li><li>Week 2: WAF + SWA downgrades</li><li>Week 3: Reserved instances</li><li>Full CLI commands for each step</li><li>Checklist & approval gates</li></ul> |

### 🚨 Emergency Runbooks (Keep Handy!)

| File | Use Case | RTO | Read Time |
|------|----------|-----|-----------|
| [docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md](./docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md) | Azure subscription suspended/disabled | 30 min | 15 min |
| [docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md](./docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md) | Data corruption, accidental deletion, testing | 30 min | 20 min |
| [docs/DISASTER_RECOVERY_RUNBOOK.md](./docs/DISASTER_RECOVERY_RUNBOOK.md) | Regional outage, security breach, component failure | 1 hour | 25 min |

### 📊 Original Assessment

| File | Purpose | Details |
|------|---------|---------|
| [docs/AZURE_INFRASTRUCTURE_ASSESSMENT.md](./docs/AZURE_INFRASTRUCTURE_ASSESSMENT.md) | Full audit from January 28, 2026 | Original findings & recommendations that led to this package |

---

## 🔧 Automation Scripts

### Ready-to-Run Scripts

| File | Language | Usage | Features |
|------|----------|-------|----------|
| [scripts/azure-optimization.sh](./scripts/azure-optimization.sh) | Bash/Linux | `./azure-optimization.sh all` | Interactive, colored output, phase selection |
| [scripts/azure-optimization.ps1](./scripts/azure-optimization.ps1) | PowerShell/Windows | `.\azure-optimization.ps1 -Phase all` | Interactive, colored output, phase selection |

**Features in Both**:
- ✅ Phase-by-phase execution (all, phase1, phase2, phase3)
- ✅ Interactive confirmations (safe to run)
- ✅ Color-coded output (easy to follow)
- ✅ Inline Azure CLI commands
- ✅ Verification steps included

---

## 📖 Reading Path (Recommended Order)

### For Executives / Managers
1. [AZURE_QUICK_REFERENCE.md](./AZURE_QUICK_REFERENCE.md) (5 min)
2. [AZURE_OPTIMIZATION_README.md](./AZURE_OPTIMIZATION_README.md) - Cost section (5 min)
3. Done! ✅

### For DevOps / Engineers
1. [AZURE_OPTIMIZATION_README.md](./AZURE_OPTIMIZATION_README.md) (10 min)
2. [docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md](./docs/AZURE_OPTIMIZATION_IMPLEMENTATION.md) (30 min)
3. [AZURE_QUICK_REFERENCE.md](./AZURE_QUICK_REFERENCE.md) - for quick lookup (5 min)
4. Run: `./scripts/azure-optimization.sh all`

### For Database Admins
1. [docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md](./docs/DATABASE_BACKUP_RESTORE_RUNBOOK.md) (20 min)
2. [docs/DISASTER_RECOVERY_RUNBOOK.md](./docs/DISASTER_RECOVERY_RUNBOOK.md) - Data corruption section (10 min)
3. Practice PITR restore on test environment

### For Operations Team
1. [AZURE_QUICK_REFERENCE.md](./AZURE_QUICK_REFERENCE.md) (5 min)
2. [docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md](./docs/SUBSCRIPTION_RECOVERY_RUNBOOK.md) (15 min)
3. [docs/DISASTER_RECOVERY_RUNBOOK.md](./docs/DISASTER_RECOVERY_RUNBOOK.md) (20 min)
4. Practice emergency procedures

---

## 🎯 What Each Document Covers

### AZURE_OPTIMIZATION_README.md
- ✅ Executive summary
- ✅ 3-week phased timeline
- ✅ Cost/benefit analysis
- ✅ Quick start guide
- ✅ Risk assessment
- ✅ Team contacts

**Best For**: Getting overview & planning

---

### AZURE_QUICK_REFERENCE.md
- ✅ Printable one-page card
- ✅ Quick CLI commands
- ✅ Verification checklist
- ✅ Emergency links
- ✅ Timeline overview

**Best For**: Quick lookup during implementation

---

### AZURE_OPTIMIZATION_IMPLEMENTATION.md
- ✅ Detailed 3-week plan
- ✅ Full Azure CLI commands
- ✅ Step-by-step instructions
- ✅ Implementation checklist
- ✅ Risk assessment
- ✅ Rollback procedures

**Best For**: Following during actual implementation

---

### SUBSCRIPTION_RECOVERY_RUNBOOK.md
- ✅ When: Subscription is suspended
- ✅ How: 8-step recovery procedure
- ✅ Time: 30 minutes RTO
- ✅ Impact: All services offline (data safe)
- ✅ Prevention: Enable auto-pay

**Best For**: Emergency response (keep handy!)

---

### DATABASE_BACKUP_RESTORE_RUNBOOK.md
- ✅ Backup types: Automatic, PITR, Manual, Geo-redundant
- ✅ Restore scenarios: Deletion, corruption, testing
- ✅ Point-in-time restore with data verification
- ✅ Zero-downtime database swap
- ✅ Backup testing schedule

**Best For**: DBA procedures & testing

---

### DISASTER_RECOVERY_RUNBOOK.md
- ✅ Regional failover (Australia East → Southeast Asia)
- ✅ Data corruption recovery
- ✅ Security breach response
- ✅ Component failures (Functions, SQL, SWA)
- ✅ Escalation matrix
- ✅ Testing schedule (quarterly drills)

**Best For**: Major incident response

---

## 🔗 Document Relationships

```
AZURE_OPTIMIZATION_README.md (start here)
    ├── AZURE_QUICK_REFERENCE.md (print me!)
    ├── AZURE_OPTIMIZATION_IMPLEMENTATION.md (detailed guide)
    │   ├── scripts/azure-optimization.sh (automate it)
    │   └── scripts/azure-optimization.ps1 (Windows version)
    └── Emergency Runbooks (use when needed)
        ├── SUBSCRIPTION_RECOVERY_RUNBOOK.md
        ├── DATABASE_BACKUP_RESTORE_RUNBOOK.md
        └── DISASTER_RECOVERY_RUNBOOK.md
```

---

## 📊 Implementation Checklist

### Pre-Implementation
- [ ] Read AZURE_OPTIMIZATION_README.md
- [ ] Review cost/benefit with finance
- [ ] Schedule implementation phases
- [ ] Assign responsibilities
- [ ] Backup current configs

### Phase 1: Critical (Week 1)
- [ ] Upgrade SQL database to S1
- [ ] Test application functionality
- [ ] Create subscription recovery runbook
- [ ] Document completion

### Phase 2: Security (Week 2)
- [ ] Enable WAF in Detection mode
- [ ] Switch WAF to Prevention mode
- [ ] Downgrade dev/staging SWAs
- [ ] Create backup/restore runbook
- [ ] Test PITR restore

### Phase 3: Optimization (Week 3)
- [ ] Purchase Reserved Instance
- [ ] Create disaster recovery runbook
- [ ] Consolidate duplicate resources
- [ ] Train team on all runbooks

### Post-Implementation
- [ ] Verify cost savings
- [ ] Update documentation
- [ ] Schedule quarterly DR drills
- [ ] Monitor for 30 days

---

## 💾 File Locations

```
bloom-web-app/
├── AZURE_OPTIMIZATION_README.md           ← Main overview
├── AZURE_OPTIMIZATION_SUMMARY.md          ← This file
├── AZURE_QUICK_REFERENCE.md               ← Printable card
├── docs/
│   ├── AZURE_INFRASTRUCTURE_ASSESSMENT.md ← Original audit
│   ├── AZURE_OPTIMIZATION_IMPLEMENTATION.md ← Detailed plan
│   ├── SUBSCRIPTION_RECOVERY_RUNBOOK.md
│   ├── DATABASE_BACKUP_RESTORE_RUNBOOK.md
│   └── DISASTER_RECOVERY_RUNBOOK.md
└── scripts/
    ├── azure-optimization.sh
    └── azure-optimization.ps1
```

---

## 🚀 Quick Start Commands

### Run Everything (Automated)
```bash
# Bash
./scripts/azure-optimization.sh all

# PowerShell
.\scripts\azure-optimization.ps1 -Phase all
```

### Run By Phase
```bash
./scripts/azure-optimization.sh phase1  # Critical only
./scripts/azure-optimization.sh phase2  # Security only
./scripts/azure-optimization.sh phase3  # Cost optimization
```

### Manual Implementation
```bash
# Phase 1: SQL Upgrade
az sql db update --resource-group lpa-rg --server lpa-sql-server \
  --name lpa-bloom-db-prod --service-objective S1

# Phase 2: WAF Setup
az network front-door waf-policy create --name lpa-waf-policy \
  --resource-group rg-lpa-unified --sku Premium_AzureFrontDoor --mode Detection

# Phase 3: SWA Downgrades
az staticwebapp update --name lpa-frontend-dev \
  --resource-group lpa-rg --sku Free
```

---

## ✅ Success Criteria

After implementation, you should have:

✅ **SQL Database**: Upgraded to Standard S1  
✅ **WAF**: Active on Front Door (in Prevention mode)  
✅ **Cost**: $43/month savings realized  
✅ **Runbooks**: Created & team trained  
✅ **Scripts**: Tested successfully  
✅ **DR**: Disaster recovery procedures documented  

---

## 🎓 Training Guide

### For Teams
- **5 min**: Managers → Read AZURE_QUICK_REFERENCE.md
- **15 min**: Developers → Read AZURE_QUICK_REFERENCE.md
- **45 min**: DevOps → Read all docs + run scripts
- **30 min**: DBAs → Read DATABASE_BACKUP_RESTORE_RUNBOOK.md
- **45 min**: Ops → Read all runbooks

### Hands-On Practice
- [ ] Team members practice running scripts
- [ ] DBAs test PITR restore on test DB
- [ ] Ops team runs subscription recovery steps (dry run)
- [ ] Everyone reviews disaster recovery scenarios

---

## 📞 Support

- **Questions**: Check the relevant runbook
- **Script Issues**: See scripts/ directory comments
- **Azure Errors**: Check [Azure Documentation](https://docs.microsoft.com/azure/)
- **Emergencies**: Use corresponding runbook

---

## 📝 Version History

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 28, 2026 | ✅ Complete | Initial release with all 9 documents |

---

## 🎯 Next Actions

1. **Right Now**: Read AZURE_OPTIMIZATION_README.md (10 min)
2. **This Week**: Review with your team (30 min meeting)
3. **Next Week**: Get approval + schedule Phase 1
4. **Week 2**: Execute Phase 1 (SQL upgrade)
5. **Week 3-4**: Execute Phase 2 (WAF + SWAs)
6. **Week 5+**: Execute Phase 3 (Reserved Instance + runbooks)

---

**Status**: ✅ Ready to implement  
**Cost Savings**: $516/year  
**Risk Level**: LOW  
**Time Required**: 3 weeks  

**Start Here**: [AZURE_OPTIMIZATION_README.md](./AZURE_OPTIMIZATION_README.md)
