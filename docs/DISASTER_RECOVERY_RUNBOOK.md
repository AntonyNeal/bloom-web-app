# Disaster Recovery Runbook

> **Last Updated**: January 28, 2026  
> **RTO (Recovery Time Objective)**: 1 hour  
> **RPO (Recovery Point Objective)**: 5 minutes  
> **Priority**: CRITICAL

---

## Overview

This runbook defines procedures for recovering from major infrastructure failures affecting the entire Bloom platform.

### Disaster Scenarios

| Scenario | Impact | RTO | Procedure |
|----------|--------|-----|-----------|
| **Single component failure** | Partial outage | 15 min | Local failover |
| **Region failure** | Total outage | 1 hour | Geo-failover |
| **Data corruption** | Data loss risk | 30 min | PITR restore |
| **Security breach** | Confidentiality risk | 2 hours | Incident response |
| **Subscription suspension** | Total outage | 30 min | [See runbook](./SUBSCRIPTION_RECOVERY_RUNBOOK.md) |

---

## Disaster: Single Component Failure

### Scenario: Azure Functions Offline

**Symptoms**:
- API returns 502/503 errors
- Application Insights shows 0% availability
- Front Door health probe fails

**Recovery Steps**:

```bash
# 1. Check function app status
az functionapp show \
  --name "bloom-functions-prod" \
  --resource-group "rg-lpa-unified" \
  --query "{State:state, HostNames:defaultHostName}"

# 2. Restart function app
az functionapp stop --name bloom-functions-prod --resource-group rg-lpa-unified
sleep 30
az functionapp start --name bloom-functions-prod --resource-group rg-lpa-unified

# 3. Verify recovery
# Wait 2 minutes for startup
curl https://bloom-functions-prod.azurewebsites.net/api/health
# Expected: 200 OK with {"status":"healthy"}
```

**Escalation**: If restart doesn't fix, check Azure Service Health and contact support.

---

### Scenario: Database Offline

**Symptoms**:
- Functions return 500 errors (database connection)
- Application Insights shows "deadlock" or "connection timeout" errors

**Recovery Steps**:

```bash
# 1. Check database status
az sql db show \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "status"

# 2. If paused/unavailable, resume
az sql db resume \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# 3. Test connection
sqlcmd -S lpa-sql-server.database.windows.net \
  -U sqluser \
  -P [password] \
  -d lpa-bloom-db-prod \
  -Q "SELECT 1"

# Expected: 1 (single row)
```

**If corruption detected**:
- Proceed to "Disaster: Data Corruption" section
- Restore from point-in-time backup

---

### Scenario: Static Web App Offline

**Symptoms**:
- Website returns 500/502 errors
- Custom domain doesn't resolve

**Recovery Steps**:

```bash
# 1. Check SWA status
az staticwebapp show \
  --name "lpa-bloom-prod" \
  --resource-group "lpa-rg" \
  --query "status"

# 2. Restart SWA (no direct restart command, check portal)
# Go to Azure Portal → Static Web Apps → lpa-bloom-prod
# Click "Restart" or check Deployment Center

# 3. Verify DNS resolution
nslookup bloom.life-psychology.com.au

# 4. Test HTTPS
curl -I https://bloom.life-psychology.com.au
# Expected: 200 or 301
```

---

## Disaster: Regional Failure (Geo-Failover)

**Scenario**: Entire Australia East region unavailable (earthquake, large-scale outage)

**RTO**: 60 minutes

### Prerequisites

Before this happens, ensure:
- ✅ Geo-redundant backups enabled
- ✅ Secondary region resources prepared
- ✅ DNS failover configured
- ✅ Team trained on failover procedures

### Regional Failover Procedure

#### Phase 1: Assess (5 minutes)

```bash
# Check Azure status
curl https://status.azure.com/api/v2/regions

# Check regional health
az vm list \
  --query "[?location=='australiaeast'].{Name:name, State:powerState}" \
  -o table

# If ALL Australia East resources offline → Regional failure confirmed
```

#### Phase 2: Activate Secondary Region (20 minutes)

**Create failover infrastructure in Southeast Asia**:

