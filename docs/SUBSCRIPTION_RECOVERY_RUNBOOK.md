# Subscription Suspension Recovery Runbook

> **Last Updated**: January 28, 2026  
> **Severity**: CRITICAL  
> **RTO**: 30 minutes  
> **RPO**: No data loss (resources paused, not deleted)

---

## Overview

When an Azure subscription is suspended (e.g., due to non-payment), all resources go offline but data is retained. This runbook provides step-by-step recovery procedures.

**What Happens During Suspension**:
- 🔴 All resources stop functioning
- 🔴 Azure SQL databases pause
- 🔴 Azure Functions offline
- 🔴 Static Web Apps offline
- 🔴 Front Door endpoint auto-disables
- ✅ All data is preserved
- ✅ No resources are deleted

---

## Recovery Procedures

### Step 1: Reactivate Azure Subscription (5 minutes)

**Responsible**: Billing/Account Owner

1. **Receive Azure notice** of suspension
   - Check email for suspension notification
   - Note the date/time of suspension
   - Note the reason (non-payment, policy violation, etc.)

2. **Resolve billing issue**
   - If non-payment: Pay outstanding bill
   - If policy violation: Contact Azure Support to appeal
   - Verify payment processed

3. **Request subscription reactivation**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to **Subscriptions**
   - Click the suspended subscription
   - Click **Reactivate**
   - Confirm reactivation

4. **Wait for reactivation**
   - Typically takes 5-15 minutes
   - Azure sends confirmation email
   - All resources remain in "paused" state initially

---

### Step 2: Verify Subscription is Active (5 minutes)

**Responsible**: DevOps/Operations

```bash
# Check subscription status
az account show --query "{State:state, Name:name}"

# Expected output: State = "Enabled"
```

**If not Enabled**:
- Wait another 5 minutes
- Check Azure status page: https://status.azure.com
- Contact Azure Support if suspended longer than 30 minutes

---

### Step 3: Start Azure Resources (10 minutes)

**Responsible**: DevOps/Operations

#### 3.1 Start Azure SQL Servers

```bash
# Start SQL Server (resumes all databases on it)
az sql server show \
  --name "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "{Name:name, State:state}"

# Note: If database is paused, manually resume it
az sql db resume \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg"

# Verify resumed
az sql db show \
  --name "lpa-bloom-db-prod" \
  --server "lpa-sql-server" \
  --resource-group "lpa-rg" \
  --query "{Name:name, State:state, Status:status}"
```

#### 3.2 Verify Azure Functions are Running

```bash
# Check function app status
az functionapp show \
  --name "bloom-functions-prod" \
  --resource-group "rg-lpa-unified" \
  --query "{Name:name, State:state, HostNames:defaultHostName}"

# If stopped, start it
az functionapp start \
  --name "bloom-functions-prod" \
  --resource-group "rg-lpa-unified"
```

#### 3.3 Verify Static Web Apps are Running

```bash
# Check SWA status
az staticwebapp show \
  --name "lpa-bloom-prod" \
  --resource-group "lpa-rg" \
  --query "{Name:name, Status:status}"

# If offline, check Application Insights for errors
```

---

### Step 4: Re-enable Front Door Endpoint (10 minutes)

**CRITICAL**: The Front Door endpoint auto-disables during suspension.

**Responsible**: DevOps/Operations

#### 4.1 Check Front Door Status

```bash
# List all Front Door front-ends
az network front-door frontend-endpoint list \
  --name "fdt42kldozqahcu" \
  --resource-group "rg-lpa-unified" \
  --query "[].{Name:name, HostName:hostName, State:resourceState}"
```

**Expected output**: Look for `life-psychology-com-au` endpoint
- If State = "Disabled" → Must re-enable
- If State = "Enabled" → Already active

#### 4.2 Re-enable Endpoint

```bash
# Enable the front-end endpoint
az network front-door frontend-endpoint enable \
  --name "life-psychology-com-au" \
  --front-door-name "fdt42kldozqahcu" \
  --resource-group "rg-lpa-unified"

# Verify re-enabled
az network front-door frontend-endpoint show \
  --name "life-psychology-com-au" \
  --front-door-name "fdt42kldozqahcu" \
  --resource-group "rg-lpa-unified" \
  --query "resourceState"
```

**Expected**: Output should show "Enabled"

---

### Step 5: Verify Custom Domain SSL/TLS (5 minutes)

**Responsible**: DevOps/Operations

```bash
# Check custom domain status
az network front-door frontend-endpoint show \
  --name "life-psychology-com-au" \
  --front-door-name "fdt42kldozqahcu" \
  --resource-group "rg-lpa-unified" \
  --query "{HostName:hostName, ProvisioningState:provisioningState}"
```

**If ProvisioningState = "Failed"**:
1. Navigate to Azure Portal → Front Door → Custom Domains
2. Check certificate status
3. If certificate expired, request new one
4. Update DNS TXT records for validation
5. Wait 5-10 minutes for validation

