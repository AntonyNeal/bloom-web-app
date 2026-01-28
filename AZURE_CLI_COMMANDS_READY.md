# Azure Optimization - CLI Commands Ready to Execute

**Status**: Azure CLI is installing. Once installed, execute these commands in order.

---

## ⚡ PHASE 1: SQL Database Upgrade (Execute First)

```bash
# Check current SQL database status
az sql db show \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --query "{ edition: edition, serviceLevelObjective: serviceLevelObjective, dtuCapacity: dtuCapacity }"

# Upgrade from Basic to Standard S1
az sql db update \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --service-objective S1

# Verify upgrade completed
az sql db show \
  --resource-group lpa-rg \
  --server lpa-sql-server \
  --name lpa-bloom-db-prod \
  --query "{ edition: edition, serviceLevelObjective: serviceLevelObjective, status: status }"
```

**Expected Output**:
```
{
  "edition": "Standard",
  "serviceLevelObjective": "S1",
  "status": "Online"
}
```

**⏱️ Time to Complete**: ~5-10 minutes (no downtime)  
**💰 Monthly Cost Change**: +$15

---

## ⚡ PHASE 2: WAF Enablement (Execute After Phase 1 Validated)

```bash
# Create WAF policy in Detection mode (non-blocking)
az network front-door waf-policy create \
  --resource-group lpa-rg \
  --name bloom-waf-policy \
  --mode Detection

# Link WAF to Front Door
az network front-door update \
  --name bloom-front-door \
  --resource-group lpa-rg \
  --set frontendEndpoints[0].webApplicationFirewallPolicyLink=/subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8/resourcegroups/lpa-rg/providers/microsoft.network/frontdoorwebapplicationfirewallpolicies/bloom-waf-policy

# Verify WAF is linked
az network front-door show \
  --name bloom-front-door \
  --resource-group lpa-rg \
  --query "frontendEndpoints[0].webApplicationFirewallPolicyLink"

# AFTER 48 hours of monitoring, switch to Prevention mode
az network front-door waf-policy update \
  --name bloom-waf-policy \
  --resource-group lpa-rg \
  --mode Prevention
```

**⏱️ Time to Complete**: ~1 hour config + 48 hours monitoring  
**💰 Monthly Cost Change**: $0 (included in Premium tier)

---

## ⚡ PHASE 3: Cost Optimization (Execute After Phase 2 Validated)

```bash
# List current App Service plans
az appservice plan list \
  --resource-group lpa-rg \
  --query "[].{name: name, sku: sku.name}"

# Downgrade Dev Static Web App to Free
az appservice plan update \
  --name bloom-static-web-app-dev-plan \
  --resource-group lpa-rg \
  --sku Free

# Downgrade Staging Static Web App to Free
az appservice plan update \
  --name bloom-static-web-app-staging-plan \
  --resource-group lpa-rg \
  --sku Free

# Verify downgrades
az appservice plan list \
  --resource-group lpa-rg \
  --query "[].{name: name, sku: sku.name}"

# Purchase 1-year Reserved Instance for EP1 Premium
az reservations reservation-order create \
  --sku standard_ep1 \
  --location australiaeast \
  --term P1Y \
  --billing-scope /subscriptions/47b5552f-0eb8-4462-97e7-cd67e8e660b8

# Check Reserved Instances
az reservations reservation-order list \
  --query "[].{name: name, displayName: displayName, provisioningState: provisioningState}"
```

**⏱️ Time to Complete**: ~1 hour  
**💰 Monthly Cost Change**: +$40 (but saves $480/year)

---

## 📋 Prerequisites Before Executing

- [ ] Azure CLI installed and in PATH
- [ ] Authenticated to Azure: `az login`
- [ ] Correct subscription selected: `az account show`
- [ ] Verified you're in the correct resource group (lpa-rg)

---

## ✅ Execution Order

**DO NOT SKIP STEPS**:

1. **Phase 1** - SQL upgrade (mandatory, fixes production issue)
   - Execute all Phase 1 commands
   - Monitor DTU usage for 24 hours
   - Verify success before proceeding

2. **Phase 2** - WAF enablement (security hardening)
   - Execute WAF creation commands
   - Monitor logs for 48 hours
   - Switch to Prevention mode after validation

3. **Phase 3** - Cost optimization
   - Execute SWA downgrades
   - Purchase Reserved Instance
   - Verify bill reduction after 30 days

---

## 🚨 If Azure CLI Installation Completes

Once you see `Azure CLI is ready!` in your terminal, you can run the commands above directly.

To test if it's ready:
```powershell
az --version
az account show
```

If both commands work, proceed with Phase 1 commands.

---

## 📞 Alternative: Azure Portal Method

If you prefer not to use CLI, you can do these via Azure Portal:

**Phase 1 - SQL Upgrade**:
1. Go to Azure Portal → SQL Databases
2. Select `lpa-bloom-db-prod`
3. Click "Compute + Storage"
4. Change from Basic to Standard S1
5. Click "Apply"

**Phase 2 - WAF**:
1. Go to Azure Portal → Front Door
2. Click on `bloom-front-door`
3. Go to WAF policies
4. Create new policy → Detection mode
5. Link to Front Door
6. After 48 hours, switch to Prevention

**Phase 3 - Cost Optimization**:
1. Go to Azure Portal → App Service Plans
2. Select dev plan → Scale up → Free
3. Select staging plan → Scale up → Free
4. Go to Reservations → Add → EP1 Premium → 1 year

---

**Status**: Commands ready. Once Azure CLI is installed, execute in order.