```bash
# 1. Create secondary SQL Server (if not exists)
az sql server create \
  --name "lpa-sql-server-sea" \
  --resource-group "lpa-rg" \
  --location "southeastasia" \
  --admin-user "sqladmin" \
  --admin-password "[strong-password]"

# 2. Restore database from geo-backup
az sql db restore \
  --dest-name "lpa-bloom-db-prod" \
  --dest-server "lpa-sql-server-sea" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# 3. Create secondary Function App
az functionapp create \
  --name "bloom-functions-sea" \
  --resource-group "rg-lpa-unified" \
  --storage-account "lpastoragesea" \
  --consumption-plan-location "southeastasia" \
  --runtime node \
  --runtime-version 18

# 4. Deploy API code to secondary
# (Use same deployment process as primary)
# Redeploy from GitHub Actions or manual zip deployment
```

#### Phase 3: Update DNS & Load Balancer (10 minutes)

```bash
# Update Front Door to route to secondary region
# (Ideally automated via Traffic Manager)

# Check current backend pool
az network front-door backend-pool list \
  --front-door-name "fdt42kldozqahcu" \
  --resource-group "rg-lpa-unified"

# Update backend to secondary region
az network front-door backend-pool backend update \
  --front-door-name "fdt42kldozqahcu" \
  --name "bloom-backend" \
  --pool "backendPool" \
  --address "bloom-functions-sea.azurewebsites.net" \
  --resource-group "rg-lpa-unified"

# Verify failover active
curl https://bloom-functions-sea.azurewebsites.net/api/health
```

#### Phase 4: Verify & Monitor (5 minutes)

```bash
# Verify primary region still down
curl https://bloom-functions-prod.azurewebsites.net/api/health
# Expected: timeout or 500 (unavailable)

# Verify secondary region up
curl https://bloom-functions-sea.azurewebsites.net/api/health
# Expected: 200 OK

# Monitor Application Insights for secondary
az monitor app-insights metrics show \
  --app "bloom-functions-sea" \
  --resource-group "rg-lpa-unified" \
  --metrics "requests/count"
```

### Regional Failback (When Primary Recovers)

```bash
# 1. Verify primary region restored
curl https://bloom-functions-prod.azurewebsites.net/api/health

# 2. Sync database from secondary to primary
# (Replicate changes made during outage)
az sql db copy \
  --dest-name "lpa-bloom-db-prod" \
  --dest-server "lpa-sql-server" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server-sea" \
  --resource-group "lpa-rg"

# 3. Switch Front Door back to primary
# Same procedure as failover, but reverse directions

# 4. Decommission secondary resources (if not keeping for DR)
az functionapp delete \
  --name "bloom-functions-sea" \
  --resource-group "rg-lpa-unified" \
  --yes
```

---

## Disaster: Data Corruption

**Symptoms**:
- Application shows incorrect data
- Data integrity checks fail
- Malicious/accidental modification detected

**RTO**: 30 minutes | **RPO**: 5 minutes (acceptable data loss: <5 min)

### Recovery Steps

```bash
# 1. Identify corruption time window
# Check application logs for anomalies
# Example: "User X deleted all appointments at 14:32 UTC"

# 2. Determine restore point
# Restore to point BEFORE corruption
# Example: 14:30 UTC (2 minutes before)
RESTORE_TIME="2026-01-20T14:30:00Z"

# 3. Create recovery database
az sql db restore \
  --dest-name "lpa-bloom-db-recovery" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --point-in-time "$RESTORE_TIME"

# 4. Verify data integrity
sqlcmd -S lpa-sql-server.database.windows.net \
  -U sqluser \
  -P [password] \
  -d lpa-bloom-db-recovery \
  -Q "SELECT COUNT(*) as appointment_count FROM appointments;"

# 5. Extract unaffected data (if selective restore needed)
# Use SSMS or query tool to identify clean data

# 6. Swap databases (see DATABASE_BACKUP_RESTORE_RUNBOOK.md)
az sql db rename \
  --name "lpa-bloom-db-prod" \
  --new-name "lpa-bloom-db-corrupted" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

az sql db rename \
  --name "lpa-bloom-db-recovery" \
  --new-name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# 7. Verify application works
curl https://bloom-functions-prod.azurewebsites.net/api/health

# 8. Archive corrupted database for forensics
# Keep lpa-bloom-db-corrupted for 30 days for investigation
```

---

## Disaster: Security Breach

