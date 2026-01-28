# Azure Infrastructure Assessment & Recommendations

> **Generated**: January 28, 2026  
> **Subscription**: `47b5552f-0eb8-4462-97e7-cd67e8e660b8`  
> **Primary Resource Group**: `rg-lpa-unified` (Australia East)

---

## Executive Summary

The Life Psychology Australia Azure infrastructure is **functional but has optimization opportunities**. The recent subscription suspension revealed a critical dependency on Azure Front Door that could be hardened. Overall architecture is sound, but there are cost optimization and resilience improvements to consider.

| Category | Status | Priority |
|----------|--------|----------|
| **Availability** | ⚠️ Needs Attention | HIGH |
| **Cost Optimization** | ⚠️ Over-provisioned | MEDIUM |
| **Security** | ✅ Good | LOW |
| **Performance** | ✅ Good | LOW |
| **Disaster Recovery** | ⚠️ Needs Planning | MEDIUM |

---

## Current Resource Inventory

### Compute (Azure Functions)

| Resource | SKU | State | Purpose | Assessment |
|----------|-----|-------|---------|------------|
| `bloom-functions-prod` | EP1 (Premium) | Running | Production API | ✅ Appropriate for production |
| `bloom-functions-dev` | Y1 (Consumption) | Running | Development | ✅ Cost-effective |
| `bloom-functions-staging-new` | Y1 (Consumption) | Running | Staging | ✅ Cost-effective |
| `lpa-halaxy-webhook-handler` | Y1 (Consumption) | Running | Webhook handler | ✅ Right-sized |

**Recommendation**: Production is on Premium (EP1) which provides always-warm instances. This is appropriate for a healthcare application requiring low latency. Consider **Reserved Instances** for 40% cost savings if committed to 1-year usage.

### Static Web Apps (Frontend)

| Resource | SKU | Location | Purpose |
|----------|-----|----------|---------|
| `lpa-frontend-prod` | Standard | East Asia | Client website (production) |
| `lpa-frontend-staging` | Standard | East Asia | Client website (staging) |
| `lpa-frontend-dev` | Standard | East Asia | Client website (dev) |
| `lpa-bloom-prod` | Standard | East Asia | Practitioner portal (production) |
| `lpa-bloom-staging` | Standard | East Asia | Practitioner portal (staging) |
| `lpa-bloom-dev` | **Free** | East Asia | Practitioner portal (dev) |

**⚠️ Issue**: All SWAs are in **East Asia** while most backend services are in **Australia East**. This adds ~30-50ms latency for API calls.

**Recommendations**:
1. **Dev environments**: Downgrade `lpa-frontend-dev` and `lpa-frontend-staging` to Free tier (saves ~$18/month each)
2. **Location**: Consider future migration to Australia East region when available for SWA
3. **Dev bloom**: Already on Free tier ✅

### Database (Azure SQL)

| Database | SKU | Tier | Status | Assessment |
|----------|-----|------|--------|------------|
| `lpa-bloom-db-prod` | Basic | Basic | Online | ⚠️ **Under-provisioned** |
| `lpa-bloom-db-dev` | Basic | Basic | Online | ✅ Appropriate for dev |
| `lpa-applications-db` | Basic | Basic | Online | ⚠️ Consider consolidation |

**⚠️ Critical Issue**: Production database is on **Basic tier** (5 DTUs, 2GB max).

**Recommendations**:
1. **Upgrade prod to Standard S1** (20 DTUs) minimum - Basic tier is not suitable for production healthcare workloads
2. **Consider serverless** for dev/staging to reduce costs
3. **Enable automated backups** with geo-redundant storage
4. **Consolidate** `lpa-applications-db` into `lpa-bloom-db-prod` if they serve the same application

### Azure Front Door (CDN/WAF)

| Resource | SKU | Status |
|----------|-----|--------|
| `fdt42kldozqahcu` | Premium | Active |
| Endpoint: `life-psychology-com-au` | - | **Enabled** (was disabled) |

**✅ Recently Fixed**: Endpoint was disabled after subscription suspension - now re-enabled.

**Recommendations**:
1. **Add WAF policies** - Premium tier includes WAF, currently not configured
2. **Enable caching rules** for static assets
3. **Configure health probes** more aggressively (currently 100s interval)

### Container Apps (Halaxy Sync Worker)

| Resource | Purpose | Status |
|----------|---------|--------|
| `lpa-halaxy-sync-staging` | Staging sync worker | Deployed |
| `lpa-halaxy-sync-prod` | Production sync worker | Deployed |
| `lpa-cae-staging` | Container Apps Environment | Active |
| `lpa-cae-prod` | Container Apps Environment | Active |

**Assessment**: Container Apps for background sync workers is appropriate architecture. Consider enabling **scale-to-zero** if not already configured.

### Communication Services

| Resource | Location | Purpose |
|----------|----------|---------|
| `lpa-communication-service` | Australia | Video calling, SMS |
| `lpa-communications` | Australia | Legacy/duplicate? |

**⚠️ Issue**: Two Communication Services resources exist. Investigate if both are needed.

### Monitoring & Alerting