**Test HTTPS**:
```bash
# Should return 200 (not redirect or error)
curl -I https://life-psychology.com.au

# Should return 200 or 301 (redirect to www)
curl -I https://www.life-psychology.com.au
```

---

### Step 6: Test All Endpoints (10 minutes)

**Responsible**: QA/Operations

#### 6.1 Test Frontend Applications

```bash
# Client website
curl -I https://life-psychology.com.au
# Expected: 200 or 301 redirect

# Practitioner portal
curl -I https://bloom.life-psychology.com.au
# Expected: 200
```

#### 6.2 Test API Endpoints

```bash
# Health check endpoint
curl https://bloom-functions-prod.azurewebsites.net/api/health
# Expected: 200 with JSON response

# Example: {"status":"healthy","timestamp":"2026-01-28T..."}
```

#### 6.3 Test Database Connectivity

```bash
# Run smoke test from Azure Portal or local machine
sqlcmd -S lpa-sql-server.database.windows.net -U sqluser -P [password] -d lpa-bloom-db-prod -Q "SELECT @@VERSION"

# Should return SQL Server version
```

---

### Step 7: Monitor Application Health (Ongoing)

**Responsible**: Operations Team

```bash
# Monitor Application Insights for errors
az monitor app-insights metrics show \
  --app "bloom-functions-prod" \
  --resource-group "rg-lpa-unified" \
  --metrics "requests/failed" \
  --interval PT1M \
  --start-time "2026-01-28T00:00:00Z"

# Check for elevated error rates
# Should return to baseline within 30 minutes
```

**Check monitoring dashboards**:
1. [Application Insights - Bloom Functions Prod](https://portal.azure.com/#@microsoftcom/resource/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourceGroups/rg-lpa-unified/providers/microsoft.insights/components/bloom-functions-prod/overview)
2. [Front Door Metrics](https://portal.azure.com/#@microsoftcom/resource/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourceGroups/rg-lpa-unified/providers/microsoft.network/frontDoors/fdt42kldozqahcu/diagnostics)

---

### Step 8: Notify Stakeholders (5 minutes)

**Responsible**: Communications/Operations

Send recovery notification to:
- [ ] Development team
- [ ] Operations team
- [ ] Stakeholders/Clients
- [ ] Support team

**Email Template**:

```
Subject: ✅ Service Restoration Complete - Azure Subscription Reactivated

Hi Team,

The Azure subscription suspension has been resolved and all services are back online:

✅ Production API (https://bloom-functions-prod.azurewebsites.net)
✅ Practitioner Portal (https://bloom.life-psychology.com.au)
✅ Client Website (https://life-psychology.com.au)
✅ Database (lpa-bloom-db-prod)

All systems have been verified and are functioning normally.

Monitoring for any issues - please report any anomalies.

DevOps Team
```

---

## Quick Reference: Recovery Commands

```bash
# One-liner recovery (for ops who knows the environment)
az account show && \
az sql db resume --name lpa-bloom-db-prod --server lpa-sql-server --resource-group lpa-rg && \
az functionapp start --name bloom-functions-prod --resource-group rg-lpa-unified && \
az network front-door frontend-endpoint enable --name life-psychology-com-au --front-door-name fdt42kldozqahcu --resource-group rg-lpa-unified && \
curl https://life-psychology.com.au
```

---

## Prevention: Enable Auto-Pay

To prevent future suspensions:

```bash
# In Azure Portal:
1. Go to Subscriptions → [Your Subscription]
2. Click "Payment Methods"
3. Add credit card for auto-pay
4. Enable "Auto-charging"

# Or via Azure CLI:
# (Not available via CLI - must use Portal)
```

---

## Estimated Recovery Time

| Phase | Duration |
|-------|----------|
| Subscription reactivation | 5-15 min |
| Verify active | 2 min |
| Start resources | 5 min |
| Re-enable Front Door | 3 min |
| Verify SSL/TLS | 2 min |
| Test endpoints | 5 min |
| **Total** | **~30 minutes** |

---

## Escalation Path

If recovery fails:

1. **Check Azure Status**: https://status.azure.com
   - May be service-wide outage
   
2. **Contact Azure Support**:
   - Severity: Critical
   - Reference: Subscription ID `47b5552f-0eb8-4462-97e7-cd67e8e660b8`
   - Issue: Resources still offline after reactivation
   
3. **Document for RCA**:
   - Time subscription suspended
   - Time recovery started
   - Any errors encountered
   - Time services returned to normal

---

## Related Documents

- [DATABASE_BACKUP_RESTORE_RUNBOOK.md](./DATABASE_BACKUP_RESTORE_RUNBOOK.md)
- [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)
- [AZURE_INFRASTRUCTURE_ASSESSMENT.md](./AZURE_INFRASTRUCTURE_ASSESSMENT.md)