**Symptoms**:
- Unauthorized access detected
- Customer data exfiltration suspected
- Credential compromise suspected

**RTO**: 2 hours | **Severity**: CRITICAL

### Immediate Actions

```bash
# 1. Isolate affected resources (IMMEDIATELY)
# Block all external access

# 2. Rotate credentials
# Update all connection strings, API keys, tokens
az keyvault secret set \
  --vault-name "lpa-keyvault" \
  --name "sql-password" \
  --value "[new-strong-password]"

# 3. Revoke all active sessions
# Force re-authentication
# (Application-specific, depends on auth system)

# 4. Enable enhanced logging
# Capture all database queries for forensics
az sql db auditing-settings create \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --state "Enabled" \
  --log-storage-key "[key]" \
  --log-retention-days 90

# 5. Change all passwords
# SQL, API keys, storage account keys, etc.
```

### Investigation & Recovery

```bash
# 1. Determine scope of breach
# How much data was accessed?
# When did access start/stop?

# 2. Restore from clean backup (before breach)
BREACH_DETECTED_TIME="2026-01-20T15:00:00Z"
RESTORE_TIME="2026-01-20T12:00:00Z"  # 3 hours before breach

az sql db restore \
  --dest-name "lpa-bloom-db-secure" \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --point-in-time "$RESTORE_TIME"

# 3. Quarantine original database for forensics
# Keep for investigation (legal/compliance requirement)

# 4. Swap to secure database
az sql db rename \
  --name "lpa-bloom-db-prod" \
  --new-name "lpa-bloom-db-breached" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

az sql db rename \
  --name "lpa-bloom-db-secure" \
  --new-name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# 5. Re-deploy application with security patches
# Address the vulnerability that enabled breach
```

### Post-Incident (Within 24 hours)

- [ ] Notify affected customers
- [ ] File incident report
- [ ] Perform forensic analysis on breached database
- [ ] Update security policies
- [ ] Brief all staff on lessons learned

---

## Disaster Recovery Checklist

### Before Disaster

- [ ] Automated backups enabled & tested
- [ ] Geo-redundant backups configured
- [ ] Secondary region resources ready (or procedures documented)
- [ ] PITR restore tested monthly
- [ ] DNS failover configured
- [ ] Team trained on all runbooks
- [ ] Runbooks reviewed quarterly
- [ ] Communication plan established (who to notify)

### During Disaster

- [ ] Identify type of failure
- [ ] Execute appropriate runbook
- [ ] Monitor recovery progress
- [ ] Communicate status to stakeholders
- [ ] Document all actions taken

### After Disaster

- [ ] Verify all systems operational
- [ ] Check data integrity
- [ ] Review logs for root cause
- [ ] Update runbooks based on lessons learned
- [ ] Conduct post-incident review
- [ ] File incident report

---

## Escalation Matrix

| Scenario | On-Call | Escalate If | Timeframe |
|----------|---------|-------------|-----------|
| Single component down | DevOps | Not resolved in 15 min | 15 min |
| Regional outage | DevOps + Architect | AWS region down | Immediate |
| Data corruption | DBA + DevOps | Can't restore cleanly | 10 min |
| Security breach | Security + CTO | Customer data affected | Immediate |
| Subscription suspended | Finance + Ops | Not resolved in 30 min | 30 min |

---

## Contact Information

**On-Call DevOps**: [Phone/Email]  
**Database Administrator**: [Phone/Email]  
**Security Team**: [Phone/Email]  
**Executive Sponsor**: [Phone/Email]  

**Emergency Azure Support**: https://portal.azure.com → Support requests (Severity: Critical)

---

## Testing Schedule

- **Weekly**: Automated backup verification
- **Monthly**: PITR restore test
- **Quarterly**: Full DR simulation (with failover)
- **Annually**: Major DR exercise with all systems

---

## Related Documents

- [SUBSCRIPTION_RECOVERY_RUNBOOK.md](./SUBSCRIPTION_RECOVERY_RUNBOOK.md)
- [DATABASE_BACKUP_RESTORE_RUNBOOK.md](./DATABASE_BACKUP_RESTORE_RUNBOOK.md)
- [AZURE_INFRASTRUCTURE_ASSESSMENT.md](./AZURE_INFRASTRUCTURE_ASSESSMENT.md)