| Resource | Type | Purpose |
|----------|------|---------|
| `bloom-functions-prod` | Application Insights | Function monitoring |
| `bloom-prod-availability` | Web Test | Availability monitoring |
| `bloom-prod-down-alert` | Alert Rule | Downtime notifications |
| `bloom-prod-alerts` | Action Group | Alert notifications |
| `LPA-Production-Alerts` | Action Group | Duplicate? |

**✅ Good**: Availability monitoring and alerting is configured.

**Recommendation**: Consolidate action groups if `bloom-prod-alerts` and `LPA-Production-Alerts` serve the same purpose.

---

## Critical Recommendations

### 1. 🔴 Upgrade Production Database (HIGH PRIORITY)

**Current State**: Basic tier (5 DTUs, 2GB)
**Risk**: Performance bottlenecks, no SLA guarantee, limited backup options
**Action**: Upgrade to Standard S1 or S2

```bash
# Recommended upgrade command
az sql db update \
  --name lpa-bloom-db-prod \
  --server lpa-sql-server \
  --resource-group lpa-rg \
  --service-objective S1
```

**Cost Impact**: ~$15/month → ~$30/month
**Benefit**: 20 DTUs, guaranteed SLA, point-in-time restore

### 2. 🟡 Configure Subscription Suspension Resilience (MEDIUM)

**Issue Discovered**: Front Door endpoint auto-disabled on subscription suspension.

**Action**: Create runbook/documentation for subscription reactivation:
1. Re-enable Front Door endpoint
2. Verify custom domain validation
3. Test SSL certificate propagation
4. Verify all Function Apps are running

### 3. 🟡 Cost Optimization (MEDIUM)

| Change | Monthly Savings |
|--------|-----------------|
| Downgrade `lpa-frontend-dev` to Free | ~$9 |
| Downgrade `lpa-frontend-staging` to Free | ~$9 |
| Review duplicate Communication Services | ~$0-50 |
| Reserved Instance for EP1 (1-year) | ~$40 |

**Estimated Annual Savings**: $700-900

### 4. 🟡 Enable WAF on Front Door (MEDIUM)

Premium Front Door includes WAF at no extra cost. Currently not configured.

```bash
# Create WAF policy
az network front-door waf-policy create \
  --name lpa-waf-policy \
  --resource-group rg-lpa-unified \
  --sku Premium_AzureFrontDoor
```

### 5. 🟢 Documentation (LOW)

Update operational runbooks:
- Subscription suspension recovery procedure
- Database backup and restore procedures
- Certificate renewal monitoring

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                       │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────┐
                    │   Azure Front Door (Premium)       │
                    │   fdt42kldozqahcu                  │
                    │   - life-psychology.com.au         │
                    │   - www.life-psychology.com.au     │
                    │   ⚠️ WAF not configured            │
                    └─────────────────┬─────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Static Web App  │       │ Static Web App  │       │  Azure Func.    │
│ lpa-frontend-*  │       │ lpa-bloom-*     │       │  bloom-func-*   │
│ (East Asia)     │       │ (East Asia)     │       │  (Aus East)     │
│ Client Website  │       │ Practitioner    │       │  API Backend    │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
                    ┌────────────────────────────────────────┼──────────┐
                    │                                        │          │
                    ▼                                        ▼          ▼
          ┌─────────────────┐                    ┌──────────────┐ ┌──────────┐
          │  Azure SQL      │                    │ Cosmos DB    │ │ Blob     │
          │  lpa-sql-server │                    │ (Analytics)  │ │ Storage  │
          │  ⚠️ Basic tier  │                    └──────────────┘ └──────────┘
          └─────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ Container Apps  │
          │ Halaxy Sync     │
          │ Worker          │
          └─────────────────┘
```

---

## Monthly Cost Estimate

| Service | Current | After Optimization |
|---------|---------|-------------------|
| Azure Functions (EP1) | ~$150 | ~$110 (reserved) |
| Azure SQL (Basic → S1) | ~$15 | ~$30 |
| Static Web Apps | ~$54 | ~$36 |
| Front Door Premium | ~$35 | ~$35 |
| Container Apps | ~$20 | ~$20 |
| Storage & Misc | ~$20 | ~$20 |
| **Total** | **~$294** | **~$251** |

*Note: Estimates based on typical usage patterns. Actual costs may vary.*

---

## Action Plan

### Week 1 (Immediate)
- [ ] Upgrade production SQL database to S1
- [ ] Document subscription recovery procedure
- [ ] Verify all monitoring alerts are working

### Week 2
- [ ] Downgrade dev/staging SWA to Free tier
- [ ] Configure WAF policy on Front Door
- [ ] Audit and consolidate duplicate resources

### Week 3-4
- [ ] Implement Reserved Instance for EP1 (if committed)
- [ ] Review Container Apps scaling configuration
- [ ] Create disaster recovery runbook

---

## Appendix: Resource Locations

| Region | Resources |
|--------|-----------|
| **Australia East** | SQL Server, Functions, Container Apps, Key Vault, Storage |
| **East Asia** | Static Web Apps (6 apps) |
| **Global** | Front Door, Action Groups |

**Note**: Static Web Apps in East Asia vs backend in Australia East adds latency. Consider this a technical debt item for future optimization when SWA becomes available in Australia.

---

*This assessment was generated from live Azure CLI queries. For the most current state, re-run infrastructure queries.*
